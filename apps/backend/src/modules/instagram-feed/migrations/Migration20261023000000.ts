import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261023000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "instagram_post" (
        "id" text not null,
        "instagram_id" text not null,
        "caption" text null,
        "media_type" text not null default 'IMAGE',
        "media_url" text not null,
        "thumbnail_url" text null,
        "permalink" text not null,
        "timestamp" timestamptz null,
        "is_hidden" boolean not null default false,
        "order" integer not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "instagram_post_pkey" primary key ("id")
      );
    `)
    this.addSql(`create unique index if not exists "IDX_instagram_post_instagram_id" on "instagram_post" ("instagram_id") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_instagram_post_is_hidden" on "instagram_post" ("is_hidden") where "deleted_at" is null;`)
    this.addSql(`create index if not exists "IDX_instagram_post_order" on "instagram_post" ("order") where "deleted_at" is null;`)

    this.addSql(`
      create table if not exists "instagram_sync_state" (
        "id" text not null,
        "last_sync_at" timestamptz null,
        "last_sync_status" text not null default 'idle',
        "last_error_message" text null,
        "posts_count" integer not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "instagram_sync_state_pkey" primary key ("id")
      );
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "instagram_post" cascade;`)
    this.addSql(`drop table if exists "instagram_sync_state" cascade;`)
  }
}
