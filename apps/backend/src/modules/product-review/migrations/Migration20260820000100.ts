import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260820000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_review" ("id" text not null, "product_id" text not null, "customer_id" text not null, "order_id" text null, "author_name" text not null, "rating" integer not null, "title" text null, "body" text not null, "verified_purchase" boolean not null default true, "status" text check ("status" in ('pending', 'approved', 'rejected', 'hidden')) not null default 'pending', "admin_reply" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_review_pkey" primary key ("id"));`)
    this.addSql(`create index if not exists "IDX_product_review_product_status" on "product_review" ("product_id", "status") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_product_review_customer_product_unique" on "product_review" ("customer_id", "product_id") where deleted_at is null;`)
  }

  // This release is additive. Production rollback must not drop customer content.
  override async down(): Promise<void> {}
}
