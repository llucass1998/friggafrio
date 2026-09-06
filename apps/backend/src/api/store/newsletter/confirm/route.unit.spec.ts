import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { getNewsletterContactState, syncNewsletterContact } from "../../../../lib/email/resend"
import { POST } from "./route"

jest.mock("../../../../lib/email/resend", () => ({
  syncNewsletterContact: jest.fn().mockResolvedValue({ status: "sent", id: "contact_1" }),
  getNewsletterContactState: jest.fn().mockResolvedValue({ status: "sent", contactState: "active" }),
}))

const response = () => {
  const result: { statusCode?: number; payload?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((payload: unknown) => { result.payload = payload; return result }),
  }
  return result
}

describe("newsletter confirmation", () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    ;(syncNewsletterContact as jest.Mock).mockResolvedValue({ status: "sent", id: "contact_1" })
    ;(getNewsletterContactState as jest.Mock).mockResolvedValue({ status: "sent", contactState: "active" })
  })

  it("activates a pending subscription exactly once and retains a hash for idempotent replay", async () => {
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

  it("does not activate a legacy pending record if contact synchronization fails", async () => {
    ;(syncNewsletterContact as jest.Mock).mockResolvedValue({ status: "failed", error: "temporary" })
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_1",
        email: "ana@example.com",
        name: "Ana",
        status: NewsletterSubscriptionStatus.PENDING,
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.payload).toEqual({ status: "confirmation_pending" })
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      last_email_status: "contact_sync_failed",
    }))
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalledWith(expect.objectContaining({
      status: NewsletterSubscriptionStatus.ACTIVE,
    }))
  })

  it("does not reactivate a contact that Resend reports as unsubscribed", async () => {
    ;(getNewsletterContactState as jest.Mock).mockResolvedValue({ status: "sent", contactState: "unsubscribed" })
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_1",
        email: "ana@example.com",
        name: "Ana",
        resend_contact_id: "contact_1",
        status: NewsletterSubscriptionStatus.PENDING,
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalledWith(expect.objectContaining({ status: NewsletterSubscriptionStatus.ACTIVE }))
  })

  it("revalidates the contact created while confirming a legacy record", async () => {
    ;(getNewsletterContactState as jest.Mock).mockResolvedValue({ status: "sent", contactState: "bounced" })
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_legacy",
        email: "ana@example.com",
        name: "Ana",
        status: NewsletterSubscriptionStatus.PENDING,
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token: "a".repeat(32) }, scope: { resolve: () => service } } as never, res as never)
    expect(getNewsletterContactState).toHaveBeenCalledWith(expect.objectContaining({ contactId: "contact_1" }))
    expect(res.statusCode).toBe(503)
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalledWith(expect.objectContaining({ status: NewsletterSubscriptionStatus.ACTIVE }))
  })

  it("serializes concurrent confirmation attempts for the same token", async () => {
    const token = "a".repeat(32)
    const record = {
      id: "sub_1", status: NewsletterSubscriptionStatus.PENDING,
      confirmation_token_hash: hashNewsletterToken(token),
      confirmation_expires_at: new Date(Date.now() + 60_000),
    }
    const service = {
      listNewsletterSubscriptions: jest.fn().mockImplementation(async (filters) =>
        record.status === filters.status && record.confirmation_token_hash === filters.confirmation_token_hash ? [record] : []),
      updateNewsletterSubscriptions: jest.fn().mockImplementation(async (update) => Object.assign(record, update)),
    }
    let tail = Promise.resolve()
    const database = {
      transaction: async (handler: (transaction: { raw: jest.Mock }) => Promise<unknown>) => {
        const result = tail.then(() => handler({ raw: jest.fn().mockResolvedValue(undefined) }))
        tail = result.then(() => undefined, () => undefined)
        return result
      },
    }
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.PG_CONNECTION ? database : service }
    const first = response()
    const second = response()

    await Promise.all([
      POST({ body: { token }, scope } as never, first as never),
      POST({ body: { token }, scope } as never, second as never),
    ])

    expect(service.updateNewsletterSubscriptions.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 400])
  })

  it("returns pending while another confirmation lease is still fresh", async () => {
    const token = "b".repeat(32)
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_lease", status: NewsletterSubscriptionStatus.PENDING,
        last_email_status: "confirmation_processing", updated_at: new Date(),
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(res.payload).toEqual({ status: "confirmation_pending" })
    expect(syncNewsletterContact).not.toHaveBeenCalled()
  })

  it("returns an idempotent success for a confirmation token already completed", async () => {
    const token = "d".repeat(32)
    const service = {
      listNewsletterSubscriptions: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "sub_done", status: NewsletterSubscriptionStatus.ACTIVE }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "already_confirmed" })
    expect(syncNewsletterContact).not.toHaveBeenCalled()
  })

  it("reclaims an expired confirmation lease", async () => {
    const token = "c".repeat(32)
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{
        id: "sub_stale", email: "ana@example.com", name: "Ana", status: NewsletterSubscriptionStatus.PENDING,
        last_email_status: "confirmation_processing", updated_at: new Date(Date.now() - 10 * 60_000),
        confirmation_expires_at: new Date(Date.now() + 60_000),
      }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ body: { token }, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(syncNewsletterContact).toHaveBeenCalledTimes(1)
  })
})
