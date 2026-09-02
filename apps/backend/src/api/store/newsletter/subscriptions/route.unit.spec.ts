import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { sendNewsletterConfirmationEmail } from "../../../../lib/newsletter/email"
import { POST } from "./route"

jest.mock("../../../../lib/newsletter/email", () => ({
  sendNewsletterConfirmationEmail: jest.fn().mockResolvedValue({ delivered: false, reason: "not_configured" }),
}))


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
    ;(sendNewsletterConfirmationEmail as jest.Mock).mockResolvedValue({ delivered: false, reason: "not_configured" })
  })

  it("records confirmation delivery time only after the mocked provider accepts it", async () => {
    ;(sendNewsletterConfirmationEmail as jest.Mock).mockResolvedValue({ delivered: true, emailId: "email_1" })
    const subscriptions = service()
    const res = response()

    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)

    expect(res.statusCode).toBe(202)
    expect(subscriptions.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      resend_email_id: "email_1",
      last_email_status: "confirmation_sent",
      confirmation_sent_at: expect.any(Date),
    }))
  })

  it("does not create a provider contact before confirmation", async () => {
    const subscriptions = service()
    const res = response()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)

    expect(sendNewsletterConfirmationEmail).toHaveBeenCalled()
  })

  it("allows a deliberate retry after contact synchronization could not be configured", async () => {
    const subscriptions = service([{ id: "sub_1", status: NewsletterSubscriptionStatus.PENDING, last_email_status: "contact_sync_not_configured" }])
    const res = response()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(subscriptions.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.PENDING,
    }))
  })

  it("refreshes an expired pending confirmation instead of acknowledging forever", async () => {
    const subscriptions = service([{
      id: "sub_1",
      status: NewsletterSubscriptionStatus.PENDING,
      last_email_status: "confirmation_sent",
      confirmation_expires_at: new Date(Date.now() - 1_000),
    }])
    const res = response()

    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)

    expect(res.statusCode).toBe(202)
    expect(subscriptions.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.PENDING,
      confirmation_expires_at: expect.any(Date),
    }))
  })

  it("serializes concurrent retries so only one renewed confirmation is delivered", async () => {
    ;(sendNewsletterConfirmationEmail as jest.Mock).mockClear()
    ;(sendNewsletterConfirmationEmail as jest.Mock).mockResolvedValue({ delivered: true, emailId: "email_1" })
    const record: Record<string, unknown> = {
      id: "sub_1", name: "Ana", email: "ana@example.com", email_normalized: "ana@example.com",
      status: NewsletterSubscriptionStatus.PENDING, last_email_status: "confirmation_sent",
      confirmation_expires_at: new Date(Date.now() - 1_000),
    }
    const subscriptions = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([record]),
      createNewsletterSubscriptions: jest.fn(),
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
    const scope = { resolve: (key: unknown) => key === ContainerRegistrationKeys.PG_CONNECTION ? database : subscriptions }

    await Promise.all([
      POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope } as never, response() as never),
      POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope } as never, response() as never),
    ])

    expect(sendNewsletterConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  it("acknowledges a concurrent unique-email race after re-reading the winner", async () => {
    const subscriptions = service()
    subscriptions.createNewsletterSubscriptions
      .mockRejectedValueOnce(Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" }))
    subscriptions.listNewsletterSubscriptions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "sub_winner", status: NewsletterSubscriptionStatus.PENDING }])
    const res = response()

    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)

    expect(res.statusCode).toBe(202)
    expect(res.payload).toEqual({ status: "confirmation_pending" })
    expect(subscriptions.createNewsletterSubscriptions).toHaveBeenCalledTimes(1)
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
    expect(subscriptions.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      last_email_status: expect.any(String),
    }))
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

  it("does not reactivate a previously unsubscribed address", async () => {
    const subscriptions = service([{ id: "sub_1", status: NewsletterSubscriptionStatus.UNSUBSCRIBED }])
    const res = response()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true }, scope: { resolve: () => subscriptions } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(subscriptions.updateNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
