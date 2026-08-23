import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { NewsletterSubscriptionStatus } from "../../../../modules/newsletter-subscription/models/newsletter-subscription"
import { hashNewsletterToken } from "../../../../lib/newsletter/subscription-security"
import { serviceFor, type NewsletterRecord } from "../subscriptions/route"

const schema = z.object({ token: z.string().min(32).max(256) }).strict()

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ status: "invalid" })

  const service = serviceFor(req)
  const subscription = (await service.listNewsletterSubscriptions({
    unsubscribe_token_hash: hashNewsletterToken(parsed.data.token),
  }))[0] as NewsletterRecord | undefined
  if (!subscription) return res.status(400).json({ status: "invalid" })

  if (subscription.status !== NewsletterSubscriptionStatus.COMPLAINED && subscription.status !== NewsletterSubscriptionStatus.BOUNCED) {
    await service.updateNewsletterSubscriptions({
      id: subscription.id,
      status: NewsletterSubscriptionStatus.UNSUBSCRIBED,
      unsubscribed_at: new Date(),
      last_email_status: "unsubscribed",
    })
  }
  res.status(200).json({ status: "unsubscribed" })
}
