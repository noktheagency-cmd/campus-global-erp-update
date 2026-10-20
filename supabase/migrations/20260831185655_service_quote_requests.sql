do $$
begin
  if not exists (select 1 from pg_type where typname = 'ServiceQuoteStatus') then
    create type "ServiceQuoteStatus" as enum (
      'PENDING',
      'OFFERED',
      'REJECTED',
      'ACCEPTED',
      'DECLINED',
      'EXPIRED'
    );
  end if;
end $$;

create table if not exists public."service_quote_requests" (
  "id" text not null,
  "code" text not null,
  "service_id" text not null,
  "agent_id" text not null,
  "service_name_snapshot" text not null,
  "quantity" integer not null default 1,
  "request_note" text,
  "status" "ServiceQuoteStatus" not null default 'PENDING',
  "offered_unit_price" decimal(12, 2),
  "offered_currency" varchar(3),
  "staff_response_note" text,
  "offer_valid_until" timestamp(3),
  "reviewed_by" text,
  "reviewed_at" timestamp(3),
  "agent_response_note" text,
  "agent_responded_at" timestamp(3),
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "service_quote_requests_pkey" primary key ("id"),
  constraint "service_quote_requests_code_key" unique ("code"),
  constraint "service_quote_requests_quantity_check"
    check ("quantity" between 1 and 100),
  constraint "service_quote_requests_amount_check"
    check ("offered_unit_price" is null or "offered_unit_price" >= 0),
  constraint "service_quote_requests_currency_check"
    check ("offered_currency" is null or "offered_currency" ~ '^[A-Z]{3}$'),
  constraint "service_quote_requests_response_check"
    check (
      (
        "status" = 'PENDING'
        and "offered_unit_price" is null
        and "offered_currency" is null
        and "reviewed_by" is null
        and "reviewed_at" is null
      )
      or (
        "status" = 'REJECTED'
        and "offered_unit_price" is null
        and "offered_currency" is null
        and "reviewed_at" is not null
        and length(btrim(coalesce("staff_response_note", ''))) > 0
      )
      or (
        "status" in ('OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED')
        and "offered_unit_price" is not null
        and "offered_currency" is not null
        and "reviewed_at" is not null
        and ("status" <> 'EXPIRED' or "offer_valid_until" is not null)
      )
    ),
  constraint "service_quote_requests_agent_response_check"
    check (
      (
        "status" in ('ACCEPTED', 'DECLINED')
        and "agent_responded_at" is not null
        and (
          "status" <> 'DECLINED'
          or length(btrim(coalesce("agent_response_note", ''))) > 0
        )
      )
      or (
        "status" not in ('ACCEPTED', 'DECLINED')
        and "agent_responded_at" is null
      )
    )
);

alter table public."service_quote_requests"
  drop constraint if exists "service_quote_requests_service_id_fkey",
  drop constraint if exists "service_quote_requests_agent_id_fkey",
  drop constraint if exists "service_quote_requests_reviewed_by_fkey",
  drop constraint if exists "service_quote_requests_created_by_fkey";

alter table public."service_quote_requests"
  add constraint "service_quote_requests_service_id_fkey"
    foreign key ("service_id") references public."services"("id")
    on delete restrict on update cascade,
  add constraint "service_quote_requests_agent_id_fkey"
    foreign key ("agent_id") references public."agents"("id")
    on delete restrict on update cascade,
  add constraint "service_quote_requests_reviewed_by_fkey"
    foreign key ("reviewed_by") references public."users"("id")
    on delete set null on update cascade,
  add constraint "service_quote_requests_created_by_fkey"
    foreign key ("created_by") references public."users"("id")
    on delete set null on update cascade;

alter table public."service_orders"
  add column if not exists "quote_request_id" text;

alter table public."service_orders"
  drop constraint if exists "service_orders_quote_request_id_fkey";

alter table public."service_orders"
  add constraint "service_orders_quote_request_id_fkey"
    foreign key ("quote_request_id")
    references public."service_quote_requests"("id")
    on delete restrict on update cascade;

create unique index if not exists "service_orders_quote_request_id_key"
  on public."service_orders"("quote_request_id");

create index if not exists "service_quote_requests_agent_id_created_at_idx"
  on public."service_quote_requests"("agent_id", "created_at");
create index if not exists "service_quote_requests_service_id_created_at_idx"
  on public."service_quote_requests"("service_id", "created_at");
create index if not exists "service_quote_requests_status_created_at_idx"
  on public."service_quote_requests"("status", "created_at");
create index if not exists "service_quote_requests_reviewed_by_idx"
  on public."service_quote_requests"("reviewed_by");
create index if not exists "service_quote_requests_created_by_idx"
  on public."service_quote_requests"("created_by");
create unique index if not exists "service_quote_requests_open_agent_service_key"
  on public."service_quote_requests"("agent_id", "service_id")
  where "status" in ('PENDING', 'OFFERED');

alter table public."service_quote_requests" enable row level security;
revoke all on table public."service_quote_requests" from anon, authenticated;
grant all on table public."service_quote_requests" to service_role;

drop policy if exists "campus_erp_deny_all"
  on public."service_quote_requests";
create policy "campus_erp_deny_all"
  on public."service_quote_requests"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
