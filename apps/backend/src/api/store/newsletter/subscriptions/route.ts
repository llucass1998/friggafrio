import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../../modules/newsletter-subscription/service"
import { sendNewsletterConfirmation, syncNewsletterContact } from "../../../../lib/email/resend"
import { createNewsletterToken, hashNewsletterToken, normalizeNewsletterEmail, NEWSLETTER_CONSENT_VERSION } from "../../../../lib/newsletter/subscription-security"

const CONSENT_TEXT = "Quero receber por e-mail novidades, lançamentos e promoções da FriggaFrio. Posso cancelar a inscrição a qualquer momento."

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  consent: z.literal(true),
  consent_version: z.string().trim().min(1).max(32).optional(),
  source: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(20).optional(),
  website: z.string().max(200).optional(),
}).strict()

  type SubscriptionService = NewsletterSubscriptionService & {
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<Array<{ id: string; status: "active" | "unsubscribed" | "bounced" | "complained"; resend_contact_id?: string | null; confirmation_sent_at?: Date | null }>>
  createNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<{ id: string }>
  updateNewsletterSubscriptions?: (input: Record<string, unknown>) => Promise<unknown>
}

const serviceFor = (req: MedusaRequest) =>
  req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as SubscriptionService

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Informe nome, e-mail válido e consentimento." })
  }

  const input = parsed.data
  if (input.website?.trim()) {
    // Do not create subscriptions from automated form submissions.
    return res.status(201).json({ status: "subscribed" })
  }
  const email = normalizeNewsletterEmail(input.email)
  const service = serviceFor(req)
  const existing = await service.listNewsletterSubscriptions({ email })

  if (existing.length > 0 && ["active", "bounced", "complained"].includes(existing[0].status)) {
    // An active row without a recorded confirmation may have been persisted
    // just before a transient provider failure. Permit one safe retry while
    // keeping completed subscriptions idempotent and bounced/complained
    // contacts opted out of automatic reactivation.
    const canRetryConfirmation = existing[0].status === "active" && !existing[0].confirmation_sent_at
    if (!canRetryConfirmation) return res.status(200).json({ status: "already_registered" })
  }

  let subscription: { id: string }
  const unsubscribeToken = createNewsletterToken()
  const consent = {
    name: input.name,
    email,
    status: "active",
    consent_at: new Date(),
    consent_version: input.consent_version || NEWSLETTER_CONSENT_VERSION,
    consent_text: CONSENT_TEXT,
    source: input.source || "storefront",
    locale: input.locale || "pt-BR",
    email_normalized: email,
    confirmed_at: new Date(),
    unsubscribe_token_hash: hashNewsletterToken(unsubscribeToken),
    unsubscribed_at: null,
  }
  try {
    if (existing.length > 0 && service.updateNewsletterSubscriptions) {
      subscription = await service.updateNewsletterSubscriptions({ id: existing[0].id, ...consent }) as { id: string }
    } else {
      subscription = await service.createNewsletterSubscriptions(consent)
    }
  } catch {
    // The unique database index closes the check-then-create race.  A retry
    // is reported as already registered rather than leaking provider/DB data.
    const raced = await service.listNewsletterSubscriptions({ email })
    if (raced.length > 0) return res.status(200).json({ status: "already_registered" })
    throw new Error("Newsletter subscription could not be persisted")
  }

  // Provider configuration is deliberately optional in local/test runs. The
  // consent is durable even when an external template or audience is pending.
  const key = `newsletter-confirmation-${subscription.id}`
  const contact = await syncNewsletterContact({ email, firstName: input.name, idempotencyKey: `newsletter-contact-${subscription.id}` })
  const confirmation = await sendNewsletterConfirmation({ email, idempotencyKey: key, unsubscribeToken })
  if (contact.status === "sent" && service.updateNewsletterSubscriptions) {
    await service.updateNewsletterSubscriptions({ id: subscription.id, resend_contact_id: contact.id, last_email_status: "contact_synced" })
  }
  if (confirmation.status === "sent" && service.updateNewsletterSubscriptions) {
    await service.updateNewsletterSubscriptions({ id: subscription.id, confirmation_sent_at: new Date(), resend_email_id: confirmation.id, last_email_status: "confirmation_sent" })
  }

  return res.status(201).json({
    status: "subscribed",
    confirmation: confirmation.status,
    contact: contact.status,
  })
}
