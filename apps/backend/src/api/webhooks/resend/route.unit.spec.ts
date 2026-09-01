import { createHmac } from "node:crypto"
import { POST } from "./route"

const response = () => {
  const result = { statusCode: 200, payload: undefined as unknown }
  return {
    status(code: number) { result.statusCode = code; return this },
    json(payload: unknown) { result.payload = payload; return this },
    get statusCode() { return result.statusCode },
    get payload() { return result.payload },
  }
}

describe("Resend webhook", () => {
  const secret = `whsec_${Buffer.alloc(32, 7).toString("base64")}`

  it("rejects unsigned requests before reading subscription data", async () => {
    process.env.RESEND_WEBHOOK_SECRET = secret
    const service = { listNewsletterWebhookEvents: jest.fn() }
    const res = response()
    await POST({ headers: {}, rawBody: "{}", scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(401)
    expect(service.listNewsletterWebhookEvents).not.toHaveBeenCalled()
  })

  it("processes a signed bounce once and records only safe metadata", async () => {
    process.env.RESEND_WEBHOOK_SECRET = secret
    const body = JSON.stringify({ type: "email.bounced", data: { email_id: "email_1" } })
    const id = "msg_test"
    const timestamp = String(Math.floor(Date.now() / 1000))
    const key = Buffer.from(secret.slice("whsec_".length), "base64")
    const digest = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")
    const service = {
      listNewsletterWebhookEvents: jest.fn().mockResolvedValue([]),
      createNewsletterWebhookEvents: jest.fn(),
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1" }]),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${digest}` }, rawBody: body, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "processed" })
    expect(service.createNewsletterWebhookEvents).toHaveBeenCalledWith(expect.objectContaining({ event_type: "email.bounced", email_id: "email_1", payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }))
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1", status: "bounced" }))
  })

  it("treats a concurrent unique-event race as a duplicate", async () => {
    process.env.RESEND_WEBHOOK_SECRET = secret
    const body = JSON.stringify({ type: "email.bounced", data: { email_id: "email_1" } })
    const id = "msg_race"
    const timestamp = String(Math.floor(Date.now() / 1000))
    const key = Buffer.from(secret.slice("whsec_".length), "base64")
    const digest = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")
    const service = {
      listNewsletterWebhookEvents: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "evt_existing" }]),
      createNewsletterWebhookEvents: jest.fn().mockRejectedValue(new Error("unique violation")),
      listNewsletterSubscriptions: jest.fn(),
      updateNewsletterSubscriptions: jest.fn(),
    }
    const res = response()
    await POST({ headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${digest}` }, rawBody: body, scope: { resolve: () => service } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "duplicate" })
    expect(service.listNewsletterSubscriptions).not.toHaveBeenCalled()
  })

  afterEach(() => { delete process.env.RESEND_WEBHOOK_SECRET })
})
