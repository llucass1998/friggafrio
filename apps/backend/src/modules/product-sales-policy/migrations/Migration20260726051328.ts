import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051328 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "product_sales_policy" drop constraint if exists "product_sales_policy_product_id_unique";`,
    );
    this.addSql(`drop index if exists "IDX_product_sales_policy_product_id";`);

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_sales_policy_product_id_unique" ON "product_sales_policy" ("product_id") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_product_sales_policy_product_id_unique";`,
    );

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_sales_policy_product_id" ON "product_sales_policy" ("product_id") WHERE deleted_at IS NULL;`,
    );
  }
}
