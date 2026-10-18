# P27 — Form validation and local verification

Status: Released 0.12.1 — QA/UAT, independent ITS, go-live A047 and CI/Pages verified, 18/10/2026. Owner: current coordinator.
Depends on: E040 audit, production baseline origin/main 6d019e9 (0.12.0).
Branch: fix/forms-and-local-checks. Resolve .worktrees/forms-and-local-checks from the current clone.

## Scope and acceptance
- Metadata edits save when every saved expense participant has left; payer, amounts, participants and split remain unchanged. New expenses still require a current participant.
- Expense estimate/actual/exact-share and itinerary cost accept whole VND, including non-thousand values; fractional/negative money remains invalid.
- Standard test/lint commands ignore nested worktrees and local artifacts; current application tests remain discoverable.
- No database, dependency, workspace-cache redesign or deferred feature changes.

## Verification
- [x] Regression tests fail before fixes and pass after (three intended failures; 17 focused tests pass).
- [x] Standard app tests (149), lint, demo build and embedded SQL (281) pass; discovery sentinels ignored correctly.
- [x] E042 full-local browser UAT and two independent ITS reviewer lenses passed; hosted not rerun.
- [x] Local implementation committed on purpose branch; resolve latest commit from Git log. Go-live requires current-batch approval.
- [x] Candidate 0.12.1 release note and ITO checklist prepared; local credential fixtures removed and sessions revoked.
- [x] Customer go-live A047, PR #13/main CI and Pages PASS; production 0.12.1 and authenticated read-only form smoke verified under E043. Production write testing not performed.
