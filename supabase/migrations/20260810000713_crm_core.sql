create type "CrmEntityType" as enum ('INDIVIDUAL', 'AGENT');

create type "CrmSource" as enum (
  'WEBSITE',
  'INSTAGRAM',
  'FACEBOOK',
  'WHATSAPP',
  'REFERRAL',
  'AGENT_REFERRAL',
  'EVENT',
  'MANUAL',
  'OTHER'
);

create type "CrmStage" as enum (
  'NEW_LEAD',
  'CONTACTED',
  'CONSULTATION',
  'DOCUMENT_COLLECTION',
  'APPLICATION',
  'OFFER',
  'ENROLLED',
  'PARTNER_ONBOARDING',
  'ACTIVE_PARTNER',
  'WON',
  'LOST'
);

create type "CrmStatus" as enum ('ACTIVE', 'FOLLOW_UP', 'PAUSED', 'WON', 'LOST');
create type "CrmTaskStatus" as enum ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
create type "CrmTaskPriority" as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

create type "CrmInteractionType" as enum (
  'CALL',
  'EMAIL',
  'WHATSAPP',
  'MEETING',
  'NOTE',
  'APPLICATION',
  'DOCUMENT',
  'SYSTEM'
);

create type "CrmInteractionDirection" as enum ('INBOUND', 'OUTBOUND', 'INTERNAL');

create table "crm_profiles" (
  "id" text not null,
  "entity_type" "CrmEntityType" not null,
  "student_id" text,
  "agent_id" text,
  "owner_id" text,
  "created_by" text,
  "source" "CrmSource" not null default 'MANUAL',
  "stage" "CrmStage" not null default 'NEW_LEAD',
  "status" "CrmStatus" not null default 'ACTIVE',
  "preferred_destination" text,
  "tags" text[] not null default array[]::text[],
  "last_contact_at" timestamp(3),
  "next_follow_up_at" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "crm_profiles_pkey" primary key ("id"),
  constraint "crm_profiles_exactly_one_subject_check"
    check (num_nonnulls("student_id", "agent_id") = 1),
  constraint "crm_profiles_entity_subject_match_check"
    check (
      ("entity_type" = 'INDIVIDUAL' and "student_id" is not null and "agent_id" is null)
      or
      ("entity_type" = 'AGENT' and "agent_id" is not null and "student_id" is null)
    ),
  constraint "crm_profiles_student_id_fkey"
    foreign key ("student_id") references "students"("id") on delete cascade on update cascade,
  constraint "crm_profiles_agent_id_fkey"
    foreign key ("agent_id") references "agents"("id") on delete cascade on update cascade,
  constraint "crm_profiles_owner_id_fkey"
    foreign key ("owner_id") references "users"("id") on delete set null on update cascade,
  constraint "crm_profiles_created_by_fkey"
    foreign key ("created_by") references "users"("id") on delete set null on update cascade
);

create unique index "crm_profiles_student_id_key" on "crm_profiles"("student_id");
create unique index "crm_profiles_agent_id_key" on "crm_profiles"("agent_id");
create index "crm_profiles_entity_type_status_idx" on "crm_profiles"("entity_type", "status");
create index "crm_profiles_stage_idx" on "crm_profiles"("stage");
create index "crm_profiles_source_idx" on "crm_profiles"("source");
create index "crm_profiles_owner_id_idx" on "crm_profiles"("owner_id");
create index "crm_profiles_next_follow_up_at_idx" on "crm_profiles"("next_follow_up_at");

create table "crm_tasks" (
  "id" text not null,
  "profile_id" text not null,
  "title" text not null,
  "description" text,
  "status" "CrmTaskStatus" not null default 'TODO',
  "priority" "CrmTaskPriority" not null default 'MEDIUM',
  "due_at" timestamp(3) not null,
  "assigned_to" text,
  "created_by" text,
  "completed_at" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "crm_tasks_pkey" primary key ("id"),
  constraint "crm_tasks_profile_id_fkey"
    foreign key ("profile_id") references "crm_profiles"("id") on delete cascade on update cascade,
  constraint "crm_tasks_assigned_to_fkey"
    foreign key ("assigned_to") references "users"("id") on delete set null on update cascade,
  constraint "crm_tasks_created_by_fkey"
    foreign key ("created_by") references "users"("id") on delete set null on update cascade
);

create index "crm_tasks_profile_id_due_at_idx" on "crm_tasks"("profile_id", "due_at");
create index "crm_tasks_assigned_to_status_due_at_idx" on "crm_tasks"("assigned_to", "status", "due_at");
create index "crm_tasks_status_due_at_idx" on "crm_tasks"("status", "due_at");

create table "crm_interactions" (
  "id" text not null,
  "profile_id" text not null,
  "type" "CrmInteractionType" not null,
  "direction" "CrmInteractionDirection" not null default 'INTERNAL',
  "subject" text not null,
  "body" text,
  "author_id" text,
  "occurred_at" timestamp(3) not null default current_timestamp,
  "created_at" timestamp(3) not null default current_timestamp,

  constraint "crm_interactions_pkey" primary key ("id"),
  constraint "crm_interactions_profile_id_fkey"
    foreign key ("profile_id") references "crm_profiles"("id") on delete cascade on update cascade,
  constraint "crm_interactions_author_id_fkey"
    foreign key ("author_id") references "users"("id") on delete set null on update cascade
);

create index "crm_interactions_profile_id_occurred_at_idx" on "crm_interactions"("profile_id", "occurred_at" desc);
create index "crm_interactions_author_id_idx" on "crm_interactions"("author_id");
create index "crm_interactions_type_occurred_at_idx" on "crm_interactions"("type", "occurred_at" desc);

alter table public."crm_profiles" enable row level security;
alter table public."crm_tasks" enable row level security;
alter table public."crm_interactions" enable row level security;

revoke all on table public."crm_profiles" from anon, authenticated;
revoke all on table public."crm_tasks" from anon, authenticated;
revoke all on table public."crm_interactions" from anon, authenticated;

grant all on table public."crm_profiles" to service_role;
grant all on table public."crm_tasks" to service_role;
grant all on table public."crm_interactions" to service_role;

create policy "campus_erp_deny_all"
on public."crm_profiles"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "campus_erp_deny_all"
on public."crm_tasks"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "campus_erp_deny_all"
on public."crm_interactions"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
