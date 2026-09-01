import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260826021320 extends Migration {

  override async up(): Promise<void> {
    // Existing local databases predate the raw BigNumber companion column.
    // Keep the ledger and its rows intact while bringing its schema in sync.
    this.addSql(`alter table if exists "payment_operation" add column if not exists "raw_amount" jsonb null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_operation_deleted_at" ON "payment_operation" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_operation" drop column if exists "raw_amount";`);
  }

}
