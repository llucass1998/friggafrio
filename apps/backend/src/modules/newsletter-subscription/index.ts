import { Module } from "@medusajs/framework/utils"
import NewsletterSubscriptionService from "./service"

export const NEWSLETTER_SUBSCRIPTION_MODULE = "newsletterSubscription"

export default Module(NEWSLETTER_SUBSCRIPTION_MODULE, {
  service: NewsletterSubscriptionService,
})
