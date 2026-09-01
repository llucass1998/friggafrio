import { model } from "@medusajs/framework/utils"

export const FiscalOutboxEvent = model
  .define("fiscal_outbox_event", {
    id: model.id().primaryKey(),
    fiscal_order_id: model.text(),
    event_key: model.text(),
    event_type: model.enum(["PAYMENT_CONFIRMED_AND_RECONCILED", "RETRY_REQUIRED", "CANCELLATION_REQUESTED", "REFUND_RECONCILIATION"]),
    status: model.enum(["pending", "processing", "completed", "dead_letter"]).default("pending"),
    attempts: model.number().default(0),
    next_attempt_at: model.dateTime().nullable(),
    last_error: model.text().nullable(),
  })
  .indexes([
    { name: "IDX_fiscal_outbox_order", on: ["fiscal_order_id"] },
    { name: "IDX_fiscal_outbox_status_due", on: ["status", "next_attempt_at"] },
    { name: "IDX_fiscal_outbox_event_key", on: ["event_key"], unique: true },
  ])
  .checks([
    { name: "fiscal_outbox_attempts_nonnegative_check", expression: (columns) => `${columns.attempts} >= 0` },
  ])

export default FiscalOutboxEvent
