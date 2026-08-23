import { Webhook } from "svix"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NewsletterSubscriptionStatus } from "../../../modules/newsletter-subscription/models/newsletter-subscription"
import { POST } from "./route"

const response = () => {
  const result: { statusCode?: number; payload?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((payload: unknown) => { result.payload = payload; return result }),
  }
  return result
}

const signingSecret = `whsec_${Buffer.alloc(32, 7).toString("base64")}`

const signedRequest = (payload: string, service: Record<string, unknown>) => {
  const id = "msg_newsletter_test"
  const timestamp = new Date()
  const signature = new Webhook(signingSecret).sign(id, timestamp, payload)
  return {
    headers: {
      "svix-id": id,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "svix-signature": signature,
    },
    rawBody: payload,
    scope: { resolve: () => service },
  }
}

describe("Resend webhook", () => {
  const beforeSecret = process.env.RESEND_WEBHOOK_SECRET

  beforeEach(() => { process.env.RESEND_WEBHOOK_SECRET = signingSecret })
  afterAll(() => {
    if (beforeSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET
    else process.env.RESEND_WEBHOOK_SECRET = beforeSecret
  })

  it("rejects unsigned requests before accessing subscription data", async () => {
    const service = { listNewsletterWebhookEvents: jest.fn() }
    const res = response()
    await POST({ headers: {}, rawBody: "{}", scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(401)
    expect(service.listNewsletterWebhookEvents).not.toHaveBeenCalled()
  })

  it("preserves the exact body bytes before Svix verification", () => {
    const middlewareSource = readFileSync(join(__dirname, "../../middlewares.ts"), "utf8")
    expect(middlewareSource).toContain("preserveRawBody: true")
  })

  it("records a signed bounce once and suppresses its subscription", async () => {
    const service = {
      listNewsletterWebhookEvents: jest.fn().mockResolvedValue([]),
      createNewsletterWebhookEvents: jest.fn(),
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: NewsletterSubscriptionStatus.ACTIVE }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST(signedRequest('{"type":"email.bounced","data":{"email_id":"email_1"}}', service) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "processed" })
    expect(service.createNewsletterWebhookEvents).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "email.bounced",
      email_id: "email_1",
      payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }))
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({
      id: "sub_1",
      status: NewsletterSubscriptionStatus.BOUNCED,
    }))
  })

  it("recognizes a verified replay without processing it twice", async () => {
    const service = {
      listNewsletterWebhookEvents: jest.fn().mockResolvedValue([{ id: "event_1" }]),
      createNewsletterWebhookEvents: jest.fn(),
      listNewsletterSubscriptions: jest.fn(),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST(signedRequest('{"type":"email.complained","data":{"email_id":"email_1"}}', service) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "duplicate" })
    expect(service.createNewsletterWebhookEvents).not.toHaveBeenCalled()
    expect(service.updateNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
