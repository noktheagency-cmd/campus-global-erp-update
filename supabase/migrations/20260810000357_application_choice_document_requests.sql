create type "ApplicationDocumentRequestStatus" as enum (
  'PENDING',
  'ACKNOWLEDGED',
  'COMPLETED',
  'CANCELLED'
);

create type "ApplicationDocumentResponseType" as enum (
  'ACKNOWLEDGEMENT',
  'FILE_UPLOAD',
  'PAYMENT_RECEIPT'
);

alter type "RelatedEntityType"
  add value if not exists 'APPLICATION_DOCUMENT_REQUEST';

create table public."application_document_requests" (
  "id" text not null,
  "application_id" text not null,
  "application_choice_id" text not null,
  "title" text not null,
  "document_type" text not null,
  "instructions" text,
  "response_type" "ApplicationDocumentResponseType" not null default 'ACKNOWLEDGEMENT',
  "status" "ApplicationDocumentRequestStatus" not null default 'PENDING',
  "deadline" timestamp(3) not null,
  "amount" decimal(12, 2),
  "currency" varchar(3),
  "file_url" text not null,
  "file_name" text not null,
  "file_size" integer not null,
  "mime_type" text not null,
  "acknowledged_at" timestamp(3),
  "response_file_url" text,
  "response_file_name" text,
  "response_file_size" integer,
  "response_mime_type" text,
  "response_date" date,
  "response_note" text,
  "responded_by" text,
  "completed_at" timestamp(3),
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,

  constraint "application_document_requests_pkey" primary key ("id"),
  constraint "application_document_requests_application_id_fkey"
    foreign key ("application_id")
    references public."applications"("id")
    on delete cascade
    on update cascade,
  constraint "application_document_requests_application_choice_id_fkey"
    foreign key ("application_choice_id")
    references public."application_choices"("id")
    on delete cascade
    on update cascade,
  constraint "application_document_requests_responded_by_fkey"
    foreign key ("responded_by")
    references public."users"("id")
    on delete set null
    on update cascade,
  constraint "application_document_requests_created_by_fkey"
    foreign key ("created_by")
    references public."users"("id")
    on delete set null
    on update cascade,
  constraint "application_document_requests_payment_fields_check"
    check (
      ("response_type" = 'PAYMENT_RECEIPT' and "currency" is not null)
      or
      ("response_type" <> 'PAYMENT_RECEIPT' and "amount" is null and "currency" is null)
    )
);

create index "application_document_requests_application_id_created_at_idx"
  on public."application_document_requests" ("application_id", "created_at");

create index "application_document_requests_application_choice_id_created_at_idx"
  on public."application_document_requests" ("application_choice_id", "created_at");

create index "application_document_requests_status_deadline_idx"
  on public."application_document_requests" ("status", "deadline");

create index "application_document_requests_created_by_idx"
  on public."application_document_requests" ("created_by");

create index "application_document_requests_responded_by_idx"
  on public."application_document_requests" ("responded_by");

alter table public."application_document_requests" enable row level security;
revoke all on table public."application_document_requests" from anon, authenticated;
grant all on table public."application_document_requests" to service_role;

create policy "campus_erp_deny_all"
on public."application_document_requests"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
