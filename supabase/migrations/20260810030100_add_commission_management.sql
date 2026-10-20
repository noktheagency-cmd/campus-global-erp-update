-- Applied to the linked production project as migration version 20260810030100.
alter type "RelatedEntityType" add value if not exists 'COMMISSION_CALCULATION';
alter type "AgentNotificationType" add value if not exists 'COMMISSION_UPDATED';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'CommissionAgreementStatus') then
    create type "CommissionAgreementStatus" as enum ('DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionCalculationMethod') then
    create type "CommissionCalculationMethod" as enum ('PERCENTAGE', 'FIXED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionCalculationBasis') then
    create type "CommissionCalculationBasis" as enum ('PAYMENT_AMOUNT');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionInstallmentPolicy') then
    create type "CommissionInstallmentPolicy" as enum ('EVERY_PAYMENT', 'FIRST_PAYMENT_ONLY');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionPaymentStatus') then
    create type "CommissionPaymentStatus" as enum ('POSTED', 'VOID');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionCalculationStatus') then
    create type "CommissionCalculationStatus" as enum ('CALCULATED', 'UNDER_REVIEW', 'PAYABLE', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionAuditAction') then
    create type "CommissionAuditAction" as enum ('CREATED', 'ACTIVATED', 'CALCULATED', 'APPROVED', 'UPDATED', 'PAID', 'VOIDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionAuditEntityType') then
    create type "CommissionAuditEntityType" as enum ('AGREEMENT', 'PAYMENT', 'CALCULATION');
  end if;
end $$;

create table public."commission_agreements" (
  "id" text not null,
  "code" text not null,
  "university_id" text not null,
  "agent_id" text not null,
  "program_id" text,
  "status" "CommissionAgreementStatus" not null default 'DRAFT',
  "calculation_basis" "CommissionCalculationBasis" not null default 'PAYMENT_AMOUNT',
  "currency" varchar(3) not null,
  "campus_method" "CommissionCalculationMethod" not null,
  "campus_value" decimal(14, 4) not null,
  "agent_method" "CommissionCalculationMethod" not null,
  "agent_value" decimal(14, 4) not null,
  "installment_policy" "CommissionInstallmentPolicy" not null default 'EVERY_PAYMENT',
  "payment_term_days" integer not null default 15,
  "valid_from" date not null,
  "valid_until" date not null,
  "document_url" text,
  "document_name" text,
  "notes" text,
  "created_by" text,
  "activated_by" text,
  "activated_at" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_agreements_pkey" primary key ("id"),
  constraint "commission_agreements_code_key" unique ("code"),
  constraint "commission_agreements_code_check" check (length(btrim("code")) >= 5),
  constraint "commission_agreements_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "commission_agreements_date_check" check ("valid_until" >= "valid_from"),
  constraint "commission_agreements_term_check" check ("payment_term_days" between 0 and 365),
  constraint "commission_agreements_value_check" check (
    "campus_value" > 0
    and "agent_value" > 0
    and ("campus_method" <> 'PERCENTAGE' or "campus_value" <= 100)
    and ("agent_method" <> 'PERCENTAGE' or "agent_value" <= 100)
    and (
      "campus_method" <> 'PERCENTAGE'
      or "agent_method" <> 'PERCENTAGE'
      or "campus_value" + "agent_value" <= 100
    )
  ),
  constraint "commission_agreements_activation_check" check (
    ("status" = 'ACTIVE' and "activated_at" is not null)
    or ("status" <> 'ACTIVE')
  ),
  constraint "commission_agreements_document_check" check (("document_url" is null) = ("document_name" is null))
);

create table public."commission_payments" (
  "id" text not null,
  "code" text not null,
  "application_choice_id" text not null,
  "finance_transaction_id" text,
  "amount" decimal(14, 2) not null,
  "base_amount" decimal(14, 2) not null,
  "base_currency" varchar(3) not null default 'AZN',
  "currency" varchar(3) not null,
  "exchange_rate" decimal(18, 8) not null default 1,
  "paid_at" date not null,
  "status" "CommissionPaymentStatus" not null default 'POSTED',
  "reference" text,
  "evidence_url" text,
  "evidence_name" text,
  "notes" text,
  "created_by" text,
  "posted_by" text,
  "posted_at" timestamp(3) not null default current_timestamp,
  "voided_at" timestamp(3),
  "void_reason" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_payments_pkey" primary key ("id"),
  constraint "commission_payments_code_key" unique ("code"),
  constraint "commission_payments_finance_transaction_id_key" unique ("finance_transaction_id"),
  constraint "commission_payments_amount_check" check ("amount" > 0 and "base_amount" > 0 and "exchange_rate" > 0),
  constraint "commission_payments_currency_check" check ("currency" ~ '^[A-Z]{3}$' and "base_currency" ~ '^[A-Z]{3}$'),
  constraint "commission_payments_evidence_check" check (("evidence_url" is null) = ("evidence_name" is null)),
  constraint "commission_payments_status_check" check (
    ("status" = 'POSTED' and "voided_at" is null and "void_reason" is null)
    or ("status" = 'VOID' and "voided_at" is not null and length(btrim(coalesce("void_reason", ''))) >= 3)
  )
);

create table public."commission_calculations" (
  "id" text not null,
  "code" text not null,
  "payment_id" text not null,
  "agreement_id" text not null,
  "application_id" text not null,
  "student_id" text not null,
  "agent_id" text not null,
  "university_id" text not null,
  "status" "CommissionCalculationStatus" not null default 'CALCULATED',
  "basis_amount" decimal(14, 2) not null,
  "base_currency" varchar(3) not null default 'AZN',
  "currency" varchar(3) not null,
  "exchange_rate" decimal(18, 8) not null default 1,
  "campus_method" "CommissionCalculationMethod" not null,
  "campus_value" decimal(14, 4) not null,
  "campus_amount" decimal(14, 2) not null,
  "agent_method" "CommissionCalculationMethod" not null,
  "agent_value" decimal(14, 4) not null,
  "agent_amount" decimal(14, 2) not null,
  "gross_commission_amount" decimal(14, 2) not null,
  "net_tuition_amount" decimal(14, 2) not null,
  "payable_due_date" date not null,
  "university_receivable_id" text,
  "agent_payable_id" text,
  "approved_by" text,
  "approved_at" timestamp(3),
  "notes" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_calculations_pkey" primary key ("id"),
  constraint "commission_calculations_code_key" unique ("code"),
  constraint "commission_calculations_payment_id_key" unique ("payment_id"),
  constraint "commission_calculations_university_receivable_id_key" unique ("university_receivable_id"),
  constraint "commission_calculations_agent_payable_id_key" unique ("agent_payable_id"),
  constraint "commission_calculations_currency_check" check ("currency" ~ '^[A-Z]{3}$' and "base_currency" ~ '^[A-Z]{3}$' and "exchange_rate" > 0),
  constraint "commission_calculations_amounts_check" check (
    "basis_amount" > 0
    and "campus_value" >= 0
    and "agent_value" >= 0
    and "campus_amount" >= 0
    and "agent_amount" >= 0
    and "gross_commission_amount" = "campus_amount" + "agent_amount"
    and "net_tuition_amount" = "basis_amount" - "gross_commission_amount"
    and "net_tuition_amount" >= 0
  ),
  constraint "commission_calculations_approval_check" check (
    ("status" in ('PAYABLE', 'PARTIALLY_PAID', 'PAID') and "approved_at" is not null and "approved_by" is not null)
    or ("status" not in ('PAYABLE', 'PARTIALLY_PAID', 'PAID'))
  ),
  constraint "commission_calculations_finance_check" check (
    ("status" in ('PAYABLE', 'PARTIALLY_PAID', 'PAID') and "university_receivable_id" is not null and "agent_payable_id" is not null)
    or ("status" not in ('PAYABLE', 'PARTIALLY_PAID', 'PAID'))
  )
);

create table public."commission_audit_logs" (
  "id" text not null,
  "entity_type" "CommissionAuditEntityType" not null,
  "entity_id" text not null,
  "action" "CommissionAuditAction" not null,
  "old_value" jsonb,
  "new_value" jsonb,
  "user_id" text,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "commission_audit_logs_pkey" primary key ("id")
);

alter table public."commission_agreements"
  add constraint "commission_agreements_university_id_fkey" foreign key ("university_id") references public."universities"("id") on delete restrict on update cascade,
  add constraint "commission_agreements_agent_id_fkey" foreign key ("agent_id") references public."agents"("id") on delete restrict on update cascade,
  add constraint "commission_agreements_program_id_fkey" foreign key ("program_id") references public."programs"("id") on delete restrict on update cascade,
  add constraint "commission_agreements_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade,
  add constraint "commission_agreements_activated_by_fkey" foreign key ("activated_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_payments"
  add constraint "commission_payments_application_choice_id_fkey" foreign key ("application_choice_id") references public."application_choices"("id") on delete restrict on update cascade,
  add constraint "commission_payments_finance_transaction_id_fkey" foreign key ("finance_transaction_id") references public."finance_transactions"("id") on delete set null on update cascade,
  add constraint "commission_payments_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade,
  add constraint "commission_payments_posted_by_fkey" foreign key ("posted_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_calculations"
  add constraint "commission_calculations_payment_id_fkey" foreign key ("payment_id") references public."commission_payments"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_agreement_id_fkey" foreign key ("agreement_id") references public."commission_agreements"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_application_id_fkey" foreign key ("application_id") references public."applications"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_student_id_fkey" foreign key ("student_id") references public."students"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_agent_id_fkey" foreign key ("agent_id") references public."agents"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_university_id_fkey" foreign key ("university_id") references public."universities"("id") on delete restrict on update cascade,
  add constraint "commission_calculations_university_receivable_id_fkey" foreign key ("university_receivable_id") references public."finance_obligations"("id") on delete set null on update cascade,
  add constraint "commission_calculations_agent_payable_id_fkey" foreign key ("agent_payable_id") references public."finance_obligations"("id") on delete set null on update cascade,
  add constraint "commission_calculations_approved_by_fkey" foreign key ("approved_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_audit_logs"
  add constraint "commission_audit_logs_user_id_fkey" foreign key ("user_id") references public."users"("id") on delete set null on update cascade;

create index "commission_agreements_status_valid_from_valid_until_idx" on public."commission_agreements"("status", "valid_from", "valid_until");
create index "commission_agreements_university_id_agent_id_status_idx" on public."commission_agreements"("university_id", "agent_id", "status");
create index "commission_agreements_agent_id_status_valid_until_idx" on public."commission_agreements"("agent_id", "status", "valid_until");
create index "commission_agreements_program_id_idx" on public."commission_agreements"("program_id");
create index "commission_agreements_created_by_idx" on public."commission_agreements"("created_by");
create index "commission_agreements_activated_by_idx" on public."commission_agreements"("activated_by");
create index "commission_payments_application_choice_id_paid_at_idx" on public."commission_payments"("application_choice_id", "paid_at");
create index "commission_payments_status_paid_at_idx" on public."commission_payments"("status", "paid_at");
create index "commission_payments_created_by_idx" on public."commission_payments"("created_by");
create index "commission_payments_posted_by_idx" on public."commission_payments"("posted_by");
create index "commission_calculations_status_created_at_idx" on public."commission_calculations"("status", "created_at");
create index "commission_calculations_agreement_id_created_at_idx" on public."commission_calculations"("agreement_id", "created_at");
create index "commission_calculations_application_id_idx" on public."commission_calculations"("application_id");
create index "commission_calculations_student_id_created_at_idx" on public."commission_calculations"("student_id", "created_at");
create index "commission_calculations_agent_id_status_created_at_idx" on public."commission_calculations"("agent_id", "status", "created_at");
create index "commission_calculations_university_id_created_at_idx" on public."commission_calculations"("university_id", "created_at");
create index "commission_calculations_approved_by_idx" on public."commission_calculations"("approved_by");
create index "commission_audit_logs_entity_type_entity_id_created_at_idx" on public."commission_audit_logs"("entity_type", "entity_id", "created_at");
create index "commission_audit_logs_user_id_created_at_idx" on public."commission_audit_logs"("user_id", "created_at");
create index "commission_audit_logs_action_created_at_idx" on public."commission_audit_logs"("action", "created_at");

create or replace function public.enforce_commission_agreement_no_overlap()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Serialize overlapping checks for the same agent/university/program scope.
  -- Without this lock, two concurrent ACTIVE inserts can both pass the EXISTS check.
  perform pg_advisory_xact_lock(
    hashtextextended(
      new."university_id" || '|' || new."agent_id" || '|' || coalesce(new."program_id", '*'),
      0
    )
  );

  if new.status = 'ACTIVE' and exists (
    select 1
    from public."commission_agreements" existing
    where existing."id" <> new."id"
      and existing."status" = 'ACTIVE'
      and existing."university_id" = new."university_id"
      and existing."agent_id" = new."agent_id"
      and existing."program_id" is not distinct from new."program_id"
      and daterange(existing."valid_from", existing."valid_until", '[]')
        && daterange(new."valid_from", new."valid_until", '[]')
  ) then
    raise exception using
      errcode = '23P01',
      message = 'commission_agreement_date_overlap';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_commission_agreement_no_overlap() from public, anon, authenticated;

create trigger "commission_agreements_no_overlap"
before insert or update of "status", "university_id", "agent_id", "program_id", "valid_from", "valid_until"
on public."commission_agreements"
for each row execute function public.enforce_commission_agreement_no_overlap();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'commission_agreements',
    'commission_payments',
    'commission_calculations',
    'commission_audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format(
      'create policy "campus_erp_deny_all" on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'commission-documents',
  'commission-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant usage on schema public to prisma;
    foreach table_name in array array[
      'commission_agreements',
      'commission_payments',
      'commission_calculations',
      'commission_audit_logs'
    ]
    loop
      execute format('grant select, insert, update on table public.%I to prisma', table_name);
    end loop;
  end if;
end $$;
