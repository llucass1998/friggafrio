import { sdk } from "@/lib/medusa"

export type NewsletterSubscriptionStatus = "subscribed" | "already_registered"

export const subscribeToNewsletter = (input: {
  name: string
  email: string
  consent: true
  consent_version: string
  source?: string
  locale?: string
  website?: string
}) => sdk.client.fetch<{ status: NewsletterSubscriptionStatus }>("/store/newsletter/subscriptions", {
  method: "POST",
  body: input,
})
