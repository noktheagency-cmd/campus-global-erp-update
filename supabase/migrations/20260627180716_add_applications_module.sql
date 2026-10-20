create type "ApplicationStatus" as enum (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'OFFER',
  'REJECTED',
  'ENROLLED',
  'ARCHIVED'
);

create type "ApplicationDocumentStatus" as enum (
  'MISSING',
  'UPLOADED',
  'WAIVED',
  'ARCHIVED'
);

alter type "RelatedEntityType" add value if not exists 'STUDENT';
alter type "RelatedEntityType" add value if not exists 'APPLICATION';
alter type "RelatedEntityType" add value if not exists 'APPLICATION_DOCUMENT';
alter type "ActivityAction" add value if not exists 'SUBMITTED';

create table "students" (
  "id" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "father_name" text,
  "mother_name" text,
  "birth_date" timestamp(3),
  "contact_email" text,
  "login_email" text,
  "phone" text,
  "address" text,
  "passport_no" text,
  "identity_no" text,
  "citizenship" text,
  "gender" text,
  "marital_status" text,
  "photo_url" text,
  "stage" text not null default 'Profile',
  "status" "EntityStatus" not null default 'ACTIVE',
  "portal_status" text not null default 'PENDING',
  "user_id" text,
  "agent_id" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "students_pkey" primary key ("id")
);

create table "applications" (
  "id" text not null,
  "code" text not null,
  "student_id" text not null,
  "agent_id" text,
  "period_id" text not null,
  "country" text not null,
  "education_level_id" text not null,
  "status" "ApplicationStatus" not null default 'DRAFT',
  "submitted_at" timestamp(3),
  "internal_notes" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "applications_pkey" primary key ("id")
);

create table "application_choices" (
  "id" text not null,
  "application_id" text not null,
  "university_id" text not null,
  "program_id" text not null,
  "tuition_id" text,
  "priority" integer not null default 1,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "application_choices_pkey" primary key ("id")
);

create table "application_education_records" (
  "id" text not null,
  "application_id" text not null,
  "record_type" text not null default 'HIGH_SCHOOL',
  "institution_name" text not null,
  "country" text,
  "city" text,
  "start_year" integer,
  "end_year" integer,
  "grading_system" text,
  "average_score" text,
  "is_required" boolean not null default false,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "application_education_records_pkey" primary key ("id")
);

create table "application_exam_records" (
  "id" text not null,
  "application_id" text not null,
  "exam_name" text not null,
  "score" text,
  "max_score" text,
  "exam_date" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "application_exam_records_pkey" primary key ("id")
);

create table "application_documents" (
  "id" text not null,
  "application_id" text not null,
  "document_key" text not null,
  "title" text not null,
  "document_group" text not null,
  "is_required" boolean not null default false,
  "is_recommended" boolean not null default false,
  "status" "ApplicationDocumentStatus" not null default 'MISSING',
  "file_url" text,
  "file_name" text,
  "file_size" integer,
  "mime_type" text,
  "uploaded_by" text,
  "uploaded_at" timestamp(3),
  "notes" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "application_documents_pkey" primary key ("id")
);

create unique index "students_contact_email_key" on "students"("contact_email");
create unique index "students_login_email_key" on "students"("login_email");
create unique index "students_passport_no_key" on "students"("passport_no");
create unique index "students_identity_no_key" on "students"("identity_no");
create unique index "students_user_id_key" on "students"("user_id");
create index "students_agent_id_idx" on "students"("agent_id");
create index "students_citizenship_idx" on "students"("citizenship");
create index "students_status_idx" on "students"("status");
create index "students_stage_idx" on "students"("stage");

create unique index "applications_code_key" on "applications"("code");
create index "applications_student_id_idx" on "applications"("student_id");
create index "applications_agent_id_idx" on "applications"("agent_id");
create index "applications_period_id_idx" on "applications"("period_id");
create index "applications_education_level_id_idx" on "applications"("education_level_id");
create index "applications_country_idx" on "applications"("country");
create index "applications_status_idx" on "applications"("status");
create index "applications_created_at_idx" on "applications"("created_at");

create unique index "application_choices_application_id_program_id_key" on "application_choices"("application_id", "program_id");
create index "application_choices_application_id_idx" on "application_choices"("application_id");
create index "application_choices_university_id_idx" on "application_choices"("university_id");
create index "application_choices_program_id_idx" on "application_choices"("program_id");
create index "application_choices_tuition_id_idx" on "application_choices"("tuition_id");

create index "application_education_records_application_id_idx" on "application_education_records"("application_id");
create index "application_exam_records_application_id_idx" on "application_exam_records"("application_id");

create unique index "application_documents_application_id_document_key_key" on "application_documents"("application_id", "document_key");
create index "application_documents_application_id_idx" on "application_documents"("application_id");
create index "application_documents_uploaded_by_idx" on "application_documents"("uploaded_by");
create index "application_documents_document_key_idx" on "application_documents"("document_key");
create index "application_documents_status_idx" on "application_documents"("status");

alter table "students"
  add constraint "students_user_id_fkey"
    foreign key ("user_id")
    references "users"("id")
    on delete set null
    on update cascade,
  add constraint "students_agent_id_fkey"
    foreign key ("agent_id")
    references "agents"("id")
    on delete set null
    on update cascade,
  add constraint "students_created_by_fkey"
    foreign key ("created_by")
    references "users"("id")
    on delete set null
    on update cascade;

alter table "applications"
  add constraint "applications_student_id_fkey"
    foreign key ("student_id")
    references "students"("id")
    on delete restrict
    on update cascade,
  add constraint "applications_agent_id_fkey"
    foreign key ("agent_id")
    references "agents"("id")
    on delete set null
    on update cascade,
  add constraint "applications_period_id_fkey"
    foreign key ("period_id")
    references "periods"("id")
    on delete restrict
    on update cascade,
  add constraint "applications_education_level_id_fkey"
    foreign key ("education_level_id")
    references "education_levels"("id")
    on delete restrict
    on update cascade,
  add constraint "applications_created_by_fkey"
    foreign key ("created_by")
    references "users"("id")
    on delete set null
    on update cascade;

alter table "application_choices"
  add constraint "application_choices_application_id_fkey"
    foreign key ("application_id")
    references "applications"("id")
    on delete cascade
    on update cascade,
  add constraint "application_choices_university_id_fkey"
    foreign key ("university_id")
    references "universities"("id")
    on delete restrict
    on update cascade,
  add constraint "application_choices_program_id_fkey"
    foreign key ("program_id")
    references "programs"("id")
    on delete restrict
    on update cascade,
  add constraint "application_choices_tuition_id_fkey"
    foreign key ("tuition_id")
    references "program_tuitions"("id")
    on delete set null
    on update cascade;

alter table "application_education_records"
  add constraint "application_education_records_application_id_fkey"
    foreign key ("application_id")
    references "applications"("id")
    on delete cascade
    on update cascade;

alter table "application_exam_records"
  add constraint "application_exam_records_application_id_fkey"
    foreign key ("application_id")
    references "applications"("id")
    on delete cascade
    on update cascade;

alter table "application_documents"
  add constraint "application_documents_application_id_fkey"
    foreign key ("application_id")
    references "applications"("id")
    on delete cascade
    on update cascade,
  add constraint "application_documents_uploaded_by_fkey"
    foreign key ("uploaded_by")
    references "users"("id")
    on delete set null
    on update cascade;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'students',
    'applications',
    'application_choices',
    'application_education_records',
    'application_exam_records',
    'application_documents'
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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'application-documents',
  'application-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campus_erp_application_documents_insert" on storage.objects;
drop policy if exists "campus_erp_application_documents_select" on storage.objects;
drop policy if exists "campus_erp_application_documents_update" on storage.objects;
