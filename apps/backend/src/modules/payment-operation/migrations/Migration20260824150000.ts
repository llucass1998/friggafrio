import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Additive ledger for idempotent gateway capture, cancellation and refunds. */
export class Migration20260824150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_operation" ("id" text not null, "provider" text not null, "provider_payment_id" text not null, "action" text not null, "idempotency_key" text not null, "amount" numeric null, "status" text check ("status" in ('initiated', 'succeeded', 'failed')) not null default 'initiated', "failure_message_sanitized" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_operation_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_operation_idempotency_key_unique" ON "payment_operation" ("idempotency_key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_operation_provider_payment" ON "payment_operation" ("provider", "provider_payment_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_operation_action" ON "payment_operation" ("action") WHERE deleted_at IS NULL;`)
  }
  override async down(): Promise<void> { this.addSql(`drop table if exists "payment_operation" cascade;`) }
}
