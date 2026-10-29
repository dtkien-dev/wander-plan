# P32 — Separate workspace reads and writes

Date: 29/10/2026 (Asia/Saigon). Owner: current agent, serial.
Authorization: customer requests checking and performing refactoring through the repository delivery workflow. Local implementation/verification/commits authorized; publication and production require a concrete current-batch go-live decision.
Baseline: fetched origin/main 9c7a872 (released 0.14.0). Branch: chore/workspace-refactor, isolated worktree.
Status: Implemented locally; QA/ITS complete under A059/E055. Await publication/go-live approval.

## PO / BA scope
Move the existing useWorkspaceMutations implementation intact to its own hook module. Keep useWorkspace/useTripPeople together as read adapters. Update all application imports, test mocks, README architecture routing and AGENTS guidance. No compatibility re-export: all consumers are repository-local.
This makes the read/write boundary explicit without adding an abstraction or changing behavior. Workspace refetch optimization remains deferred: existing E040 evidence shows whole-workspace loads but provides no production latency/data-volume benchmark to justify a query/cache redesign.
Preserve mutation origin identity/trip, singleFlight guards, mounted/identity selection checks, archive cache clearing and refresh-on-error behavior. No repository/RPC/schema/storage/money/authorization/UI changes, dependencies or version bump.

## Acceptance / QA
- Mutation function body identical to baseline; only its module/imports change.
- Every caller/mock resolves the new module; no stale combined-module mutation import.
- Existing provider integration covers late saves, account switches, trip selection and one Realtime channel; existing component tests cover affected actions.
- Focused provider/component/page checks, npm test, lint, demo build, embedded SQL, dependency audit and diff whitespace checks.
- Scoped ITS after QA: review import graph and unchanged account/trip, authorization and data boundaries. Same-agent review, not independent.

## Recovery / release gate
Revert the extraction/import changes as one frontend unit; no DB rollback. No push/merge/deployment or production data writes. Present verified candidate and outstanding checks before asking for go-live approval under docs/agent/workflow.md.

## Results
- PASS: 32 focused tests before/after; 168 total app tests, 353 embedded SQL assertions (27 unchanged migrations), lint, TypeScript/demo build, audit-high (zero findings), final diff whitespace.
- PASS: explicit baseline comparison preserves read bodies, mutation body and its imports; all five application consumers and five test modules updated. Test changes only import/mock routing; existing assertions retained.
- ITS: implementing agent reviewed the scoped diff after QA. Account/trip capture, singleFlight, selection guards, archive cancellation and failure refresh unchanged. No new trust boundary or blocking finding; review is not independent.
- NOT RUN: actual-browser UAT, full Supabase/service concurrency or hosted tests. No UI, query strategy or transport logic changes. No measured performance gain claimed.
- ITO after approval: fetch/reconcile remote and exact reviewed commit; publish branch/PR; require shared CI; merge only after CI; verify Pages and public app plus affected navigation/action dialogs without saving real data. Version retained at 0.14.0 for this internal refactor; identify delivery by commit. No migration or production configuration change required.
- Next: customer publication/go-live decision. Local implementation and documentation commit discoverable via Git log on chore/workspace-refactor.
