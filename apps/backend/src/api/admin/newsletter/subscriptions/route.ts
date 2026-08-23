import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../../modules/newsletter-subscription/service"
import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"

type NewsletterAdminRecord = {
  id: string
  name?: string | null
  email_normalized: string
  status: NewsletterSubscriptionStatus
  source?: string | null
  locale?: string | null
  consent_version?: string | null
  consent_at?: Date | string | null
  confirmed_at?: Date | string | null
  unsubscribed_at?: Date | string | null
  created_at?: Date | string
}

type NewsletterAdminService = NewsletterSubscriptionService & {
  listAndCountNewsletterSubscriptions: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<[NewsletterAdminRecord[], number]>
}

const querySchema = z.object({
  status: z.enum(Object.values(NewsletterSubscriptionStatus) as [NewsletterSubscriptionStatus, ...NewsletterSubscriptionStatus[]]).optional(),
  q: z.string().trim().max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).strict()

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: "Invalid newsletter query" })
  const input = parsed.data
  const filters: Record<string, unknown> = {}
  if (input.status) filters.status = input.status
  if (input.q) filters.email_normalized = { $like: `%${input.q.toLowerCase()}%` }
  const service = req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as NewsletterAdminService
  const limit = input.limit || 25
  const offset = input.offset || 0
  const [subscriptions, count] = await service.listAndCountNewsletterSubscriptions(filters, {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })

  // Token hashes and provider identifiers are deliberately never exposed here.
  res.json({
    subscriptions: subscriptions.map(({ id, name, email_normalized, status, source, locale, consent_version, consent_at, confirmed_at, unsubscribed_at, created_at }) => ({
      id,
      name,
      email: email_normalized,
      status,
      source,
      locale,
      consent_version,
      consent_at,
      confirmed_at,
      unsubscribed_at,
      created_at,
    })),
    count,
    limit,
    offset,
  })
}
