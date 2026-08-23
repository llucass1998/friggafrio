import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { POST } from "./route"

const response = () => {
  const result: { statusCode?: number; payload?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((payload: unknown) => { result.payload = payload; return result }),
  }
  return result
}

describe("newsletter unsubscribe", () => {
  it("suppresses an active subscription without exposing account information", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: NewsletterSubscriptionStatus.ACTIVE }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "unsubscribed" })
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.UNSUBSCRIBED,
    }))
  })

  it("does not undo bounce or complaint suppression", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: NewsletterSubscriptionStatus.BOUNCED }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
