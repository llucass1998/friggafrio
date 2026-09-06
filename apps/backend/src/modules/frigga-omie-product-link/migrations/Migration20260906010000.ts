import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260906010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "frigga_omie_product_link" ("id" text not null, "code_display" text not null, "code_normalized" text not null, "product_id" text not null, "variant_id" text null, "source" text not null default 'manual', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "frigga_omie_product_link_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_frigga_omie_product_link_code" on "frigga_omie_product_link" (lower("code_normalized")) where "deleted_at" is null;`)
    this.addSql(`create unique index if not exists "IDX_frigga_omie_product_link_variant" on "frigga_omie_product_link" ("variant_id") where "deleted_at" is null and "variant_id" is not null;`)
    this.addSql(`create index if not exists "IDX_frigga_omie_product_link_product" on "frigga_omie_product_link" ("product_id") where "deleted_at" is null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "frigga_omie_product_link" cascade;`)
  }
}
