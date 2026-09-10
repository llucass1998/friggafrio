import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  equalOpaqueValues,
  exchangeGoogleCode,
  getGoogleOidcConfig,
  isFreshGoogleOidcSession,
  verifyGoogleIdToken,
  type GoogleOidcSession,
} from "../../../../../lib/auth/google-oidc"

type SessionWithSave = {
  google_oidc?: GoogleOidcSession
  auth_context?: {
    actor_id: string
    actor_type: "customer" | "user"
    auth_identity_id: string
    auth_provider: string
    app_metadata: Record<string, unknown>
    user_metadata: Record<string, unknown>
  }
  save: (callback: (error?: Error | null) => void) => void
  regenerate?: (callback: (error?: Error | null) => void) => void
}

type AuthResult = {
  success?: boolean
  authIdentity?: {
    id: string
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
    provider_identities?: Array<{ provider?: string; user_metadata?: Record<string, unknown> }>
  }
}

type AuthService = {
  listProviderIdentities: (filters: Record<string, unknown>, config?: Record<string, unknown>) => Promise<Array<{
    id: string
    entity_id?: string
    auth_identity_id?: string
    auth_identity?: AuthResult["authIdentity"]
    provider?: string
  }>>
  createProviderIdentities: (input: Record<string, unknown>) => Promise<{ id: string }>
  retrieveAuthIdentity: (id: string) => Promise<NonNullable<AuthResult["authIdentity"]>>
}

type ProviderIdentity = {
  id: string
  entity_id?: string
  auth_identity_id?: string
  auth_identity?: AuthResult["authIdentity"]
  provider?: string
}

const saveSession = (session: SessionWithSave): Promise<void> =>
  new Promise((resolve, reject) => session.save((error) => (error ? reject(error) : resolve())))

const regenerateSession = (req: MedusaRequest): Promise<SessionWithSave> => {
  const session = req.session as unknown as SessionWithSave
  if (typeof session.regenerate !== "function") {
    return Promise.resolve(session)
  }

  return new Promise((resolve, reject) => {
    session.regenerate?.((error) => {
      if (error) {
        reject(error)
        return
      }

      // express-session replaces req.session during regeneration. Always use
      // that replacement so the authenticated context is persisted on the new
      // session identifier rather than on the discarded pre-auth session.
      resolve(req.session as unknown as SessionWithSave)
    })
  })
}

const actorFromIdentity = (identity: NonNullable<AuthResult["authIdentity"]>) => {
  const metadata = identity.app_metadata ?? {}
  const customerId = typeof metadata.customer_id === "string" ? metadata.customer_id : null
  const userId = typeof metadata.user_id === "string" ? metadata.user_id : null
  if ((customerId && userId) || (!customerId && !userId)) return null
  return customerId
    ? { actor_id: customerId, actor_type: "customer" as const }
    : { actor_id: userId!, actor_type: "user" as const }
}

const resolveProviderAuthIdentity = async (
  auth: AuthService,
  providerIdentity: ProviderIdentity,
): Promise<NonNullable<AuthResult["authIdentity"]>> => {
  if (providerIdentity.auth_identity) return providerIdentity.auth_identity
  if (!providerIdentity.auth_identity_id) {
    throw new Error("Google auth identity is unavailable")
  }
  return auth.retrieveAuthIdentity(providerIdentity.auth_identity_id)
}

const redirectWithError = (
  res: MedusaResponse,
  storefrontOrigin: string,
  returnTo: string,
  code: string,
): void => {
  // Return failures to the login surface itself so AccountShell cannot hide
  // the diagnostic query while redirecting an anonymous visitor.
  const target = new URL(returnTo)
  const login = new URL("/br/account/login", storefrontOrigin)
  login.searchParams.set("returnTo", `${target.pathname}${target.search}${target.hash}`)
  login.searchParams.set("google_error", code)
  res.redirect(302, login.toString())
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const baseConfig = getGoogleOidcConfig(process.env, req)
  const requestSession = req.session as unknown as SessionWithSave
  const pending = requestSession.google_oidc
  const redirectUri = pending?.redirectUri || baseConfig?.redirectUri
  const storefrontOrigin = pending?.storefrontOrigin || baseConfig?.storefrontOrigin
  const config = baseConfig && redirectUri && storefrontOrigin
    ? { ...baseConfig, redirectUri, storefrontOrigin }
    : null
  const fallback = config?.storefrontOrigin ? new URL("/br/account", config.storefrontOrigin).toString() : "/br/account"
  const returnTo = pending?.returnTo || fallback
  if (!config || !pending || !isFreshGoogleOidcSession(pending)) {
    if (pending) {
      delete requestSession.google_oidc
      await saveSession(requestSession).catch(() => undefined)
    }
    if (config) redirectWithError(res, config.storefrontOrigin, returnTo, "expired")
    else res.status(503).json({ code: "GOOGLE_OIDC_EXTERNAL_CONFIGURATION_REQUIRED" })
    return
  }

  const state = typeof req.query?.state === "string" ? req.query.state : ""
  const code = typeof req.query?.code === "string" ? req.query.code : ""
  if (!state || !equalOpaqueValues(state, pending.state) || !code) {
    delete requestSession.google_oidc
    await saveSession(requestSession).catch(() => undefined)
    redirectWithError(res, config.storefrontOrigin, returnTo, "invalid_request")
    return
  }

  // Consume state before any network call so callback replay cannot reuse PKCE.
  delete requestSession.google_oidc
  await saveSession(requestSession)

  try {
    const tokens = await exchangeGoogleCode(config, code, pending.codeVerifier)
    const claims = await verifyGoogleIdToken(tokens.id_token!, config, pending.nonce)
    const auth = req.scope.resolve(Modules.AUTH) as unknown as AuthService
    let identity: NonNullable<AuthResult["authIdentity"]>
    const googleIdentities = await auth.listProviderIdentities(
      { provider: "google", entity_id: claims.sub },
      { relations: ["auth_identity"] },
    )
    if (googleIdentities.length > 1) throw new Error("Google identity conflict")
    if (googleIdentities[0]) {
      // Some auth-module adapters return the provider row without expanding
      // auth_identity. Resolve it by id instead of turning a valid link into a
      // generic authentication failure.
      identity = await resolveProviderAuthIdentity(auth, googleIdentities[0])
    } else {
      const emailIdentities = await auth.listProviderIdentities(
        { provider: "emailpass", entity_id: claims.email },
        { relations: ["auth_identity"] },
      )
      let emailAuthIdentityId: string
      if (emailIdentities.length === 1 && emailIdentities[0].auth_identity_id) {
        emailAuthIdentityId = emailIdentities[0].auth_identity_id
        await resolveProviderAuthIdentity(auth, emailIdentities[0])
      } else {
        const customerService = req.scope.resolve(Modules.CUSTOMER) as unknown as {
          listCustomers: (filters: Record<string, unknown>) => Promise<Array<{ id: string }>>
          createCustomers: (data: Record<string, unknown>) => Promise<{ id: string }>
        }
        const existingCustomers = await customerService.listCustomers({ email: claims.email })
        const customer = existingCustomers[0] || (await customerService.createCustomers({
          email: claims.email,
          first_name: claims.given_name || claims.name || "Cliente",
          last_name: claims.family_name || "",
          has_account: true,
        }))
        const newAuthIdentity = await (auth as unknown as {
          createAuthIdentities: (data: Record<string, unknown>) => Promise<NonNullable<AuthResult["authIdentity"]>>
        }).createAuthIdentities({
          app_metadata: { customer_id: customer.id },
        })
        emailAuthIdentityId = newAuthIdentity.id
      }
      let providerWasCreated = false
      try {
        await auth.createProviderIdentities({
          provider: "google",
          entity_id: claims.sub,
          auth_identity_id: emailAuthIdentityId,
          user_metadata: {
            email: claims.email,
            name: claims.name,
            given_name: claims.given_name,
            family_name: claims.family_name,
            picture: claims.picture,
          },
        })
        providerWasCreated = true
      } catch {
        // A concurrent callback may have created the unique Google identity.
        // Re-read it and continue only when exactly one safe link exists.
        const racedIdentities = await auth.listProviderIdentities(
          { provider: "google", entity_id: claims.sub },
          { relations: ["auth_identity"] },
        )
        if (racedIdentities.length !== 1) throw new Error("Google identity conflict")
      }
      if (providerWasCreated) {
        identity = await auth.retrieveAuthIdentity(emailAuthIdentityId)
      } else {
        const linkedIdentities = await auth.listProviderIdentities(
          { provider: "google", entity_id: claims.sub },
          { relations: ["auth_identity"] },
        )
        if (linkedIdentities.length !== 1) throw new Error("Google identity conflict")
        identity = await resolveProviderAuthIdentity(auth, linkedIdentities[0])
      }
      if (identity.id !== emailAuthIdentityId) {
        throw new Error("Google identity is linked to a different account")
      }
    }
    const actor = actorFromIdentity(identity)
    if (!actor || actor.actor_type !== "customer") throw new Error("Google account is not linked to a customer")
    // Rotate the session identifier before attaching the authenticated actor,
    // preventing a pre-authentication session from becoming authenticated.
    const authenticatedSession = await regenerateSession(req)
    authenticatedSession.auth_context = {
      ...actor,
      auth_identity_id: identity.id,
      auth_provider: "google",
      app_metadata: identity.app_metadata ?? {},
      user_metadata: identity.provider_identities?.find((entry) => entry.provider === "google")?.user_metadata ?? {},
    }
    await saveSession(authenticatedSession)
    res.redirect(302, returnTo)
  } catch {
    redirectWithError(res, config.storefrontOrigin, returnTo, "authentication_failed")
  }
}
