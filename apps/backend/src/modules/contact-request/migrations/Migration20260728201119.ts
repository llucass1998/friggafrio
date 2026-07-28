import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260728201119 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "contact_request" ("id" text not null, "name" text not null, "email" text not null, "phone" text null, "subject" text null, "message" text not null, "status" text check ("status" in ('received', 'read', 'resolved', 'spam')) not null default 'received', "source" text not null default 'storefront_home', "notification_sent" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_request_deleted_at" ON "contact_request" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_request_status" ON "contact_request" ("status") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_request_email" ON "contact_request" ("email") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact_request" cascade;`);
  }

}
