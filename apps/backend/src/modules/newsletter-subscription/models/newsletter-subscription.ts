import { model } from "@medusajs/framework/utils"

export enum NewsletterSubscriptionStatus {
  ACTIVE = "active",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
  COMPLAINED = "complained",
}

export const NewsletterSubscription = model
  .define("newsletter_subscription", {
    id: model.id().primaryKey(),
    name: model.text(),
    email: model.text(),
    email_normalized: model.text().nullable(),
    status: model.enum(Object.values(NewsletterSubscriptionStatus)).default(NewsletterSubscriptionStatus.ACTIVE),
    consent_at: model.dateTime(),
    consent_version: model.text().nullable(),
    consent_text: model.text().nullable(),
    source: model.text().nullable(),
    locale: model.text().nullable(),
    confirmed_at: model.dateTime().nullable(),
    confirmation_token_hash: model.text().nullable(),
    confirmation_expires_at: model.dateTime().nullable(),
    unsubscribe_token_hash: model.text().nullable(),
    resend_contact_id: model.text().nullable(),
    resend_email_id: model.text().nullable(),
    last_email_status: model.text().nullable(),
    confirmation_sent_at: model.dateTime().nullable(),
    unsubscribed_at: model.dateTime().nullable(),
  })
  .indexes([
    { name: "IDX_newsletter_subscription_email", on: ["email"] },
    { name: "IDX_newsletter_subscription_email_normalized", on: ["email_normalized"] },
    { name: "IDX_newsletter_subscription_status", on: ["status"] },
    { name: "IDX_newsletter_subscription_unsubscribe_hash", on: ["unsubscribe_token_hash"] },
  ])

export default NewsletterSubscription
