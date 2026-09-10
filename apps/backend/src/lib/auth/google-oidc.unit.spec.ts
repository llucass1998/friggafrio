import { generateKeyPairSync, createSign } from "node:crypto"
import {
  buildGoogleAuthorizationUrl,
  createGoogleOidcSession,
  getGoogleOidcConfig,
  normalizeGoogleReturnTo,
  verifyGoogleIdToken,
} from "./google-oidc"

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url")

describe("Google OIDC safeguards", () => {
  it("fails closed when server credentials are incomplete", () => {
    expect(getGoogleOidcConfig({ STOREFRONT_URL: "https://shop.example" })).toBeNull()
  })

  it("creates a PKCE authorization request and rejects external return targets", () => {
    const config = getGoogleOidcConfig({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "server-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://api.example/auth/customer/google/callback",
      STOREFRONT_URL: "https://shop.example",
    })!
    const session = createGoogleOidcSession(normalizeGoogleReturnTo("https://evil.example", config.storefrontOrigin))
    const url = new URL(buildGoogleAuthorizationUrl(config, session))
    expect(url.origin).toBe("https://accounts.google.com")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("state")).toBe(session.state)
    expect(new URL(session.returnTo).origin).toBe("https://shop.example")
    expect(
      normalizeGoogleReturnTo("https://shop.example/br/account/login", "https://shop.example"),
    ).toBe("https://shop.example/br/account")
  })

  it("validates issuer, audience, nonce, expiry and RS256 signature", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const config = getGoogleOidcConfig({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "server-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://api.example/auth/customer/google/callback",
      STOREFRONT_URL: "https://shop.example",
    })!
    const nonce = "nonce-value"
    const now = Math.floor(Date.now() / 1000)
    const header = encode({ alg: "RS256", kid: "test-key", typ: "JWT" })
    const payload = encode({
      iss: "https://accounts.google.com",
      aud: "client-id",
      sub: "google-subject",
      email: "customer@example.com",
      email_verified: true,
      nonce,
      iat: now,
      exp: now + 300,
    })
    const signer = createSign("RSA-SHA256")
    signer.update(`${header}.${payload}`)
    signer.end()
    const token = `${header}.${payload}.${signer.sign(privateKey).toString("base64url")}`
    const jwk = publicKey.export({ format: "jwk" })
    const fetcher = (async (input: RequestInfo | URL) => {
      if (String(input).includes("oauth2.googleapis.com")) return new Response(JSON.stringify({}), { status: 200 })
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", kty: "RSA" }] }), { status: 200 })
    }) as typeof fetch
    await expect(verifyGoogleIdToken(token, config, nonce, fetcher, now)).resolves.toMatchObject({
      sub: "google-subject",
      email: "customer@example.com",
    })
    await expect(verifyGoogleIdToken(token, config, "wrong", fetcher, now)).rejects.toThrow(/nonce/i)
  })

  it("requires azp when Google returns multiple audiences", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const config = getGoogleOidcConfig({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "server-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://api.example/auth/customer/google/callback",
      STOREFRONT_URL: "https://shop.example",
    })!
    const now = Math.floor(Date.now() / 1000)
    const header = encode({ alg: "RS256", kid: "test-key", typ: "JWT" })
    const payload = encode({
      iss: "https://accounts.google.com",
      aud: ["client-id", "another-client"],
      sub: "google-subject",
      email: "customer@example.com",
      email_verified: true,
      nonce: "nonce-value",
      iat: now,
      exp: now + 300,
    })
    const signer = createSign("RSA-SHA256")
    signer.update(`${header}.${payload}`)
    signer.end()
    const token = `${header}.${payload}.${signer.sign(privateKey).toString("base64url")}`
    const jwk = publicKey.export({ format: "jwk" })
    const fetcher = (async () => new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", kty: "RSA" }] }), { status: 200 })) as typeof fetch

    await expect(verifyGoogleIdToken(token, config, "nonce-value", fetcher, now)).rejects.toThrow(/authorized-party/i)
  })

  it("adapts redirectUri and storefrontOrigin for local development requests", () => {
    const env = {
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "server-secret",
      GOOGLE_OAUTH_REDIRECT_URI: "https://friggafrio.istigestao.com.br/auth/customer/google/callback",
      STOREFRONT_URL: "https://friggafrio.istigestao.com.br",
    }
    const localConfig = getGoogleOidcConfig(env, { headers: { host: "localhost:9000" } })!
    expect(localConfig.redirectUri).toBe("http://localhost:9000/auth/customer/google/callback")
    expect(localConfig.storefrontOrigin).toBe("http://localhost:5173")

    expect(
      normalizeGoogleReturnTo("http://localhost:5173/br/account", localConfig.storefrontOrigin),
    ).toBe("http://localhost:5173/br/account")
  })
})
