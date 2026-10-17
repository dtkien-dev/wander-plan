# P14: Display names and shared preparation checklist
Status: Completed
Depends on: P13; E015 security hardening completed
Wave: 16
Owner: Codex coordinator (E016); sequential execution, shared persistence contracts.
Owned scope: profiles/name RPC and checklist forward migration + SQL tests; types/repository/demo/cache; GroupPage own-name form; checklist component in GroupPage; affected tests/styles; README/AGENTS/release/version; canonical tracker and roadmap/schedule.
Produces: Optional global self-managed display name and per-trip shared checklist with optional active-member assignee, persistence and Realtime.

## Accepted behavior
R09: each user edits own name only; optional and global across trips; empty name falls back to email local part; other members' emails remain limited to shared trips. Preserve existing legitimate names; normalize legacy email-as-name fallback without overwriting a chosen name.
R04: all current members can add/edit/delete/check items and optionally assign a current trip member. Removed assignees must not prevent other members from editing/unassigning existing items. Trip isolation enforced in database; stale edits rejected using existing version convention. Checklist does not enter existing itinerary/expense Excel contracts.

## Tasks
- [x] PO/BA: adopt A014 rules, inspect handoff, define scope and criteria.
- [x] IT: migration/pgTAP and profile + checklist data/UI with focused checks and incremental commits.
- [x] UAT/QA: full application/SQL checks; two sessions, persistence, trip isolation, stale edits, desktop/mobile.
- [x] ITS: scoped security review after QA, fix and retest any confirmed issue; simplify full session diff.
- [x] ITO: revalidate remote/config/history; apply only new forward migration before frontend; release and verify CI/Pages/public version.
- [x] PO: release notes, remaining QA limits and roadmap/checkpoint.

## Verification
pgTAP allowed/denied roles, self-name only, email privacy, active-member assignment, cross-trip writes/reads, stale version and delete behavior. Repository demo migration preserves old storage, names global/checklist per trip; UI controls exercise save/error/edit/check/delete. Required npm test/lint/build, embedded SQL and full stack SQL; UAT actual Auth/Realtime where available. No production test user records or messages.

## Recovery
Additive forward migration; preserve trips/expenses and existing profile choices. Schema deployed before matching frontend. Revert frontend to 0.4.2 if needed (new data retained); database repairs via reviewed forward migration. No historical replay or production reset.

## Completion
Released0.5.0 at356c83e90be55d6b05c3280bb095575725c3dc35 on16/10/2026.85 app tests/166 SQL, lint/build/audit/advisors and UAT two-account/mobile/concurrency pass. Three forward migrations applied production; prior business counts unchanged, new checklist0. CI38904239001 and Pages38904238872 success; public metadata0.5.0/login verified. Simplify local passes complete; two independent read-only doc reviewers informed scoped AGENTS/README fixes. Hosted email/Realtime/real Google login remain unclaimed. Worktree clean/retained; ignored canonical records updated separately. Execute staysActive.
