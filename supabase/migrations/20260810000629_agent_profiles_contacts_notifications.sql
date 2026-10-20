create type "AgentSocialPlatform" as enum (
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'TIKTOK',
  'YOUTUBE',
  'WEBSITE',
  'OTHER'
);

create type "AgentNotificationType" as enum (
  'APPLICATION_CREATED',
  'APPLICATION_STATUS',
  'DOCUMENT_REQUIRED',
  'DOCUMENT_STATUS',
  'STUDENT_CREATED',
  'SYSTEM'
);

alter table "agents"
  add column "profile_photo_url" text;

create table "agent_social_links" (
  "id" text not null,
  "agent_id" text not null,
  "platform" "AgentSocialPlatform" not null,
  "url" text not null,
  "label" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "agent_social_links_pkey" primary key ("id"),
  constraint "agent_social_links_agent_id_fkey"
    foreign key ("agent_id")
    references "agents"("id")
    on delete cascade
    on update cascade
);

create unique index "agent_social_links_agent_id_platform_url_key"
  on "agent_social_links"("agent_id", "platform", "url");
create index "agent_social_links_agent_id_idx"
  on "agent_social_links"("agent_id");

create table "agent_contacts" (
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
    foreign key ("agent_id")
    references "agents"("id")
    on delete cascade
    on update cascade
);

create index "agent_contacts_agent_id_idx"
  on "agent_contacts"("agent_id");
create index "agent_contacts_agent_id_is_primary_idx"
  on "agent_contacts"("agent_id", "is_primary");
create unique index "agent_contacts_one_primary_per_agent_idx"
  on "agent_contacts"("agent_id")
  where "is_primary" = true;

create table "agent_notifications" (
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
    foreign key ("agent_id")
    references "agents"("id")
    on delete cascade
    on update cascade
);

create index "agent_notifications_agent_id_created_at_idx"
  on "agent_notifications"("agent_id", "created_at" desc);
create index "agent_notifications_agent_id_read_at_created_at_idx"
  on "agent_notifications"("agent_id", "read_at", "created_at" desc);

alter table public."agent_social_links" enable row level security;
alter table public."agent_contacts" enable row level security;
alter table public."agent_notifications" enable row level security;

revoke all on table public."agent_social_links" from anon, authenticated;
revoke all on table public."agent_contacts" from anon, authenticated;
revoke all on table public."agent_notifications" from anon, authenticated;

grant all on table public."agent_social_links" to service_role;
grant all on table public."agent_contacts" to service_role;
grant all on table public."agent_notifications" to service_role;

create policy "campus_erp_deny_all"
on public."agent_social_links"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "campus_erp_deny_all"
on public."agent_contacts"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "campus_erp_deny_all"
on public."agent_notifications"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
