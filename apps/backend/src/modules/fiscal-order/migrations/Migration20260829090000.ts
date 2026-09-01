import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Durable one-to-one fiscal projection; all writes remain fail-closed locally. */
export class Migration20260829090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fiscal_order" ("id" text not null, "medusa_order_id" text not null, "integration_code" text not null, "state" text check ("state" in ('NOT_ELIGIBLE','PAYMENT_PENDING','READY_FOR_FISCAL_SYNC','VALIDATING_FISCAL_DATA','BLOCKED_MISSING_CONFIGURATION','CUSTOMER_SYNCED','SALES_ORDER_CREATING','SALES_ORDER_CREATED','INVOICE_PENDING','INVOICE_PROCESSING','NFE_AUTHORIZED','NFE_REJECTED','CANCELLATION_PENDING','NFE_CANCELLED','REFUND_RECONCILIATION_PENDING','COMPLETED','ERROR_RETRYABLE','ERROR_PERMANENT')) not null default 'NOT_ELIGIBLE', "environment" text check ("environment" in ('homologation','production')) not null default 'homologation', "omie_customer_id" text null, "omie_sales_order_id" text null, "nfe_id" text null, "nfe_number" text null, "nfe_series" text null, "nfe_access_key" text null, "nfe_authorized_at" timestamptz null, "xml_url" text null, "danfe_url" text null, "attempts" integer not null default 0, "last_error" text null, "external_event_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fiscal_order_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_fiscal_order_medusa_order_unique" on "fiscal_order" ("medusa_order_id") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_fiscal_order_integration_code_unique" on "fiscal_order" ("integration_code") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_fiscal_order_omie_sales_order_unique" on "fiscal_order" ("omie_sales_order_id") where deleted_at is null and "omie_sales_order_id" is not null;`)
    this.addSql(`create unique index if not exists "IDX_fiscal_order_nfe_access_key_unique" on "fiscal_order" ("nfe_access_key") where deleted_at is null and "nfe_access_key" is not null;`)
    this.addSql(`create unique index if not exists "IDX_fiscal_order_external_event_unique" on "fiscal_order" ("external_event_id") where deleted_at is null and "external_event_id" is not null;`)
    this.addSql(`create index if not exists "IDX_fiscal_order_state" on "fiscal_order" ("state");`)
    this.addSql(`create index if not exists "IDX_fiscal_order_omie_customer" on "fiscal_order" ("omie_customer_id");`)
    this.addSql(`create index if not exists "IDX_fiscal_order_nfe_id" on "fiscal_order" ("nfe_id");`)
    this.addSql(`alter table "fiscal_order" add constraint "fiscal_order_attempts_nonnegative_check" check ("attempts" >= 0);`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fiscal_order" cascade;`)
  }
}
