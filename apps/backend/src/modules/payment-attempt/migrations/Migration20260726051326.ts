import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051326 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "payment_attempt" drop constraint if exists "payment_attempt_idempotency_key_unique";`,
    );
    this.addSql(
      `create table if not exists "payment_attempt" ("id" text not null, "cart_id" text null, "order_id" text null, "customer_id" text null, "provider" text not null, "provider_payment_id" text null, "idempotency_key" text not null, "amount" numeric not null, "currency_code" text not null, "method" text null, "status" text check ("status" in ('pending', 'processing', 'authorized', 'captured', 'failed', 'canceled')) not null default 'pending', "attempt_number" integer not null default 1, "request_fingerprint" text null, "failure_code" text null, "failure_message_sanitized" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_attempt_pkey" primary key ("id"), constraint payment_attempt_amount_nonnegative_check check (amount >= 0), constraint payment_attempt_number_positive_check check (attempt_number >= 1), constraint payment_attempt_currency_code_check check (char_length(currency_code) = 3));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_attempt_idempotency_key_unique" ON "payment_attempt" ("idempotency_key") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_deleted_at" ON "payment_attempt" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_cart_id" ON "payment_attempt" ("cart_id") WHERE "deleted_at" IS NULL AND "cart_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_order_id" ON "payment_attempt" ("order_id") WHERE "deleted_at" IS NULL AND "order_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_customer_id" ON "payment_attempt" ("customer_id") WHERE "deleted_at" IS NULL AND "customer_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_attempt_provider_payment" ON "payment_attempt" ("provider", "provider_payment_id") WHERE "deleted_at" IS NULL AND "provider_payment_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_attempt" cascade;`);
  }
}
