import { model } from "@medusajs/framework/utils"

export const NewsletterWebhookEvent = model
  .define("newsletter_webhook_event", {
    id: model.id().primaryKey(),
    event_id: model.text(),
    event_type: model.text(),
    email_id: model.text().nullable(),
    payload_hash: model.text(),
    processed_at: model.dateTime(),
  })
  .indexes([{ name: "IDX_newsletter_webhook_event_id", on: ["event_id"] }])

export default NewsletterWebhookEvent
