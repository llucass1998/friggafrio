import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NEWSLETTER_SUBSCRIPTION_MODULE } from "../../../../modules/newsletter-subscription"
import type NewsletterSubscriptionService from "../../../../modules/newsletter-subscription/service"
import { unsubscribeNewsletterContact } from "../../../../lib/email/resend"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"

const schema = z.object({ token: z.string().min(32).max(256) }).strict()

type Service = NewsletterSubscriptionService & {
  listNewsletterSubscriptions: (filters: Record<string, unknown>) => Promise<Array<{
    id: string
    status: string
    email: string
    resend_contact_id?: string | null
  }>>
  updateNewsletterSubscriptions: (input: Record<string, unknown>) => Promise<unknown>
}

/** Idempotent, token-only cancellation. Email addresses are never accepted from the browser. */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ status: "invalid" })

  const service = req.scope.resolve(NEWSLETTER_SUBSCRIPTION_MODULE) as Service
  const matches = await service.listNewsletterSubscriptions({
    unsubscribe_token_hash: hashNewsletterToken(parsed.data.token),
  })
  const subscription = matches[0]
  if (!subscription) return res.status(400).json({ status: "invalid" })

  if (subscription.status !== "unsubscribed") {
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      status: "unsubscribed",
      unsubscribed_at: new Date(),
      last_email_status: "unsubscribed",
    })
    const provider = await unsubscribeNewsletterContact({
      email: subscription.email,
      contactId: subscription.resend_contact_id,
      idempotencyKey: `newsletter-unsubscribe-${subscription.id}`,
    })
    if (provider.status === "failed") {
      await service.updateNewsletterSubscriptions({ id: subscription.id, last_email_status: "unsubscribe_provider_failed" })
    }
  }

  return res.status(200).json({ status: "unsubscribed" })
}
