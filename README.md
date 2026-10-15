# WanderPlan

Collaborative travel planning: create and select trips, build itineraries, manage shared expenses, and invite your group.

## Development

React/TypeScript/Vite, TanStack Query, Supabase Auth/PostgreSQL/RLS; hosted frontend on GitHub Pages.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Use Node 20.19+ or a supported newer LTS for all development tools. Without Supabase configuration, development uses browser-local demo data. `VITE_DEMO_MODE=true` explicitly selects demo even when Supabase variables exist. Demo data is private to that browser; no emails or collaboration. Existing demo data is preserved when first writing the multi-trip storage format.

## Database setup and upgrades

Fresh database: apply migrations once in filename order through `202610150001_require_membership_consent.sql`. Existing databases: inspect applied migration history and apply only missing forward migrations. Do not rerun all historical migrations: earlier functions restore obsolete single-trip/auto-accept behavior. Keep a backup and rehearse upgrades before production.

The `202610150001` security migration removes direct membership INSERT privileges from public API roles. Trip creation and recipient acceptance still create memberships through their authorized RPCs; existing memberships and business data are unchanged. Apply this forward migration to databases already running the `202610140004` contract. Do not restore the old direct INSERT grant when reverting frontend code.

The new `202610140004` migration supports explicit invitation responses, revocation, reserved capacity, and idempotent multi-trip creation. Preserve `202610140003_remove_trip_member.sql` as part of the upgrade chain too. Deploy the new schema before the matching frontend; an older frontend cannot display incoming invitations once automatic claiming is disabled. Coordinate the rollout and verify sign-in, acceptance, revocation, trip selection and expenses before inviting real users.

With Docker Desktop available:

```sh
npm run supabase:start
npm run test:db
npm run supabase:stop
```

Without Docker, an ephemeral embedded PostgreSQL runner applies the unchanged migrations and runs all pgTAP suites:

```sh
npm run test:db:embedded
```

This verifies SQL and RLS with a minimal Supabase identity bootstrap. It does not verify email delivery, Supabase Realtime delivery or concurrent database sessions; those require the full Supabase stack/staging verification.

## Supabase Auth and deployment

Keep Email Auth enabled. Set Site URL and allowed redirect URL to `https://dtkien-dev.github.io/wander-plan/`; also allow the exact local development URL when testing sign-in locally. Copy `.env.example` to `.env.local` and set the project URL and publishable key. Configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` repository variables for GitHub Pages. Never expose a secret/service-role key. Production fails closed if configuration is missing unless demo mode is explicitly enabled.

Users sign in with an email link. Sign-in does not accept invitations. The recipient sees pending invitations and chooses accept or decline after authenticating with the matching email. Existing accepted memberships are preserved. Creating an invitation stores it inside WanderPlan; it does not send an invitation email. The owner shares the website link and asks the recipient to sign in with the invited address. Login-link delivery is handled by Supabase Auth; verify the configured mail sender separately before public use.

Pending invitations reserve places: 3 active members plus 1 pending invitation fill a group of 4. The owner can revoke the pending invitation to free its place. A declined invitation also frees its place. There is no automatic expiry policy in this version.

## Trips and reminders

The trip selector scopes queries, edits and realtime subscriptions to the selected trip; changing trips resets open edit forms. Each new trip has its own membership, itinerary and expenses. Trip creation uses a request key to prevent duplicates on retries.

Dashboard reminders use the trip timezone and show upcoming/ongoing/completed status. Calendar export creates an all-day `.ics` event for the inclusive trip range. Add it to your calendar and configure alerts there; WanderPlan does not send background push or reminder emails.

Excel imports preserve stable ID/version checks, payer and participant data; deleting a spreadsheet row does not delete app data. Expense settlement remains an accounting view, not a payment service.

## Delivery workflow

Plan → code → QA → security review/test → go-live → release notes and next-day plan. A failed QA/security gate returns to code and the affected checks. Record unperformed checks explicitly; deployment alone does not establish a passing result.

Pages calls the shared CI verification workflow before building and deploying. Verification runs lint, application tests, embedded SQL/RLS tests, a dependency audit that blocks high/critical advisories, and a demo build. Only the deploy job receives Pages write/OIDC permissions. Dependency auditing complements the security review of authorization and business logic; it does not replace it.

Before a release, review security results and required migrations, verify the target database/repository, and apply only missing migrations. After deployment, verify the workflow result, live version and affected behavior. Record release results and remaining work under `docs/releases/`.
