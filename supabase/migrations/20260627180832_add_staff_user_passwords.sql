alter table public."users" add column if not exists "password_hash" text;

insert into public."users" (
  id, email, name, password_hash, role, status, created_at, updated_at
)
values (
  'usr_elnur_camalov',
  'elnur.jamalov@campusglobal.az',
  'Elnur Camalov',
  'scrypt:07111bc6ffc73ede9fa07d3e868fb573:6b8b389a91175db87fcb51dee8c757278fb5e93dd1eb0cc095f1306c8e248cc88ae85083081acfd934ce22780fcdfa3420809f7de35c97b8c885bbd3e72bfbcc',
  'SUPER_ADMIN',
  'ACTIVE',
  now(),
  now()
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();
