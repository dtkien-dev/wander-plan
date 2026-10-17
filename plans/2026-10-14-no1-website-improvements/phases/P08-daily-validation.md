# P08: Daily validation and fixes — 15/10/2026
Status: Completed
Depends on: P07
Wave: 8
Subagent: Security audit read-only lenses only when skill requires; coordinator sole code/record/release writer.
Owned scope: Existing 0.2.0 auth, invitations/capacity, workspace/realtime, trips, expenses/Excel, related UI/tests/migrations; release report/docs.
Produces: Verified QA/security evidence, focused corrections if found, release decision and next-day notes.

## Goal
Apply user workflow: plan → code → QA → security → go-live → feature and next-day notes.
## Context
A005, user asks to start work after agreeing daily schedule. Today is validation/fixes, not early implementation of future backlog features. Base 13583f1 in retained dedicated worktree.
## Tasks
- [x] Revalidate baseline, remote release, critical source/tests and runtime availability.
- [x] Reproduce and correct confirmed in-scope defects with focused regression proof. Copy, consent revocation and QA deployment gate fixed.
- [x] Run QA: focused/integration tests, SQL/RLS, browser demo/mobile and safe live read-only smoke. Baseline passed; authenticated cloud/email/concurrent-service checks unavailable.
- [x] Run security audit/test of critical 0.2.0 flows and fixes; validate findings locally and fix release blockers. Four lenses done; S01 corrected with regression proof.
- [x] Evaluate go-live; publish tested fixes only when required gates pass and current authorization covers target. If no change, record existing release retained. Required unavailable live checks block release, not silently pass.
- [x] Record completed functionality, results, limitations and next-day priority in durable release notes and daily schedule.
## Intended Logic
Preserve trip/expense/Excel data, explicit invitation acceptance, capacity and tenant isolation. Use disposable local fixtures for security proofs. No emails to others, no live test records, credentials or hosting/auth setting changes.
## Verification
Application suites/lint/build; SQL/RLS suites; affected browser interactions at mobile/desktop; auth/realtime/concurrency only passed if actually exercised. Security findings require reachable attack path and local proof where feasible.
## Acceptance Gate
QA/security results and release decision accurately documented. No known blocking defect shipped. Missing external access recorded as blocked check with concrete next action.
## Rollback or Recovery
Keep production unchanged until gates pass; compatible frontend revert or forward DB repair if release needed. Never replay old migrations or delete real records.
## Execution Notes
Initial user checkout main f94f72e has pre-existing .gitignore changes. Reuse clean dedicated worktree at 13583f1; do not reset source checkout. Future dated features remain backlog.

Completed15/10:0.2.1 published, cloud membership INSERT revoked and counts unchanged; CI/Pages verified for code0f2d8af and final notesc82d97b. Live version0.2.1 confirmed. Release-specific gates passed; broader cloud email/realtime/concurrent checks explicitly carried to16/10, not passed. Retained clean worktree.
