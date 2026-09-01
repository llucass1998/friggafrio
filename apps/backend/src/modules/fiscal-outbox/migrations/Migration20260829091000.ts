import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Durable fiscal outbox. It stores only bounded state and sanitized errors. */
export class Migration20260829091000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fiscal_outbox_event" ("id" text not null, "fiscal_order_id" text not null, "event_key" text not null, "event_type" text check ("event_type" in ('PAYMENT_CONFIRMED_AND_RECONCILED','RETRY_REQUIRED','CANCELLATION_REQUESTED','REFUND_RECONCILIATION')) not null, "status" text check ("status" in ('pending','processing','completed','dead_letter')) not null default 'pending', "attempts" integer not null default 0, "next_attempt_at" timestamptz null, "last_error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fiscal_outbox_event_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_fiscal_outbox_event_key_unique" on "fiscal_outbox_event" ("event_key") where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_fiscal_outbox_order" on "fiscal_outbox_event" ("fiscal_order_id") where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_fiscal_outbox_status_due" on "fiscal_outbox_event" ("status", "next_attempt_at") where deleted_at is null;`)
    this.addSql(`alter table "fiscal_outbox_event" add constraint "fiscal_outbox_attempts_nonnegative_check" check ("attempts" >= 0);`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fiscal_outbox_event" cascade;`)
  }
}
