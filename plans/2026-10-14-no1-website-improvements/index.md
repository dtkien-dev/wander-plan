# Plan Record: WanderPlan improvements
<!-- workflow-record version:4 kind:plan tracker-id:wp-20261014-01 -->
Tracker ID: wp-20261014-01
Created: 2026-10-14 Asia/Saigon
Last updated: 2026-10-18 Asia/Saigon
Status: Implemented
Plan mode: Exited
Execution readiness: Ready
Execute mode: Active
Resume instruction: Resolve plans/2026-10-14-no1-website-improvements from the current clone root (tracker wp-20261014-01). Read docs/agent/README.md and workflow.md, then this index and every manifest file. Keep this exact repository-relative bundle as the execution source of truth; update it until explicit exit. If the execute skill is installed, it may be used with this resolved path.
Workspace: Current clone root; never reuse another device's absolute path.
Repository: origin/main 40ea587 (app 0.11.1). Fetch before resume.
Active action: None — E032 0.11.1 released.

<!-- workflow-active-snapshot:start version:2 -->
## Active Snapshot
Profile: Durable
Required references: references/intake.md, references/implementation.md, references/parallel-execution.md, references/completion.md
Goal: Deliver verified daily improvements through plan, code, QA, security, go-live and next-day notes.
Current state: Production 0.11.1 at 40ea587 (readable Excel export on top of 0.11.0 multi-day itinerary). Release records on docs/release-0.11.1.
Accepted decisions: D01–D06, A010, A019, A020, A023, A024, A026 and A029, A031, A032, A033, A034, A035, A036. Customer explicitly approved sanitized branch push; main merge/deployment is not in scope.
Open items: R07/R15/R17/R18 need customer decisions; hosted email/Realtime/real Google QA remain.
Next safe action: Select the next batch with the customer. Next-day check: create a multi-day activity on a real trip; inspect import/workspace errors.
<!-- workflow-active-snapshot:end -->

Shared workflow: [portable workflow](../../docs/agent/workflow.md). The references/*.md above belong to the optional installed execute skill; they are not missing repository files and are not required on a new device. Shared workflow contains the portable execution and evidence rules.

## Resume Checkpoint
- E025 completed: user-authorized sanitized branch published; remote package commit 1f8c3df verified. Branch starts at baseline 6becd6f and excludes original unsanitized candidates. Worktree retained at .worktrees/portable-workflow-clean relative to local repository anchor. Resolve paths in the current clone; latest checkpoint commit is available from Git log.
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
phases/P24-itinerary-overlap-warning.md
phases/P25-multi-day-itinerary.md
<!-- workflow-manifest:end -->
