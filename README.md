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

Users sign in through an email magic link. The first authenticated user can create the default trip through the `create_default_trip` RPC. Add the other two authenticated users to `trip_members` as `editor` after their first sign-in.

## Quality checks

```bash
npm run lint
npm test
npm run build
```
