import { createHash } from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Webhook } from "svix"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../modules/newsletter-subscription/service"
import { NewsletterSubscriptionStatus } from "../../../modules/newsletter-subscription/models/newsletter-subscription"

type ResendWebhookPayload = {
  type?: string
  data?: { email_id?: string }
}

type ResendWebhookService = NewsletterSubscriptionService & {
  listNewsletterWebhookEvents: (filters: Record<string, unknown>) => Promise<Array<{ id: string }>>
  createNewsletterWebhookEvents: (input: Record<string, unknown>) => Promise<{ id: string }>
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<Array<{ id: string; status: NewsletterSubscriptionStatus }>>
  updateNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<unknown>
}

const readHeader = (req: MedusaRequest, name: string): string | null => {
  const value = req.headers[name]
  return typeof value === "string" ? value : null
}

const rawPayload = (req: MedusaRequest): string | null => {
  const withRaw = req as MedusaRequest & { rawBody?: string | Buffer }
  if (typeof withRaw.rawBody === "string") return withRaw.rawBody
  if (Buffer.isBuffer(withRaw.rawBody)) return withRaw.rawBody.toString("utf8")
  return null
}

const statusForEvent = (eventType: string): NewsletterSubscriptionStatus | null => {
  if (eventType === "email.bounced") return NewsletterSubscriptionStatus.BOUNCED
  if (eventType === "email.complained") return NewsletterSubscriptionStatus.COMPLAINED
  return null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  const webhookId = readHeader(req, "svix-id")
  const webhookTimestamp = readHeader(req, "svix-timestamp")
  const webhookSignature = readHeader(req, "svix-signature")
  const body = rawPayload(req)

  if (!secret || !webhookId || !webhookTimestamp || !webhookSignature || !body) {
    return res.status(401).json({ message: "Invalid webhook signature" })
  }

  let payload: ResendWebhookPayload
  try {
    payload = new Webhook(secret).verify(body, {
      "svix-id": webhookId,
      "svix-timestamp": webhookTimestamp,
      "svix-signature": webhookSignature,
    }) as ResendWebhookPayload
  } catch {
    return res.status(401).json({ message: "Invalid webhook signature" })
  }

  const eventType = typeof payload.type === "string" ? payload.type : ""
  const emailId = typeof payload.data?.email_id === "string" ? payload.data.email_id : null
  if (!eventType || !emailId) return res.status(202).json({ status: "ignored" })

  const service = req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as ResendWebhookService
  const duplicate = await service.listNewsletterWebhookEvents({ event_id: webhookId })
  if (duplicate.length > 0) return res.status(200).json({ status: "duplicate" })

  await service.createNewsletterWebhookEvents({
    event_id: webhookId,
    event_type: eventType,
    email_id: emailId,
    payload_hash: createHash("sha256").update(body, "utf8").digest("hex"),
    processed_at: new Date(),
  })

  const nextStatus = statusForEvent(eventType)
  const subscriptions = await service.listNewsletterSubscriptions({ resend_email_id: emailId })
  for (const subscription of subscriptions) {
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      ...(nextStatus ? { status: nextStatus } : {}),
      last_email_status: eventType,
    })
  }
  res.status(200).json({ status: "processed" })
}
