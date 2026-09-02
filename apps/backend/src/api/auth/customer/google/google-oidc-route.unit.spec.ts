import { GET as startGoogle } from "./start/route"
import { GET as callbackGoogle } from "./callback/route"
import { GET as googleStatus } from "./status/route"
import {
  exchangeGoogleCode,
  verifyGoogleIdToken,
} from "../../../../lib/auth/google-oidc"

jest.mock("../../../../lib/auth/google-oidc", () => {
  const actual = jest.requireActual("../../../../lib/auth/google-oidc")
  return {
    ...actual,
    exchangeGoogleCode: jest.fn(),
    verifyGoogleIdToken: jest.fn(),
  }
})

const response = () => ({
  statusCode: 200,
  payload: undefined as unknown,
  location: undefined as string | undefined,
  status(code: number) {
    this.statusCode = code
    return this
  },
  json(payload: unknown) {
    this.payload = payload
    return this
  },
  redirect(_code: number, location: string) {
    this.location = location
    return this
  },
})

type TestSession = {
  google_oidc?: {
    state: string
    nonce: string
    codeVerifier: string
    returnTo: string
    createdAt: number
  }
  auth_context?: Record<string, unknown>
  save: (callback: (error?: Error | null) => void) => void
  regenerate?: (callback: (error?: Error | null) => void) => void
}

describe("Google OIDC routes", () => {
  const names = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_OAUTH_REDIRECT_URI",
    "STOREFRONT_URL",
  ] as const
  const previous = new Map(names.map((name) => [name, process.env[name]]))

  afterEach(() => {
    for (const name of names) {
      const value = previous.get(name)
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })

  it("fails closed before redirect when external credentials are absent", async () => {
    for (const name of names) delete process.env[name]
    const res = response()
    await startGoogle({ query: {}, session: {} } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.payload).toMatchObject({ code: "GOOGLE_OIDC_EXTERNAL_CONFIGURATION_REQUIRED" })
  })

  it("reports availability through the auth namespace without requiring a store key", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "https://api.example/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "https://shop.example"

    const res = response()
    googleStatus({} as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ available: true })
  })

  it("consumes a mismatched callback state without exchanging a code", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "https://api.example/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "https://shop.example"
    const session = {
      google_oidc: {
        state: "expected-state",
        nonce: "nonce",
        codeVerifier: "verifier",
        returnTo: "https://shop.example/br/account",
        createdAt: Date.now(),
      },
      save: jest.fn((callback: (error?: Error | null) => void) => callback()),
    }
    const res = response()
    await callbackGoogle({ query: { state: "wrong", code: "code" }, session } as never, res as never)
    expect(session.google_oidc).toBeUndefined()
    expect(session.save).toHaveBeenCalled()
    expect(res.location).toContain("/br/account/login?")
    expect(res.location).toContain("google_error=invalid_request")
    expect(res.location).toContain("returnTo=%2Fbr%2Faccount")
  })

  it("sends an expired callback to the login surface without a self-loop returnTo", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:9000/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "http://localhost:5173"

    const res = response()
    await callbackGoogle({ query: { state: "stale", code: "code" }, session: {} } as never, res as never)

    expect(res.location).toBe(
      "http://localhost:5173/br/account/login?returnTo=%2Fbr%2Faccount&google_error=expired",
    )
  })

  it("persists auth context on the regenerated session", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "https://api.example/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "https://shop.example"

    const oldSession: TestSession = {
      google_oidc: {
        state: "expected-state",
        nonce: "nonce",
        codeVerifier: "verifier",
        returnTo: "https://shop.example/br/account",
        createdAt: Date.now(),
      },
      save: jest.fn((callback: (error?: Error | null) => void) => callback()),
    }
    const regeneratedSession: TestSession = {
      save: jest.fn((callback: (error?: Error | null) => void) => callback()),
    }
    const req = {
      query: { state: "expected-state", code: "authorization-code" },
      session: oldSession,
      scope: {
        resolve: () => ({
          listProviderIdentities: jest
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
              {
                auth_identity_id: "auth_1",
                auth_identity: {
                  id: "auth_1",
                  app_metadata: { customer_id: "cus_1" },
                  provider_identities: [{ provider: "emailpass" }],
                },
              },
            ]),
          createProviderIdentities: jest.fn().mockResolvedValue({ id: "provider_1" }),
          retrieveAuthIdentity: jest.fn().mockResolvedValue({
            id: "auth_1",
            app_metadata: { customer_id: "cus_1" },
            provider_identities: [{ provider: "google", user_metadata: { email: "customer@example.com" } }],
          }),
        }),
      },
    }
    oldSession.regenerate = jest.fn((callback: (error?: Error | null) => void) => {
      req.session = regeneratedSession
      callback()
    })
    const res = response()

    const exchange = exchangeGoogleCode as jest.MockedFunction<typeof exchangeGoogleCode>
    exchange.mockResolvedValue({ id_token: "id-token", access_token: "access-token" })
    const verify = verifyGoogleIdToken as jest.MockedFunction<typeof verifyGoogleIdToken>
    verify.mockResolvedValue({ sub: "google-sub", email: "customer@example.com", email_verified: true })

    await callbackGoogle(req as never, res as never)

    expect(oldSession.auth_context).toBeUndefined()
    expect(regeneratedSession.auth_context).toMatchObject({
      actor_id: "cus_1",
      actor_type: "customer",
      auth_provider: "google",
    })
    expect(res.location).toBe("https://shop.example/br/account")
    exchange.mockReset()
    verify.mockReset()
  })

  it("resolves an existing Google link when the adapter omits the relation", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "https://api.example/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "https://shop.example"

    const session: TestSession = {
      google_oidc: {
        state: "expected-state",
        nonce: "nonce",
        codeVerifier: "verifier",
        returnTo: "https://shop.example/br/account",
        createdAt: Date.now(),
      },
      save: jest.fn((callback: (error?: Error | null) => void) => callback()),
    }
    const identity = {
      id: "auth_1",
      app_metadata: { customer_id: "cus_1" },
      provider_identities: [{ provider: "google", user_metadata: { email: "customer@example.com" } }],
    }
    const auth = {
      listProviderIdentities: jest.fn().mockResolvedValue([
        { id: "provider_1", provider: "google", entity_id: "google-sub", auth_identity_id: "auth_1" },
      ]),
      createProviderIdentities: jest.fn(),
      retrieveAuthIdentity: jest.fn().mockResolvedValue(identity),
    }
    const req = {
      query: { state: "expected-state", code: "authorization-code" },
      session,
      scope: { resolve: () => auth },
    }
    const res = response()
    const exchange = exchangeGoogleCode as jest.MockedFunction<typeof exchangeGoogleCode>
    exchange.mockResolvedValue({ id_token: "id-token", access_token: "access-token" })
    const verify = verifyGoogleIdToken as jest.MockedFunction<typeof verifyGoogleIdToken>
    verify.mockResolvedValue({ sub: "google-sub", email: "customer@example.com", email_verified: true })

    await callbackGoogle(req as never, res as never)

    expect(auth.retrieveAuthIdentity).toHaveBeenCalledWith("auth_1")
    expect(auth.createProviderIdentities).not.toHaveBeenCalled()
    expect(res.location).toBe("https://shop.example/br/account")
    exchange.mockReset()
    verify.mockReset()
  })

  it("re-reads a Google link after a concurrent unique-identity race", async () => {
    process.env.GOOGLE_CLIENT_ID = "client-id"
    process.env.GOOGLE_CLIENT_SECRET = "server-secret"
    process.env.GOOGLE_OAUTH_REDIRECT_URI = "https://api.example/auth/customer/google/callback"
    process.env.STOREFRONT_URL = "https://shop.example"

    const session: TestSession = {
      google_oidc: {
        state: "expected-state",
        nonce: "nonce",
        codeVerifier: "verifier",
        returnTo: "https://shop.example/br/account",
        createdAt: Date.now(),
      },
      save: jest.fn((callback: (error?: Error | null) => void) => callback()),
    }
    const identity = {
      id: "auth_1",
      app_metadata: { customer_id: "cus_1" },
      provider_identities: [{ provider: "google", user_metadata: { email: "customer@example.com" } }],
    }
    const auth = {
      listProviderIdentities: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "email_1", provider: "emailpass", entity_id: "customer@example.com", auth_identity_id: "auth_1", auth_identity: identity }])
        .mockResolvedValueOnce([{ id: "google_1", provider: "google", entity_id: "google-sub", auth_identity_id: "auth_1", auth_identity: identity }])
        .mockResolvedValueOnce([{ id: "google_1", provider: "google", entity_id: "google-sub", auth_identity_id: "auth_1", auth_identity: identity }]),
      createProviderIdentities: jest.fn().mockRejectedValue(new Error("unique constraint")),
      retrieveAuthIdentity: jest.fn().mockResolvedValue(identity),
    }
    const req = {
      query: { state: "expected-state", code: "authorization-code" },
      session,
      scope: { resolve: () => auth },
    }
    const res = response()
    const exchange = exchangeGoogleCode as jest.MockedFunction<typeof exchangeGoogleCode>
    exchange.mockResolvedValue({ id_token: "id-token", access_token: "access-token" })
    const verify = verifyGoogleIdToken as jest.MockedFunction<typeof verifyGoogleIdToken>
    verify.mockResolvedValue({ sub: "google-sub", email: "customer@example.com", email_verified: true })

    await callbackGoogle(req as never, res as never)

    expect(auth.createProviderIdentities).toHaveBeenCalledTimes(1)
    expect(res.location).toBe("https://shop.example/br/account")
    exchange.mockReset()
    verify.mockReset()
  })
})
