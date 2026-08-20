import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260819000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "wishlist" ("id" text not null, "customer_id" text not null, "is_primary" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wishlist_pkey" primary key ("id"));`,
    )
    this.addSql(
      `create table if not exists "wishlist_item" ("id" text not null, "wishlist_id" text not null, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wishlist_item_pkey" primary key ("id"), constraint "wishlist_item_wishlist_id_foreign" foreign key ("wishlist_id") references "wishlist" ("id") on update cascade);`,
    )
    this.addSql(
      `create unique index if not exists "IDX_wishlist_customer_primary_unique" on "wishlist" ("customer_id") where deleted_at is null and is_primary = true;`,
    )
    this.addSql(
      `create index if not exists "IDX_wishlist_customer_primary" on "wishlist" ("customer_id", "is_primary") where deleted_at is null;`,
    )
    this.addSql(
      `create unique index if not exists "IDX_wishlist_item_wishlist_product_unique" on "wishlist_item" ("wishlist_id", "product_id") where deleted_at is null;`,
    )
    this.addSql(
      `create index if not exists "IDX_wishlist_item_wishlist_product" on "wishlist_item" ("wishlist_id", "product_id") where deleted_at is null;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wishlist_item" cascade;`)
    this.addSql(`drop table if exists "wishlist" cascade;`)
  }
}
