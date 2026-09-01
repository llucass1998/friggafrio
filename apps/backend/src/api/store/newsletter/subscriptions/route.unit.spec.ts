import { POST } from "./route"

const makeResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) { response.statusCode = code; return response },
    json(payload: unknown) { response.payload = payload; return response },
  }
  return response
}

describe("newsletter subscriptions", () => {
  const originalEnv = { ...process.env }
  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID
    delete process.env.RESEND_AUDIENCE_ID
  })
  afterEach(() => { process.env = { ...originalEnv } })
  it("normalizes a new voluntary subscription", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([]),
      createNewsletterSubscriptions: jest.fn().mockResolvedValue({ id: "sub_1" }),
      updateNewsletterSubscriptions: jest.fn().mockResolvedValue({ id: "sub_1" }),
    }
    const response = makeResponse()
    await POST({ body: { name: " Ana ", email: " ANA@EXAMPLE.COM ", consent: true, consent_version: "2026-08" }, scope: { resolve: () => service } } as never, response as never)
    expect(response.statusCode).toBe(201)
    expect(response.payload).toEqual(expect.objectContaining({ status: "subscribed", confirmation: "not_configured", contact: "not_configured" }))
    expect(service.createNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({ name: "Ana", email: "ana@example.com", status: "active", consent_version: "2026-08" }))
  })

  it("is idempotent for an existing normalized email", async () => {
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: "active", confirmation_sent_at: new Date() }]),
      createNewsletterSubscriptions: jest.fn(),
      updateNewsletterSubscriptions: jest.fn().mockResolvedValue({ id: "sub_1" }),
    }
    const response = makeResponse()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true, consent_version: "2026-08" }, scope: { resolve: () => service } } as never, response as never)
    expect(response.statusCode).toBe(200)
    expect(response.payload).toEqual({ status: "already_registered" })
    expect(service.createNewsletterSubscriptions).not.toHaveBeenCalled()
  })

  it("retries an active subscription whose confirmation was not delivered", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID = "tmpl_test"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const service = {
      listNewsletterSubscriptions: jest.fn().mockResolvedValue([{ id: "sub_1", status: "active", confirmation_sent_at: null }]),
      createNewsletterSubscriptions: jest.fn(),
      updateNewsletterSubscriptions: jest.fn().mockResolvedValue({ id: "sub_1" }),
    }
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }))
    const response = makeResponse()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true, consent_version: "2026-08" }, scope: { resolve: () => service } } as never, response as never)
    expect(response.statusCode).toBe(201)
    expect(service.createNewsletterSubscriptions).not.toHaveBeenCalled()
    expect(service.updateNewsletterSubscriptions).toHaveBeenCalledWith(expect.objectContaining({ id: "sub_1", status: "active" }))
  })

  it("rejects missing names and invalid emails", async () => {
    const response = makeResponse()
    await POST({ body: { name: " ", email: "not-an-email", consent: false }, scope: { resolve: jest.fn() } } as never, response as never)
    expect(response.statusCode).toBe(400)
  })

  it("does not persist a filled honeypot", async () => {
    const service = { listNewsletterSubscriptions: jest.fn(), createNewsletterSubscriptions: jest.fn() }
    const response = makeResponse()
    await POST({ body: { name: "Ana", email: "ana@example.com", consent: true, consent_version: "2026-08", website: "bot" }, scope: { resolve: () => service } } as never, response as never)
    expect(response.statusCode).toBe(201)
    expect(service.createNewsletterSubscriptions).not.toHaveBeenCalled()
  })
})
