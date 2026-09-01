import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { POST } from "./route"

const response = () => {
  const result: { statusCode?: number; payload?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((payload: unknown) => { result.payload = payload; return result }),
  }
  return result
}

const service = (existing: unknown[] = []) => ({
  listNewsletterSubscriptions: jest.fn().mockResolvedValue(existing),
  createNewsletterSubscriptions: jest.fn().mockImplementation(async (input) => ({ id: "sub_1", ...input })),
  updateNewsletterSubscriptions: jest.fn().mockImplementation(async (input) => ({ id: "sub_1", ...input })),
})

describe("newsletter subscriptions", () => {
  const originalEnv = { ...process.env }
  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  it("creates a pending, consented subscription with hashes only and a generic response", async () => {
    const subscriptions = service()
    const res = response()
    await POST({
      body: { name: " Ana ", email: " ANA@EXAMPLE.COM ", consent: true, consent_version: "2026-08" },
      scope: { resolve: () => subscriptions },
    } as never, res as never)

    expect(res.statusCode).toBe(202)
    expect(res.payload).toEqual({ status: "confirmation_pending" })
    expect(subscriptions.createNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      name: "Ana",
      email: "ana@example.com",
      email_normalized: "ana@example.com",
      status: NewsletterSubscriptionStatus.PENDING,
      consent_version: "2026-08",
    }))
    const created = subscriptions.createNewsletterSubscriptions.mock.calls[0][0] as Record<string, unknown>
    expect(created.confirmation_token_hash).toEqual(expect.any(String))
    expect(created.unsubscribe_token_hash).toEqual(expect.any(String))
    expect(Object.keys(created)).not.toContain("confirmation_token")
    expect(Object.keys(created)).not.toContain("unsubscribe_token")
    expect(hashNewsletterToken(String(created.confirmation_token_hash))).not.toBe(String(created.confirmation_token_hash))
  })

  it("requires affirmative consent and does not call the module on invalid input", async () => {
    const subscriptions = service()
    const res = response()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: false }, scope: { resolve: () => subscriptions } } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(subscriptions.listNewsletterSubscriptions).not.toHaveBeenCalled()
  })

  it("accepts honeypot submissions without persisting an address", async () => {
    const res = response()
    const resolve = jest.fn()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true, website: "bot" }, scope: { resolve } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(resolve).not.toHaveBeenCalled()
  })

  it.each([NewsletterSubscriptionStatus.PENDING, NewsletterSubscriptionStatus.ACTIVE, NewsletterSubscriptionStatus.BOUNCED, NewsletterSubscriptionStatus.COMPLAINED])(
    "does not enumerate an existing %s address",
    async (status) => {
      const subscriptions = service([{ id: "sub_1", status }])
      const res = response()
      await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)
      expect(res.statusCode).toBe(202)
      expect(res.payload).toEqual({ status: "confirmation_pending" })
      expect(subscriptions.createNewsletterSubscriptions).not.toHaveBeenCalled()
      expect(subscriptions.updateNewsletterSubscriptions).not.toHaveBeenCalled()
    },
  )

  it("requires a new confirmation when a previously unsubscribed address provides consent", async () => {
    const subscriptions = service([{ id: "sub_1", status: NewsletterSubscriptionStatus.UNSUBSCRIBED }])
    const res = response()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(subscriptions.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.PENDING,
    }))
  })
})
