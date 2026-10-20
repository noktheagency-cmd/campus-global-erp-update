create type "SupportTicketCategory" as enum (
  'TECHNICAL',
  'PAYMENTS',
  'DOCUMENTS',
  'APPLICATIONS',
  'ACCOUNT_ACCESS',
  'SERVICE',
  'OTHER'
);

create type "SupportTicketPriority" as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type "SupportTicketStatus" as enum ('NEW', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED');
create type "SupportMessageKind" as enum ('PUBLIC_REPLY', 'INTERNAL_NOTE', 'SYSTEM');
create type "SupportActivityAction" as enum (
  'CREATED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'REPLIED',
  'INTERNAL_NOTE_ADDED',
  'ATTACHMENT_ADDED'
);

create table public."support_tickets" (
  "id" text not null,
  "code" text not null,
  "subject" text not null,
  "description" text not null,
  "category" "SupportTicketCategory" not null,
  "priority" "SupportTicketPriority" not null default 'MEDIUM',
  "status" "SupportTicketStatus" not null default 'NEW',
  "related_module" text,
  "requester_id" text not null,
  "requester_name_snapshot" text not null,
  "requester_email_snapshot" text not null,
  "assigned_to" text,
  "first_response_at" timestamp(3),
  "resolved_at" timestamp(3),
  "closed_at" timestamp(3),
  "last_activity_at" timestamp(3) not null default current_timestamp,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "support_tickets_pkey" primary key ("id"),
  constraint "support_tickets_code_key" unique ("code"),
  constraint "support_tickets_requester_id_fkey"
    foreign key ("requester_id") references public."users"("id") on delete restrict on update cascade,
  constraint "support_tickets_assigned_to_fkey"
    foreign key ("assigned_to") references public."users"("id") on delete set null on update cascade
);

create table public."support_ticket_messages" (
  "id" text not null,
  "ticket_id" text not null,
  "author_id" text,
  "kind" "SupportMessageKind" not null default 'PUBLIC_REPLY',
  "body" text not null,
  "created_at" timestamp(3) not null default current_timestamp,

  constraint "support_ticket_messages_pkey" primary key ("id"),
  constraint "support_ticket_messages_ticket_id_fkey"
    foreign key ("ticket_id") references public."support_tickets"("id") on delete cascade on update cascade,
  constraint "support_ticket_messages_author_id_fkey"
    foreign key ("author_id") references public."users"("id") on delete set null on update cascade
);

create table public."support_ticket_attachments" (
  "id" text not null,
  "ticket_id" text not null,
  "message_id" text,
  "uploaded_by" text,
  "file_url" text not null,
  "file_name" text not null,
  "file_size" integer not null,
  "mime_type" text not null,
  "created_at" timestamp(3) not null default current_timestamp,

  constraint "support_ticket_attachments_pkey" primary key ("id"),
  constraint "support_ticket_attachments_ticket_id_fkey"
    foreign key ("ticket_id") references public."support_tickets"("id") on delete cascade on update cascade,
  constraint "support_ticket_attachments_message_id_fkey"
    foreign key ("message_id") references public."support_ticket_messages"("id") on delete set null on update cascade,
  constraint "support_ticket_attachments_uploaded_by_fkey"
    foreign key ("uploaded_by") references public."users"("id") on delete set null on update cascade
);

create table public."support_ticket_activities" (
  "id" text not null,
  "ticket_id" text not null,
  "actor_id" text,
  "action" "SupportActivityAction" not null,
  "detail" text,
  "metadata" jsonb,
  "created_at" timestamp(3) not null default current_timestamp,

  constraint "support_ticket_activities_pkey" primary key ("id"),
  constraint "support_ticket_activities_ticket_id_fkey"
    foreign key ("ticket_id") references public."support_tickets"("id") on delete cascade on update cascade,
  constraint "support_ticket_activities_actor_id_fkey"
    foreign key ("actor_id") references public."users"("id") on delete set null on update cascade
);

create index "support_tickets_requester_id_last_activity_at_idx" on public."support_tickets"("requester_id", "last_activity_at" desc);
create index "support_tickets_assigned_to_status_last_activity_at_idx" on public."support_tickets"("assigned_to", "status", "last_activity_at" desc);
create index "support_tickets_status_priority_last_activity_at_idx" on public."support_tickets"("status", "priority", "last_activity_at" desc);
create index "support_tickets_category_status_idx" on public."support_tickets"("category", "status");
create index "support_ticket_messages_ticket_id_created_at_idx" on public."support_ticket_messages"("ticket_id", "created_at");
create index "support_ticket_messages_author_id_created_at_idx" on public."support_ticket_messages"("author_id", "created_at");
create index "support_ticket_attachments_ticket_id_created_at_idx" on public."support_ticket_attachments"("ticket_id", "created_at");
create index "support_ticket_attachments_message_id_idx" on public."support_ticket_attachments"("message_id");
create index "support_ticket_attachments_uploaded_by_idx" on public."support_ticket_attachments"("uploaded_by");
create index "support_ticket_activities_ticket_id_created_at_idx" on public."support_ticket_activities"("ticket_id", "created_at");
create index "support_ticket_activities_actor_id_created_at_idx" on public."support_ticket_activities"("actor_id", "created_at");

alter table public."support_tickets" enable row level security;
alter table public."support_ticket_messages" enable row level security;
alter table public."support_ticket_attachments" enable row level security;
alter table public."support_ticket_activities" enable row level security;

revoke all on table public."support_tickets" from anon, authenticated;
revoke all on table public."support_ticket_messages" from anon, authenticated;
revoke all on table public."support_ticket_attachments" from anon, authenticated;
revoke all on table public."support_ticket_activities" from anon, authenticated;

grant all on table public."support_tickets" to service_role;
grant all on table public."support_ticket_messages" to service_role;
grant all on table public."support_ticket_attachments" to service_role;
grant all on table public."support_ticket_activities" to service_role;

create policy "campus_erp_deny_all" on public."support_tickets"
as restrictive for all to anon, authenticated using (false) with check (false);
create policy "campus_erp_deny_all" on public."support_ticket_messages"
as restrictive for all to anon, authenticated using (false) with check (false);
create policy "campus_erp_deny_all" on public."support_ticket_attachments"
as restrictive for all to anon, authenticated using (false) with check (false);
create policy "campus_erp_deny_all" on public."support_ticket_activities"
as restrictive for all to anon, authenticated using (false) with check (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campus_erp_support_attachments_insert" on storage.objects;
drop policy if exists "campus_erp_support_attachments_select" on storage.objects;
drop policy if exists "campus_erp_support_attachments_update" on storage.objects;
drop policy if exists "campus_erp_support_attachments_delete" on storage.objects;
