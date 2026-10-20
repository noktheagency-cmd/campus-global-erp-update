alter table public."students"
  add column if not exists "password_hash" text;

create index if not exists "students_updated_at_idx"
  on public."students" ("updated_at");

create index if not exists "students_portal_status_idx"
  on public."students" ("portal_status");

create index if not exists "students_login_email_idx"
  on public."students" ("login_email");

alter table public."students"
  drop constraint if exists "students_gender_check",
  add constraint "students_gender_check"
    check ("gender" is null or "gender" in ('Male', 'Female'));

alter table public."students"
  drop constraint if exists "students_marital_status_check",
  add constraint "students_marital_status_check"
    check ("marital_status" is null or "marital_status" in ('Single', 'Married'));

alter table public."students"
  drop constraint if exists "students_portal_status_check",
  add constraint "students_portal_status_check"
    check ("portal_status" in ('READY', 'PENDING'));

alter table public."students" enable row level security;
revoke all on table public."students" from anon, authenticated;
grant all on table public."students" to service_role;

drop policy if exists "campus_erp_deny_all" on public."students";
create policy "campus_erp_deny_all"
on public."students"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'student-photos',
  'student-photos',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campus_erp_student_photos_insert" on storage.objects;
drop policy if exists "campus_erp_student_photos_select" on storage.objects;
drop policy if exists "campus_erp_student_photos_update" on storage.objects;

create policy "campus_erp_student_photos_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'student-photos');

create policy "campus_erp_student_photos_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'student-photos');

create policy "campus_erp_student_photos_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'student-photos')
with check (bucket_id = 'student-photos');

drop policy if exists "campus_erp_application_documents_insert" on storage.objects;
drop policy if exists "campus_erp_application_documents_select" on storage.objects;
drop policy if exists "campus_erp_application_documents_update" on storage.objects;
