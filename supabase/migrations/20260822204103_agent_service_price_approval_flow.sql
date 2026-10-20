do $$
begin
  if not exists (select 1 from pg_type where typname = 'ServiceQuotePurpose') then
    create type "ServiceQuotePurpose" as enum ('ORDER', 'PRICE_OVERRIDE');
  end if;
end $$;

alter table public."service_quote_requests"
  add column if not exists "purpose" "ServiceQuotePurpose" not null default 'ORDER',
  add column if not exists "standard_unit_price" decimal(12, 2),
  add column if not exists "standard_currency" varchar(3);

alter table public."service_quote_requests"
  drop constraint if exists "service_quote_requests_standard_price_check",
  add constraint "service_quote_requests_standard_price_check"
    check (
      (
        "purpose" = 'ORDER'
        and "standard_unit_price" is null
        and "standard_currency" is null
      )
      or (
        "purpose" = 'PRICE_OVERRIDE'
        and "standard_unit_price" is not null
        and "standard_unit_price" >= 0
        and "standard_currency" ~ '^[A-Z]{3}$'
        and "status" in ('OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED')
      )
    );

drop index if exists public."service_quote_requests_open_agent_service_key";
create unique index "service_quote_requests_open_agent_service_purpose_key"
  on public."service_quote_requests"("agent_id", "service_id", "purpose")
  where "status" in ('PENDING', 'OFFERED');

create index if not exists "service_quote_requests_purpose_status_created_at_idx"
  on public."service_quote_requests"("purpose", "status", "created_at");
