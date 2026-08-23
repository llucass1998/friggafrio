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

describe("newsletter confirmation", () => {
  it("activates a pending subscription exactly once and removes its confirmation hash", async () => {
    const token = "a".repeat(32)
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_1",
        status: NewsletterSubscriptionStatus.PENDING,
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "confirmed" })
    expect(service.listNewsletterSubscriptions).toHaveBeenCalledWith({
      confirmation_token_hash: hashNewsletterToken(token),
      status: NewsletterSubscriptionStatus.PENDING,
    })
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.ACTIVE,
      confirmation_token_hash: null,
      confirmation_expires_at: null,
    }))
  })

  it("rejects expired or previously used confirmation tokens without changing state", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_1",
        status: NewsletterSubscriptionStatus.PENDING,
        confirmation_expires_at: new Date(Date.now() - 1),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ status: "invalid_or_expired" })
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
