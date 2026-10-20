alter table public.application_choices
  drop constraint if exists application_choices_priority_check,
  add constraint application_choices_priority_check
    check (priority >= 1);

alter table public.application_documents
  drop constraint if exists application_documents_file_size_check,
  add constraint application_documents_file_size_check
    check (
      file_size is null
      or (file_size > 0 and file_size <= 26214400)
    );

alter table public.application_documents
  drop constraint if exists application_documents_uploaded_metadata_check,
  add constraint application_documents_uploaded_metadata_check
    check (
      status <> 'UPLOADED'
      or (
        file_url is not null
        and file_name is not null
        and file_size is not null
        and file_size > 0
        and mime_type is not null
        and uploaded_at is not null
      )
    );

alter table public.applications
  drop constraint if exists applications_submitted_at_status_check,
  add constraint applications_submitted_at_status_check
    check (
      status in ('DRAFT', 'ARCHIVED')
      or submitted_at is not null
    );
