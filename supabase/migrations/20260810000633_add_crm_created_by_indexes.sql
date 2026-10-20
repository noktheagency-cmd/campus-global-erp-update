-- Cover the referencing side of CRM creator foreign keys so joins and
-- user-deletion checks do not degrade into sequential scans as data grows.
create index if not exists "crm_profiles_created_by_idx"
  on public."crm_profiles" ("created_by");

create index if not exists "crm_tasks_created_by_idx"
  on public."crm_tasks" ("created_by");
