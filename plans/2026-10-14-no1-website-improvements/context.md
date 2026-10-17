# Context
Goal: Assess ten feedback items; prioritize work and model/effort. User requested planning, not implementation.

## Verified source baseline
React/TypeScript/Vite, Supabase Auth/Postgres/RLS, GitHub Pages. GroupPage and 202610130003 count active + pending; no revoke. invite_trip_member immediately adds existing auth users; claim_trip_invitations auto-enrols new users in loadWorkspace. Invitation RPC writes DB, no email sending. create_default_trip globally restricts one trip and hard-codes destination/dates; loadWorkspace picks first accessible trip. App eagerly imports pages; Excel libraries already dynamic. staleTime 30s; useWorkspace creates subscriptions per caller and invalidates full workspace. Group CSS already has ellipsis, so user-reported overflow needs viewport reproduction across screens.

## Preserve
Existing trips, itinerary, expense payer/participant history and settlement, Excel IDs/version checks, owner/editor permissions, optimistic concurrency. Forward migrations; no replay of historical migrations for rollback.

## Evidence limits
Public URL fetch failed; no authenticated UI/live database reproduction. Deployed schema may differ. No AGENTS.md found in repository inventory. No behavior tests run during planning.

## Resource strategy
Small verified units, serial by default; checkpoint changed files/tests/next step. Quota differs from context size. No fixed token/5-hour completion promise. Recommendations do not automatically change model.
