-- Additive production hardening for installations whose migration history was
-- created before the CRM and extended agent modules. This migration is
-- intentionally idempotent and never drops customer data.

do $$ begin
  create type "AgentSocialPlatform" as enum (
    'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'WEBSITE', 'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "AgentNotificationType" as enum (
    'APPLICATION_CREATED', 'APPLICATION_STATUS', 'DOCUMENT_REQUIRED',
    'DOCUMENT_STATUS', 'STUDENT_CREATED', 'SYSTEM'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmEntityType" as enum ('INDIVIDUAL', 'AGENT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmSource" as enum (
    'WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'REFERRAL',
    'AGENT_REFERRAL', 'EVENT', 'MANUAL', 'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmStage" as enum (
    'NEW_LEAD', 'CONTACTED', 'CONSULTATION', 'DOCUMENT_COLLECTION',
    'APPLICATION', 'OFFER', 'ENROLLED', 'PARTNER_ONBOARDING',
    'ACTIVE_PARTNER', 'WON', 'LOST'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmStatus" as enum ('ACTIVE', 'FOLLOW_UP', 'PAUSED', 'WON', 'LOST');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmTaskStatus" as enum ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmTaskPriority" as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmInteractionType" as enum (
    'CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'APPLICATION', 'DOCUMENT', 'SYSTEM'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "CrmInteractionDirection" as enum ('INBOUND', 'OUTBOUND', 'INTERNAL');
exception when duplicate_object then null;
end $$;

create table if not exists public."agent_social_links" (
  "id" text not null,
  "agent_id" text not null,
  "platform" "AgentSocialPlatform" not null,
  "url" text not null,
  "label" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "agent_social_links_pkey" primary key ("id"),
  constraint "agent_social_links_agent_id_fkey"
    foreign key ("agent_id") references public."agents"("id")
    on delete cascade on update cascade
);

create unique index if not exists "agent_social_links_agent_id_platform_url_key"
  on public."agent_social_links"("agent_id", "platform", "url");
create index if not exists "agent_social_links_agent_id_idx"
  on public."agent_social_links"("agent_id");

create table if not exists public."agent_contacts" (
  "id" text not null,
  "agent_id" text not null,
  "full_name" text not null,
  "position" text,
  "email" text,
  "phone" text,
  "whatsapp" text,
  "is_primary" boolean not null default false,
  "notes" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "agent_contacts_pkey" primary key ("id"),
  constraint "agent_contacts_agent_id_fkey"
    foreign key ("agent_id") references public."agents"("id")
    on delete cascade on update cascade
);

create index if not exists "agent_contacts_agent_id_idx"
  on public."agent_contacts"("agent_id");
create index if not exists "agent_contacts_agent_id_is_primary_idx"
  on public."agent_contacts"("agent_id", "is_primary");
create unique index if not exists "agent_contacts_one_primary_per_agent_idx"
  on public."agent_contacts"("agent_id") where "is_primary" = true;

create table if not exists public."agent_notifications" (
  "id" text not null,
  "agent_id" text not null,
  "type" "AgentNotificationType" not null default 'SYSTEM',
  "title" text not null,
  "message" text not null,
  "action_href" text,
  "entity_type" "RelatedEntityType",
  "entity_id" text,
  "read_at" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "agent_notifications_pkey" primary key ("id"),
  constraint "agent_notifications_agent_id_fkey"
    foreign key ("agent_id") references public."agents"("id")
    on delete cascade on update cascade
);

create index if not exists "agent_notifications_agent_id_created_at_idx"
  on public."agent_notifications"("agent_id", "created_at" desc);
create index if not exists "agent_notifications_agent_id_read_at_created_at_idx"
  on public."agent_notifications"("agent_id", "read_at", "created_at" desc);

create table if not exists public."crm_profiles" (
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
  constraint "crm_profiles_entity_subject_match_check" check (
    ("entity_type" = 'INDIVIDUAL' and "student_id" is not null and "agent_id" is null)
    or
    ("entity_type" = 'AGENT' and "agent_id" is not null and "student_id" is null)
  ),
  constraint "crm_profiles_student_id_fkey"
    foreign key ("student_id") references public."students"("id")
    on delete cascade on update cascade,
  constraint "crm_profiles_agent_id_fkey"
    foreign key ("agent_id") references public."agents"("id")
    on delete cascade on update cascade,
  constraint "crm_profiles_owner_id_fkey"
    foreign key ("owner_id") references public."users"("id")
    on delete set null on update cascade,
  constraint "crm_profiles_created_by_fkey"
    foreign key ("created_by") references public."users"("id")
    on delete set null on update cascade
);

create unique index if not exists "crm_profiles_student_id_key"
  on public."crm_profiles"("student_id");
create unique index if not exists "crm_profiles_agent_id_key"
  on public."crm_profiles"("agent_id");
create index if not exists "crm_profiles_entity_type_status_idx"
  on public."crm_profiles"("entity_type", "status");
create index if not exists "crm_profiles_stage_idx"
  on public."crm_profiles"("stage");
create index if not exists "crm_profiles_source_idx"
  on public."crm_profiles"("source");
create index if not exists "crm_profiles_owner_id_idx"
  on public."crm_profiles"("owner_id");
create index if not exists "crm_profiles_next_follow_up_at_idx"
  on public."crm_profiles"("next_follow_up_at");
create index if not exists "crm_profiles_active_follow_up_idx"
  on public."crm_profiles"("next_follow_up_at")
  where "next_follow_up_at" is not null and "status" in ('ACTIVE', 'FOLLOW_UP');

create table if not exists public."crm_tasks" (
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
    foreign key ("profile_id") references public."crm_profiles"("id")
    on delete cascade on update cascade,
  constraint "crm_tasks_assigned_to_fkey"
    foreign key ("assigned_to") references public."users"("id")
    on delete set null on update cascade,
  constraint "crm_tasks_created_by_fkey"
    foreign key ("created_by") references public."users"("id")
    on delete set null on update cascade
);

create index if not exists "crm_tasks_profile_id_due_at_idx"
  on public."crm_tasks"("profile_id", "due_at");
create index if not exists "crm_tasks_assigned_to_status_due_at_idx"
  on public."crm_tasks"("assigned_to", "status", "due_at");
create index if not exists "crm_tasks_status_due_at_idx"
  on public."crm_tasks"("status", "due_at");
create index if not exists "crm_tasks_open_due_at_idx"
  on public."crm_tasks"("due_at") where "status" in ('TODO', 'IN_PROGRESS');

create table if not exists public."crm_interactions" (
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
    foreign key ("profile_id") references public."crm_profiles"("id")
    on delete cascade on update cascade,
  constraint "crm_interactions_author_id_fkey"
    foreign key ("author_id") references public."users"("id")
    on delete set null on update cascade
);

create index if not exists "crm_interactions_profile_id_occurred_at_idx"
  on public."crm_interactions"("profile_id", "occurred_at" desc);
create index if not exists "crm_interactions_author_id_idx"
  on public."crm_interactions"("author_id");
create index if not exists "crm_interactions_type_occurred_at_idx"
  on public."crm_interactions"("type", "occurred_at" desc);

alter table public."agent_social_links" enable row level security;
alter table public."agent_contacts" enable row level security;
alter table public."agent_notifications" enable row level security;
alter table public."crm_profiles" enable row level security;
alter table public."crm_tasks" enable row level security;
alter table public."crm_interactions" enable row level security;

revoke all on table public."agent_social_links" from anon, authenticated;
revoke all on table public."agent_contacts" from anon, authenticated;
revoke all on table public."agent_notifications" from anon, authenticated;
revoke all on table public."crm_profiles" from anon, authenticated;
revoke all on table public."crm_tasks" from anon, authenticated;
revoke all on table public."crm_interactions" from anon, authenticated;

grant all on table public."agent_social_links" to service_role;
grant all on table public."agent_contacts" to service_role;
grant all on table public."agent_notifications" to service_role;
grant all on table public."crm_profiles" to service_role;
grant all on table public."crm_tasks" to service_role;
grant all on table public."crm_interactions" to service_role;

drop policy if exists "campus_erp_deny_all" on public."agent_social_links";
create policy "campus_erp_deny_all" on public."agent_social_links"
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists "campus_erp_deny_all" on public."agent_contacts";
create policy "campus_erp_deny_all" on public."agent_contacts"
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists "campus_erp_deny_all" on public."agent_notifications";
create policy "campus_erp_deny_all" on public."agent_notifications"
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists "campus_erp_deny_all" on public."crm_profiles";
create policy "campus_erp_deny_all" on public."crm_profiles"
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists "campus_erp_deny_all" on public."crm_tasks";
create policy "campus_erp_deny_all" on public."crm_tasks"
  as restrictive for all to anon, authenticated using (false) with check (false);

drop policy if exists "campus_erp_deny_all" on public."crm_interactions";
create policy "campus_erp_deny_all" on public."crm_interactions"
  as restrictive for all to anon, authenticated using (false) with check (false);
