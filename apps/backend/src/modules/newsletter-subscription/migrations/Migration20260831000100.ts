import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Additive newsletter consent/provider bookkeeping; no destructive rollback. */
export class Migration20260831000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "newsletter_subscription" add column if not exists "consent_version" text null;`)
    this.addSql(`alter table "newsletter_subscription" add column if not exists "consent_text" text null;`)
    this.addSql(`alter table "newsletter_subscription" add column if not exists "resend_contact_id" text null;`)
    this.addSql(`alter table "newsletter_subscription" add column if not exists "confirmation_sent_at" timestamptz null;`)
    this.addSql(`alter table "newsletter_subscription" add column if not exists "unsubscribed_at" timestamptz null;`)
  }

  override async down(): Promise<void> {}
}
