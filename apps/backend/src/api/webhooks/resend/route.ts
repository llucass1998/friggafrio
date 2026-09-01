import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../modules/newsletter-subscription/service"

type Payload = {
  type?: unknown
  data?: {
    email_id?: unknown
    email?: unknown
    contact_id?: unknown
    id?: unknown
    unsubscribed?: unknown
  }
}

type Service = NewsletterSubscriptionService & {
  listNewsletterWebhookEvents: (filters: Record<string, unknown>) => Promise<Array<{ id: string }>>
  createNewsletterWebhookEvents: (input: Record<string, unknown>) => Promise<{ id: string }>
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<Array<{ id: string }>>
  updateNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<unknown>
}

const header = (req: MedusaRequest, name: string): string | null => {
  const value = req.headers[name]
  return typeof value === "string" ? value : null
}

const rawBody = (req: MedusaRequest): string | null => {
  const candidate = req as MedusaRequest & { rawBody?: string | Buffer }
  if (typeof candidate.rawBody === "string") return candidate.rawBody
  if (Buffer.isBuffer(candidate.rawBody)) return candidate.rawBody.toString("utf8")
  return null
}

const statusFor = (type: string, data: Payload["data"]): string | null => {
  if (type === "email.bounced") return "bounced"
  if (type === "email.complained") return "complained"
  if (type === "contact.updated" && data?.unsubscribed === true) return "unsubscribed"
  return null
}

const verifySvix = (body: string, id: string, timestamp: string, signature: string, secret: string): boolean => {
  const timestampSeconds = Number(timestamp)
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false
  const encodedSecret = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : ""
  if (!encodedSecret) return false
  let key: Buffer
  try { key = Buffer.from(encodedSecret, "base64") } catch { return false }
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`, "utf8").digest("base64")
  return signature.split(" ").some((candidate) => {
    const value = candidate.startsWith("v1,") ? candidate.slice(3) : ""
    if (!value) return false
    const left = Buffer.from(value)
    const right = Buffer.from(expected)
    return left.length === right.length && timingSafeEqual(left, right)
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  const id = header(req, "svix-id")
  const timestamp = header(req, "svix-timestamp")
  const signature = header(req, "svix-signature")
  const body = rawBody(req)
  if (!secret || !id || !timestamp || !signature || !body) return res.status(401).json({ message: "Invalid webhook signature" })

  let payload: Payload
  if (!verifySvix(body, id, timestamp, signature, secret)) {
    return res.status(401).json({ message: "Invalid webhook signature" })
  }
  try { payload = JSON.parse(body) as Payload } catch { return res.status(400).json({ message: "Invalid webhook payload" }) }

  const type = typeof payload.type === "string" ? payload.type : ""
  const data = payload.data || {}
  const emailId = typeof data.email_id === "string" ? data.email_id : null
  const contactId = typeof data.contact_id === "string" || typeof data.id === "string"
    ? String(data.contact_id || data.id)
    : null
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : null
  const nextStatus = statusFor(type, data)
  if (!type || !nextStatus || (!emailId && !contactId && !email)) return res.status(202).json({ status: "ignored" })

  const service = req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as Service
  const duplicate = await service.listNewsletterWebhookEvents({ event_id: id })
  if (duplicate.length > 0) return res.status(200).json({ status: "duplicate" })
  try {
    await service.createNewsletterWebhookEvents({
      event_id: id,
      event_type: type,
      email_id: emailId,
      payload_hash: createHash("sha256").update(body, "utf8").digest("hex"),
      processed_at: new Date(),
    })
  } catch {
    // A concurrent delivery can win the unique event insert race.
    const raced = await service.listNewsletterWebhookEvents({ event_id: id })
    if (raced.length > 0) return res.status(200).json({ status: "duplicate" })
    throw new Error("Webhook event could not be recorded")
  }

  const filter = emailId ? { resend_email_id: emailId } : contactId ? { resend_contact_id: contactId } : { email }
  const subscriptions = await service.listNewsletterSubscriptions(filter)
  for (const subscription of subscriptions) {
    await service.updateNewsletterSubscriptions({ id: subscription.id, status: nextStatus, last_email_status: type, ...(nextStatus === "unsubscribed" ? { unsubscribed_at: new Date() } : {}) })
  }
  return res.status(200).json({ status: "processed" })
}
