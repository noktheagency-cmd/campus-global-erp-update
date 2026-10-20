do $$
begin
  if not exists (select 1 from pg_type where typname = 'ServiceStatus') then
    create type "ServiceStatus" as enum ('ACTIVE', 'INACTIVE', 'ARCHIVED');
  end if;

  if not exists (select 1 from pg_type where typname = 'ServiceAudience') then
    create type "ServiceAudience" as enum ('AGENT', 'STUDENT');
  end if;

  if not exists (select 1 from pg_type where typname = 'ServiceOrderStatus') then
    create type "ServiceOrderStatus" as enum (
      'PENDING',
      'APPROVED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    );
  end if;
end $$;

create table if not exists "services" (
  "id" text not null,
  "name" text not null,
  "description" text,
  "status" "ServiceStatus" not null default 'ACTIVE',
  "available_to_agents" boolean not null default true,
  "available_to_students" boolean not null default true,
  "sort_order" integer not null default 0,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "services_pkey" primary key ("id"),
  constraint "services_name_not_blank_check"
    check (length(btrim("name")) >= 2)
);

create table if not exists "service_prices" (
  "id" text not null,
  "service_id" text not null,
  "audience" "ServiceAudience" not null,
  "agent_id" text,
  "amount" decimal(12, 2) not null,
  "currency" varchar(3) not null,
  "is_active" boolean not null default true,
  "valid_from" timestamp(3) not null default current_timestamp,
  "valid_until" timestamp(3),
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "service_prices_pkey" primary key ("id"),
  constraint "service_prices_amount_check" check ("amount" >= 0),
  constraint "service_prices_currency_check"
    check ("currency" ~ '^[A-Z]{3}$'),
  constraint "service_prices_validity_check"
    check ("valid_until" is null or "valid_until" > "valid_from"),
  constraint "service_prices_agent_scope_check"
    check ("agent_id" is null or "audience" = 'AGENT')
);

create table if not exists "service_orders" (
  "id" text not null,
  "code" text not null,
  "service_id" text not null,
  "price_id" text,
  "buyer_type" "ServiceAudience" not null,
  "agent_id" text,
  "student_id" text,
  "service_name_snapshot" text not null,
  "unit_price" decimal(12, 2) not null,
  "quantity" integer not null default 1,
  "total_amount" decimal(12, 2) not null,
  "currency" varchar(3) not null,
  "status" "ServiceOrderStatus" not null default 'PENDING',
  "customer_note" text,
  "internal_note" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "service_orders_pkey" primary key ("id"),
  constraint "service_orders_code_key" unique ("code"),
  constraint "service_orders_quantity_check"
    check ("quantity" between 1 and 100),
  constraint "service_orders_amount_check"
    check ("unit_price" >= 0 and "total_amount" >= 0),
  constraint "service_orders_total_check"
    check ("total_amount" = "unit_price" * "quantity"),
  constraint "service_orders_currency_check"
    check ("currency" ~ '^[A-Z]{3}$'),
  constraint "service_orders_buyer_check"
    check (
      (
        "buyer_type" = 'AGENT'
        and "agent_id" is not null
        and "student_id" is null
      )
      or (
        "buyer_type" = 'STUDENT'
        and "student_id" is not null
        and "agent_id" is null
      )
    )
);

create index if not exists "services_status_sort_order_idx"
  on "services"("status", "sort_order");
create index if not exists "services_created_by_idx" on "services"("created_by");

create index if not exists "service_prices_service_id_audience_is_active_idx"
  on "service_prices"("service_id", "audience", "is_active");
create index if not exists "service_prices_agent_id_is_active_idx"
  on "service_prices"("agent_id", "is_active");
create index if not exists "service_prices_created_by_idx"
  on "service_prices"("created_by");
create unique index if not exists "service_prices_default_active_key"
  on "service_prices"("service_id", "audience")
  where "is_active" = true and "agent_id" is null;
create unique index if not exists "service_prices_agent_active_key"
  on "service_prices"("service_id", "agent_id")
  where "is_active" = true and "agent_id" is not null;

create index if not exists "service_orders_service_id_idx"
  on "service_orders"("service_id");
create index if not exists "service_orders_price_id_idx"
  on "service_orders"("price_id");
create index if not exists "service_orders_agent_id_created_at_idx"
  on "service_orders"("agent_id", "created_at");
create index if not exists "service_orders_student_id_created_at_idx"
  on "service_orders"("student_id", "created_at");
create index if not exists "service_orders_status_created_at_idx"
  on "service_orders"("status", "created_at");
create index if not exists "service_orders_created_by_idx"
  on "service_orders"("created_by");

alter table "services"
  drop constraint if exists "services_created_by_fkey";
alter table "services"
  add constraint "services_created_by_fkey"
  foreign key ("created_by")
  references "users"("id")
  on delete set null
  on update cascade;

alter table "service_prices"
  drop constraint if exists "service_prices_service_id_fkey",
  drop constraint if exists "service_prices_agent_id_fkey",
  drop constraint if exists "service_prices_created_by_fkey";
alter table "service_prices"
  add constraint "service_prices_service_id_fkey"
  foreign key ("service_id")
  references "services"("id")
  on delete restrict
  on update cascade,
  add constraint "service_prices_agent_id_fkey"
  foreign key ("agent_id")
  references "agents"("id")
  on delete cascade
  on update cascade,
  add constraint "service_prices_created_by_fkey"
  foreign key ("created_by")
  references "users"("id")
  on delete set null
  on update cascade;

alter table "service_orders"
  drop constraint if exists "service_orders_service_id_fkey",
  drop constraint if exists "service_orders_price_id_fkey",
  drop constraint if exists "service_orders_agent_id_fkey",
  drop constraint if exists "service_orders_student_id_fkey",
  drop constraint if exists "service_orders_created_by_fkey";
alter table "service_orders"
  add constraint "service_orders_service_id_fkey"
  foreign key ("service_id")
  references "services"("id")
  on delete restrict
  on update cascade,
  add constraint "service_orders_price_id_fkey"
  foreign key ("price_id")
  references "service_prices"("id")
  on delete set null
  on update cascade,
  add constraint "service_orders_agent_id_fkey"
  foreign key ("agent_id")
  references "agents"("id")
  on delete restrict
  on update cascade,
  add constraint "service_orders_student_id_fkey"
  foreign key ("student_id")
  references "students"("id")
  on delete restrict
  on update cascade,
  add constraint "service_orders_created_by_fkey"
  foreign key ("created_by")
  references "users"("id")
  on delete set null
  on update cascade;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'services',
    'service_prices',
    'service_orders'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format('drop policy if exists "campus_erp_deny_all" on public.%I', table_name);
    execute format(
      'create policy "campus_erp_deny_all" on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;
