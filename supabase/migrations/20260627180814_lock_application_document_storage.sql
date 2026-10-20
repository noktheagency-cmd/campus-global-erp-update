update storage.buckets
set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array[
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
where id = 'application-documents';

drop policy if exists "campus_erp_application_documents_insert" on storage.objects;
drop policy if exists "campus_erp_application_documents_select" on storage.objects;
drop policy if exists "campus_erp_application_documents_update" on storage.objects;
