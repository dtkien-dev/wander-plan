# P10: Priority capacity and storage-mode UX
Status: Completed
Depends on: P09
Wave:10
Subagent: Not eligible — small coordinated UI change; QA/security local passes.
Owned scope: GroupPage, styles, AppShell, focused tests and0.2.2 release/metadata; daily plan.
Produces: Accurate capacity guidance, honest storage-mode label, tested patch and revised daily backlog.
## Tasks
- [x] Trace full-group condition, sync badge, translation and runtime monitoring implementation.
- [x] Fix priority1/2 with focused regression and preserved owner/capacity behavior.
- [x] QA application/lint/build, mobile/desktop and pending/no-pending/free/limit states.
- [x] Scoped security and simplify review; preserve DB authorization/tenant contracts.
- [x] Release verified patch under established workflow and document outcome/limits.
- [x] Update daily plan: monitoring and VI/EN as future scope with required decisions.
## Intended Logic
Full is normal information, not an error/live announcement. No suggestion to revoke when pending=0; make increasing capacity discoverable only below20, never allow overcapacity. Storage-mode badge must not claim transport/save success it cannot observe. Actual write errors and successful-save feedback remain authoritative.
## Verification and Acceptance Gate
Regression fails before/passes after; no false suggestion/status claims. Owner-only controls remain, capped20, demo isolated. App checks and scoped security review pass; deployment verified if released. Future monitoring/i18n remain planned, not silently represented as implemented.
## Recovery
Revert compatible frontend if regression; no schema changes. Do not relax membership/security validation.

Completed15/10:0.2.2 at24e8b57 published, CI38743778496/Pages38743778575 success. Fresh public browser meta0.2.2 and login smoke passed; authenticated cloud group view not performed. Daily schedule and release notes include all4 user questions, with1/2 implemented and3/4 planned for17/18-Oct. All code edits in retained dedicated worktree, clean.
