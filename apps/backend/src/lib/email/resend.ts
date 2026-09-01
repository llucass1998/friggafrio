/**
 * Small server-only Resend adapter.  Keeping the HTTP boundary here makes it
 * straightforward to mock in tests and prevents provider credentials from
 * leaking into routes, logs, or the storefront bundle.
 */

export type ResendConfigStatus = {
  from: string
  storefrontUrl: string
  missing: string[]
}

const required = (name: string): string => process.env[name]?.trim() || ""

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

export const configuredResend = (): boolean => getResendConfigStatus().missing.length === 0

export type ResendResult = {
  ok: boolean
  id?: string
  status: number
  error?: string
}

export const resendRequest = async (
  path: string,
  body: Record<string, unknown>,
  idempotencyKey?: string,
  method: "POST" | "PATCH" = "POST",
): Promise<ResendResult> => {
  const config = getResendConfigStatus()
  if (config.missing.length > 0) {
    return { ok: false, status: 0, error: `Missing Resend configuration: ${config.missing.join(", ")}` }
  }

  const apiKey = required("RESEND_API_KEY")

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey

  const maxAttempts = 3
  let lastError = "Resend provider is temporarily unavailable"
  let lastStatus = 0
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response
    try {
      response = await fetch(`https://api.resend.com${path}`, {
        method,
        headers,
        body: JSON.stringify(body),
      })
    } catch {
      if (attempt === maxAttempts) return { ok: false, status: 0, error: lastError }
      continue
    }

    let payload: { id?: string; message?: string } = {}
    try {
      payload = await response.json() as typeof payload
    } catch {
      // Provider responses are not required to be JSON for error handling.
    }
    if (response.ok) return { ok: true, id: payload.id, status: response.status }

    lastStatus = response.status
    lastError = payload.message || `Resend request failed (${response.status})`
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500
    if (!retryable || attempt === maxAttempts) break
    const retryAfter = Number(response.headers.get("retry-after"))
    const delayMs = Number.isFinite(retryAfter)
      ? Math.min(1000, Math.max(0, retryAfter * 1000))
      : attempt * 50
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return { ok: false, status: lastStatus, error: lastError }
}

export type NewsletterProviderResult =
  | { status: "sent"; id?: string }
  | { status: "not_configured"; missing: string[] }
  | { status: "failed"; error: string }

/** Send a confirmation only after the subscription has been persisted. */
export const sendNewsletterConfirmation = async (input: {
  email: string
  idempotencyKey: string
  unsubscribeToken?: string
}): Promise<NewsletterProviderResult> => {
  const config = getResendConfigStatus()
  const templateId = required("RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID")
  const missing = [...config.missing]
  if (!templateId) missing.push("RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID")
  if (missing.length > 0) return { status: "not_configured", missing }

  const unsubscribeUrl = input.unsubscribeToken ? buildUnsubscribeUrl(input.unsubscribeToken) : null
  const result = await resendRequest(
    "/emails",
    {
      from: config.from,
      to: [input.email],
      subject: "Inscrição confirmada — FriggaFrio",
      template: { id: templateId, variables: {} },
      ...(unsubscribeUrl ? {
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      } : {}),
    },
    input.idempotencyKey,
  )
  return result.ok
    ? { status: "sent", id: result.id }
    : { status: "failed", error: result.error || "Resend rejected the confirmation" }
}

/** Upsert only an explicitly consented contact into the configured audience. */
export const syncNewsletterContact = async (input: {
  email: string
  firstName: string
  idempotencyKey: string
}): Promise<NewsletterProviderResult> => {
  const config = getResendConfigStatus()
  const audienceId = required("RESEND_AUDIENCE_ID")
  const missing = [...config.missing]
  if (!audienceId) missing.push("RESEND_AUDIENCE_ID")
  if (missing.length > 0) return { status: "not_configured", missing }

  const contactBody = { email: input.email, first_name: input.firstName, unsubscribed: false }
  let result = await resendRequest(
    `/audiences/${encodeURIComponent(audienceId)}/contacts`,
    contactBody,
    input.idempotencyKey,
  )
  if (!result.ok && result.status === 409) {
    // A previous attempt may have created the contact before the request was
    // retried. Treat the provider's conflict as an idempotent upsert.
    result = await resendRequest(
      `/audiences/${encodeURIComponent(audienceId)}/contacts/${encodeURIComponent(input.email)}`,
      contactBody,
      `${input.idempotencyKey}-upsert`,
      "PATCH",
    )
  }
  if (!result.ok) return { status: "failed", error: result.error || "Resend rejected the contact" }

  const contactId = result.id
  const segmentId = required("RESEND_SEGMENT_ID")
  const topicId = required("RESEND_PROMOTIONS_TOPIC_ID")
  if (segmentId && contactId) {
    const segment = await resendRequest(
      `/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segmentId)}`,
      {},
      `${input.idempotencyKey}-segment`,
    )
    if (!segment.ok) return { status: "failed", error: segment.error || "Resend rejected the segment assignment" }
  }
  if (topicId && contactId) {
    const topic = await resendRequest(
      `/contacts/${encodeURIComponent(contactId)}/topics`,
      { topics: [{ id: topicId, subscription: "opt_in" }] },
      `${input.idempotencyKey}-topic`,
      "PATCH",
    )
    if (!topic.ok) return { status: "failed", error: topic.error || "Resend rejected the topic subscription" }
  }
  return { status: "sent", id: contactId }
}

export const unsubscribeNewsletterContact = async (input: {
  email: string
  contactId?: string | null
  idempotencyKey: string
}): Promise<NewsletterProviderResult> => {
  const config = getResendConfigStatus()
  const audienceId = required("RESEND_AUDIENCE_ID")
  const missing = [...config.missing]
  if (!audienceId) missing.push("RESEND_AUDIENCE_ID")
  if (missing.length > 0) return { status: "not_configured", missing }

  const identifier = input.contactId || input.email
  const result = await resendRequest(
    `/audiences/${encodeURIComponent(audienceId)}/contacts/${encodeURIComponent(identifier)}`,
    { unsubscribed: true },
    input.idempotencyKey,
    "PATCH",
  )
  return result.ok
    ? { status: "sent", id: result.id }
    : { status: "failed", error: result.error || "Resend rejected the unsubscribe request" }
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
