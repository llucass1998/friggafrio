import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051327 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "payment_webhook_event" ("id" text not null, "provider" text not null, "provider_event_id" text not null, "provider_payment_id" text null, "request_id" text null, "event_type" text not null, "signature_validated" boolean not null default false, "payload_hash" text null, "processing_status" text check ("processing_status" in ('pending', 'processing', 'completed', 'failed')) not null default 'pending', "attempts" integer not null default 0, "last_error" text null, "received_at" timestamptz not null, "processed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_webhook_event_pkey" primary key ("id"), constraint payment_webhook_attempts_nonnegative_check check (attempts >= 0));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_webhook_event_deleted_at" ON "payment_webhook_event" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_webhook_provider_event" ON "payment_webhook_event" ("provider", "provider_event_id") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_webhook_provider_payment" ON "payment_webhook_event" ("provider", "provider_payment_id") WHERE "deleted_at" IS NULL AND "provider_payment_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_webhook_processing_status" ON "payment_webhook_event" ("processing_status") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_webhook_request_id" ON "payment_webhook_event" ("request_id") WHERE "deleted_at" IS NULL AND "request_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_webhook_event" cascade;`);
  }
}
