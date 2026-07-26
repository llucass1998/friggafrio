import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051324 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "audit_log" ("id" text not null, "actor" text null, "actor_type" text check ("actor_type" in ('customer', 'admin', 'system', 'employee')) not null default 'system', "action" text not null, "resource" text not null, "resource_id" text null, "result" text check ("result" in ('success', 'failure')) not null default 'success', "ip_anonymized" text null, "user_agent_short" text null, "correlation_id" text null, "before_state" jsonb null, "after_state" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "audit_log_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_deleted_at" ON "audit_log" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_resource" ON "audit_log" ("resource", "resource_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_correlation_id" ON "audit_log" ("correlation_id") WHERE "deleted_at" IS NULL AND "correlation_id" IS NOT NULL AND deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_log" cascade;`);
  }
}
