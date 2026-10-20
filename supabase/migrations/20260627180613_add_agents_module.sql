create type "AgentPortalStatus" as enum ('READY', 'PENDING', 'SUSPENDED');

create type "AgentTier" as enum ('STARTER', 'GROWTH', 'PREMIER');

alter type "RelatedEntityType" add value if not exists 'AGENT';

create table "agents" (
  "id" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "company_name" text,
  "logo_url" text,
  "email" text not null,
  "password_hash" text,
  "phone" text,
  "country" text,
  "address" text,
  "instagram_url" text,
  "internal_notes" text,
  "portal_status" "AgentPortalStatus" not null default 'PENDING',
  "tier" "AgentTier" not null default 'STARTER',
  "can_register_students" boolean not null default true,
  "own_students_only" boolean not null default true,
  "portal_reporting" boolean not null default true,
  "registered_students_count" integer not null default 0,
  "active_applications_count" integer not null default 0,
  "conversion_rate" integer not null default 0,
  "commission_balance" decimal(12, 2) not null default 0,
  "user_id" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "agents_pkey" primary key ("id")
);

create unique index "agents_email_key" on "agents"("email");
create unique index "agents_user_id_key" on "agents"("user_id");
create index "agents_country_idx" on "agents"("country");
create index "agents_portal_status_idx" on "agents"("portal_status");
create index "agents_tier_idx" on "agents"("tier");
create index "agents_created_by_idx" on "agents"("created_by");

alter table "agents"
  add constraint "agents_user_id_fkey"
    foreign key ("user_id")
    references "users"("id")
    on delete set null
    on update cascade,
  add constraint "agents_created_by_fkey"
    foreign key ("created_by")
    references "users"("id")
    on delete set null
    on update cascade;

alter table public."agents" enable row level security;
revoke all on table public."agents" from anon, authenticated;
grant all on table public."agents" to service_role;

drop policy if exists "campus_erp_deny_all" on public."agents";
create policy "campus_erp_deny_all"
on public."agents"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
