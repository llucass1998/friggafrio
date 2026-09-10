import {
  createHash,
  createPublicKey,
  createVerify,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GOOGLE_JWKS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs"
const DEFAULT_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"])
const DEFAULT_TTL_MS = 10 * 60 * 1000

export type GoogleOidcConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  issuer: string
  storefrontOrigin: string
}

export type GoogleOidcSession = {
  state: string
  nonce: string
  codeVerifier: string
  returnTo: string
  redirectUri?: string
  storefrontOrigin?: string
  createdAt: number
}

export type GoogleOidcClaims = {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

const base64Url = (value: Buffer): string => value.toString("base64url")

const decodeJson = <T>(value: string): T =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const getGoogleOidcConfig = (
  env: NodeJS.ProcessEnv = process.env,
  req?: { headers?: Record<string, string | string[] | undefined> },
): GoogleOidcConfig | null => {
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  let redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  let storefrontOrigin = env.STOREFRONT_URL?.trim()
  if (!clientId || !clientSecret || !redirectUri || !storefrontOrigin) return null

  const hostHeader = typeof req?.headers?.host === "string" ? req.headers.host : undefined
  const forwardedHost = typeof req?.headers?.["x-forwarded-host"] === "string" ? req.headers["x-forwarded-host"] : undefined
  const effectiveHost = forwardedHost || hostHeader
  if (effectiveHost) {
    try {
      const hostname = new URL(effectiveHost.includes("://") ? effectiveHost : `http://${effectiveHost}`).hostname.replace(/^\[|\]$/g, "")
      if (LOCAL_HOSTS.has(hostname)) {
        redirectUri = "http://localhost:9000/auth/customer/google/callback"
        storefrontOrigin = `http://${hostname}:5173`
      }
    } catch {
      // Keep env defaults if host parsing fails
    }
  }

  try {
    const redirect = new URL(redirectUri)
    const storefront = new URL(storefrontOrigin)
    if (!["http:", "https:"].includes(redirect.protocol) || !["http:", "https:"].includes(storefront.protocol)) return null
    if (redirect.username || redirect.password || storefront.username || storefront.password) return null
    return {
      clientId,
      clientSecret,
      redirectUri: redirect.toString(),
      issuer: env.GOOGLE_OIDC_ISSUER?.trim() || "https://accounts.google.com",
      storefrontOrigin: storefront.origin,
    }
  } catch {
    return null
  }
}

export const normalizeGoogleReturnTo = (
  value: unknown,
  storefrontOrigin: string,
): string => {
  const fallback = new URL("/br/account", storefrontOrigin).toString()
  if (typeof value !== "string" || !value.trim()) return fallback
  try {
    const candidate = new URL(value, storefrontOrigin)
    const origin = new URL(storefrontOrigin).origin
    const isLocal = LOCAL_HOSTS.has(candidate.hostname.replace(/^\[|\]$/g, ""))
    if (
      (candidate.origin !== origin && !isLocal) ||
      candidate.username ||
      candidate.password ||
      candidate.pathname === "/br/account/login"
    ) return fallback
    return candidate.toString()
  } catch {
    return fallback
  }
}

export const createGoogleOidcSession = (
  returnTo: string,
  redirectUri?: string,
  storefrontOrigin?: string,
): GoogleOidcSession => ({
  state: base64Url(randomBytes(32)),
  nonce: base64Url(randomBytes(32)),
  codeVerifier: base64Url(randomBytes(48)),
  returnTo,
  redirectUri,
  storefrontOrigin,
  createdAt: Date.now(),
})

export const buildGoogleAuthorizationUrl = (
  config: GoogleOidcConfig,
  session: GoogleOidcSession,
): string => {
  const challenge = createHash("sha256").update(session.codeVerifier).digest("base64url")
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT)
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: session.state,
    nonce: session.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  }).toString()
  return url.toString()
}

export const isFreshGoogleOidcSession = (
  session: GoogleOidcSession | undefined,
  now = Date.now(),
): session is GoogleOidcSession => {
  const ttl = Number(process.env.GOOGLE_OIDC_STATE_TTL_MS || DEFAULT_TTL_MS)
  return Boolean(
    session &&
      Number.isSafeInteger(session.createdAt) &&
      now - session.createdAt >= 0 &&
      now - session.createdAt <= (Number.isSafeInteger(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_MS),
  )
}

export const equalOpaqueValues = (left: string, right: string): boolean => {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

type TokenResponse = { id_token?: string; access_token?: string }

export const exchangeGoogleCode = async (
  config: GoogleOidcConfig,
  code: string,
  codeVerifier: string,
  fetcher: typeof fetch = fetch,
): Promise<TokenResponse> => {
  const response = await fetcher(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  })
  if (!response.ok) throw new Error("Google authorization code exchange failed")
  const payload = (await response.json()) as TokenResponse
  if (!payload.id_token || !payload.access_token) throw new Error("Google token response is incomplete")
  return payload
}

export const verifyGoogleIdToken = async (
  idToken: string,
  config: GoogleOidcConfig,
  expectedNonce: string,
  fetcher: typeof fetch = fetch,
  now = Math.floor(Date.now() / 1000),
): Promise<GoogleOidcClaims> => {
  const parts = idToken.split(".")
  if (parts.length !== 3) throw new Error("Invalid Google ID token")
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = decodeJson<{ alg?: string; kid?: string }>(encodedHeader)
  const claims = decodeJson<GoogleOidcClaims & { iss?: string; aud?: string | string[]; azp?: string; exp?: number; iat?: number; nonce?: string }>(encodedPayload)
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Google ID token algorithm")
  if (!claims.sub || !claims.email || claims.email_verified !== true) throw new Error("Google account email is not verified")
  if (!claims.iss || !DEFAULT_ISSUERS.has(claims.iss) || claims.iss !== config.issuer) throw new Error("Google issuer mismatch")
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audiences.includes(config.clientId)) throw new Error("Google audience mismatch")
  if (audiences.length > 1 && claims.azp !== config.clientId) throw new Error("Google authorized-party mismatch")
  const exp = claims.exp
  const iat = claims.iat
  if (!Number.isFinite(exp) || !Number.isFinite(iat) || exp! <= now || iat! > now + 60) throw new Error("Google ID token is expired or not yet valid")
  if (!claims.nonce || !equalOpaqueValues(claims.nonce, expectedNonce)) throw new Error("Google nonce mismatch")

  const jwksResponse = await fetcher(GOOGLE_JWKS_ENDPOINT)
  if (!jwksResponse.ok) throw new Error("Google signing keys unavailable")
  const jwks = (await jwksResponse.json()) as { keys?: Array<Record<string, unknown>> }
  const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA")
  if (!jwk) throw new Error("Google signing key not found")
  const verifier = createVerify("RSA-SHA256")
  verifier.update(`${encodedHeader}.${encodedPayload}`)
  verifier.end()
  if (!verifier.verify(createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(encodedSignature, "base64url"))) throw new Error("Google ID token signature mismatch")
  return claims
}
