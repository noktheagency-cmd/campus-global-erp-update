<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Campus Global ERP agent guide

This is a Next.js 16 App Router ERP for study abroad operations. Make focused
changes that follow the existing feature patterns; inspect the nearby code
before introducing a new abstraction. `CLAUDE.md` points to this file.

## Project map

- `src/app/[locale]/(workspace)/`: locale aware workspace pages and layouts.
- `src/app/api/`: route handlers; `src/proxy.ts`: locale and initial route handling.
- `src/features/<module>/`: module actions, data access, schemas, types, and UI.
- `src/lib/auth/`: signed cookie sessions and role permissions.
- `src/lib/db.ts`: server side Prisma client; `src/lib/supabase/storage.ts`:
  Supabase Storage access.
- `src/i18n/` and `messages/{az,en,ru,tr}.json`: locale routing and messages.
- `prisma/schema.prisma`: Prisma model and generated client definition.
- `supabase/migrations/`: main SQL migration history, including RLS and storage
  policies. `prisma/migrations/` contains a small older migration history.
- `output/`: generated design and QA images, not application source.

## Implementation rules

- Keep server data access in server components, feature data modules, server
  actions, or route handlers. Add `"use client"` only to interactive UI and do
  not import `@/lib/db`, session code, or service role credentials there.
- Follow a module's existing `schemas.ts`, `actions.ts`, `data.ts`, and
  `components/` structure when extending it. Validate untrusted form and
  request data with Zod before writing to the database.
- Enforce access in every server action and route handler with the appropriate
  `requireSession` / `requirePermission` check from `src/lib/auth/session.ts`.
  Page or layout checks alone do not protect a mutation. For agent and student
  portals, scope records to the session's subject, not only its role.
- Keep privileged Supabase Storage calls and `SUPABASE_SERVICE_ROLE_KEY` on the
  server. Preserve the project's deny by default Data API/RLS posture when
  changing SQL; review grants, policies, and storage access together.
- Use `src/i18n/routing.ts` for locale behavior. When editing translated UI
  copy, update the matching keys in all four message files and check the
  default `az` and prefixed locale routes.
- Reuse existing Tailwind and `src/components/ui/` patterns. Check both desktop
  and mobile layouts for UI changes.

## Database changes

- Inspect the relevant existing SQL migrations and `prisma/schema.prisma`
  before changing a table. Add a new forward SQL migration under
  `supabase/migrations/` for database changes, including indexes, constraints,
  grants, and RLS as applicable; update the Prisma schema to match. Do not
  rewrite applied migrations or assume `prisma migrate dev` covers the
  Supabase SQL history.
- Generate the Prisma client with `npm run db:generate` after model changes.
  `DATABASE_URL` is used at runtime; `prisma.config.ts` prefers `DIRECT_URL`
  for Prisma CLI operations. Never print or commit real environment secrets.
- Review migrations before applying them to any shared or production database.

## Verification

- Run `npm run typecheck` and `npm run lint` for code changes. Run
  `npm run build` for changes to routing, server/client boundaries, or the
  database model when the required environment is available.
- Run `npm run db:validate` for Prisma schema changes. Verify changed UI flows
  and permissions with the relevant roles and locales. There is currently no
  project wide automated test script; add targeted checks when a change needs
  them rather than claiming test coverage that does not exist.
- Report which checks ran and any environment limitation in the final summary.
