import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Upgrade databases that predate pending newsletter confirmations.
 * The prior migration already contains the desired schema for fresh installs;
 * this migration is only for deployed databases where that migration was not
 * applied. Validation happens before the legacy constraint is replaced, and
 * down() restores the legacy status domain when no pending rows remain.
 */
export class Migration20260901010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`do $$
      declare current_definition text;
      declare pending_constraint_exists boolean;
      begin
        if to_regclass('public.newsletter_subscription') is null then
          raise exception 'newsletter_subscription table is required';
        end if;
        select pg_get_constraintdef(oid) into current_definition
          from pg_constraint
         where conrelid = 'public.newsletter_subscription'::regclass
           and conname = 'newsletter_subscription_status_check';
        if current_definition is not null and current_definition like '%pending%' then
          return;
        end if;
        select exists(
          select 1 from pg_constraint
           where conrelid = 'public.newsletter_subscription'::regclass
             and conname = 'newsletter_subscription_status_check_pending'
        ) into pending_constraint_exists;
        if not pending_constraint_exists then
          execute 'alter table "newsletter_subscription" add constraint "newsletter_subscription_status_check_pending" check ("status" in (''pending'', ''active'', ''unsubscribed'', ''bounced'', ''complained'')) not valid';
        end if;
        execute 'alter table "newsletter_subscription" validate constraint "newsletter_subscription_status_check_pending"';
        if current_definition is not null then
          execute 'alter table "newsletter_subscription" drop constraint "newsletter_subscription_status_check"';
        end if;
        execute 'alter table "newsletter_subscription" rename constraint "newsletter_subscription_status_check_pending" to "newsletter_subscription_status_check"';
      end
    $$;`)
  }

  override async down(): Promise<void> {
    this.addSql(`do $$
      declare current_definition text;
      declare legacy_constraint_exists boolean;
      declare pending_count bigint;
      begin
        if to_regclass('public.newsletter_subscription') is null then
          return;
        end if;
        select pg_get_constraintdef(oid) into current_definition
          from pg_constraint
         where conrelid = 'public.newsletter_subscription'::regclass
           and conname = 'newsletter_subscription_status_check';
        if current_definition is null or current_definition not like '%pending%' then
          return;
        end if;
        select count(*) into pending_count
          from "newsletter_subscription"
         where "status" = 'pending';
        if pending_count > 0 then
          raise exception 'cannot roll back newsletter pending status while % pending subscriptions exist', pending_count;
        end if;
        select exists(
          select 1 from pg_constraint
           where conrelid = 'public.newsletter_subscription'::regclass
             and conname = 'newsletter_subscription_status_check_legacy'
        ) into legacy_constraint_exists;
        if not legacy_constraint_exists then
          execute 'alter table "newsletter_subscription" add constraint "newsletter_subscription_status_check_legacy" check ("status" in (''active'', ''unsubscribed'', ''bounced'', ''complained'')) not valid';
        end if;
        execute 'alter table "newsletter_subscription" validate constraint "newsletter_subscription_status_check_legacy"';
        execute 'alter table "newsletter_subscription" drop constraint "newsletter_subscription_status_check"';
        execute 'alter table "newsletter_subscription" rename constraint "newsletter_subscription_status_check_legacy" to "newsletter_subscription_status_check"';
      end
    $$;`)
  }
}
