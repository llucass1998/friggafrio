import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Preserve the active Medusa session while a gateway attempt is reused. */
export class Migration20260826033000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_attempt" add column if not exists "payment_session_id" text null;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_payment_session_id" ON "payment_attempt" ("payment_session_id") WHERE "deleted_at" IS NULL AND "payment_session_id" IS NOT NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_payment_attempt_payment_session_id";`)
    this.addSql(`alter table if exists "payment_attempt" drop column if exists "payment_session_id";`)
  }
}
