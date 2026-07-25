import { model } from "@medusajs/framework/utils"

export const PaymentWebhookEvent = model.define("payment_webhook_event", {
  id: model.id().primaryKey(),
  provider: model.text(),
  provider_event_id: model.text().unique(), // The external ID for the event, e.g. Mercado Pago action ID
  provider_payment_id: model.text().nullable(),
  request_id: model.text().nullable(),
  event_type: model.text(),
  signature_validated: model.boolean().default(false),
  payload_hash: model.text().nullable(),
  processing_status: model.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  attempts: model.number().default(0),
  last_error: model.text().nullable(),
  received_at: model.dateTime(),
  processed_at: model.dateTime().nullable(),
})
