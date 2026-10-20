do $$
begin
  if not exists (select 1 from pg_type where typname = 'FinanceAccountType') then
    create type "FinanceAccountType" as enum ('BANK', 'CASH', 'DIGITAL_WALLET');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceAccountStatus') then
    create type "FinanceAccountStatus" as enum ('ACTIVE', 'INACTIVE', 'ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceCategoryType') then
    create type "FinanceCategoryType" as enum ('INCOME', 'EXPENSE');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceTransactionType') then
    create type "FinanceTransactionType" as enum ('INCOME', 'EXPENSE', 'TRANSFER');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceTransactionStatus') then
    create type "FinanceTransactionStatus" as enum ('DRAFT', 'POSTED', 'VOID');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceCounterpartyType') then
    create type "FinanceCounterpartyType" as enum ('STUDENT', 'AGENT', 'UNIVERSITY', 'VENDOR', 'PARTNER', 'OTHER');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceObligationType') then
    create type "FinanceObligationType" as enum ('RECEIVABLE', 'PAYABLE');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceObligationStatus') then
    create type "FinanceObligationStatus" as enum ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceBudgetStatus') then
    create type "FinanceBudgetStatus" as enum ('DRAFT', 'ACTIVE', 'CLOSED');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceAuditAction') then
    create type "FinanceAuditAction" as enum ('CREATED', 'POSTED', 'UPDATED', 'VOIDED', 'SETTLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'FinanceAuditEntityType') then
    create type "FinanceAuditEntityType" as enum ('ACCOUNT', 'CATEGORY', 'TRANSACTION', 'OBLIGATION', 'BUDGET');
  end if;
end $$;

create table if not exists public."finance_accounts" (
  "id" text not null,
  "name" text not null,
  "type" "FinanceAccountType" not null,
  "status" "FinanceAccountStatus" not null default 'ACTIVE',
  "bank_name" text,
  "account_number" text,
  "currency" varchar(3) not null,
  "base_currency" varchar(3) not null default 'AZN',
  "exchange_rate" decimal(18, 8) not null default 1,
  "opening_balance" decimal(14, 2) not null default 0,
  "opening_balance_date" date not null default current_date,
  "notes" text,
  "sort_order" integer not null default 0,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_accounts_pkey" primary key ("id"),
  constraint "finance_accounts_name_not_blank_check" check (length(btrim("name")) >= 2),
  constraint "finance_accounts_currency_check" check ("currency" ~ '^[A-Z]{3}$' and "base_currency" ~ '^[A-Z]{3}$'),
  constraint "finance_accounts_exchange_rate_check" check ("exchange_rate" > 0)
);

create table if not exists public."finance_categories" (
  "id" text not null,
  "name" text not null,
  "type" "FinanceCategoryType" not null,
  "status" "FinanceAccountStatus" not null default 'ACTIVE',
  "is_system" boolean not null default false,
  "sort_order" integer not null default 0,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_categories_pkey" primary key ("id"),
  constraint "finance_categories_type_name_key" unique ("type", "name"),
  constraint "finance_categories_name_not_blank_check" check (length(btrim("name")) >= 2)
);

create table if not exists public."finance_transactions" (
  "id" text not null,
  "code" text not null,
  "type" "FinanceTransactionType" not null,
  "status" "FinanceTransactionStatus" not null default 'POSTED',
  "account_id" text not null,
  "destination_account_id" text,
  "category_id" text,
  "amount" decimal(14, 2) not null,
  "base_amount" decimal(14, 2) not null,
  "base_currency" varchar(3) not null default 'AZN',
  "destination_amount" decimal(14, 2),
  "currency" varchar(3) not null,
  "destination_currency" varchar(3),
  "exchange_rate" decimal(18, 8) not null default 1,
  "effective_at" date not null,
  "counterparty_type" "FinanceCounterpartyType",
  "counterparty_name" text,
  "reference" text,
  "description" text,
  "related_entity_type" "RelatedEntityType",
  "related_entity_id" text,
  "created_by" text,
  "posted_by" text,
  "posted_at" timestamp(3),
  "voided_by" text,
  "voided_at" timestamp(3),
  "void_reason" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_transactions_pkey" primary key ("id"),
  constraint "finance_transactions_code_key" unique ("code"),
  constraint "finance_transactions_amount_check" check ("amount" > 0 and "base_amount" > 0 and "exchange_rate" > 0),
  constraint "finance_transactions_currency_check" check ("currency" ~ '^[A-Z]{3}$' and "base_currency" ~ '^[A-Z]{3}$'),
  constraint "finance_transactions_destination_currency_check" check ("destination_currency" is null or "destination_currency" ~ '^[A-Z]{3}$'),
  constraint "finance_transactions_counterparty_check" check (("counterparty_type" is null) = ("counterparty_name" is null)),
  constraint "finance_transactions_related_entity_check" check (("related_entity_type" is null) = ("related_entity_id" is null)),
  constraint "finance_transactions_posted_check" check (
    ("status" = 'DRAFT' and "posted_at" is null and "voided_at" is null)
    or ("status" = 'POSTED' and "posted_at" is not null and "voided_at" is null)
    or ("status" = 'VOID' and "posted_at" is not null and "voided_at" is not null and length(btrim(coalesce("void_reason", ''))) >= 3)
  ),
  constraint "finance_transactions_shape_check" check (
    (
      "type" = 'TRANSFER'
      and "destination_account_id" is not null
      and "destination_account_id" <> "account_id"
      and "category_id" is null
      and "destination_amount" is not null
      and "destination_amount" > 0
      and "destination_currency" is not null
    )
    or
    (
      "type" in ('INCOME', 'EXPENSE')
      and "destination_account_id" is null
      and "category_id" is not null
      and "destination_amount" is null
      and "destination_currency" is null
    )
  )
);

create table if not exists public."finance_obligations" (
  "id" text not null,
  "code" text not null,
  "type" "FinanceObligationType" not null,
  "status" "FinanceObligationStatus" not null default 'OPEN',
  "category_id" text,
  "amount" decimal(14, 2) not null,
  "base_amount" decimal(14, 2) not null,
  "base_currency" varchar(3) not null default 'AZN',
  "exchange_rate" decimal(18, 8) not null default 1,
  "currency" varchar(3) not null,
  "issue_date" date not null,
  "due_date" date not null,
  "counterparty_type" "FinanceCounterpartyType" not null,
  "counterparty_name" text not null,
  "reference" text,
  "description" text,
  "related_entity_type" "RelatedEntityType",
  "related_entity_id" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_obligations_pkey" primary key ("id"),
  constraint "finance_obligations_code_key" unique ("code"),
  constraint "finance_obligations_amount_check" check ("amount" > 0 and "base_amount" > 0 and "exchange_rate" > 0),
  constraint "finance_obligations_currency_check" check ("currency" ~ '^[A-Z]{3}$' and "base_currency" ~ '^[A-Z]{3}$'),
  constraint "finance_obligations_date_check" check ("due_date" >= "issue_date"),
  constraint "finance_obligations_counterparty_name_check" check (length(btrim("counterparty_name")) >= 2),
  constraint "finance_obligations_related_entity_check" check (("related_entity_type" is null) = ("related_entity_id" is null))
);

create table if not exists public."finance_settlements" (
  "id" text not null,
  "obligation_id" text not null,
  "transaction_id" text not null,
  "amount" decimal(14, 2) not null,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "finance_settlements_pkey" primary key ("id"),
  constraint "finance_settlements_obligation_id_transaction_id_key" unique ("obligation_id", "transaction_id"),
  constraint "finance_settlements_amount_check" check ("amount" > 0)
);

create table if not exists public."finance_budgets" (
  "id" text not null,
  "name" text not null,
  "start_date" date not null,
  "end_date" date not null,
  "currency" varchar(3) not null,
  "status" "FinanceBudgetStatus" not null default 'DRAFT',
  "notes" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_budgets_pkey" primary key ("id"),
  constraint "finance_budgets_name_not_blank_check" check (length(btrim("name")) >= 2),
  constraint "finance_budgets_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "finance_budgets_date_check" check ("end_date" >= "start_date")
);

create table if not exists public."finance_budget_lines" (
  "id" text not null,
  "budget_id" text not null,
  "category_id" text not null,
  "planned_amount" decimal(14, 2) not null,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "finance_budget_lines_pkey" primary key ("id"),
  constraint "finance_budget_lines_budget_id_category_id_key" unique ("budget_id", "category_id"),
  constraint "finance_budget_lines_planned_amount_check" check ("planned_amount" > 0)
);

create table if not exists public."finance_audit_logs" (
  "id" text not null,
  "entity_type" "FinanceAuditEntityType" not null,
  "entity_id" text not null,
  "action" "FinanceAuditAction" not null,
  "old_value" jsonb,
  "new_value" jsonb,
  "user_id" text,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "finance_audit_logs_pkey" primary key ("id")
);

alter table public."finance_accounts"
  add constraint "finance_accounts_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."finance_categories"
  add constraint "finance_categories_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."finance_transactions"
  add constraint "finance_transactions_account_id_fkey" foreign key ("account_id") references public."finance_accounts"("id") on delete restrict on update cascade,
  add constraint "finance_transactions_destination_account_id_fkey" foreign key ("destination_account_id") references public."finance_accounts"("id") on delete restrict on update cascade,
  add constraint "finance_transactions_category_id_fkey" foreign key ("category_id") references public."finance_categories"("id") on delete restrict on update cascade,
  add constraint "finance_transactions_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade,
  add constraint "finance_transactions_posted_by_fkey" foreign key ("posted_by") references public."users"("id") on delete set null on update cascade,
  add constraint "finance_transactions_voided_by_fkey" foreign key ("voided_by") references public."users"("id") on delete set null on update cascade;

alter table public."finance_obligations"
  add constraint "finance_obligations_category_id_fkey" foreign key ("category_id") references public."finance_categories"("id") on delete restrict on update cascade,
  add constraint "finance_obligations_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."finance_settlements"
  add constraint "finance_settlements_obligation_id_fkey" foreign key ("obligation_id") references public."finance_obligations"("id") on delete restrict on update cascade,
  add constraint "finance_settlements_transaction_id_fkey" foreign key ("transaction_id") references public."finance_transactions"("id") on delete restrict on update cascade;

alter table public."finance_budgets"
  add constraint "finance_budgets_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."finance_budget_lines"
  add constraint "finance_budget_lines_budget_id_fkey" foreign key ("budget_id") references public."finance_budgets"("id") on delete cascade on update cascade,
  add constraint "finance_budget_lines_category_id_fkey" foreign key ("category_id") references public."finance_categories"("id") on delete restrict on update cascade;

alter table public."finance_audit_logs"
  add constraint "finance_audit_logs_user_id_fkey" foreign key ("user_id") references public."users"("id") on delete set null on update cascade;

create index if not exists "finance_accounts_status_sort_order_idx" on public."finance_accounts"("status", "sort_order");
create index if not exists "finance_accounts_currency_idx" on public."finance_accounts"("currency");
create index if not exists "finance_accounts_created_by_idx" on public."finance_accounts"("created_by");
create index if not exists "finance_categories_status_type_sort_order_idx" on public."finance_categories"("status", "type", "sort_order");
create index if not exists "finance_categories_created_by_idx" on public."finance_categories"("created_by");
create index if not exists "finance_transactions_status_effective_at_idx" on public."finance_transactions"("status", "effective_at");
create index if not exists "finance_transactions_type_status_effective_at_idx" on public."finance_transactions"("type", "status", "effective_at");
create index if not exists "finance_transactions_account_id_status_effective_at_idx" on public."finance_transactions"("account_id", "status", "effective_at");
create index if not exists "finance_transactions_destination_account_id_status_effective_at_idx" on public."finance_transactions"("destination_account_id", "status", "effective_at");
create index if not exists "finance_transactions_category_id_status_effective_at_idx" on public."finance_transactions"("category_id", "status", "effective_at");
create index if not exists "finance_transactions_counterparty_type_counterparty_name_idx" on public."finance_transactions"("counterparty_type", "counterparty_name");
create index if not exists "finance_transactions_related_entity_type_related_entity_id_idx" on public."finance_transactions"("related_entity_type", "related_entity_id");
create index if not exists "finance_transactions_created_by_idx" on public."finance_transactions"("created_by");
create index if not exists "finance_transactions_posted_by_idx" on public."finance_transactions"("posted_by");
create index if not exists "finance_transactions_voided_by_idx" on public."finance_transactions"("voided_by");
create index if not exists "finance_obligations_type_status_due_date_idx" on public."finance_obligations"("type", "status", "due_date");
create index if not exists "finance_obligations_counterparty_type_counterparty_name_idx" on public."finance_obligations"("counterparty_type", "counterparty_name");
create index if not exists "finance_obligations_category_id_idx" on public."finance_obligations"("category_id");
create index if not exists "finance_obligations_related_entity_type_related_entity_id_idx" on public."finance_obligations"("related_entity_type", "related_entity_id");
create index if not exists "finance_obligations_created_by_idx" on public."finance_obligations"("created_by");
create index if not exists "finance_settlements_transaction_id_idx" on public."finance_settlements"("transaction_id");
create index if not exists "finance_budgets_status_start_date_end_date_idx" on public."finance_budgets"("status", "start_date", "end_date");
create index if not exists "finance_budgets_currency_idx" on public."finance_budgets"("currency");
create index if not exists "finance_budgets_created_by_idx" on public."finance_budgets"("created_by");
create index if not exists "finance_budget_lines_category_id_idx" on public."finance_budget_lines"("category_id");
create index if not exists "finance_audit_logs_entity_type_entity_id_created_at_idx" on public."finance_audit_logs"("entity_type", "entity_id", "created_at");
create index if not exists "finance_audit_logs_user_id_created_at_idx" on public."finance_audit_logs"("user_id", "created_at");
create index if not exists "finance_audit_logs_action_created_at_idx" on public."finance_audit_logs"("action", "created_at");

insert into public."finance_categories" ("id", "name", "type", "status", "is_system", "sort_order", "created_at", "updated_at")
values
  ('fin_cat_income_tuition', 'Təhsil haqqı', 'INCOME', 'ACTIVE', true, 10, current_timestamp, current_timestamp),
  ('fin_cat_income_services', 'Xidmət gəlirləri', 'INCOME', 'ACTIVE', true, 20, current_timestamp, current_timestamp),
  ('fin_cat_income_consulting', 'Konsultasiya gəlirləri', 'INCOME', 'ACTIVE', true, 30, current_timestamp, current_timestamp),
  ('fin_cat_income_other', 'Digər gəlirlər', 'INCOME', 'ACTIVE', true, 90, current_timestamp, current_timestamp),
  ('fin_cat_expense_agent', 'Agent komissiyası', 'EXPENSE', 'ACTIVE', true, 10, current_timestamp, current_timestamp),
  ('fin_cat_expense_university', 'Universitet ödənişləri', 'EXPENSE', 'ACTIVE', true, 20, current_timestamp, current_timestamp),
  ('fin_cat_expense_payroll', 'Əmək haqqı', 'EXPENSE', 'ACTIVE', true, 30, current_timestamp, current_timestamp),
  ('fin_cat_expense_marketing', 'Marketinq', 'EXPENSE', 'ACTIVE', true, 40, current_timestamp, current_timestamp),
  ('fin_cat_expense_operations', 'Əməliyyat xərcləri', 'EXPENSE', 'ACTIVE', true, 50, current_timestamp, current_timestamp),
  ('fin_cat_expense_other', 'Digər xərclər', 'EXPENSE', 'ACTIVE', true, 90, current_timestamp, current_timestamp)
on conflict ("type", "name") do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'finance_accounts',
    'finance_categories',
    'finance_transactions',
    'finance_obligations',
    'finance_settlements',
    'finance_budgets',
    'finance_budget_lines',
    'finance_audit_logs'
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
