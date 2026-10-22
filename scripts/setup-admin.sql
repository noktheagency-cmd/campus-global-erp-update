-- Create database
CREATE DATABASE campus_global_erp;

\c campus_global_erp

-- Create admin user with password: admin123
INSERT INTO public.users (
  id,
  email,
  name,
  password_hash,
  role,
  status,
  created_at,
  updated_at
)
VALUES (
  'usr_super_admin',
  'admin@campusglobal.az',
  'Super Admin',
  'scrypt:5b282de8b5910bf729f940edee02f7c7:cd7cdfe5ea90fe98b087e3ac556c4ed0898badd570a01e317d980d175102d552e658aee246de2eb8aa7acacb242e1d8c603129ea2f7304f8a7f5f9d166104436',
  'SUPER_ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();
