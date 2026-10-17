# Plan Record: WanderPlan improvements
<!-- workflow-record version:4 kind:plan tracker-id:wp-20261014-01 -->
Tracker ID: wp-20261014-01
Created: 2026-10-14 Asia/Saigon
Last updated: 2026-10-17 Asia/Saigon
Status: In progress
Plan mode: Exited
Execution readiness: Ready
Execute mode: Active
Resume instruction: Resolve plans/2026-10-14-no1-website-improvements from the current clone root (tracker wp-20261014-01). Read docs/agent/README.md and workflow.md, then this index and every manifest file. Keep this exact repository-relative bundle as the execution source of truth; update it until explicit exit. If the execute skill is installed, it may be used with this resolved path.
Workspace: Current clone root; never reuse another device's absolute path.
Repository: origin/main baseline 6becd6f938430c50432a7ef93f4240ebdf762410; local implementation branch codex/portable-workflow-clean. Fetch before resume.
Active action: E025 — sanitize and publish reviewed handoff branch.

<!-- workflow-active-snapshot:start version:2 -->
## Active Snapshot
Profile: Durable
Required references: references/intake.md, references/implementation.md, references/parallel-execution.md, references/completion.md
Goal: Deliver verified daily improvements through plan, code, QA, security, go-live and next-day notes.
Current state: Production baseline 6becd6f, app 0.9.3. Portable handoff sanitized in a fresh branch; E025 verification/publication in progress.
Accepted decisions: D01–D06, A010, A019, A020, A023, A024, A026 and A029. Customer explicitly approved sanitized branch push; main merge/deployment is not in scope.
Open items: E025 final scan and authorized branch publication. Future R07/R11 decisions and hosted email/Realtime/real Google QA remain separate follow-ups.
Next safe action: Finish E025 scans, commit and push codex/portable-workflow-clean only under current explicit authorization. Do not merge main or deploy.
<!-- workflow-active-snapshot:end -->

Shared workflow: [portable workflow](../../docs/agent/workflow.md). The references/*.md above belong to the optional installed execute skill; they are not missing repository files and are not required on a new device. Shared workflow contains the portable execution and evidence rules.

## Resume Checkpoint
- E025: user authorized cleanup and branch push. Use codex/portable-workflow-clean; branch starts at production baseline 6becd6f and excludes original unsanitized candidate commits. Worktree: .worktrees/portable-workflow-clean relative to the local repository anchor. Resolve all paths within the current clone.
- P23 portable workflow locally verified; 129 app tests, 270 embedded SQL, lint/demo build pass on unchanged baseline application code. No new app/schema/CI changes.
- Text/privacy and binary scans completed; public historical evidence minimized. Check E025 result below/in evidence for publication status and Git log for the exact handoff commit.
- No main merge/deployment. Hosted email/Realtime/real Google not retested. Next product batch requires customer decisions as listed in roadmap.

<!-- workflow-manifest:start -->
index.md
context.md
decisions.md
plan.md
verification.md
evidence.md
phases/P01-invitations.md
phases/P02-auth.md
phases/P03-copy-layout.md
phases/P04-performance.md
phases/P05-multiple-trips.md
phases/P06-reminders.md
phases/P07-release.md
phases/P08-daily-validation.md
phases/P09-migration-history.md
phases/P10-priority-ux.md
phases/P11-selector-version-ux.md
phases/P12-cloud-qa-c01.md
phases/P13-dropdown-date-ranges.md
security-audit-2026-10-15.md
phases/P14-names-checklist.md
phases/R14-action-pins.md
phases/R05-trip-archive.md
phases/P19-interface-refinement.md
phases/P16-settlement-status.md
phases/P20-unequal-split.md
phases/P21-integrated-qa.md
phases/P22-former-money-lock-mock-uat.md
phases/P23-portable-workflow.md
<!-- workflow-manifest:end -->
