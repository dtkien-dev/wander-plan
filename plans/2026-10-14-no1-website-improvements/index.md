# Plan Record: WanderPlan improvements
<!-- workflow-record version:4 kind:plan tracker-id:wp-20261014-01 -->
Tracker ID: wp-20261014-01
Created: 2026-10-14 Asia/Saigon
Last updated: 2026-10-29 Asia/Saigon
Status: Implemented locally; P32 QA/ITS complete, publication pending approval
Plan mode: Exited
Execution readiness: Ready
Execute mode: Active
Resume instruction: Resolve plans/2026-10-14-no1-website-improvements from the current clone root (tracker wp-20261014-01). Read docs/agent/README.md and workflow.md, then this index and every manifest file. Keep this exact repository-relative bundle as the execution source of truth; update it until explicit exit. If the execute skill is installed, it may be used with this resolved path.
Workspace: Current clone root; never reuse another device's absolute path.
Repository: fetched origin/main 9c7a872 (released 0.14.0). Local refactor on chore/workspace-refactor; resolve final commit through Git log.
Active action: None — A059/E055 completed locally; P32 publication/go-live approval pending.

<!-- workflow-active-snapshot:start version:2 -->
## Active Snapshot
Profile: Durable
Required references: references/intake.md, references/implementation.md, references/parallel-execution.md, references/completion.md, references/post-merge-cleanup.md
Goal: Deliver verified daily improvements through plan, code, QA, security, go-live and next-day notes.
Current state: P29/P30/P31 released as 0.14.0. P32 read/write hook extraction implemented and QA/ITS complete locally on chore/workspace-refactor from 9c7a872. Production unchanged; no current-batch go-live approval.
Accepted decisions: D01–D06, A010, A019, A020, A023, A024, A026, A029 and A031–A051. A047 explicitly authorizes P27 0.12.1 push, PR, merge after CI and Pages verification; completed under E043. No production data writes.
Open items: R07/R17/R18 deferred by customer (A043/A044). E040 items 1–3 fixed under A045/P27; workspace refresh optimization remains deferred. Customer reports successful sign-in and requests no further R15 proposals; hosted email/Realtime remain unverified.
Next safe action: present the verified P32 refactor for publication/go-live approval. After approval: re-fetch, publish purpose branch/PR, require CI, merge and verify Pages/live. No migration needed. Preserve primary checkout changes.
<!-- workflow-active-snapshot:end -->

Shared workflow: [portable workflow](../../docs/agent/workflow.md). The references/*.md above belong to the optional installed execute skill; they are not missing repository files and are not required on a new device. Shared workflow contains the portable execution and evidence rules.

## Resume Checkpoint
- E055/A059/P32 (29/10): unchanged mutation hook moved to src/hooks/useWorkspaceMutations.ts; all callers/mocks and architecture docs updated. 32 focused tests before/after, 168 total app tests, 353 embedded SQL assertions, lint/demo build/audit-high (zero findings), semantic equivalence and diff whitespace PASS. Same-agent scoped ITS clear. No browser/full-Supabase/hosted rerun, push/merge/deploy; go-live approval pending. Resolve local commit on chore/workspace-refactor via Git log.
- E047/A051 (29/10): docs PR #17 merged acc310a after CI 40731357042; main CI 40731549138 and Pages 40731548893 PASS; final public HTTP 200/version 0.13.0. Release complete; final receipt on docs/release-0.13.0, resolve SHA from Git log. No new feature approved.
- E046/A050/P28 (28/10): 0.13.0 app released at 58b2906 via PR #16; migration/grants/history, CI/Pages/public version and authenticated read-only controls PASS. E047 docs publication in progress. No production business-data test writes.
- E043/A047/P27 (18/10): released 0.12.1. PR #13 reviewed head 40f316a merged at 5ebbe82; PR CI 39126404155, main CI 39126491308 and Pages 39126491352 PASS. Public HTTP 200/meta version and authenticated browser badge 0.12.1 confirmed; affected dialogs open, step=1, canceled without saving; console errors zero. No production schema/data writes. Final docs-only release records follow up on docs/release-0.12.1 (resolve latest SHA from Git log); primary user changes preserved. Deferred features unchanged.
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
phases/P28-bulk-delete-itinerary.md
security-review-p28-2026-10-28.md
phases/P29-itinerary-trash.md
phases/P30-trip-reschedule.md
phases/P31-trip-template-clone.md
security-review-p29-p31-2026-10-29.md
phases/P32-workspace-hook-boundary.md
<!-- workflow-manifest:end -->

Latest checkpoint 29/10: A055/E051 complete; independent review High fixed by forward provenance migration and verified in 353 embedded/full-local SQL, 168 app tests, lint/build. Prior E050 browser/mobile/Realtime/concurrency UAT passed. Candidate local on feat/trip-reschedule-templates-trash; resolve final commit via Git log. No push or production changes. Await fresh go-live approval.

A056/E052 complete: three dependency warnings fixed via Vitest4.1.12/fast-uri3.1.9. Zero npm audit findings; clean install/168 app tests/353 embedded SQL/lint/build pass; independent dependency metadata/integrity review found no issue. No push/prod change.

E053/A057 complete: app PR18 b732461, main CI40794364399/Pages40794364198 PASS; HTTP200/version0.14.0 and authenticated move/clone/trash open/cancel smoke, zero console errors. Four production migrations, backup, private hourly cleanup and grants verified. No production business-data test writes. E054 docs publication follows; no new backlog feature approved.
