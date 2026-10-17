# R05: Owner-only trip archive and restore
Status: Completed
Depends on: P14 and R14 completed
Wave: 18
Owner: Codex coordinator; sequential shared DB/cache/UI contracts.
Owned scope: new forward migration/pgTAP, types/repository/demo, WorkspaceProvider/useWorkspace, GroupPage archive control, TripManager restore list, related tests/styles, README/AGENTS/release0.6.0, canonical record/roadmap/schedule, ignored local UAT evidence.
Produces: Owner archives/restores; archived contents hidden at database/API and UI; data/history retained, restore re-enables access.

## Accepted rules and design
Customer16/10: only owner archive/restore; hide content until restored. Archived trips leave active selector. Only owner sees minimal archived title/time metadata needed for restoration. Itinerary, expenses, participants, checklist and other members' details remain unavailable while archived. Membership rows/history and invitations are retained; pending invitations are hidden and cannot be accepted until restore. No background automation or data deletion.
Preserve one Realtime channel. Archive/restore emits authorized self-membership UPDATE notifications without changing any member data, because the archived trip UPDATE itself is hidden by its new RLS state; clients refetch trip lists and drop active content. Own membership ID/role remains observable, no archived planner data. Demo keeps old storage readable and archived records intact.

## Tasks
- [x] PO/BA: customer choices recorded, affected API/RLS/Realtime paths traced.
- [x] IT: additive archive column, active membership/owner guards, owner archive/list RPCs, hidden invitations and SQL regression tests.
- [x] IT: repository/demo/cache and archive/restore UI with focused tests, small commits.
- [x] UAT/QA: full app/SQL/lint/build/audit; two-account archive/restore and Realtime, hidden API content, data restoration, no-active-trip state, mobile.
- [x] ITS/simplify: scoped authorization/concurrency/sinks/security review; four local simplify passes; correct and retest findings.
- [x] ITO: exact target/remote/migration preflight, production migration before frontend, CI/Pages/public verification.
- [x] PO: release notes and roadmap/checkpoint.

## Acceptance
Editor/outsider/anon cannot archive/restore or list owner archives. Owner cannot bypass optimistic trip version. Archived content is unreadable/uneditable through existing REST and RPCs; pending invitation cannot be accepted/declined while hidden. No deletion of existing rows; restoration restores exact planner content. Active trips unaffected. Realtime sessions hide after archive and restore access after restoration. Minimal owner archive list remains usable with zero active trips.

## Recovery
Forward database repair; never replay old migrations or delete stored trip contents. Revert frontend if required: existing old code lists only active trips due RLS, but cannot restore archives; prefer forward UI correction. Preserve all archived data and memberships. Rehearse on full local Supabase before go-live.

Completed16/10: release0.6.0 at21009573592ef2c948e2514f59d9c5b6f7fcac6b;90 app/201 SQL checks pass, two-account/mobile/zero-active UAT pass. Migration20261016131452 applied, counts unchanged and archived0; CI38908291944/Pages38908291722/public0.6.0 verified. Hosted email/Realtime/real Google remain untested. Worktree retained; executeActive.
