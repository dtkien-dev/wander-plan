# Plan Record: WanderPlan improvements
<!-- workflow-record version:4 kind:plan tracker-id:wp-20261014-01 -->
Tracker ID: wp-20261014-01
Created: 2026-10-14 Asia/Saigon
Last updated: 2026-10-30 Asia/Saigon
Status: Released 0.17.0 (P35 Bảng giờ tàu redesign)
Plan mode: Exited
Execution readiness: Ready
Execute mode: Active
Resume instruction: Resolve plans/2026-10-14-no1-website-improvements from the current clone root (tracker wp-20261014-01). Read docs/agent/README.md and workflow.md, then this index and every manifest file. Keep this exact repository-relative bundle as the execution source of truth; update it until explicit exit. If the execute skill is installed, it may be used with this resolved path.
Workspace: Current clone root; never reuse another device's absolute path.
Repository: deployed app main 7393752 (PR26, 0.17.0). Docs closeout on docs/release-0.17.0; resolve final receipt via Git log.
Active action: A067/E063 open — vite 6.4.5 dev-dependency security patch (fix/vite-6-4-5); merge awaits go-live approval.

<!-- workflow-active-snapshot:start version:2 -->
## Active Snapshot
Profile: Durable
Required references: references/intake.md, references/implementation.md, references/parallel-execution.md, references/completion.md, references/post-merge-cleanup.md
Goal: Deliver verified daily improvements through plan, code, QA, security, go-live and next-day notes.
Current state: P33 released0.15.0 under A062/E058; both production migrations, approved verified-account admin grant, CI/Pages/public and authenticated read-only UI PASS. Docs-only closeout follows.
Accepted decisions: prior product/financial/consent decisions retained. A061 adds website admin access across all trips, owner promotion of accepted members and creator-only co-owner demotion. Initial admin supplied privately; no new-batch production approval.
Open items: R07/R17/R18 deferred by customer (A043/A044). E040 items 1–3 fixed under A045/P27; workspace refresh optimization remains deferred. Customer reports successful sign-in and requests no further R15 proposals; hosted email/Realtime remain unverified.
Next safe action: publish docs/release-0.15.0 outcomes through CI-gated PR, verify final Pages/public and share final receipt. No new feature selected; preserve primary checkout changes.
<!-- workflow-active-snapshot:end -->

Shared workflow: [portable workflow](../../docs/agent/workflow.md). The references/*.md above belong to the optional installed execute skill; they are not missing repository files and are not required on a new device. Shared workflow contains the portable execution and evidence rules.

## Resume Checkpoint
- E062/A066/P35 (30/10): 0.17.0 released. PR26 7393752 (head 180dec5), PR CI PASS, main CI 40981612990/Pages 40981612923 PASS; no migration; public HTTP 200/meta 0.17.0, signed-out console 0. Authenticated smoke not run. No feature queued.
- E060/A064/P34 (29/10): 0.16.0 released. PR24 96c419e, main CI 40886069902/Pages 40886070224 PASS; production migration 20261029150000 once after private backup, contracts verified; public meta 0.16.0. Authenticated smoke not run (signed out). Next: P35 redesign (A063).
- E059/A063/P34 (29/10): impeccable review (26/40, 13/20) and customer decisions recorded; expense trash candidate 0.16.0 at f733fdb on feat/ui-upgrade. 178 app tests, 406 embedded/full-local SQL, two-account Realtime UAT and same-agent ITS PASS. Migration 20261029150000 applied only locally. No push/production change; await go-live approval, then P35 redesign.
- E058/A062/P33 (29/10):0.15.0 app PR22/7b647fa; PR CI40874958708/main CI40875101095/Pages40875101197 PASS. Two production forward migrations once after private backup, strict verified-account registry bootstrap and grants/RLS checks PASS. Public HTTP200/meta0.15.0; actual Google sign-in/admin indicator/Group/promotion dialog open+cancel, zero app console errors. No business-data test writes or email. Docs closeout docs/release-0.15.0 follows; resolve latest receipt via Git log.
- E057/A061/P33 (29/10): candidate0.15.0 on feat/site-admin-trip-co-owners;175 app tests,389 embedded/full-local SQL, lint/build/audit/advisor and actual two-browser Realtime/mobile/concurrent-role/cache-revocation QA PASS. Independent ITS remediations rechecked; no remaining scoped finding. No production grant/DB/data/push/merge/deploy. Two forward migrations and private bootstrap require new go-live approval. Resolve local commit via Git log; initial admin identity remains outside Git.
- E056/A060/P32 (29/10): customer go-live approved; PR20/fa59861 deployed, PR CI40866629066/main CI40866751685/Pages40866751533 PASS. Public HTML/entry script HTTP200, meta0.14.0; real browser login smoke PASS. No new console errors after reload; pre-deployment stale token noted. Authenticated/hosted write tests not performed, no DB changes or login emails. Docs closeout on docs/release-workspace-refactor follows; resolve latest final receipt via Git log.
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
phases/P33-site-admin-trip-co-owners.md
phases/P34-expense-trash.md
phases/P35-ui-redesign.md
security-review-p33-2026-10-29.md
phases/P32-workspace-hook-boundary.md
<!-- workflow-manifest:end -->

Latest checkpoint 29/10: A055/E051 complete; independent review High fixed by forward provenance migration and verified in 353 embedded/full-local SQL, 168 app tests, lint/build. Prior E050 browser/mobile/Realtime/concurrency UAT passed. Candidate local on feat/trip-reschedule-templates-trash; resolve final commit via Git log. No push or production changes. Await fresh go-live approval.

A056/E052 complete: three dependency warnings fixed via Vitest4.1.12/fast-uri3.1.9. Zero npm audit findings; clean install/168 app tests/353 embedded SQL/lint/build pass; independent dependency metadata/integrity review found no issue. No push/prod change.

E053/A057 complete: app PR18 b732461, main CI40794364399/Pages40794364198 PASS; HTTP200/version0.14.0 and authenticated move/clone/trash open/cancel smoke, zero console errors. Four production migrations, backup, private hourly cleanup and grants verified. No production business-data test writes. E054 docs publication follows; no new backlog feature approved.
