import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** This migration is additive and intentionally has no destructive rollback. */
export class Migration20260821000200 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "newsletter_subscription" ("id" text not null, "name" text not null, "email" text not null, "status" text check ("status" in ('active', 'unsubscribed')) not null default 'active', "consent_at" timestamptz not null, "source" text null, "locale" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_subscription_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_newsletter_subscription_email_unique" on "newsletter_subscription" ("email") where deleted_at is null;`)
  }

  override async down(): Promise<void> {}
}
