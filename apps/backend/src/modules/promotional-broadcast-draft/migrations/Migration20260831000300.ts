import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Local idempotency and provider association for admin-created drafts. */
export class Migration20260831000300 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "promotional_broadcast_draft" ("id" text not null, "promotion_id" text not null, "product_ids" text not null, "idempotency_key" text not null, "broadcast_id" text null, "status" text check ("status" in ('draft')) not null default 'draft', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotional_broadcast_draft_pkey" primary key ("id"));`)
    this.addSql(`create unique index if not exists "IDX_promotional_broadcast_draft_idempotency_unique" on "promotional_broadcast_draft" ("idempotency_key") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_promotional_broadcast_draft_promotion" on "promotional_broadcast_draft" ("promotion_id") where "deleted_at" is null;`)
  }

  override async down(): Promise<void> {}
}
