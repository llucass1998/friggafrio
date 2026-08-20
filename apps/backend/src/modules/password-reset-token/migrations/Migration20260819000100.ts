import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260819000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "password_reset_token" ("id" text not null, "token_hash" text not null, "customer_email" text not null, "expires_at" timestamptz not null, "consumed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "password_reset_token_pkey" primary key ("id"));`,
    )
    this.addSql(
      `create unique index if not exists "IDX_password_reset_token_token_hash_unique" on "password_reset_token" ("token_hash") where deleted_at is null;`,
    )
    this.addSql(
      `create index if not exists "IDX_password_reset_token_customer_active" on "password_reset_token" ("customer_email", "consumed_at") where deleted_at is null and consumed_at is null;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "password_reset_token" cascade;`)
  }
}
