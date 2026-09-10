import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../../modules/newsletter-subscription"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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
import { withPostgresAdvisoryLock } from "../../../../lib/postgres-advisory-lock"

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
  last_email_status?: string | null
  updated_at?: Date | string | null
}

export type NewsletterService = NewsletterSubscriptionService & {
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<NewsletterRecord[]>
  createNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<NewsletterRecord>
  updateNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<NewsletterRecord>
}

export const serviceFor = (req: MedusaRequest): NewsletterService =>
  req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as NewsletterService

type TransactionRunner = {
  transaction: <T>(handler: (transaction: { raw: (sql: string, bindings?: unknown[]) => Promise<unknown> }) => Promise<T>) => Promise<T>
}

const accepted = (res: MedusaResponse): void => {
  // Keep the acknowledgement identical for existing and new addresses.
  res.status(202).json({ status: "confirmation_pending" })
}

const retryablePendingStatuses = new Set([
  "contact_sync_not_configured",
  "contact_sync_failed",
  "confirmation_not_configured",
  "confirmation_failed",
])
export const PROCESSING_LEASE_MS = 5 * 60 * 1_000

export const processingLeaseExpired = (subscription: NewsletterRecord): boolean => {
  const updatedAt = subscription.updated_at ? new Date(subscription.updated_at).getTime() : Number.NaN
  return !Number.isFinite(updatedAt) || updatedAt + PROCESSING_LEASE_MS <= Date.now()
}

const pendingNeedsRetry = (subscription: NewsletterRecord): boolean => {
  if (retryablePendingStatuses.has(subscription.last_email_status || "")) return true
  if (subscription.last_email_status === "confirmation_processing") {
    return processingLeaseExpired(subscription)
  }
  if (!subscription.confirmation_expires_at) return false
  return new Date(subscription.confirmation_expires_at).getTime() <= Date.now()
}

const isUniqueViolation = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: unknown; errno?: unknown; message?: unknown }
  return candidate.code === "23505" || candidate.errno === "23505" ||
    (typeof candidate.message === "string" && /unique|duplicate/i.test(candidate.message))
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
}): Promise<boolean> => {
  try {
    // Keep provider contact creation and marketing-topic opt-in behind the
    // double-opt-in confirmation endpoint; this call delivers only a token.
    const delivery = await sendNewsletterConfirmationEmail({
      to: email,
      confirmationToken,
      unsubscribeToken,
    })
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      resend_email_id: delivery.delivered ? delivery.emailId : null,
      last_email_status: delivery.delivered ? "confirmation_sent" : "confirmation_not_configured",
      confirmation_sent_at: delivery.delivered ? new Date() : null,
    })
    return delivery.delivered
  } catch {
    // Provider details never reach the public response or logs.
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      last_email_status: "confirmation_failed",
    })
    return false
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
  const database = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Partial<TransactionRunner>
  const claim = async () => {
      const service = serviceFor(req)
      const existing = await service.listNewsletterSubscriptions({ email_normalized: email })
      const current = existing[0]
      if (current && [
        NewsletterSubscriptionStatus.ACTIVE,
        NewsletterSubscriptionStatus.UNSUBSCRIBED,
        NewsletterSubscriptionStatus.BOUNCED,
        NewsletterSubscriptionStatus.COMPLAINED,
      ].includes(current.status)) return null
      if (current?.status === NewsletterSubscriptionStatus.PENDING && !pendingNeedsRetry(current)) return null

      const confirmationToken = createNewsletterToken()
      const unsubscribeToken = createNewsletterToken()
      const now = new Date()
      const values = {
        name: input.name.trim(), email, email_normalized: email,
        status: NewsletterSubscriptionStatus.PENDING, source: input.source || "storefront",
        locale: input.locale || "pt-BR", consent_version: input.consent_version || NEWSLETTER_CONSENT_VERSION,
        consent_text: CONSENT_TEXT, consent_at: now, confirmed_at: null, unsubscribed_at: null,
        confirmation_token_hash: hashNewsletterToken(confirmationToken), confirmation_expires_at: confirmationExpiry(now),
        unsubscribe_token_hash: hashNewsletterToken(unsubscribeToken), resend_email_id: null, last_email_status: "confirmation_queued",
      }

      let subscription: NewsletterRecord
      if (current) {
        subscription = await service.updateNewsletterSubscriptions({ id: current.id, ...values })
      } else {
        try {
          subscription = await service.createNewsletterSubscriptions(values)
        } catch (error) {
          if (!isUniqueViolation(error)) throw error
          const raced = await service.listNewsletterSubscriptions({ email_normalized: email })
          if (raced[0]) return null
          throw error
        }
      }
      return { service, subscription, email, confirmationToken, unsubscribeToken }
    }
  const claimed = typeof database?.transaction === "function"
    ? await withPostgresAdvisoryLock((handler) => database.transaction!(handler), `newsletter-subscription:${email}`, claim)
    : await claim()
  if (!claimed) return accepted(res)
  const confirmationQueued = await queueConfirmation(claimed)
  if (!confirmationQueued) {
    return res.status(503).json({ status: "confirmation_pending", message: "NÃ£o foi possÃ­vel enviar a confirmaÃ§Ã£o agora. Tente novamente." })
  }
  return accepted(res)
}
