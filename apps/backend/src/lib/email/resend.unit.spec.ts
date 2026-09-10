import {
  getNewsletterContactState,
  getNewsletterContactsConfigStatus,
  getResendConfigStatus,
  newsletterContactsCredential,
  sendNewsletterConfirmation,
  syncNewsletterContact,
  unsubscribeNewsletterContact,
} from "./resend"

describe("Resend server adapter", () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
    jest.restoreAllMocks()
  })

  const configure = () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@example.com>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    process.env.RESEND_NEWSLETTER_SEGMENT_ID = "seg_test"
  }

  it("prefers the dedicated contacts key and safely falls back to the general key", () => {
    process.env.RESEND_API_KEY = "re_general"
    expect(newsletterContactsCredential().variableName).toBe("RESEND_API_KEY")
    process.env.RESEND_CONTACTS_API_KEY = "re_contacts"
    expect(newsletterContactsCredential().variableName).toBe("RESEND_CONTACTS_API_KEY")
    expect(newsletterContactsCredential().value).toBe("re_contacts")
  })

  it("reports missing global contacts configuration without a request", async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_CONTACTS_API_KEY
    delete process.env.RESEND_NEWSLETTER_SEGMENT_ID
    delete process.env.RESEND_SEGMENT_ID
    expect(getNewsletterContactsConfigStatus()).toEqual({
      missing: ["RESEND_CONTACTS_API_KEY_OR_RESEND_API_KEY", "RESEND_NEWSLETTER_SEGMENT_ID"],
      credentialVariable: null,
    })
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "k" }))
      .resolves.toEqual(expect.objectContaining({ status: "not_configured" }))
  })

  it("accepts the legacy segment variable during the WSL configuration transition", () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.RESEND_SEGMENT_ID = "seg_legacy"
    delete process.env.RESEND_NEWSLETTER_SEGMENT_ID
    expect(getNewsletterContactsConfigStatus()).toEqual({ missing: [], credentialVariable: "RESEND_API_KEY" })
  })

  it("creates a global contact and adds it to the configured segment", async () => {
    configure()
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "contact-1" }))
      .resolves.toEqual({ status: "sent", id: "contact_1" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/contacts")
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.resend.com/contacts/contact_1/segments/seg_test")
    expect(String(fetchMock.mock.calls[0][1]?.body)).not.toContain("re_test_only")
  })

  it("recovers an existing contact after a duplicate race and completes segment association", async () => {
    configure()
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "already exists" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_existing", unsubscribed: false }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_existing" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "race" }))
      .resolves.toEqual({ status: "sent", id: "contact_existing" })
    expect(fetchMock.mock.calls[1][0]).toContain("/contacts/a%40example.com")
    expect(fetchMock.mock.calls[2][1]?.method).toBe("PATCH")
  })

  it("treats an already-associated segment as idempotent success", async () => {
    configure()
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "already associated" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "seg_test" }] }), { status: 200 }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "segment-replay" }))
      .resolves.toEqual({ status: "sent", id: "contact_1" })
  })

  it.each([
    [401, "resend_authentication_rejected"],
    [403, "resend_authorization_rejected"],
    [404, "resend_resource_not_found"],
    [429, "resend_rate_limited"],
    [503, "resend_temporary_failure"],
  ])("sanitizes provider status %s", async (status, error) => {
    configure()
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "private provider detail" }), { status }))
    await expect(syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: `status-${status}` }))
      .resolves.toEqual({ status: "failed", error })
  })

  it("looks up global contact state without any legacy audience path", async () => {
    configure()
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "contact_1", unsubscribed: false, status: "active" }), { status: 200 }))
    await expect(getNewsletterContactState({ email: "a@example.com", contactId: "contact_1", idempotencyKey: "state" }))
      .resolves.toEqual({ status: "sent", id: "contact_1", contactState: "active" })
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/contacts/contact_1")
  })

  it("updates a global contact for unsubscribe", async () => {
    configure()
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "contact_1" }), { status: 200 }))
    await expect(unsubscribeNewsletterContact({ email: "a@example.com", contactId: "contact_1", idempotencyKey: "unsubscribe" }))
      .resolves.toEqual({ status: "sent", id: "contact_1" })
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/contacts/contact_1")
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH")
  })

  it("keeps transactional confirmation on the email API and reports missing configuration safely", async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendNewsletterConfirmation({ email: "a@example.com", idempotencyKey: "email" }))
      .resolves.toEqual(expect.objectContaining({ status: "not_configured" }))
  })

  it("never calls an Audience endpoint for Newsletter contacts", async () => {
    configure()
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact_1" }), { status: 201 })).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    await syncNewsletterContact({ email: "a@example.com", firstName: "Ana", idempotencyKey: "no-audience" })
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("/audiences/"))).toBe(true)
    expect(getResendConfigStatus()).not.toHaveProperty("apiKey")
  })
})
