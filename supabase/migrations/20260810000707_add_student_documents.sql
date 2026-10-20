create table if not exists public."student_documents" (
  "id" text not null,
  "student_id" text not null,
  "title" text not null,
  "document_type" text not null,
  "file_url" text not null,
  "file_name" text not null,
  "file_size" integer not null,
  "mime_type" text not null,
  "uploaded_by" text,
  "uploaded_at" timestamp(3) not null default current_timestamp,
  "notes" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "student_documents_pkey" primary key ("id"),
  constraint "student_documents_student_id_fkey"
    foreign key ("student_id")
    references public."students"("id")
    on delete cascade
    on update cascade,
  constraint "student_documents_uploaded_by_fkey"
    foreign key ("uploaded_by")
    references public."users"("id")
    on delete set null
    on update cascade
);

create index if not exists "student_documents_student_id_idx"
  on public."student_documents" ("student_id");

create index if not exists "student_documents_uploaded_by_idx"
  on public."student_documents" ("uploaded_by");

create index if not exists "student_documents_document_type_idx"
  on public."student_documents" ("document_type");

alter table public."student_documents" enable row level security;
revoke all on table public."student_documents" from anon, authenticated;
grant all on table public."student_documents" to service_role;

drop policy if exists "campus_erp_deny_all" on public."student_documents";
create policy "campus_erp_deny_all"
on public."student_documents"
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
  'student-documents',
  'student-documents',
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

drop policy if exists "campus_erp_student_documents_insert" on storage.objects;
drop policy if exists "campus_erp_student_documents_select" on storage.objects;
drop policy if exists "campus_erp_student_documents_update" on storage.objects;
drop policy if exists "campus_erp_student_documents_delete" on storage.objects;
