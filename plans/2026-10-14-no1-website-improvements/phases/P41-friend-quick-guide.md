# P41 — Hướng dẫn nhanh cho thành viên được mời

Status: released · A084/E080 · 2026-11-11 Asia/Saigon
Owner: primary agent
Branch: feat/friend-quick-guide from origin/main 410d6d8 (0.19.0, PR #39 docs closeout).

User approved the proposed scope and authorized implementation on 2026-11-11. Separate go-live approval remains required.
Show a hint beside pending invitations. After joining, show the guide by default for active editor memberships, including existing members who have never closed it. Link to Itinerary, Expenses and Group. Allow closing and reopening. Remember the preference per account and trip in browser storage. Existing invitation acceptance, trip selection and permissions remain the source of truth.

Scope: TripManager, AppShell, guide component, focused tests and tracker. No deployment, schema or dependency changes.

## Result
Local implementation, QA and scoped same-agent review complete. App 210, embedded SQL 406, lint, build, audit-high and mocked Chromium 320/390/1280px passed. Physical devices and full-stack or hosted invitation acceptance remain unverified. Ready for user review and separate go-live approval.

## Release
A084/E080 complete. PR #40 merged e8bee8a. Main CI and Pages passed. Deployed guide and login smoke passed as described in verification. See docs/releases/2026-11-11-friend-quick-guide.md.
