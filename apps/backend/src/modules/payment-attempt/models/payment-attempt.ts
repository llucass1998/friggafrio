import { model } from "@medusajs/framework/utils"

export const PaymentAttempt = model.define("payment_attempt", {
  id: model.id().primaryKey(),
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  provider: model.text(),
  provider_payment_id: model.text().nullable(),
  idempotency_key: model.text().unique(),
  amount: model.bigNumber(),
  currency_code: model.text(),
  method: model.text().nullable(),
  status: model.text(), // pending, processing, authorized, captured, failed, canceled
  attempt_number: model.number().default(1),
  request_fingerprint: model.text().nullable(),
  failure_code: model.text().nullable(),
  failure_message_sanitized: model.text().nullable(),
})
