import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../../modules/newsletter-subscription/service"
import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { sendNewsletterConfirmationEmail } from "../../../../lib/newsletter/email"
import {
  confirmationExpiry,
  createNewsletterToken,
  hashNewsletterToken,
  normalizeNewsletterEmail,
  NEWSLETTER_CONSENT_VERSION,
} from "../../../../lib/newsletter/subscription-security"

const CONSENT_TEXT = "Quero receber por e-mail novidades, lançamentos e promoções da FriggaFrio. Posso cancelar a inscrição a qualquer momento."

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  consent: z.literal(true),
  consent_version: z.string().trim().min(1).max(32).optional(),
  source: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(20).optional(),
  website: z.string().trim().max(200).optional(),
}).strict()

export type NewsletterRecord = {
  id: string
  name?: string | null
  email?: string
  email_normalized?: string | null
  status: NewsletterSubscriptionStatus
  confirmation_token_hash?: string | null
  confirmation_expires_at?: Date | string | null
  unsubscribe_token_hash?: string | null
  resend_contact_id?: string | null
}

export type NewsletterService = NewsletterSubscriptionService & {
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<NewsletterRecord[]>
  createNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<NewsletterRecord>
  updateNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<NewsletterRecord>
}

export const serviceFor = (req: MedusaRequest): NewsletterService =>
  req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as NewsletterService

const accepted = (res: MedusaResponse): void => {
  // Keep the acknowledgement identical for existing and new addresses.
  res.status(202).json({ status: "confirmation_pending" })
}

const queueConfirmation = async ({
  service,
  subscription,
  email,
  confirmationToken,
  unsubscribeToken,
}: {
  service: NewsletterService
  subscription: NewsletterRecord
  email: string
  confirmationToken: string
  unsubscribeToken: string
}): Promise<void> => {
  try {
    const delivery = await sendNewsletterConfirmationEmail({
      to: email,
      confirmationToken,
      unsubscribeToken,
    })
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      resend_email_id: delivery.delivered ? delivery.emailId : null,
      last_email_status: delivery.delivered ? "confirmation_sent" : "confirmation_not_configured",
    })
  } catch {
    // Provider details never reach the public response or logs.
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      last_email_status: "confirmation_failed",
    })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Informe nome, e-mail e consentimento válidos." })
  }

  const input = parsed.data
  if (input.website) return accepted(res)

  const email = normalizeNewsletterEmail(input.email)
  const service = serviceFor(req)
  const existing = await service.listNewsletterSubscriptions({ email_normalized: email })
  const current = existing[0]
  if (current && [
    NewsletterSubscriptionStatus.PENDING,
    NewsletterSubscriptionStatus.ACTIVE,
    NewsletterSubscriptionStatus.BOUNCED,
    NewsletterSubscriptionStatus.COMPLAINED,
  ].includes(current.status)) {
    return accepted(res)
  }

  const confirmationToken = createNewsletterToken()
  const unsubscribeToken = createNewsletterToken()
  const now = new Date()
  const values = {
    name: input.name.trim(),
    email,
    email_normalized: email,
    status: NewsletterSubscriptionStatus.PENDING,
    source: input.source || "storefront",
    locale: input.locale || "pt-BR",
    consent_version: input.consent_version || NEWSLETTER_CONSENT_VERSION,
    consent_text: CONSENT_TEXT,
    consent_at: now,
    confirmed_at: null,
    unsubscribed_at: null,
    confirmation_token_hash: hashNewsletterToken(confirmationToken),
    confirmation_expires_at: confirmationExpiry(now),
    unsubscribe_token_hash: hashNewsletterToken(unsubscribeToken),
    resend_email_id: null,
    last_email_status: "confirmation_queued",
  }

  const subscription = current
    ? await service.updateNewsletterSubscriptions({ id: current.id, ...values })
    : await service.createNewsletterSubscriptions(values)
  await queueConfirmation({
    service,
    subscription,
    email,
    confirmationToken,
    unsubscribeToken,
  })
  return accepted(res)
}
