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

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/202610130001_initial_schema.sql` in the SQL editor.
3. Keep Email Auth enabled and set the Site URL/redirect URL to `https://dtkien-dev.github.io/wander-plan/`.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
5. For GitHub Pages, create repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

The publishable key is designed for browser use. Never expose the Supabase secret key or `service_role` key.

Users sign in through an email magic link. The first authenticated user creates the single Đà Lạt trip for 27–30 November 2026 and becomes its owner. From the **Nhóm** screen, the owner can invite up to two friends by email before or after they first sign in. Pending invitations are claimed automatically when the matching email logs in.

The second migration adds idempotent trip creation, invitations, realtime publication, versioned trip settings and database-level date validation:

```text
supabase/migrations/202610130002_collaboration_hardening.sql
```

Run migrations in filename order for a new Supabase project. Production fails closed when Supabase variables are missing; local demo mode is enabled automatically in development and can be set explicitly with `VITE_DEMO_MODE=true`.

## Quality checks

```bash
npm run lint
npm test
npm run build
```
