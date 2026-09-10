/**
 * Server-only Resend boundary. Credentials never leave this module and the
 * Newsletter uses Resend's global Contacts and Segments APIs exclusively.
 */

export type ResendConfigStatus = {
  from: string
  storefrontUrl: string
  missing: string[]
}

const required = (name: string): string => process.env[name]?.trim() || ""
const firstConfigured = (...names: string[]): string => names.map(required).find(Boolean) || ""
const resendRequestTimeoutMs = (): number => {
  const configured = Number(process.env.RESEND_REQUEST_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 30_000) : 10_000
}

export const newsletterContactsCredential = (): { value: string; variableName: "RESEND_CONTACTS_API_KEY" | "RESEND_API_KEY" | null } => {
  const contactsKey = required("RESEND_CONTACTS_API_KEY")
  if (contactsKey) return { value: contactsKey, variableName: "RESEND_CONTACTS_API_KEY" }
  const apiKey = required("RESEND_API_KEY")
  return apiKey ? { value: apiKey, variableName: "RESEND_API_KEY" } : { value: "", variableName: null }
}

export const getResendConfigStatus = (): ResendConfigStatus => {
  const from = required("EMAIL_FROM")
  const storefrontUrl = required("STOREFRONT_URL")
  const missing = [
    ["RESEND_API_KEY", required("RESEND_API_KEY")],
    ["EMAIL_FROM", from],
    ["STOREFRONT_URL", storefrontUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  return { from, storefrontUrl, missing }
}

export const getNewsletterContactsConfigStatus = (): { missing: string[]; credentialVariable: string | null } => {
  const credential = newsletterContactsCredential()
  const segmentId = firstConfigured("RESEND_NEWSLETTER_SEGMENT_ID", "RESEND_SEGMENT_ID")
  return {
    missing: [
      ...(credential.value ? [] : ["RESEND_CONTACTS_API_KEY_OR_RESEND_API_KEY"]),
      ...(segmentId ? [] : ["RESEND_NEWSLETTER_SEGMENT_ID"]),
    ],
    credentialVariable: credential.variableName,
  }
}

export const configuredResend = (): boolean => getResendConfigStatus().missing.length === 0

export type ResendResult = {
  ok: boolean
  id?: string
  status: number
  error?: string
  payload?: unknown
}

const providerRequest = async (
  path: string,
  body: Record<string, unknown>,
  apiKey: string,
  idempotencyKey?: string,
  method: "POST" | "PATCH" | "GET" = "POST",
): Promise<ResendResult> => {
  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` }
  if (method !== "GET") headers["Content-Type"] = "application/json"
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey

  const maxAttempts = 3
  let lastError = "Resend provider is temporarily unavailable"
  let lastStatus = 0
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), resendRequestTimeoutMs())
    try {
      const response = await fetch(`https://api.resend.com${path}`, {
        method,
        headers,
        signal: controller.signal,
        ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
      })
      let payload: { id?: string; message?: string; name?: string } = {}
      try {
        payload = await response.json() as typeof payload
      } catch {
        // A non-JSON provider error is still sanitized before callers see it.
      }
      if (response.ok) return { ok: true, id: payload.id, status: response.status, payload }

      lastStatus = response.status
      lastError = payload.message || payload.name || `Resend request failed (${response.status})`
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500
      if (!retryable || attempt === maxAttempts) break
      const retryAfter = Number(response.headers.get("retry-after"))
      const delayMs = Number.isFinite(retryAfter)
        ? Math.min(1000, Math.max(0, retryAfter * 1000))
        : attempt * 50
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
    } catch {
      if (attempt === maxAttempts) return { ok: false, status: 0, error: lastError }
    } finally {
      clearTimeout(timeout)
    }
  }
  return { ok: false, status: lastStatus, error: lastError }
}

export const resendRequest = async (
  path: string,
  body: Record<string, unknown>,
  idempotencyKey?: string,
  method: "POST" | "PATCH" | "GET" = "POST",
): Promise<ResendResult> => {
  const config = getResendConfigStatus()
  if (config.missing.length > 0) {
    return { ok: false, status: 0, error: `Missing Resend configuration: ${config.missing.join(", ")}` }
  }
  return providerRequest(path, body, required("RESEND_API_KEY"), idempotencyKey, method)
}

const newsletterContactsRequest = async (
  path: string,
  body: Record<string, unknown>,
  idempotencyKey?: string,
  method: "POST" | "PATCH" | "GET" = "POST",
): Promise<ResendResult> => {
  const credential = newsletterContactsCredential()
  if (!credential.value) return { ok: false, status: 0, error: "Newsletter contacts credentials are not configured" }
  return providerRequest(path, body, credential.value, idempotencyKey, method)
}

export type NewsletterProviderResult =
  | { status: "sent"; id?: string }
  | { status: "not_configured"; missing: string[] }
  | { status: "failed"; error: string }

export type NewsletterContactState = "active" | "unsubscribed" | "bounced" | "complained" | "unknown"

type NewsletterContactLookup = NewsletterProviderResult & { contactState?: NewsletterContactState }

const contactStateFromPayload = (payload: unknown): NewsletterContactState => {
  const value = payload && typeof payload === "object" ? payload as { unsubscribed?: unknown; status?: unknown; contact?: unknown } : {}
  const contact = value.contact && typeof value.contact === "object" ? value.contact as { unsubscribed?: unknown; status?: unknown } : value
  const providerStatus = typeof contact.status === "string" ? contact.status.toLowerCase() : ""
  if (providerStatus === "bounced" || providerStatus === "suppressed") return "bounced"
  if (providerStatus === "complained") return "complained"
  if (contact.unsubscribed === true) return "unsubscribed"
  if (contact.unsubscribed === false || providerStatus === "active" || providerStatus === "subscribed") return "active"
  return "unknown"
}

const globalContact = async (input: { email: string; contactId?: string | null; idempotencyKey: string }): Promise<NewsletterContactLookup> => {
  const config = getNewsletterContactsConfigStatus()
  if (config.missing.length > 0) return { status: "not_configured", missing: config.missing }
  const identifier = input.contactId || input.email
  const result = await newsletterContactsRequest(`/contacts/${encodeURIComponent(identifier)}`, {}, input.idempotencyKey, "GET")
  if (!result.ok) return { status: "failed", error: sanitizeProviderFailure(result) }
  const payload = result.payload && typeof result.payload === "object" ? result.payload as { id?: unknown } : {}
  return { status: "sent", id: typeof payload.id === "string" ? payload.id : input.contactId || undefined, contactState: contactStateFromPayload(result.payload) }
}

/** Revalidates a global Resend contact before local activation. */
export const getNewsletterContactState = async (input: { email: string; contactId?: string | null; idempotencyKey: string }): Promise<NewsletterProviderResult & { contactState?: NewsletterContactState }> => globalContact(input)

const sanitizeProviderFailure = (result: ResendResult): string => {
  if (result.status === 401) return "resend_authentication_rejected"
  if (result.status === 403) return "resend_authorization_rejected"
  if (result.status === 404) return "resend_resource_not_found"
  if (result.status === 408 || result.status === 0) return "resend_timeout_or_network_failure"
  if (result.status === 429) return "resend_rate_limited"
  if (result.status >= 500) return "resend_temporary_failure"
  return "resend_request_rejected"
}

const hasConfiguredSegment = async (contactId: string, segmentId: string, idempotencyKey: string): Promise<boolean> => {
  const result = await newsletterContactsRequest(`/contacts/${encodeURIComponent(contactId)}/segments`, {}, idempotencyKey, "GET")
  if (!result.ok) return false
  const payload = result.payload && typeof result.payload === "object" ? result.payload as { data?: unknown } : {}
  const segments = Array.isArray(payload.data) ? payload.data : []
  return segments.some((segment) => Boolean(segment && typeof segment === "object" && (segment as { id?: unknown }).id === segmentId))
}

/**
 * Creates or repairs a global contact, then associates it with the configured
 * Newsletter segment. All calls occur only after double opt-in confirmation.
 */
export const syncNewsletterContact = async (input: { email: string; firstName: string; idempotencyKey: string }): Promise<NewsletterProviderResult> => {
  const config = getNewsletterContactsConfigStatus()
  if (config.missing.length > 0) return { status: "not_configured", missing: config.missing }
  const segmentId = firstConfigured("RESEND_NEWSLETTER_SEGMENT_ID", "RESEND_SEGMENT_ID")

  let result = await newsletterContactsRequest(
    "/contacts",
    { email: input.email, first_name: input.firstName, unsubscribed: false },
    input.idempotencyKey,
  )
  let contactId = result.id

  if (!result.ok && result.status === 409) {
    const existing = await globalContact({ email: input.email, idempotencyKey: `${input.idempotencyKey}-existing` })
    if (existing.status !== "sent" || !existing.id || existing.contactState === "bounced" || existing.contactState === "complained") {
      return { status: "failed", error: "resend_contact_recovery_failed" }
    }
    contactId = existing.id
    // A fresh double opt-in can restore a previously unsubscribed contact.
    result = await newsletterContactsRequest(
      `/contacts/${encodeURIComponent(contactId)}`,
      { first_name: input.firstName, unsubscribed: false },
      `${input.idempotencyKey}-upsert`,
      "PATCH",
    )
  }
  if (!result.ok || !contactId) return { status: "failed", error: sanitizeProviderFailure(result) }

  const segment = await newsletterContactsRequest(
    `/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segmentId)}`,
    {},
    `${input.idempotencyKey}-segment`,
  )
  if (!segment.ok && !(segment.status === 409 && await hasConfiguredSegment(contactId, segmentId, `${input.idempotencyKey}-segment-state`))) {
    return { status: "failed", error: sanitizeProviderFailure(segment) }
  }
  return { status: "sent", id: contactId }
}

/** Unsubscribe a global contact; no legacy Audience endpoint is used. */
export const unsubscribeNewsletterContact = async (input: { email: string; contactId?: string | null; idempotencyKey: string }): Promise<NewsletterProviderResult> => {
  const config = getNewsletterContactsConfigStatus()
  if (config.missing.length > 0) return { status: "not_configured", missing: config.missing }
  const identifier = input.contactId || input.email
  const result = await newsletterContactsRequest(
    `/contacts/${encodeURIComponent(identifier)}`,
    { unsubscribed: true },
    input.idempotencyKey,
    "PATCH",
  )
  return result.ok ? { status: "sent", id: result.id } : { status: "failed", error: sanitizeProviderFailure(result) }
}

const buildUnsubscribeUrl = (token: string): string | null => {
  const storefrontUrl = required("STOREFRONT_URL")
  if (!storefrontUrl) return null
  try {
    const url = new URL("/br/newsletter/unsubscribe", storefrontUrl)
    url.searchParams.set("token", token)
    return url.toString()
  } catch {
    return null
  }
}

// Retained for callers outside the double-opt-in route that still need a
// template-based transactional confirmation.
export const sendNewsletterConfirmation = async (input: { email: string; idempotencyKey: string; unsubscribeToken?: string }): Promise<NewsletterProviderResult> => {
  const config = getResendConfigStatus()
  const templateId = required("RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID")
  const missing = [...config.missing, ...(templateId ? [] : ["RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID"])]
  if (missing.length > 0) return { status: "not_configured", missing }
  const unsubscribeUrl = input.unsubscribeToken ? buildUnsubscribeUrl(input.unsubscribeToken) : null
  const result = await resendRequest("/emails", {
    from: config.from,
    to: [input.email],
    subject: "InscriÃ§Ã£o confirmada â€” FriggaFrio",
    template: { id: templateId, variables: {} },
    ...(unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
  }, input.idempotencyKey)
  return result.ok ? { status: "sent", id: result.id } : { status: "failed", error: sanitizeProviderFailure(result) }
}
