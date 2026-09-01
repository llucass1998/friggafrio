import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { syncNewsletterContact } from "../../../../lib/email/resend"
import { serviceFor, type NewsletterRecord } from "../subscriptions/route"

const schema = z.object({ token: z.string().min(32).max(256) }).strict()

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ status: "invalid_or_expired" })

  const service = serviceFor(req)
  const matches = await service.listNewsletterSubscriptions({
    confirmation_token_hash: hashNewsletterToken(parsed.data.token),
    status: NewsletterSubscriptionStatus.PENDING,
  })
  const subscription = matches[0] as NewsletterRecord | undefined
  const expiresAt = subscription?.confirmation_expires_at ? new Date(subscription.confirmation_expires_at) : null
  if (!subscription || !expiresAt || expiresAt.getTime() <= Date.now()) {
    return res.status(400).json({ status: "invalid_or_expired" })
  }

  await service.updateNewsletterSubscriptions({
    id: subscription.id,
    status: NewsletterSubscriptionStatus.ACTIVE,
    confirmed_at: new Date(),
    confirmation_token_hash: null,
    confirmation_expires_at: null,
    last_email_status: "confirmed",
  })
  if (subscription.email) {
    const provider = await syncNewsletterContact({
      email: subscription.email,
      firstName: subscription.name || "cliente",
      idempotencyKey: `newsletter-contact-${subscription.id}`,
    })
    if (provider.status === "sent") {
      await service.updateNewsletterSubscriptions({
        id: subscription.id,
        resend_contact_id: provider.id,
        last_email_status: "contact_synced",
      })
    }
  }
  res.status(200).json({ status: "confirmed" })
}
