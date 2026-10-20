-- Keep public ERP tables closed to Supabase anon/authenticated API clients
-- until staff authentication and role-based RLS are connected.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'activity_logs',
    'campuses',
    'education_languages',
    'education_levels',
    'periods',
    'program_tuitions',
    'programs',
    'universities',
    'university_contacts',
    'university_documents',
    'university_notes',
    'users'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "campus_erp_deny_all" on public.%I', table_name);
    execute format(
      'create policy "campus_erp_deny_all" on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;
