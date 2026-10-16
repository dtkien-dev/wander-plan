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

Fresh database: apply all files in `supabase/migrations/` once in filename order. Existing databases: inspect applied migration history and apply only missing forward migrations. Do not rerun all historical migrations: earlier functions restore obsolete single-trip/auto-accept behavior. Keep a backup and rehearse upgrades before production.

The `202610150001` security migration removes direct membership INSERT privileges from public API roles. Trip creation and recipient acceptance still create memberships through their authorized RPCs; existing memberships and business data are unchanged. Apply this forward migration to databases already running the `202610140004` contract. Do not restore the old direct INSERT grant when reverting frontend code.

The `202610160001` migration rejects moving an expense to another trip while any existing participant is not a member of the destination trip, matching the rule already applied when participants are saved. Same-trip edits and existing data are unchanged; apply it once as a forward migration.

The `202610160002` migration adds an optional expense `end_date` for round-trip transport (return date) and stays (check-out date); amounts still count on `expense_date`. It replaces `save_expense_with_participants` with a version that takes a trailing `target_end_date` and updates `import_trip_data`. Apply it before the matching frontend. An older frontend editing a ranged expense clears its end date, so prefer a forward fix over reverting the frontend once ranged expenses exist.

### Existing column error after a manual deployment

`42701: column "revoked_at" already exists` while applying `202610140004` can mean its SQL was applied through SQL Editor but its version is absent from `supabase_migrations.schema_migrations`. Check `npx supabase migration list` against the intended project and compare the entire migration's functions, columns, constraints, policies, triggers and privileges with the deployed database. An existing column alone does not prove the migration is complete.

For the verified WanderPlan production database, the missing history entries were repaired on 15 October 2026 with:

```sh
npx supabase migration repair 202610140004 202610150001 --status applied --project-ref rpwchohopxvqsftrould
npx supabase migration list --project-ref rpwchohopxvqsftrould
npx supabase db push --linked --project-ref rpwchohopxvqsftrould --dry-run --skip-vault
```

These repair commands record already-applied versions without rerunning their SQL. Do not run them against another database unless both migrations are fully verified there. Do not drop existing columns, reset the database, or add only `IF NOT EXISTS` to bypass this error. If a migration was only partly applied, reconcile that difference before marking it applied. Prefer the normal migration runner for future releases; after any manual SQL deployment, verify and reconcile its history before the next push. See the [official migration repair reference](https://supabase.com/docs/reference/cli/supabase-migration-repair).

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

The `202610160004` migration accepts only https Google Maps links in itinerary items (existing rows must already comply; check before applying), removes EXECUTE on application functions from signed-out callers and makes new functions private by default. Grant EXECUTE to `authenticated` explicitly for any new RPC.

### New-account switch and Google sign-in

`config/access.json` holds two switches:

- `allowNewAccounts`: `false` lets only existing accounts and emails with a pending invitation create an account; `true` lets anyone sign up. Supabase enforces it through the `before-user-created` hook (`public.hook_before_user_created`, migration `202610160003`) for both email links and Google. Existing accounts are never blocked.
- `googleSignIn`: shows the "Đăng nhập với Google" button. It does not enable the provider; turn it on only after Google is configured in Supabase.

Changing `allowNewAccounts`: edit the file, commit and push, then apply it to the database (the CLI must be logged in to the project):

```sh
npm run access:apply -- --project-ref rpwchohopxvqsftrould
```

Use `--local` for the local stack. The script prints the stored value; a push alone does not change the database.

One-time project setup by the owner in the Supabase dashboard:

1. Authentication → Auth Hooks → Before User Created → Postgres function `public.hook_before_user_created`. Until this hook is enabled the switch is stored but not enforced.
2. For Google: create an OAuth client (type Web application) in Google Cloud Console with authorized JavaScript origin `https://dtkien-dev.github.io` and authorized redirect URI `https://rpwchohopxvqsftrould.supabase.co/auth/v1/callback`. Then enable Authentication → Providers → Google with its client ID and secret. Keep `https://dtkien-dev.github.io/wander-plan/` in the allowed redirect URLs. Never commit the client secret.

Locally, `supabase/config.toml` enables the same hook. Google stays disabled there unless `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` are set and `enabled` is switched on before `supabase start`.

Pending invitations reserve places: 3 active members plus 1 pending invitation fill a group of 4. The owner can revoke the pending invitation to free its place. A declined invitation also frees its place. There is no automatic expiry policy in this version.

## Trips and reminders

Owners can archive the current trip from **Nhóm → Lưu trữ chuyến này** after confirmation. Archived itinerary, expenses, checklist and invitations are hidden at the API boundary for every member until an owner restores the trip from **Đã lưu trữ** beside the trip selector. Restoration works even when all trips are archived. Only the owner's minimal archived-trip list exposes the title and restoration metadata; members cannot restore. Existing data, memberships and pending invitations are retained.

Apply `20261016131452_trip_archive.sql` before deploying frontend0.6.0: the frontend calls the new archive-list RPC on startup. This additive migration archives no existing trips. Archive/restore requires the current trip version and cannot be bypassed with a direct `archived_at` update. Self-membership updates notify connected members without changing membership values; pending recipients' invitation lists refresh every15 seconds while the page is active because hidden rows cannot deliver their archive event. Offline/disconnected pages can retain previously loaded data; archiving cannot erase prior downloads. For rollback, prefer a forward fix: an older frontend still hides archived trips through RLS but has no restore UI. Do not replay historical migrations or delete archived records.

In **Nhóm**, each member can set their own optional display name (up to 80 characters), shared across all trips. Clearing it shows the email local part. Existing names are retained; a legacy email-as-name is displayed using its local part. Owners cannot change another person's name. Email addresses remain visible only within shared trips through the existing membership checks.

The shared trip checklist is also in **Nhóm**. Every current member can add, edit, check and remove preparation items, with an optional current-member assignee. Removing a member clears their assignments and retains the items. Stale edits/deletions are rejected; reopen the item after refreshing to use its latest version. Checklist data is separate from the itinerary/expense Excel format.

For rollout, apply forward migrations `20261016123926_names_and_checklist.sql`, `20261016124932_authorize_checklist_validation.sql` and `20261016125337_serialize_checklist_writes.sql` before the matching frontend. These add the checklist table/RLS, profile-name RPC and Realtime publication, prevent cross-trip membership probing, and route checklist writes through authorized RPCs with trip-before-item locking (matching member removal). Direct API checklist writes are revoked. Checklist removal uses `deleted_at` updates so trip-filtered Realtime subscribers receive removals while RLS remains enforced. Old demo storage gains an empty checklist on read. A frontend rollback retains the new data; database recovery uses forward migrations.

The trip selector scopes queries, edits and realtime subscriptions to the selected trip; changing trips resets open edit forms. Each new trip has its own membership, itinerary and expenses. Trip creation uses a request key to prevent duplicates on retries.

Dashboard reminders use the trip timezone and show upcoming/ongoing/completed status. Calendar export creates an all-day `.ics` event for the inclusive trip range. Add it to your calendar and configure alerts there; WanderPlan does not send background push or reminder emails.

Excel imports preserve stable ID/version checks, payer and participant data; deleting a spreadsheet row does not delete app data. Expense settlement remains an accounting view, not a payment service.

## Delivery workflow

Plan → code → QA → security review/test → go-live → release notes and next-day plan. A failed QA/security gate returns to code and the affected checks. Record unperformed checks explicitly; deployment alone does not establish a passing result.

Pages calls the shared CI verification workflow before building and deploying. Verification runs lint, application tests, embedded SQL/RLS tests, a dependency audit that blocks high/critical advisories, and a demo build. Only the deploy job receives Pages write/OIDC permissions. Dependency auditing complements the security review of authorization and business logic; it does not replace it.

Before a release, review security results and required migrations, verify the target database/repository, and apply only missing migrations. After deployment, verify the workflow result, live version and affected behavior. Record release results and remaining work under `docs/releases/`.

### Updating GitHub Actions

External actions in `.github/workflows/ci.yml` and `.github/workflows/deploy-pages.yml` use full commit SHAs, with the corresponding release tag in a comment. The local reusable CI workflow stays a local path. The pins identify the reviewed action commits; runner images, downloaded tooling and npm dependencies have their own update mechanisms.

To update a pin:
1. Choose a release from the action's official `github.com/actions/<action>` repository and read its release notes and `action.yml` (including nested actions for composite actions). Do not copy a SHA from a fork.
2. Resolve the release tag in that official repository. For example: `git ls-remote https://github.com/actions/checkout.git 'refs/tags/v6.1.0' 'refs/tags/v6.1.0^{}'`. If an annotated tag has a `^{}` entry, use that peeled commit SHA rather than the tag object's SHA.
3. Replace the full 40-character SHA and version comment in every workflow occurrence. Review any requested input, runtime or permission changes separately; keep verify → build → deploy gates intact.
4. Parse both YAML files, inspect the scoped diff and verify that each SHA belongs to the official action repository. Run the existing CI and Pages workflows and confirm every job succeeds before marking the update complete. Retain the previously verified SHA for rollback.

See [GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions). Pinning these workflow references does not lock every transitive build dependency. This maintenance change needs no database migration or application-version increment.
