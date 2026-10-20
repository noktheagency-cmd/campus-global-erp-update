alter table "applications"
  drop constraint if exists applications_submitted_at_status_check,
  add constraint applications_submitted_at_status_check
  check (
    (
      "status" in (
        'SUBMITTED',
        'INVALID_DOCUMENTS',
        'ACCEPTED',
        'UNDER_REVIEW',
        'OFFER',
        'REJECTED',
        'ENROLLED'
      )
      and "submitted_at" is not null
    )
    or (
      "status" in ('DRAFT', 'ARCHIVED')
      and "submitted_at" is null
    )
  );
