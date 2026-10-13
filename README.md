# WanderPlan

Collaborative travel planner for a small group planning a trip to Đà Lạt.

## Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS 4 pipeline with project-specific CSS tokens/modules
- TanStack Query, React Hook Form, Zod
- Supabase Auth, PostgreSQL and Row Level Security
- GitHub Pages and GitHub Actions

## Local development

```bash
npm install
npm run dev
```

Without environment variables the app uses browser `localStorage` and seeded demo data. Demo changes are private to that browser and are not collaborative.

To run the complete Supabase stack locally with Docker Desktop:

```bash
npm run supabase:start
npm run test:db
```

Supabase Studio is then available at `http://127.0.0.1:54323`. Run `npm run supabase:stop` when the local stack is no longer needed. The project-pinned CLI version is used by every command.

## Connect Supabase

1. Create a Supabase project.
2. For a new project, run these files **once**, in filename order, in the SQL editor:
   - `supabase/migrations/202610130001_initial_schema.sql`
   - `supabase/migrations/202610130002_collaboration_hardening.sql`
   - `supabase/migrations/202610130003_flexible_group_size.sql`
   - `supabase/migrations/202610130004_excel_import.sql`
   - `supabase/migrations/202610140001_expense_splitting.sql`
   - `supabase/migrations/202610140002_repair_trip_owner_membership.sql`
3. Keep Email Auth enabled and set the Site URL/redirect URL to `https://dtkien-dev.github.io/wander-plan/`.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
5. For GitHub Pages, create repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

> Existing project: an error such as `relation "profiles" already exists (SQLSTATE
> 42P07)` means the schema exists but the migration runner does not know that the
> initial migration was applied. Use the current migration files and rerun the full
> `001` → `002` → `003` → `004` → `202610140001` → `202610140002` sequence. The files are repeatable; always run the complete
> sequence so the latest functions, triggers and import RPC are restored.

The publishable key is designed for browser use. Never expose the Supabase secret key or `service_role` key.

Users sign in through an email magic link. The first authenticated user creates the single Đà Lạt trip for 27–30 November 2026 and becomes its owner. From the **Nhóm** screen, the owner can set a group size from 1 to 20 and invite friends by email before or after they first sign in. Pending invitations are claimed automatically when the matching email logs in.

The second migration adds idempotent trip creation, invitations, realtime publication, versioned trip settings and database-level date validation. The third migration makes the group capacity configurable from 1 to 20. The fourth migration adds transactional Excel create/update imports with optimistic version checks. The fifth migration records who paid and the selected participants for each expense, and saves both in one transaction. Exported reports include stable `ID` and `Version` columns so users can edit and import them back safely; deleting a spreadsheet row does not delete application data. Production fails closed when Supabase variables are missing; local demo mode is enabled automatically in development and can be set explicitly with `VITE_DEMO_MODE=true`.

## Quality checks

```bash
npm run lint
npm test
npm run test:db
npm run build
```
