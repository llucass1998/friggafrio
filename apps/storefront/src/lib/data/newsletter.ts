import { sdk } from "@/lib/medusa"

export type NewsletterSubscriptionStatus = "confirmation_pending"
export type NewsletterActionStatus = "confirmed" | "unsubscribed" | "invalid" | "invalid_or_expired"

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

export const confirmNewsletterSubscription = (token: string) =>
  sdk.client.fetch<{ status: NewsletterActionStatus }>("/store/newsletter/confirm", {
    method: "POST",
    body: { token },
  })

export const unsubscribeNewsletter = (token: string) =>
  sdk.client.fetch<{ status: NewsletterActionStatus }>("/store/newsletter/unsubscribe", {
    method: "POST",
    body: { token },
  })
