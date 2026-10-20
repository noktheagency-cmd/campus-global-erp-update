-- Campus Global ERP HR core.
-- All records are server-managed through Prisma. Public Data API access stays closed.

create extension if not exists pg_trgm with schema extensions;

create type public."HrEmploymentStatus" as enum (
  'ACTIVE', 'PROBATION', 'ON_LEAVE', 'INACTIVE', 'TERMINATED'
);

create type public."HrEmploymentType" as enum (
  'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'
);

create type public."HrWorkMode" as enum (
  'ONSITE', 'HYBRID', 'REMOTE'
);

create type public."HrAttendanceStatus" as enum (
  'PRESENT', 'LATE', 'REMOTE', 'ABSENT', 'SICK_LEAVE', 'VACATION'
);

create type public."HrLeaveType" as enum (
  'ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'STUDY', 'OTHER'
);

create type public."HrLeaveStatus" as enum (
  'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
);

create type public."HrVacancyStatus" as enum (
  'DRAFT', 'OPEN', 'PAUSED', 'CLOSED'
);

create type public."HrCandidateStage" as enum (
  'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'
);

create type public."HrReviewStatus" as enum (
  'DRAFT', 'IN_PROGRESS', 'COMPLETED'
);

create type public."HrPayrollStatus" as enum (
  'DRAFT', 'APPROVED', 'PAID', 'CANCELLED'
);

create table public."hr_employees" (
  "id" text not null,
  "employee_code" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "email" text not null,
  "phone" text,
  "birth_date" date,
  "department" text not null,
  "position" text not null,
  "manager_id" text,
  "hired_at" date not null,
  "contract_end_date" date,
  "terminated_at" date,
  "employment_status" public."HrEmploymentStatus" not null default 'ACTIVE',
  "employment_type" public."HrEmploymentType" not null default 'FULL_TIME',
  "work_mode" public."HrWorkMode" not null default 'ONSITE',
  "office" text,
  "salary" decimal(14, 2) not null default 0,
  "currency" varchar(3) not null default 'AZN',
  "annual_leave_allowance" integer not null default 21,
  "emergency_contact_name" text,
  "emergency_contact_phone" text,
  "emergency_contact_relation" text,
  "address" text,
  "notes" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_employees_pkey" primary key ("id"),
  constraint "hr_employees_employee_code_key" unique ("employee_code"),
  constraint "hr_employees_email_key" unique ("email"),
  constraint "hr_employees_name_check" check (
    length(btrim("first_name")) >= 2 and length(btrim("last_name")) >= 2
  ),
  constraint "hr_employees_department_position_check" check (
    length(btrim("department")) >= 2 and length(btrim("position")) >= 2
  ),
  constraint "hr_employees_dates_check" check (
    ("contract_end_date" is null or "contract_end_date" >= "hired_at") and
    ("terminated_at" is null or "terminated_at" >= "hired_at")
  ),
  constraint "hr_employees_salary_check" check ("salary" >= 0),
  constraint "hr_employees_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "hr_employees_leave_allowance_check" check (
    "annual_leave_allowance" between 0 and 365
  ),
  constraint "hr_employees_manager_not_self_check" check (
    "manager_id" is null or "manager_id" <> "id"
  ),
  constraint "hr_employees_manager_id_fkey" foreign key ("manager_id")
    references public."hr_employees"("id") on delete set null on update cascade,
  constraint "hr_employees_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_attendance" (
  "id" text not null,
  "employee_id" text not null,
  "work_date" date not null,
  "status" public."HrAttendanceStatus" not null default 'PRESENT',
  "check_in" varchar(5),
  "check_out" varchar(5),
  "note" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_attendance_pkey" primary key ("id"),
  constraint "hr_attendance_employee_id_work_date_key" unique ("employee_id", "work_date"),
  constraint "hr_attendance_check_in_format_check" check (
    "check_in" is null or "check_in" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint "hr_attendance_check_out_format_check" check (
    "check_out" is null or "check_out" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint "hr_attendance_employee_id_fkey" foreign key ("employee_id")
    references public."hr_employees"("id") on delete cascade on update cascade,
  constraint "hr_attendance_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_leave_requests" (
  "id" text not null,
  "code" text not null,
  "employee_id" text not null,
  "type" public."HrLeaveType" not null,
  "start_date" date not null,
  "end_date" date not null,
  "days" decimal(5, 1) not null,
  "reason" text,
  "status" public."HrLeaveStatus" not null default 'PENDING',
  "reviewed_by" text,
  "reviewed_at" timestamp(3),
  "review_note" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_leave_requests_pkey" primary key ("id"),
  constraint "hr_leave_requests_code_key" unique ("code"),
  constraint "hr_leave_requests_date_check" check ("end_date" >= "start_date"),
  constraint "hr_leave_requests_days_check" check ("days" > 0),
  constraint "hr_leave_requests_employee_id_fkey" foreign key ("employee_id")
    references public."hr_employees"("id") on delete cascade on update cascade,
  constraint "hr_leave_requests_reviewed_by_fkey" foreign key ("reviewed_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_vacancies" (
  "id" text not null,
  "code" text not null,
  "title" text not null,
  "department" text not null,
  "location" text,
  "employment_type" public."HrEmploymentType" not null default 'FULL_TIME',
  "work_mode" public."HrWorkMode" not null default 'ONSITE',
  "headcount" integer not null default 1,
  "status" public."HrVacancyStatus" not null default 'DRAFT',
  "description" text,
  "closing_date" date,
  "hiring_manager_id" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_vacancies_pkey" primary key ("id"),
  constraint "hr_vacancies_code_key" unique ("code"),
  constraint "hr_vacancies_title_department_check" check (
    length(btrim("title")) >= 2 and length(btrim("department")) >= 2
  ),
  constraint "hr_vacancies_headcount_check" check ("headcount" between 1 and 100),
  constraint "hr_vacancies_hiring_manager_id_fkey" foreign key ("hiring_manager_id")
    references public."hr_employees"("id") on delete set null on update cascade,
  constraint "hr_vacancies_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_candidates" (
  "id" text not null,
  "vacancy_id" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "email" text not null,
  "phone" text,
  "source" text,
  "stage" public."HrCandidateStage" not null default 'APPLIED',
  "rating" integer not null default 0,
  "expected_salary" decimal(14, 2),
  "currency" varchar(3) not null default 'AZN',
  "applied_at" date not null default current_date,
  "next_interview_at" timestamp(3),
  "notes" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_candidates_pkey" primary key ("id"),
  constraint "hr_candidates_vacancy_id_email_key" unique ("vacancy_id", "email"),
  constraint "hr_candidates_name_check" check (
    length(btrim("first_name")) >= 2 and length(btrim("last_name")) >= 2
  ),
  constraint "hr_candidates_rating_check" check ("rating" between 0 and 5),
  constraint "hr_candidates_expected_salary_check" check (
    "expected_salary" is null or "expected_salary" >= 0
  ),
  constraint "hr_candidates_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "hr_candidates_vacancy_id_fkey" foreign key ("vacancy_id")
    references public."hr_vacancies"("id") on delete cascade on update cascade,
  constraint "hr_candidates_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_performance_reviews" (
  "id" text not null,
  "employee_id" text not null,
  "reviewer_id" text,
  "period_start" date not null,
  "period_end" date not null,
  "status" public."HrReviewStatus" not null default 'DRAFT',
  "score" decimal(3, 2),
  "strengths" text,
  "improvements" text,
  "goals" text,
  "completed_at" timestamp(3),
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_performance_reviews_pkey" primary key ("id"),
  constraint "hr_performance_reviews_period_check" check ("period_end" >= "period_start"),
  constraint "hr_performance_reviews_score_check" check (
    "score" is null or "score" between 0 and 5
  ),
  constraint "hr_performance_reviews_employee_id_fkey" foreign key ("employee_id")
    references public."hr_employees"("id") on delete cascade on update cascade,
  constraint "hr_performance_reviews_reviewer_id_fkey" foreign key ("reviewer_id")
    references public."hr_employees"("id") on delete set null on update cascade,
  constraint "hr_performance_reviews_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_payroll_runs" (
  "id" text not null,
  "code" text not null,
  "period_start" date not null,
  "period_end" date not null,
  "status" public."HrPayrollStatus" not null default 'DRAFT',
  "currency" varchar(3) not null default 'AZN',
  "total_gross" decimal(14, 2) not null default 0,
  "total_bonus" decimal(14, 2) not null default 0,
  "total_deductions" decimal(14, 2) not null default 0,
  "total_net" decimal(14, 2) not null default 0,
  "approved_by" text,
  "approved_at" timestamp(3),
  "paid_at" timestamp(3),
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_payroll_runs_pkey" primary key ("id"),
  constraint "hr_payroll_runs_code_key" unique ("code"),
  constraint "hr_payroll_runs_period_start_period_end_key" unique ("period_start", "period_end"),
  constraint "hr_payroll_runs_period_check" check ("period_end" >= "period_start"),
  constraint "hr_payroll_runs_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "hr_payroll_runs_totals_check" check (
    "total_gross" >= 0 and "total_bonus" >= 0 and
    "total_deductions" >= 0 and "total_net" >= 0
  ),
  constraint "hr_payroll_runs_approved_by_fkey" foreign key ("approved_by")
    references public."users"("id") on delete set null on update cascade,
  constraint "hr_payroll_runs_created_by_fkey" foreign key ("created_by")
    references public."users"("id") on delete set null on update cascade
);

create table public."hr_payroll_items" (
  "id" text not null,
  "payroll_run_id" text not null,
  "employee_id" text not null,
  "base_salary" decimal(14, 2) not null,
  "bonus" decimal(14, 2) not null default 0,
  "deductions" decimal(14, 2) not null default 0,
  "net_salary" decimal(14, 2) not null,
  "currency" varchar(3) not null default 'AZN',
  "note" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "hr_payroll_items_pkey" primary key ("id"),
  constraint "hr_payroll_items_payroll_run_id_employee_id_key" unique ("payroll_run_id", "employee_id"),
  constraint "hr_payroll_items_amounts_check" check (
    "base_salary" >= 0 and "bonus" >= 0 and "deductions" >= 0 and
    "deductions" <= ("base_salary" + "bonus") and
    "net_salary" = ("base_salary" + "bonus" - "deductions")
  ),
  constraint "hr_payroll_items_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "hr_payroll_items_payroll_run_id_fkey" foreign key ("payroll_run_id")
    references public."hr_payroll_runs"("id") on delete cascade on update cascade,
  constraint "hr_payroll_items_employee_id_fkey" foreign key ("employee_id")
    references public."hr_employees"("id") on delete restrict on update cascade
);

create index "hr_employees_employment_status_department_idx"
  on public."hr_employees"("employment_status", "department");
create index "hr_employees_employment_status_name_id_idx"
  on public."hr_employees"("employment_status", "first_name", "last_name", "id");
create index "hr_employees_name_id_idx"
  on public."hr_employees"("first_name", "last_name", "id");
create index "hr_employees_search_trgm_idx"
  on public."hr_employees" using gin (
    "first_name" extensions.gin_trgm_ops,
    "last_name" extensions.gin_trgm_ops,
    "email" extensions.gin_trgm_ops,
    "employee_code" extensions.gin_trgm_ops,
    "position" extensions.gin_trgm_ops,
    "phone" extensions.gin_trgm_ops
  );
create index "hr_employees_manager_id_idx" on public."hr_employees"("manager_id");
create index "hr_employees_hired_at_idx" on public."hr_employees"("hired_at");
create index "hr_employees_created_by_idx" on public."hr_employees"("created_by");
create index "hr_attendance_work_date_status_idx" on public."hr_attendance"("work_date", "status");
create index "hr_attendance_created_by_idx" on public."hr_attendance"("created_by");
create index "hr_leave_requests_status_start_date_created_at_idx"
  on public."hr_leave_requests"("status", "start_date" desc, "created_at" desc);
create index "hr_leave_requests_employee_id_start_date_idx" on public."hr_leave_requests"("employee_id", "start_date");
create index "hr_leave_requests_reviewed_by_idx" on public."hr_leave_requests"("reviewed_by");
create index "hr_vacancies_status_department_idx" on public."hr_vacancies"("status", "department");
create index "hr_vacancies_status_created_at_id_idx"
  on public."hr_vacancies"("status", "created_at" desc, "id");
create index "hr_vacancies_hiring_manager_id_idx" on public."hr_vacancies"("hiring_manager_id");
create index "hr_vacancies_created_by_idx" on public."hr_vacancies"("created_by");
create index "hr_candidates_vacancy_id_stage_applied_at_id_idx"
  on public."hr_candidates"("vacancy_id", "stage", "applied_at" desc, "id");
create index "hr_candidates_next_interview_at_idx" on public."hr_candidates"("next_interview_at");
create index "hr_candidates_created_by_idx" on public."hr_candidates"("created_by");
create index "hr_performance_reviews_employee_id_period_end_idx"
  on public."hr_performance_reviews"("employee_id", "period_end");
create index "hr_performance_reviews_period_end_created_at_id_idx"
  on public."hr_performance_reviews"("period_end" desc, "created_at" desc, "id");
create index "hr_performance_reviews_reviewer_id_status_idx"
  on public."hr_performance_reviews"("reviewer_id", "status");
create index "hr_performance_reviews_created_by_idx"
  on public."hr_performance_reviews"("created_by");
create index "hr_payroll_runs_status_period_end_idx"
  on public."hr_payroll_runs"("status", "period_end");
create index "hr_payroll_runs_period_end_id_idx"
  on public."hr_payroll_runs"("period_end" desc, "id");
create index "hr_payroll_runs_approved_by_idx" on public."hr_payroll_runs"("approved_by");
create index "hr_payroll_runs_created_by_idx" on public."hr_payroll_runs"("created_by");
create index "hr_payroll_items_employee_id_idx" on public."hr_payroll_items"("employee_id");

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_employees',
    'hr_attendance',
    'hr_leave_requests',
    'hr_vacancies',
    'hr_candidates',
    'hr_performance_reviews',
    'hr_payroll_runs',
    'hr_payroll_items'
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

-- Prisma is the private server-only application role for this deployment.
-- It bypasses RLS at the database-role level, so grant only the operations the
-- HR module performs and keep DELETE unavailable to the application.
do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant usage on schema public to prisma;
    foreach table_name in array array[
      'hr_employees',
      'hr_attendance',
      'hr_leave_requests',
      'hr_vacancies',
      'hr_candidates',
      'hr_performance_reviews',
      'hr_payroll_runs',
      'hr_payroll_items'
    ]
    loop
      execute format(
        'grant select, insert, update on table public.%I to prisma',
        table_name
      );
    end loop;
  end if;
end $$;
