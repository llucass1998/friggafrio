import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Evolves the local draft subscription table without deleting subscriber data. */
export class Migration20260823000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "email_normalized" text null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "consent_version" text null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "confirmed_at" timestamptz null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "unsubscribed_at" timestamptz null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "confirmation_token_hash" text null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "confirmation_expires_at" timestamptz null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "unsubscribe_token_hash" text null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "resend_email_id" text null;`)
    this.addSql(`alter table if exists "newsletter_subscription" add column if not exists "last_email_status" text null;`)
    this.addSql(`update "newsletter_subscription" set "email_normalized" = lower(trim("email")) where "email_normalized" is null and "email" is not null;`)
    this.addSql(`alter table if exists "newsletter_subscription" drop constraint if exists "newsletter_subscription_status_check";`)
    this.addSql(`alter table if exists "newsletter_subscription" add constraint "newsletter_subscription_status_check" check ("status" in ('pending', 'active', 'unsubscribed', 'bounced', 'complained'));`)
    this.addSql(`create unique index if not exists "IDX_newsletter_subscription_email_normalized" on "newsletter_subscription" ("email_normalized") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_newsletter_subscription_status" on "newsletter_subscription" ("status");`)
    this.addSql(`create index if not exists "IDX_newsletter_subscription_confirmation_hash" on "newsletter_subscription" ("confirmation_token_hash") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_newsletter_subscription_unsubscribe_hash" on "newsletter_subscription" ("unsubscribe_token_hash") where "deleted_at" is null;`)
    this.addSql(`create table if not exists "newsletter_webhook_event" ("id" text not null, "event_id" text not null, "event_type" text not null, "email_id" text null, "payload_hash" text not null, "processed_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_webhook_event_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_newsletter_webhook_event_id" on "newsletter_webhook_event" ("event_id") where "deleted_at" is null;`)
  }

  override async down(): Promise<void> {}
}
