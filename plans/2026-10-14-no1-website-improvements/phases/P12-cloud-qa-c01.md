# P12: 16-Oct cloud QA and C01 expense trip reassignment
Status: Completed
Depends on: P11
Wave: 12
Owner: Claude Code (E012); Codex must not edit claimed files until E012 is completed or handed off.
Owned scope: src/lib/supabase.ts dev-only loopback allowance (+test); new migration 202610160001_validate_expense_trip_move.sql; new pgTAP expense_trip_move_test.sql; README rollout note; docs/releases note; bundle records.
## Tasks
- [x] Revalidate git/worktree/remote and bundle.
- [x] C01 failed-before regression (direct UPDATE trip_id with participant absent from destination succeeds).
- [x] Forward migration enforcing existing participant-membership invariant on trip_id change.
- [x] Passed-after regression plus full embedded SQL suite, app tests, lint, build.
- [ ] Cloud QA: NOT PERFORMED (no signed-in session); read-only production checks done.
- [x] Scoped security review.
- [x] Go-live 0.2.4 and approved data correction.
## Intended Logic
Expense participants must be members of the expense's trip (existing rule). When trip_id changes, every existing participant must be a member of the destination trip, else reject with 23514 and the existing message. Same-trip updates unaffected, so preserved history of removed members is not disturbed. Payer/date checks unchanged.
## Verification and Acceptance Gate
Failed-before/passed-after pgTAP; valid move with all participants in destination still succeeds; same-trip update unaffected; all prior 95 SQL assertions pass; 59 app tests/lint/build.
## Recovery
Forward-only: a later migration may drop the trigger/function. No data changes.
