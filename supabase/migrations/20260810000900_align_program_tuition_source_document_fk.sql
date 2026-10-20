-- Restore the optional source-document relation expected by the Prisma schema.
-- NOT VALID keeps the initial lock brief; validation runs after the constraint exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.program_tuitions'::regclass
      and conname = 'program_tuitions_source_document_id_fkey'
  ) then
    alter table public.program_tuitions
      add constraint program_tuitions_source_document_id_fkey
      foreign key (source_document_id)
      references public.university_documents(id)
      on update cascade
      on delete set null
      not valid;
  end if;
end
$$;

alter table public.program_tuitions
  validate constraint program_tuitions_source_document_id_fkey;
