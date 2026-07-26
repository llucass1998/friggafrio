import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726051325 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "customer_profile" drop constraint if exists "customer_profile_document_hash_unique";`,
    );
    this.addSql(
      `alter table if exists "customer_profile" drop constraint if exists "customer_profile_customer_id_unique";`,
    );
    this.addSql(
      `create table if not exists "customer_profile" ("id" text not null, "customer_id" text not null, "document_type" text check ("document_type" in ('cpf', 'cnpj')) not null default 'cpf', "document_ciphertext" text null, "document_iv" text null, "document_auth_tag" text null, "document_hash" text null, "document_last_four" text null, "corporate_name" text null, "state_inscription" text null, "is_state_inscription_exempt" boolean not null default false, "accepted_terms_at" timestamptz null, "accepted_terms_version" text null, "marketing_consent" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_profile_pkey" primary key ("id"), constraint customer_profile_document_bundle_check check (((document_ciphertext IS NULL AND document_iv IS NULL AND document_auth_tag IS NULL AND document_hash IS NULL AND document_last_four IS NULL) OR (document_ciphertext IS NOT NULL AND document_iv IS NOT NULL AND document_auth_tag IS NOT NULL AND document_hash IS NOT NULL AND document_last_four IS NOT NULL))), constraint customer_profile_terms_bundle_check check (((accepted_terms_at IS NULL AND accepted_terms_version IS NULL) OR (accepted_terms_at IS NOT NULL AND accepted_terms_version IS NOT NULL))));`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_profile_customer_id_unique" ON "customer_profile" ("customer_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_profile_document_hash_unique" ON "customer_profile" ("document_hash") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_profile_deleted_at" ON "customer_profile" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_profile_terms_version" ON "customer_profile" ("accepted_terms_version") WHERE "deleted_at" IS NULL AND "accepted_terms_version" IS NOT NULL AND deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_profile" cascade;`);
  }
}
