import { model } from "@medusajs/framework/utils";

export enum PaymentWebhookProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export const PaymentWebhookEvent = model
  .define("payment_webhook_event", {
    id: model.id().primaryKey(),
    provider: model.text(),
    provider_event_id: model.text(),
    provider_payment_id: model.text().nullable(),
    request_id: model.text().nullable(),
    event_type: model.text(),
    signature_validated: model.boolean().default(false),
    payload_hash: model.text().nullable(),
    processing_status: model
      .enum(Object.values(PaymentWebhookProcessingStatus))
      .default(PaymentWebhookProcessingStatus.PENDING),
    attempts: model.number().default(0),
    last_error: model.text().nullable(),
    received_at: model.dateTime(),
    processed_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_payment_webhook_provider_event",
      on: ["provider", "provider_event_id"],
      unique: true,
      where: '"deleted_at" IS NULL',
    },
    {
      name: "IDX_payment_webhook_provider_payment",
      on: ["provider", "provider_payment_id"],
      where: '"deleted_at" IS NULL AND "provider_payment_id" IS NOT NULL',
    },
    {
      name: "IDX_payment_webhook_processing_status",
      on: ["processing_status"],
    },
    {
      name: "IDX_payment_webhook_request_id",
      on: ["request_id"],
      where: '"deleted_at" IS NULL AND "request_id" IS NOT NULL',
    },
  ])
  .checks([
    {
      name: "payment_webhook_attempts_nonnegative_check",
      expression: (columns) => `${columns.attempts} >= 0`,
    },
  ]);
