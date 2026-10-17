# P23: Production reconciliation and portable workflow
Status: Completed
Depends on: P22 completed; production 0.9.3 at 6becd6f
Wave: 24
Owner: Codex coordinator; documentation reviewers read-only
Owned scope: fast-forward local main and dedicated worktree; dependency install and local checks; AGENTS.md, README.md, docs/agent/, existing plans bundle/roadmap/schedule, 0.9.3 release note. No application, schema or production data changes planned.
Produces: Verified baseline, reconciled release evidence and Git-tracked instructions/plans usable from another device.

## Tasks
- [x] PO/BA/IT: sync latest main safely, preserve user edits, inspect actual release and scope.
- [x] QA: application tests, lint, build and embedded SQL; record unavailable service checks explicitly.
- [x] ITS/simplify: inspect documentation diff for secrets, stale authority and accidental runtime changes; validate relative links and portable paths.
- [x] IT: import existing plans without creating a second authoritative tracker; add docs/agent entrypoint, delivery workflow and handoff instructions; route AGENTS/README to it.
- [x] ITO/PO: reconcile already-completed 0.9.3 deployment evidence; prepare local commit/handoff. No new push/deploy without current approval.

## Acceptance
Another device can clone/fetch the committed branch, find current status from AGENTS.md, follow the workflow without installed private skills, locate the same tracker and know which checks remain unverified. No secrets or machine-specific setup required in shared instructions. Shared evidence excludes private workstation paths, chat identifiers and real financial record snapshots; the original private record stays outside the shared Git tree.

## Recovery
Revert documentation commit if needed; never reset local user changes. No migration or production rollback needed.

Completed locally 17/10: both checkouts synced; 129 app/270 embedded SQL/lint/demo build pass. Two read-only docs reviewers; relative links/manifest/credential-pattern checks pass; scoped docs ITS and four coordinator simplify passes found no remaining issue. Original local candidates superseded by sanitized branch; exact shared commit is discoverable in Git log. No app/schema changes or new deploy. Customer authorized sanitized branch push under A029; service/hosted UAT not rerun.

## A029 privacy cleanup and branch publication
- [x] Preserve private original outside tracked tree; minimize shared historical evidence and remove sensitive identifiers/real amounts.
- [x] Validate fresh outgoing tree/history, commit and push codex/portable-workflow-clean only.
- [x] Verify remote exact SHA and record publication without deploying main.

E025 complete: clean package 1f8c3df pushed and exact remote SHA verified. Original local candidate commits excluded from ancestry; no main merge/deploy. This checkpoint is a documentation-only follow-up on the same sharing branch.
