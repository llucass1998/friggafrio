import { model } from "@medusajs/framework/utils"

export enum NewsletterSubscriptionStatus {
  PENDING = "pending",
  ACTIVE = "active",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
  COMPLAINED = "complained",
}

export const NewsletterSubscription = model
  .define("newsletter_subscription", {
    id: model.id().primaryKey(),
    name: model.text().nullable(),
    // The first local migration created this column as NOT NULL. Keep it as an
    // internal compatibility field while all lookups use email_normalized.
    email: model.text(),
    email_normalized: model.text(),
    status: model.enum(Object.values(NewsletterSubscriptionStatus)).default(NewsletterSubscriptionStatus.PENDING),
    source: model.text().nullable(),
    locale: model.text().nullable(),
    consent_version: model.text().nullable(),
    consent_at: model.dateTime().nullable(),
    confirmed_at: model.dateTime().nullable(),
    unsubscribed_at: model.dateTime().nullable(),
    confirmation_token_hash: model.text().nullable(),
    confirmation_expires_at: model.dateTime().nullable(),
    unsubscribe_token_hash: model.text().nullable(),
    resend_email_id: model.text().nullable(),
    last_email_status: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_newsletter_subscription_email_normalized",
      on: ["email_normalized"],
      unique: true,
      where: '"deleted_at" IS NULL',
    },
    { name: "IDX_newsletter_subscription_status", on: ["status"] },
    { name: "IDX_newsletter_subscription_confirmation_hash", on: ["confirmation_token_hash"] },
    { name: "IDX_newsletter_subscription_unsubscribe_hash", on: ["unsubscribe_token_hash"] },
  ])

export default NewsletterSubscription
