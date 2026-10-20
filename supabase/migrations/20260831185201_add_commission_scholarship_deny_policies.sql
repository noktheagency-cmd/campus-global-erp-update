create policy "campus_erp_deny_all"
on public."commission_package_scholarship_awards"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create policy "campus_erp_deny_all"
on public."commission_package_scholarship_award_programs"
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
