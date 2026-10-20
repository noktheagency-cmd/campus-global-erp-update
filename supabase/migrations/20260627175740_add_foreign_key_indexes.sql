create index "universities_created_by_idx" on public."universities"("created_by");
create index "programs_education_level_id_idx" on public."programs"("education_level_id");
create index "programs_education_language_id_idx" on public."programs"("education_language_id");
create index "program_tuitions_source_document_id_idx" on public."program_tuitions"("source_document_id");
create index "university_documents_uploaded_by_idx" on public."university_documents"("uploaded_by");
create index "university_notes_author_id_idx" on public."university_notes"("author_id");
