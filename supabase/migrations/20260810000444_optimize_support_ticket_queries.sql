create extension if not exists pg_trgm with schema extensions;

create index if not exists support_tickets_last_activity_at_id_idx
  on public.support_tickets (last_activity_at, id);

create index if not exists support_tickets_status_last_activity_at_id_idx
  on public.support_tickets (status, last_activity_at, id);

create index if not exists support_tickets_priority_last_activity_at_id_idx
  on public.support_tickets (priority, last_activity_at, id);

create index if not exists support_tickets_category_last_activity_at_id_idx
  on public.support_tickets (category, last_activity_at, id);

create index if not exists support_tickets_resolved_at_active_idx
  on public.support_tickets (resolved_at)
  where resolved_at is not null;

create index if not exists support_tickets_search_trgm_idx
  on public.support_tickets using gin (
    code extensions.gin_trgm_ops,
    subject extensions.gin_trgm_ops,
    requester_name_snapshot extensions.gin_trgm_ops,
    requester_email_snapshot extensions.gin_trgm_ops
  );
