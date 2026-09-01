import { MedusaService } from "@medusajs/framework/utils"
import { NewsletterSubscription } from "./models/newsletter-subscription"
import { NewsletterWebhookEvent } from "./models/newsletter-webhook-event"

export default class NewsletterSubscriptionService extends MedusaService({
  NewsletterSubscription,
  NewsletterWebhookEvent,
}) {}
