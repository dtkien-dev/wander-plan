# P07: Release prepared website
Status: Completed
Depends on: P01,P02,P03,P04,P05,P06
Wave: 7
Subagent: Not eligible — one writer for production state.
Owned scope: dtkien-dev/wander-plan GitHub main/Pages, Supabase project confirmed against deployment config, package version if needed.
Produces: Live website with matching database contracts.
## Goal
Publish completed functionality per latest user request.
## Context
Prepared HEAD5bed32f; main remote f94f72e. GitHub account dtkien-dev authenticated; Pages deploys on main push. Browser has existing Supabase project dashboard.
## Tasks
- [x] Verify deployed schema and apply only missing forward migrations.
- [x] Publish prepared commits and version metadata through established main deployment.
- [x] Verify CI/Pages and live behavior; record results.
## Intended Logic
Schema before matching frontend. Preserve data; migration only once. Verify remote has not drifted before non-force push.
## Touchpoints
Existing Github repository/Pages and configured Supabase project.
## Verification
New RPC/schema availability, CI/Pages success, live general login copy/title; authenticated existing session read checks where available. No invitation test emails or permanent removal of real records.
## Acceptance Gate
Deployment success confirmed and compatible DB; disclose untested behavior.
## Rollback or Recovery
Revert frontend if needed; forward DB repair, never delete live records or replay old migrations blindly.
## Execution Notes
Released0.2.0 at13583f1; DB004 applied once, RLS/RPC/publication checks passed and business counts preserved. CI and Pages succeeded; live public boot/version/copy verified. Authenticated user session was unavailable; no sign-in emails or real group mutations sent. Worktree retained; no credential/config/protection changes made.
