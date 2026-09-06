import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { withPostgresAdvisoryLock } from "../../../../lib/postgres-advisory-lock"
import { getNewsletterContactState, syncNewsletterContact } from "../../../../lib/email/resend"
import { processingLeaseExpired, serviceFor, type NewsletterRecord } from "../subscriptions/route"

const schema = z.object({ token: z.string().min(32).max(256) }).strict()
type RawConnection = {
  raw?: (sql: string, bindings?: unknown[]) => Promise<unknown>
  transaction?: <T>(handler: (transaction: { raw: (sql: string, bindings?: unknown[]) => Promise<unknown> }) => Promise<T>) => Promise<T>
}

const rawRows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows
  }
  return []
}

/** Atomically claims a pending confirmation lease before provider I/O. */
const claimConfirmation = async (req: MedusaRequest, token: string): Promise<NewsletterRecord | "processing" | "already_confirmed" | null> => {
  const database = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Partial<RawConnection>
  const tokenHash = hashNewsletterToken(token)

  if (typeof database.raw === "function") {
    const cutoff = new Date(Date.now() - 5 * 60 * 1_000)
    const result = await database.raw(
      `update "newsletter_subscription"
          set "last_email_status" = 'confirmation_processing', "updated_at" = now()
        where "confirmation_token_hash" = ?
          and "status" = 'pending'
          and "confirmation_expires_at" > now()
          and ("last_email_status" is distinct from 'confirmation_processing' or "updated_at" <= ?)
        returning "id", "name", "email", "email_normalized", "status", "confirmation_token_hash",
                  "confirmation_expires_at", "unsubscribe_token_hash", "resend_contact_id",
                  "last_email_status", "updated_at"`,
      [tokenHash, cutoff],
    )
    const claimed = rawRows<NewsletterRecord>(result)[0]
    if (claimed) return claimed

    const pending = await database.raw(
      `select "last_email_status", "updated_at"
         from "newsletter_subscription"
        where "confirmation_token_hash" = ?
          and "status" = 'pending'
          and "confirmation_expires_at" > now()
        limit 1`,
      [tokenHash],
    )
    const existing = rawRows<{ last_email_status?: string | null; updated_at?: Date | string | null }>(pending)[0]
    if (existing && existing.last_email_status === "confirmation_processing" && !processingLeaseExpired(existing as NewsletterRecord)) {
      return "processing"
    }
    const confirmed = await database.raw(
      `select "id" from "newsletter_subscription"
        where "confirmation_token_hash" = ? and "status" = 'active'
        limit 1`,
      [tokenHash],
    )
    if (rawRows(confirmed).length > 0) return "already_confirmed"
    return null
  }

  const legacyClaim = async (): Promise<NewsletterRecord | "processing" | "already_confirmed" | null> => {
    const service = serviceFor(req)
    const matches = await service.listNewsletterSubscriptions({ confirmation_token_hash: tokenHash, status: NewsletterSubscriptionStatus.PENDING })
    const subscription = matches[0] as NewsletterRecord | undefined
    if (!subscription) {
      const confirmed = await service.listNewsletterSubscriptions({ confirmation_token_hash: tokenHash, status: NewsletterSubscriptionStatus.ACTIVE })
      return confirmed[0] ? "already_confirmed" : null
    }
    const expiresAt = subscription?.confirmation_expires_at ? new Date(subscription.confirmation_expires_at) : null
    if (!expiresAt || expiresAt.getTime() <= Date.now()) return null
    if (subscription.last_email_status === "confirmation_processing" && !processingLeaseExpired(subscription)) return "processing"
    await service.updateNewsletterSubscriptions({ id: subscription.id, last_email_status: "confirmation_processing" })
    return subscription
  }
  return typeof database.transaction === "function"
    ? withPostgresAdvisoryLock((handler) => database.transaction!(handler), `newsletter-confirm:${tokenHash}`, legacyClaim)
    : legacyClaim()
}

const completeConfirmation = async (req: MedusaRequest, res: MedusaResponse, subscription: NewsletterRecord, token: string) => {
  const service = serviceFor(req)
  let contactId = subscription.resend_contact_id || null
  if (subscription.email && !subscription.resend_contact_id) {
    const provider = await syncNewsletterContact({ email: subscription.email, firstName: subscription.name || "cliente", idempotencyKey: `newsletter-contact-${subscription.id}` })
    if (provider.status !== "sent") {
      await service.updateNewsletterSubscriptions({ id: subscription.id, last_email_status: provider.status === "not_configured" ? "contact_sync_not_configured" : "contact_sync_failed" })
      return res.status(503).json({ status: "confirmation_pending" })
    }
    contactId = provider.id || null
    if (!contactId) {
      await service.updateNewsletterSubscriptions({ id: subscription.id, last_email_status: "contact_sync_missing_id" })
      return res.status(503).json({ status: "confirmation_pending" })
    }
    await service.updateNewsletterSubscriptions({ id: subscription.id, resend_contact_id: contactId })
  }
  if (subscription.email && contactId) {
    const state = await getNewsletterContactState({ email: subscription.email, contactId, idempotencyKey: `newsletter-contact-state-${subscription.id}` })
    if (state.status !== "sent" || state.contactState !== "active") {
      await service.updateNewsletterSubscriptions({ id: subscription.id, last_email_status: state.status === "not_configured" ? "contact_state_not_configured" : "contact_state_blocked" })
      return res.status(503).json({ status: "confirmation_pending" })
    }
  }

  const database = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Partial<RawConnection>
  let confirmed = false
  if (typeof database.raw === "function") {
    const result = await database.raw(
      `update "newsletter_subscription"
          set "status" = 'active', "confirmed_at" = now(),
              "confirmation_expires_at" = null, "last_email_status" = 'confirmed', "updated_at" = now()
        where "id" = ? and "status" = 'pending' and "confirmation_token_hash" = ?
        returning "id"`,
      [subscription.id, hashNewsletterToken(token)],
    )
    confirmed = rawRows(result).length > 0
  } else {
    const current = await service.listNewsletterSubscriptions({ confirmation_token_hash: hashNewsletterToken(token), status: NewsletterSubscriptionStatus.PENDING })
    if (current[0]) {
      // Retain only the one-way hash to make repeated clicks an explicit,
      // provider-free success path. The raw confirmation token is never stored.
      await service.updateNewsletterSubscriptions({ id: subscription.id, status: NewsletterSubscriptionStatus.ACTIVE, confirmed_at: new Date(), confirmation_expires_at: null, last_email_status: "confirmed" })
      confirmed = true
    }
  }
  return confirmed ? res.status(200).json({ status: "confirmed" }) : res.status(400).json({ status: "invalid_or_expired" })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const requestBody = req.body as { token?: unknown }
  const token = typeof requestBody?.token === "string" ? requestBody.token : "invalid"
  if (!schema.safeParse(req.body).success) return res.status(400).json({ status: "invalid_or_expired" })
  const claimed = await claimConfirmation(req, token)
  if (!claimed) return res.status(400).json({ status: "invalid_or_expired" })
  if (claimed === "processing") return res.status(202).json({ status: "confirmation_pending" })
  if (claimed === "already_confirmed") return res.status(200).json({ status: "already_confirmed" })
  return completeConfirmation(req, res, claimed, token)
}
