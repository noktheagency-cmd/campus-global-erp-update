# Campus Global ERP

Next.js full-stack ERP foundation for Campus Global's study abroad operations.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui `radix-nova`
- next-intl with `az`, `en`, `ru`, `tr`
- Prisma 7 + PostgreSQL schema foundation
- TanStack Query, TanStack Table, React Hook Form, Zod
- Lucide icons, Recharts, Sonner

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/universities`.

## Database

Copy `.env.example` to `.env` and update `DATABASE_URL`.

```bash
npm run db:validate
npm run db:generate
npm run db:migrate
```

The first module scope is `Universities`: profile, campuses, programs, tuition,
periods, documents, contacts, notes, and activity log.
