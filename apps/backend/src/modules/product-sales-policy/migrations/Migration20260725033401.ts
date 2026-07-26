import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260725033401 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_sales_policy" ("id" text not null, "product_id" text not null, "is_quote_only" boolean not null default false, "is_inflammatory" boolean not null default false, "requires_contact" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_sales_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_sales_policy_product_id" ON "product_sales_policy" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_sales_policy_deleted_at" ON "product_sales_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_sales_policy" cascade;`);
  }

}
