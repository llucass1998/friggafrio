import { model } from "@medusajs/framework/utils"

export const PaymentOperation = model
  .define("payment_operation", {
    id: model.id().primaryKey(),
    provider: model.text(),
    provider_payment_id: model.text(),
    action: model.text(),
    idempotency_key: model.text().unique(),
    amount: model.bigNumber().nullable(),
    status: model.enum(["initiated", "succeeded", "failed"]).default("initiated"),
    failure_message_sanitized: model.text().nullable(),
  })
  .indexes([
    { name: "IDX_payment_operation_provider_payment", on: ["provider", "provider_payment_id"] },
    { name: "IDX_payment_operation_action", on: ["action"] },
  ])
