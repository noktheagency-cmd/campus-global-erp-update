alter table public."campuses"
  add column if not exists "notes" text,
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."periods"
  add column if not exists "notes" text,
  alter column "application_start_date" type timestamp(3) using "application_start_date"::timestamp(3),
  alter column "application_deadline" type timestamp(3) using "application_deadline"::timestamp(3),
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."programs"
  add column if not exists "notes" text,
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."university_contacts"
  add column if not exists "position" text,
  add column if not exists "department" text,
  add column if not exists "whatsapp" text,
  drop column if exists "title",
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."university_documents"
  add column if not exists "notes" text,
  alter column "uploaded_at" type timestamp(3) using ("uploaded_at" at time zone 'UTC'),
  alter column "expiry_date" type timestamp(3) using "expiry_date"::timestamp(3),
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."activity_logs"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC');

alter table public."education_languages"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."education_levels"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."program_tuitions"
  alter column "last_updated_at" type timestamp(3) using ("last_updated_at" at time zone 'UTC'),
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."universities"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."university_notes"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');

alter table public."users"
  alter column "created_at" type timestamp(3) using ("created_at" at time zone 'UTC'),
  alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'UTC');
