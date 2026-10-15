# Agent Guide

Read `package.json` and `package-lock.json` for current tooling; `README.md` owns setup and upgrade instructions.

- For sign-in/session changes, read `src/providers/AuthProvider.tsx`, `src/pages/LoginPage.tsx`, and their tests. Authentication does not accept trip invitations.
- For who may create accounts or the Google button, read `config/access.json`, `src/lib/accessConfig.ts` and `supabase/migrations/202610160003_new_account_access.sql`. The sign-up hook enforces the switch; a push alone does not apply it — follow the README runbook.
- For routing, read `src/App.tsx` and `src/components/AppShell.tsx`. The account key resets the workspace; the identity/trip key resets route forms. Preserve lazy loading and `src/components/PageErrorBoundary.tsx` recovery.
- For trip selection, queries or realtime, start at `src/providers/WorkspaceProvider.tsx`. It owns the single channel and identity/trip cache keys. Consumers in `src/hooks/useWorkspace.ts` must not add subscriptions. Late writes refresh their originating trip cache; only active-account UI may change selection.
- For persistence, read `src/services/travelRepository.ts` and `src/types.ts`; invitation/trip methods must match the SQL RPC signatures. Preserve legacy demo data when changing browser storage.
- For invitations/capacity/multi-trip creation, read `supabase/migrations/202610140004_invitations_and_trips.sql` and `supabase/tests/database/`. Pending invitations reserve seats; owner revocation/recipient decline free them. Keep authorization and same-trip locking in the database.
- Add forward migrations; apply each missing migration once. Do not rerun historical migrations to restore a new database contract. Read the rollout note in `README.md` before deployment.
- For membership consent, read `supabase/migrations/202610150001_require_membership_consent.sql` and `supabase/tests/database/membership_consent_test.sql`. Public API roles cannot insert memberships directly; preserve the authorized creation/acceptance RPCs.
- For release gates, read `.github/workflows/ci.yml`, `.github/workflows/deploy-pages.yml` and the delivery workflow in `README.md`. Pages must depend on shared verification; dependency auditing does not replace the security review. Keep release outcomes and remaining checks in `docs/releases/`.
- For calendar reminders/export, read `src/lib/tripReminder.ts` and its tests. Trip dates are inclusive; `.ics` end dates are exclusive. Banner/calendar export does not provide background push or email reminders.
- For focused checks, use `npx vitest run <test-file>`. Run `npm test`, `npm run lint`, and `npm run build` for integration. `npm run test:db:embedded` exercises unchanged migrations and pgTAP in ephemeral PostgreSQL; full Supabase tests (`npm run test:db`) are still needed for services/concurrent-session verification.

Do not edit generated `dist/`, dependency directories or ignored browser screenshots in `.artifacts/`. Never print private environment values or commit service-role credentials.
