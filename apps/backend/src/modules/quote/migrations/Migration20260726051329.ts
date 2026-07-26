import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051329 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_customer_id" ON "quote" ("customer_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_status" ON "quote" ("status") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_draft_order_id" ON "quote" ("draft_order_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_order_change_id" ON "quote" ("order_change_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_cart_id" ON "quote" ("cart_id") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_quote_customer_id";`);
    this.addSql(`drop index if exists "IDX_quote_status";`);
    this.addSql(`drop index if exists "IDX_quote_draft_order_id";`);
    this.addSql(`drop index if exists "IDX_quote_order_change_id";`);
    this.addSql(`drop index if exists "IDX_quote_cart_id";`);
  }
}
