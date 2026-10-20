do $$
begin
  if not exists (select 1 from pg_type where typname = 'DocumentOrderStatus') then
    create type "DocumentOrderStatus" as enum ('ORDERED', 'IN_PROGRESS', 'PREPARING', 'AT_OFFICE', 'DELIVERED', 'RETURNED');
  end if;
  if not exists (select 1 from pg_type where typname = 'DocumentOrderSource') then
    create type "DocumentOrderSource" as enum ('SYSTEM', 'WHATSAPP', 'PHONE');
  end if;
  if not exists (select 1 from pg_type where typname = 'DocumentOrderPaymentStatus') then
    create type "DocumentOrderPaymentStatus" as enum ('UNPAID', 'PAID');
  end if;
  if not exists (select 1 from pg_type where typname = 'DocumentOrderRecipientType') then
    create type "DocumentOrderRecipientType" as enum ('STUDENT', 'AGENT', 'OTHER');
  end if;
end $$;

create table if not exists public."document_orders" (
  "id" text not null,
  "code" text not null,
  "service_id" text,
  "service_name_snapshot" text not null,
  "source" "DocumentOrderSource" not null default 'SYSTEM',
  "status" "DocumentOrderStatus" not null default 'ORDERED',
  "student_id" text,
  "agent_id" text,
  "external_student_name" text,
  "external_student_surname" text,
  "external_student_passport" text,
  "beneficiary_name" text,
  "beneficiary_surname" text,
  "beneficiary_fin" text,
  "beneficiary_passport" text,
  "manager_id" text,
  "price" decimal(12, 2),
  "currency" varchar(3) not null default 'AZN',
  "payment_status" "DocumentOrderPaymentStatus" not null default 'UNPAID',
  "paid_at" timestamp(3),
  "delivery_date" timestamp(3),
  "delivered_at" timestamp(3),
  "recipient_type" "DocumentOrderRecipientType",
  "recipient_name" text,
  "recipient_surname" text,
  "recipient_fin" text,
  "note" text,
  "created_by" text not null,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "document_orders_pkey" primary key ("id"),
  constraint "document_orders_code_key" unique ("code"),
  constraint "document_orders_code_check" check ("code" ~ '^DOC-[0-9]{4}-[0-9]{6}$'),
  constraint "document_orders_service_name_check" check (length(btrim("service_name_snapshot")) between 2 and 160),
  constraint "document_orders_student_check" check (
    "student_id" is not null
    or (
      length(btrim(coalesce("external_student_name", ''))) >= 2
      and length(btrim(coalesce("external_student_surname", ''))) >= 2
    )
  ),
  constraint "document_orders_price_check" check ("price" is null or "price" >= 0),
  constraint "document_orders_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "document_orders_payment_check" check (
    ("payment_status" = 'UNPAID' and "paid_at" is null)
    or ("payment_status" = 'PAID' and "paid_at" is not null and "price" is not null)
  ),
  constraint "document_orders_delivery_check" check (
    ("status" <> 'DELIVERED' and "delivered_at" is null)
    or (
      "status" = 'DELIVERED'
      and "delivered_at" is not null
      and "recipient_type" is not null
      and length(btrim(coalesce("recipient_name", ''))) >= 2
      and length(btrim(coalesce("recipient_surname", ''))) >= 2
    )
  )
);

create table if not exists public."document_order_status_history" (
  "id" text not null,
  "order_id" text not null,
  "status" "DocumentOrderStatus" not null,
  "note" text,
  "changed_by" text not null,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "document_order_status_history_pkey" primary key ("id")
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'document_orders_service_id_fkey') then
    alter table public."document_orders" add constraint "document_orders_service_id_fkey" foreign key ("service_id") references public."services"("id") on delete set null on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_orders_student_id_fkey') then
    alter table public."document_orders" add constraint "document_orders_student_id_fkey" foreign key ("student_id") references public."students"("id") on delete restrict on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_orders_agent_id_fkey') then
    alter table public."document_orders" add constraint "document_orders_agent_id_fkey" foreign key ("agent_id") references public."agents"("id") on delete set null on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_orders_manager_id_fkey') then
    alter table public."document_orders" add constraint "document_orders_manager_id_fkey" foreign key ("manager_id") references public."users"("id") on delete set null on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_orders_created_by_fkey') then
    alter table public."document_orders" add constraint "document_orders_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete restrict on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_order_status_history_order_id_fkey') then
    alter table public."document_order_status_history" add constraint "document_order_status_history_order_id_fkey" foreign key ("order_id") references public."document_orders"("id") on delete cascade on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'document_order_status_history_changed_by_fkey') then
    alter table public."document_order_status_history" add constraint "document_order_status_history_changed_by_fkey" foreign key ("changed_by") references public."users"("id") on delete restrict on update cascade;
  end if;
end $$;

create index if not exists "document_orders_status_created_at_idx" on public."document_orders"("status", "created_at");
create index if not exists "document_orders_service_id_created_at_idx" on public."document_orders"("service_id", "created_at");
create index if not exists "document_orders_student_id_created_at_idx" on public."document_orders"("student_id", "created_at");
create index if not exists "document_orders_agent_id_created_at_idx" on public."document_orders"("agent_id", "created_at");
create index if not exists "document_orders_manager_id_status_idx" on public."document_orders"("manager_id", "status");
create index if not exists "document_orders_delivery_date_idx" on public."document_orders"("delivery_date");
create index if not exists "document_order_status_history_order_id_created_at_idx" on public."document_order_status_history"("order_id", "created_at");
create index if not exists "document_order_status_history_changed_by_idx" on public."document_order_status_history"("changed_by");

do $$
declare
  table_name text;
begin
  foreach table_name in array array['document_orders', 'document_order_status_history']
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

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant usage on schema public to prisma;
    foreach table_name in array array['document_orders', 'document_order_status_history']
    loop
      execute format('grant select, insert, update, delete on table public.%I to prisma', table_name);
    end loop;
  end if;
end $$;
