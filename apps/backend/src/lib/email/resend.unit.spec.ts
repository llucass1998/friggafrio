import { getResendConfigStatus, sendNewsletterConfirmation, syncNewsletterContact, unsubscribeNewsletterContact } from "./resend"

describe("Resend server adapter", () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
    jest.restoreAllMocks()
  })

  it("reports missing configuration without making a request", async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID
    expect(getResendConfigStatus().missing).toContain("RESEND_API_KEY")
    await expect(sendNewsletterConfirmation({ email: "a@example.com", idempotencyKey: "k" }))
      .resolves.toEqual(expect.objectContaining({ status: "not_configured" }))
  })

  it("uses an idempotency key and never exposes the key in the body", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID = "tmpl_test"
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "em_1" }), { status: 200 }))
    await expect(sendNewsletterConfirmation({ email: "a@example.com", idempotencyKey: "newsletter-a" }))
      .resolves.toEqual({ status: "sent", id: "em_1" })
    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect((request.headers as Record<string, string>)["Idempotency-Key"]).toBe("newsletter-a")
    expect(String(request.body)).not.toContain("re_test_only")
    expect(getResendConfigStatus()).not.toHaveProperty("apiKey")
  })

  it("retries transient provider failures with the same idempotency key", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID = "tmpl_test"
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "temporary" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "em_retry" }), { status: 200 }))
    await expect(sendNewsletterConfirmation({ email: "a@example.com", idempotencyKey: "retry-key" }))
      .resolves.toEqual({ status: "sent", id: "em_retry" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("retry-key")
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("retry-key")
  })

  it("does not sync a contact until an audience is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "k" }))
      .resolves.toEqual(expect.objectContaining({ status: "not_configured" }))
  })

  it("upserts an existing provider contact after a duplicate race", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "already exists" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_existing" }), { status: 200 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "contact-race" }))
      .resolves.toEqual({ status: "sent", id: "contact_existing" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain("/audiences/aud_test/contacts/a%40example.com")
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PATCH")
    expect((fetchMock.mock.calls[1][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("contact-race-upsert")
  })

  it("syncs the contact to the configured segment and promotions topic", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    process.env.RESEND_SEGMENT_ID = "seg_test"
    process.env.RESEND_PROMOTIONS_TOPIC_ID = "topic_test"
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "contact-1" }))
      .resolves.toEqual({ status: "sent", id: "contact_1" })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain("/contacts/contact_1/segments/seg_test")
    expect(fetchMock.mock.calls[2][0]).toContain("/contacts/contact_1/topics")
    expect(fetchMock.mock.calls[2][1]?.method).toBe("PATCH")
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({ topics: [{ id: "topic_test", subscription: "opt_in" }] })
  })

  it("does not retry a permanent provider rejection", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "invalid audience" }), { status: 400 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "permanent-failure" }))
      .resolves.toEqual({ status: "failed", error: "invalid audience" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("uses the audience contact endpoint for idempotent unsubscribe", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "contact_1" }), { status: 200 }))
    await expect(unsubscribeNewsletterContact({ email: "a@example.com", contactId: "contact_1", idempotencyKey: "unsubscribe-1" }))
      .resolves.toEqual({ status: "sent", id: "contact_1" })
    expect(fetchMock.mock.calls[0][0]).toContain("/audiences/aud_test/contacts/contact_1")
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH")
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ unsubscribed: true })
  })
})
