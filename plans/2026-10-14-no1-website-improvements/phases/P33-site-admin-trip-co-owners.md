# P33 — Website admin and trip co-owners

Date: 29/10/2026 Asia/Saigon. Owner: current agent. Baseline: fetched origin/main 3591711 (0.14.0); branch feat/site-admin-trip-co-owners, isolated worktree.
Status: released0.15.0 under A062/E058, PR22/7b647fa; production migrations/admin contracts, CI/Pages/public and authenticated read-only UI verified. Docs closeout follows.

## Accepted scope / PO and BA
- Website admin may view and manage every trip, including trips without their membership. Admin is a separate server-managed account capability, not a trip membership or extra occupied seat.
- Any active trip owner may promote an accepted active member to owner. Only the trip creator may demote a co-owner back to member. Creator cannot be demoted; retain at least one owner. Pending invitees/outsiders cannot be promoted. Demotion retains membership, checklist assignments and financial history.
- Co-owners have existing owner trip permissions. Site admin has the same management access across trips, but does not bypass creator-only demotion, payment-recipient confirmation, frozen money, member-removal balances, explicit invitation consent or archive hiding of contents.
- Initial admin account supplied privately by customer. Do not commit its email/ID into migration, config, fixtures, tracker or release records. Prepare controlled bootstrap runbook; execute only at separately approved production go-live.
- Smallest UI: existing trip selector and owner controls for admins, an admin badge, and confirmation dialogs for promote/demote in Group. No new account deletion/ban/configuration feature, generic permissions framework or dependency.

## Touchpoints / IT
Add a forward migration: private admin registry with no public write path, authoritative status RPC, existing RLS/helper/archive contracts extended for admin, trip-locked role-change RPC with expected role and creator/last-owner checks, direct membership UPDATE revoked. Preserve grant discipline and Realtime self-membership events.
Update types/creator metadata, demo and Supabase repositories, originating identity/trip cache mutation hook, Group controls and app badge. Preserve legacy demo defaults. Existing single WorkspaceProvider channel handles changes; do not add subscriptions. README rollout/backup/bootstrap/recovery, agent routing and canonical tracker updated.

## QA / ITS / acceptance
SQL: admin registry/metadata spoof denial, anon/editor/outsider/pending/archive/stale denial, creator/co-owner/admin distinctions, role change races/locks, membership/data/financial preservation, admin active/archived access and owner workflows. Demo/real SDK transport/component/provider tests cover distinct boundaries. Run app tests, lint/build, embedded and full local SQL where available, synthetic browser UAT with owner/co-owner/member/admin and mobile, Realtime and simultaneous role changes.
After QA, security-review skill requires independent read-only parallel review of this multi-file authorization diff; coordinator resolves verified findings before go-live decision. Hosted checks must not be claimed from mocks/embedded SQL.

## Rollout / recovery
Final outcome:175 app tests,389 embedded/full-local SQL, lint/build/TypeScript/audit/advisor and actual two-browser Realtime/mobile/concurrency/cache-revocation QA PASS. Independent ITS closed direct member DELETE bypass and stale queued archive authority through forward20261029122209 (after20261029120247); race reproduced before/after. Both applied once locally. Synthetic bootstrap verified/idempotent/missing/unconfirmed cases PASS. One older trash timing case failed transiently then full reruns passed; unchanged contract, no fix claimed. [Review](../security-review-p33-2026-10-29.md), [candidate/ITO](../../../docs/releases/2026-10-29-0.15.0.md). Resolve candidate commit via branch Git log.
No production migration, admin grant, publication or deployment before current-batch go-live approval. DB contract before frontend; bootstrap only exact privately confirmed account, verify registry and grants without exposing identifiers. Backup first, apply missing forward migration once, verify CI/Pages/live. Frontend rollback retains restrictive role RPC and admin registry; revoke admin registry entry in a reviewed operational change if needed, preserve memberships/business records.
