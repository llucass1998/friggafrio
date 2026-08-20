import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IAuthModuleService, AuthIdentityDTO } from "@medusajs/types"

const INVALID_CREDENTIALS = "E-mail ou senha inválidos."

type UnifiedLoginBody = {
  email?: unknown
  password?: unknown
}

type SessionAuthContext = {
  actor_id: string
  actor_type: "customer" | "user"
  auth_identity_id: string
  auth_provider: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
}

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (!email || email.length > 320 || !email.includes("@")) return null
  return email
}

const getActorType = (
  identity: AuthIdentityDTO,
): { actorType: "customer" | "user"; actorId: string } | null => {
  const metadata = identity.app_metadata ?? {}
  const userId = typeof metadata.user_id === "string" ? metadata.user_id : null
  const customerId =
    typeof metadata.customer_id === "string" ? metadata.customer_id : null

  // An identity linked to more than one actor is unsafe to resolve silently.
  if ((userId && customerId) || (!userId && !customerId)) return null
  return userId
    ? { actorType: "user", actorId: userId }
    : { actorType: "customer", actorId: customerId! }
}

const findEmailIdentities = async (
  auth: IAuthModuleService,
  email: string,
): Promise<AuthIdentityDTO[]> => {
  const providerIdentities = await auth.listProviderIdentities(
    {
      provider: "emailpass",
      entity_id: email,
    },
    { relations: ["auth_identity", "auth_identity.provider_identities"] },
  )

  const identities = providerIdentities
    .filter((providerIdentity) => typeof providerIdentity.entity_id === "string" && providerIdentity.entity_id.trim().toLowerCase() === email)
    .map((providerIdentity) => providerIdentity.auth_identity)
    .filter((identity): identity is AuthIdentityDTO => Boolean(identity))

  return Array.from(new Map(identities.map((identity) => [identity.id, identity])).values())
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body ?? {}) as UnifiedLoginBody
  const email = normalizeEmail(body.email)
  const password = typeof body.password === "string" ? body.password : null
  const bodyKeys = Object.keys((req.body ?? {}) as Record<string, unknown>)

  if (
    bodyKeys.some((key) => key !== "email" && key !== "password") ||
    !email ||
    !password ||
    password.length === 0 ||
    password.length > 1024
  ) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, INVALID_CREDENTIALS)
  }

  const auth = req.scope.resolve<IAuthModuleService>(Modules.AUTH)
  const identities = await findEmailIdentities(auth, email)

  if (identities.length !== 1) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, INVALID_CREDENTIALS)
  }

  const identity = identities[0]
  const actor = getActorType(identity)
  if (!actor) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, INVALID_CREDENTIALS)
  }

  const result = await auth.authenticate("emailpass", {
    actor_type: actor.actorType,
    url: req.url,
    headers: req.headers as Record<string, string>,
    query: req.query as Record<string, string>,
    body: { email, password },
    protocol: req.protocol,
  } as never)

  if (!result.success || !result.authIdentity || result.mfaChallenge || result.location) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, INVALID_CREDENTIALS)
  }

  const authenticatedActor = getActorType(result.authIdentity)
  if (
    !authenticatedActor ||
    authenticatedActor.actorType !== actor.actorType ||
    authenticatedActor.actorId !== actor.actorId
  ) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, INVALID_CREDENTIALS)
  }

  const providerIdentity = result.authIdentity.provider_identities?.find(
    (provider) => provider.provider === "emailpass",
  )
  const authContext: SessionAuthContext = {
    actor_id: actor.actorId,
    actor_type: actor.actorType,
    auth_identity_id: result.authIdentity.id,
    auth_provider: "emailpass",
    app_metadata: {
      ...(result.authIdentity.app_metadata ?? {}),
      [`${actor.actorType}_id`]: actor.actorId,
    },
    user_metadata: providerIdentity?.user_metadata ?? {},
  }

  // This is the same session context established by POST /auth/session, but
  // the actor resolution and token exchange remain entirely server-side.
  req.session.auth_context = authContext
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()))
  })

  res.status(200).json({ authenticated: true })
}
