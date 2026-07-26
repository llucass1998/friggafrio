import { model } from "@medusajs/framework/utils";

export enum PaymentAttemptStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  CANCELED = "canceled",
}

export const PaymentAttempt = model
  .define("payment_attempt", {
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
    status: model
      .enum(Object.values(PaymentAttemptStatus))
      .default(PaymentAttemptStatus.PENDING),
    attempt_number: model.number().default(1),
    request_fingerprint: model.text().nullable(),
    failure_code: model.text().nullable(),
    failure_message_sanitized: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_payment_attempt_cart_id",
      on: ["cart_id"],
      where: '"deleted_at" IS NULL AND "cart_id" IS NOT NULL',
    },
    {
      name: "IDX_payment_attempt_order_id",
      on: ["order_id"],
      where: '"deleted_at" IS NULL AND "order_id" IS NOT NULL',
    },
    {
      name: "IDX_payment_attempt_customer_id",
      on: ["customer_id"],
      where: '"deleted_at" IS NULL AND "customer_id" IS NOT NULL',
    },
    {
      name: "IDX_payment_attempt_provider_payment",
      on: ["provider", "provider_payment_id"],
      unique: true,
      where: '"deleted_at" IS NULL AND "provider_payment_id" IS NOT NULL',
    },
  ])
  .checks([
    {
      name: "payment_attempt_amount_nonnegative_check",
      expression: (columns) => `${columns.amount} >= 0`,
    },
    {
      name: "payment_attempt_number_positive_check",
      expression: (columns) => `${columns.attempt_number} >= 1`,
    },
    {
      name: "payment_attempt_currency_code_check",
      expression: (columns) => `char_length(${columns.currency_code}) = 3`,
    },
  ]);
