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
Repository: origin/main 6d019e9 (app 0.12.0). Fetch before resume; final receipt on docs/post-release-uat.
Active action: E043 / P27 — A047 approves 0.12.1 push, PR, merge after CI and Pages verification.

<!-- workflow-active-snapshot:start version:2 -->
## Active Snapshot
Profile: Durable
Required references: references/intake.md, references/implementation.md, references/parallel-execution.md, references/completion.md, references/post-merge-cleanup.md
Goal: Deliver verified daily improvements through plan, code, QA, security, go-live and next-day notes.
Current state: Production app 0.12.0; main 6d019e9. P27 candidate 0.12.1 on fix/forms-and-local-checks passed full-local browser QA and independent ITS; local commits only, go-live unapproved.
Accepted decisions: D01–D06, A010, A019, A020, A023, A024, A026, A029 and A031–A042. A042 explicitly authorizes this documentation batch's push, PR/merge after CI and Pages redeployment. No production data writes.
Open items: R07/R17/R18 deferred by customer (A043/A044). E040 items 1–3 fixed under A045/P27; workspace refresh optimization remains deferred. Customer reports successful sign-in and requests no further R15 proposals; hosted email/Realtime remain unverified.
Next safe action: Execute approved A047/E043 publication and ITO checklist; require CI on exact PR head before merge, then verify Pages/public 0.12.1. No production schema/data change.
<!-- workflow-active-snapshot:end -->

Shared workflow: [portable workflow](../../docs/agent/workflow.md). The references/*.md above belong to the optional installed execute skill; they are not missing repository files and are not required on a new device. Shared workflow contains the portable execution and evidence rules.

## Resume Checkpoint
- E042/A046/P27 (18/10): candidate 0.12.1, actual-browser full-local UAT PASS (all-former metadata, frozen-money readback, whole-dong/exact-split/itinerary reload, negative/fractional/no-participant guards, 320/375px, zero console errors); 149 app tests/lint/build and full-local 281 SQL PASS. Two independent ITS lenses signed off after QA. Local app/tab stopped, synthetic sessions revoked, credential fixtures removed; existing local stack/data retained. Release note/ITO checklist prepared. All commits local on fix/forms-and-local-checks; resolve latest SHA from branch log. Await current-batch go-live approval; no push/deploy.
- E041/A045/P27 (18/10): audit items 1–3 fixed on fix/forms-and-local-checks from origin/main 6d019e9 in isolated worktree. Three intended pre-fix regression failures; 17 focused and 149 total app tests, lint, demo build, 281 SQL and audit PASS. No migration/dependency/cache changes; same-agent QA/security review. Implementation and record commits local only (resolve latest SHA from branch log); primary checkout source/user changes preserved. Actual-browser UAT and hosted checks not rerun; go-live not approved.
- E040/A044 (18/10): R17/R18 deferred. Reviewed current application, persistence, auth, money, Excel, Realtime and CI paths for small collaborative groups (up to 20 members). 147 app tests passed with worktrees excluded; scoped lint, TypeScript, demo build and dependency audit passed. Embedded SQL blocked by missing local pglite package. Four findings in evidence; no source fixes, commit, push or deployment.
- E039/A043 (18/10): customer deferred R07; roadmap and records updated locally. R17/R18 comparison requested, implementation undecided. No commit, push or deployment; pre-existing changes preserved.
- E038/A042 (18/10): docs commit 66463a1 pushed and PR #12 merged at 6d019e9. PR CI 39110831509, main CI 39110885640 and Pages 39110885665 succeeded; Pages verify/build/deploy all PASS. Public HTTP 200/app-version 0.12.0 after deployment. No app/schema/config/dependency change or production data write. Final receipt is a docs-only follow-up on docs/post-release-uat (resolve SHA from Git log), separate from deployed main. Dedicated QA worktree retained for ignored reproducibility artifacts; primary user changes preserved. Execute remains Active.
- E037/A041 (18/10): in-app browser downloaded the real report and uploaded it successfully without changing extension permissions. Unchanged file: 0 create/0 update/2 skip/0 errors; edited downloaded workbook: 0 create/1 update/1 skip/0 errors, applied through UI. Reload retained three-day rendering and 27/11 20:00 to 29/11 08:00. Old version re-upload showed one conflict and disabled import. No console errors, source changes, production access, commit/push/deploy. Owned tab/server closed; sessions revoked, credential fixtures removed. Local workbook/screenshot receipts retained in ignored QA artifacts. Canonical tracker edits remain uncommitted; execute Active.
- E036/A040 (18/10): synthetic local UAT completed on d877371 in .worktrees/post-release-qa. Multi-day browser save/reload/list/warning and two-account Realtime passed; app-code Excel report/readback/edited and legacy import passed; notification provider browser mock passed; local Mailpit email and full local SQL 281/281 passed. Browser file upload blocked by extension permission, download capture timed out: these browser file-transfer checks are not claimed PASS. No production access during A040, source/schema/dependency edits, commit, push or deploy. Owned tabs/server stopped, local synthetic data/ignored harness retained, synthetic sessions revoked and credential fixture files removed. Canonical record-only changes remain uncommitted; execute Active.
- E035 (18/10): 147 app tests, 281 embedded SQL assertions, lint/demo build/audit passed at d877371. Authenticated production routes and Excel export/toast/history checked. Customer selected a separate test trip but has not supplied its name; hosted write tests, real Google/email and two-session Realtime remain unverified. Verification worktree .worktrees/post-release-qa retained; no source edits, commits, push or deployment. Evidence-only record changes remain uncommitted in this canonical bundle.
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
phases/P26-toasts-excel-autofit.md
phases/P27-form-validation-local-checks.md
<!-- workflow-manifest:end -->
