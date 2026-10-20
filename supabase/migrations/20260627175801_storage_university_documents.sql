insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'university-documents',
  'university-documents',
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
    'text/plain'
  ]::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campus_erp_university_documents_insert" on storage.objects;
drop policy if exists "campus_erp_university_documents_select" on storage.objects;

-- MVP policy: bucket-scoped upload/read while the internal ERP auth layer is
-- being built. Tighten this to role/user-scoped policies once Supabase Auth is
-- connected to staff sessions.
create policy "campus_erp_university_documents_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'university-documents');

create policy "campus_erp_university_documents_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'university-documents');
