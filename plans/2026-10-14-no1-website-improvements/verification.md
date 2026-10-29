# Verification

## 0.15.0 approved production release — E058/A062
PASS: private schema/data backup+ACL, both canonical missing migrations once and empty follow-up dry-run; approved unique verified-account bootstrap; production registry RLS/private access, role RPC grants, direct member UPDATE/DELETE denial and post-lock archive guard. Read-only authenticated SQL verifies global active/archive metadata access without printing identity/counts. PR22 CI40874958708, merge7b647fa, main CI40875101095/Pages40875101197 PASS; public HTTP200/meta0.15.0. Actual existing Google sign-in, admin indicator/Group/role-dialog open+cancel and zero app console errors PASS. No real role/trip/member/payment test writes or login email. Backup restore/hosted role-change concurrency not run. Docs closeout and final receipt follow on docs/release-0.15.0.

## P33 / A061–E057 — candidate0.15.0,29/10/2026
PASS:175 app tests/29 suites, lint/TypeScript/demo build, audit zero,389 embedded and full-local SQL assertions/20 suites/29 migrations, security advisor no issues, diff whitespace. Actual synthetic owner/co-owner/admin browser sessions, two-browser promotion/demotion Realtime, creator-only demotion, confirmation/cancel,320/375px after admin label relocation, registry revocation clears privileged caches, concurrent API role changes; zero console errors. Bootstrap confirmed/idempotent/missing/unconfirmed cases PASS.
Independent ITS remediated direct membership DELETE and queued archive/demotion race via forward20261029122209; catalog DELETE=false/UPDATE=false, two-session stale archive succeeded before and was denied after, independent delta checks clear. Earlier unchanged trash-provenance timing test failed once embedded then subsequent embedded/full-local passed; no fix claimed. No hosted/production checks, migration/admin grant/push/deploy. Synthetic sessions/admin privilege removed, credential fixtures/local UAT env removed, owned tabs/app stopped, shared stack and synthetic business fixtures retained. Candidate release note and P33 contain ITO/recovery; new-batch go-live approval pending.

## P32 approved deployment — E056/A060
PASS: PR20 CI40866629066, merge fa59861, main CI40866751685 and Pages40866751533 for the merge SHA. Public HTML/entry script HTTP200/meta0.14.0 and actual-browser login after reload. No new console errors captured after reload; initial navigation had an old invalid refresh token before deployment. NOT RUN: signed-in dialogs, hosted writes/email/Realtime and full service concurrency. No migration/config change or real-data writes. Release outcome in docs/releases/2026-10-29-workspace-refactor.md; docs closeout publication and final receipt follows on docs/release-workspace-refactor.

## P32 / A059–E055 — 29/10/2026
Baseline fetched origin/main 9c7a872; local branch chore/workspace-refactor. PASS: 32 focused provider/page/component tests before/after; 168 total app tests/29 suites, lint, TypeScript/demo build, 353 embedded SQL assertions/19 suites, audit-high zero findings and final diff whitespace. Assert comparison: mutation/read function bodies and mutation imports unchanged (normalized line endings). Same-agent scoped ITS after QA: no blocker, no new security surface. Test-audit: existing assertions retained, only module/mock routing changed; no duplicate tests introduced. NOT RUN: actual browser UAT/full Supabase/hosted/concurrent-service tests. No performance gain or independent security review claimed. No publication/production effects. Next gate: current-batch publication/go-live approval, then remote CI/Pages verification; no migration.

## E043 / P27 — Release 0.12.1, 18/10/2026
- PASS: published exact PR #13 head 40f316a; shared PR CI 39126404155, merge with matching-head guard at 5ebbe82.
- PASS: main CI 39126491308; Pages 39126491352 verify/build/deploy all succeeded.
- PASS: public HTTP 200 and app-version metadata 0.12.1; existing authenticated session reload shows v0.12.1.
- PASS: authenticated production read-only smoke — Expense and Itinerary create dialogs load with step=1, canceled without saving; dashboard restored, console errors zero.
- No migration, access apply or production data write. Hosted write/tampering/email/Google/Realtime tests NOT RUN; local write evidence remains E042.

## E042 / P27 — Delivery gates, candidate 0.12.1, 18/10/2026
- PASS: actual-browser UAT on full local Supabase — all-former metadata save/reload with unchanged financial fields; whole-dong expense/exact splits and itinerary save/reload; negative/fractional native validation; no-participant creation blocked.
- PASS: direct API readback assertions and rejection of frozen-money tampering on synthetic local fixture.
- PASS: affected dialogs at 320/375px, no horizontal document overflow; console errors zero. Screenshots retained locally under ignored P27 artifacts.
- PASS: final candidate npm test 149/149 (26 files); npm run lint; npm run build with demo mode and temporary output (includes tsc).
- PASS: full local Supabase test db, 281 assertions across 16 suites. E041 embedded 281 assertions and dependency audit remain applicable; dependencies unchanged.
- PASS: two independent ITS reviewer lenses after QA — access/financial invariants and unsafe-input/platform/supply-chain, no actionable findings; coordinator synthesis PASS.
- PASS: app/tab cleanup, viewport reset, synthetic session revocation and credential fixture removal. Existing stack/data retained.
- NOT RUN: hosted/production UAT, CI/Pages for candidate (not pushed), deployment smoke. No schema/migration change.

## E041 / P27 — Form fixes and local discovery, 18/10/2026
- Regression control PASS: three intended failures on pre-fix forms; 17/17 focused tests PASS after fixes.
- PASS: default npm test — 26 files/149 tests, no worktree exclusion flags.
- PASS: default npm run lint. Both test/lint ran with invalid TypeScript sentinel files under nested .worktrees and .artifacts; ignored correctly, removed afterward.
- PASS: npm run build with VITE_DEMO_MODE=true and temporary outDir — TypeScript and Vite; generated dist unchanged. Existing dependency annotation/empty demo Supabase chunk warnings only.
- PASS: npm run test:db:embedded — 22 unchanged migrations, 281 SQL assertions/16 suites.
- PASS: npm audit --audit-level=high — zero vulnerabilities; git diff --check.
- PASS: same-coordinator QA/security and test-value review; no independent reviewer claimed, database and lockfile unchanged.
- NOT RUN: actual-browser UAT, hosted/full Supabase integration and deployment. No schema change; no production data writes.

## E040 — Repository audit, 18/10/2026
- PASS: npx vitest run --exclude '**/.worktrees/**' — 26 files, 147 tests.
- PASS: npx eslint src vite.config.ts; npx eslint . with worktree/artifact ignore patterns; npx tsc -b.
- PASS: VITE_DEMO_MODE=true Vite build to OS temporary output; generated dist not changed.
- PASS: npm audit --audit-level=high — zero vulnerabilities.
- PASS: native DOM validity self-check, min=0/step=1000/value=12500 gives stepMismatch=true, confirming rejected whole-dong input.
- NOT PASS: unfiltered npm test includes historical nested worktrees and emits invalid-hook-call failures; stopped owned runs and used filtered current-source suite.
- BLOCKED: npm run test:db:embedded — missing @electric-sql/pglite in local dependencies. Full Supabase/hosted tests and performance profiling NOT RUN.
- Findings 1/4 are source-traced scenarios; no new component regression or performance benchmark added in this report-only audit.

## E039 — R07 deferral, 18/10/2026
Documentation only: roadmap row, A043 decision and current index/evidence checkpoint agree that R07 is deferred and R17/R18 are undecided. No application/database tests run; no runtime change. Whitespace validation: git diff --check on the five touched Markdown files.
## A042 / E038 — Publication and Pages, 18/10/2026
- [x] Six Markdown files only; privacy/scope/relative-link/whitespace review passed. Local artifacts/credentials and unrelated changes excluded.
- [x] 66463a1 pushed and exact remote SHA verified; PR #12 merged as 6d019e9 after successful verify (39110831509).
- [x] Main CI 39110885640 and Pages 39110885665 succeeded; verify/build/deploy all PASS.
- [x] Public HTTP 200 and app-version 0.12.0 verified after deployment. No runtime/schema/config/dependency/workflow change or production data writes.
- [x] Final docs-only receipt on docs/post-release-uat; QA worktree retained for ignored test evidence. Hosted/native Excel limits unchanged.

## A041 / E037 — Browser Excel completed, 18/10/2026
- [x] Real browser export downloaded; exact file re-uploaded via UI: 2 unchanged rows skipped, 0 errors, no write enabled.
- [x] Edited downloaded workbook uploaded via UI: 1 update/1 skip/0 errors; applied once.
- [x] Reload: title under three days; form preserves 27/11 20:00 to 29/11 08:00 and notes.
- [x] Stale original file: 1 Version conflict, import disabled; 0 captured console errors.
- [x] In-app browser required no extension permission change; no production access. Owned tab/server closed, local sessions revoked and credential fixtures removed. Application source unchanged; previous automated gates retained.
Remaining limits: native Excel appearance, real Google and hosted email/Realtime. E036 browser file upload/download limitation resolved for this path.

## A040 / E036 — Synthetic local UAT, 18/10/2026
- [x] Two synthetic local accounts, owner trip creation/member invitation acceptance; explicit localhost configuration.
- [x] Browser multi-day save/reload/three-day rendering and overlap marker/edit warning.
- [x] Two-account Realtime create and Excel import updates without reload.
- [x] Real app report builder/workbook readback, unchanged skip, edited import (one update), legacy end-date preservation through local repository/RPC.
- [x] Browser real notification provider + mock triggers: success hides, error stays until closed, account-isolated history persists after reload; 11 focused tests pass.
- [x] Full local Supabase SQL: 281 assertions/16 suites; synthetic login email captured in Mailpit.
- [x] Owned tabs/server stopped; synthetic sessions revoked, credential fixture files removed; pre-existing stack preserved. No production access in this action, source/schema/dependency change or deployment.
Limits: browser download capture timed out; upload blocked by extension file-URL permission (unchanged). Browser Excel roundtrip, native Excel appearance and hosted Google/email/Realtime not claimed. Prior E035 inconclusive overlap observation resolved only on local UAT.

## A039 / E035 — 18/10/2026 post-release check
- [x] d877371: npm ci; 147 app tests, lint/demo build; 281 embedded SQL assertions/22 unchanged migrations; audit 0.
- [x] Authenticated live 0.12.0: all four routes load, Excel export success, toast/history entry; no captured console errors.
- [x] Draft form opened and cancelled without saving. Multi-day field present; overlap warning after automated date/time fill INCONCLUSIVE (requires reliable reproduction).
- [x] Hosted test-trip request superseded by A040 local-only UAT; Google/email/Realtime hosted remain unverified and outside this batch.
Limits: Node 20.17 engine warning; build warnings nonblocking. No fresh full Supabase stack test or Excel application inspection. No app/schema change, push or deploy.

## P22 / E023 — Former-member money lock + mock UAT, 17/10/2026
- [x] 107 app tests, lint, build; 270 SQL/15 suites embedded + full stack.
- [x] Mock UAT: .ics, Excel export/re-import/edited workbook, Google request/hook/simulated callback/error, email via Mailpit, Realtime.
- [x] ITS and simplify.
- [x] Go-live 0.9.2: migration first, counts unchanged, triggers/grants verified; CI 38936701447/Pages 38936701442 success; public 0.9.2.
Not mockable: Google consent + identity linking, hosted email/Realtime.

## P21 / E022 — R16/R08 integrated QA, 16/10/2026
- [x] Automated gates on 0.9.0 and after fixes: 106 app tests, lint, build, audit 0, 258 SQL embedded + full stack, schema lint, production advisors reviewed.
- [x] Two-account functional regression of every released feature (matrix in evidence); D1 found and fixed per A023.
- [x] Responsive 320/375/768/1280 all routes + dialogs; D2 fixed.
- [x] ITS: RLS/grants/definer search_path/isolation; L2 and participant-update hardening.
- [x] Go-live 0.9.1: migration first, counts unchanged, grants verified; CI 38933172872/Pages 38933172947 success; public 0.9.1.
Not run: Excel/.ics browser downloads, Google OAuth, hosted email/Realtime.

## P20 / E021 — R10 unequal splits, 16/10/2026
- [x] 103 application tests/22 suites, lint, build (0.9.0 title/app-version UTF-8 correct).
- [x] 240 SQL assertions/13 suites, embedded and full local Supabase.
- [x] Two-account UAT shares/amounts/mismatch block/Realtime settlement; 320/375 dialog.
- [x] UAT defect (share values reused as amounts) fixed with regression test.
- [x] ITS local probes; scoped simplify.
- [x] Go-live: migration first, counts unchanged, grants/triggers verified; CI 38922160733/Pages 38922160843 success; public 0.9.0.
Limits: Excel round trip by unit tests + import RPC, not browser upload.

## P16 / E020 — R06 settlement payments, 16/10/2026
- [x] 97 application tests/22 suites, lint, build (title/app-version 0.8.0 UTF-8 correct).
- [x] 223 SQL assertions/12 suites, embedded PostgreSQL and full local Supabase.
- [x] Two-account UAT confirm/Realtime/expense change/undo; mobile 320/375 and desktop 1280.
- [x] ITS local probes and scoped simplify (one fix).
- [x] Go-live: migration applied first, counts unchanged, grants/Realtime verified; CI 38914518083/Pages 38914518088 success; public 0.8.0.
Limits: hosted Realtime/email and real Google round trip still untested.

## P19 / E019 — Unified UI,16/10/2026
- [x]92 application tests/21 suites,201 embedded SQL assertions/11 suites, lint/build/audit0.
- [x] All four signed-in routes + Login reviewed at320/375/768/1280; no horizontal overflow after itinerary action/tablet header fixes;900/901/1024 boundaries pass.
- [x] Owner editor save/cancel/reset/error regression; capacity opens/focuses, Escape closes/restores focus; profile save/checklist add; editor controls absent in local Supabase member session.
- [x] Expense/itinerary/Excel dialogs reviewed; full-width mobile actions, long names/amounts contained. Reduced-motion CSS preserved/inspected; no exhaustive assistive-technology claim.
- [x] Four local simplify/ITS passes across full2100957..eff7495 range. Existing AGENTS routing sufficient; README/release updated.
- [x] Byte-correct metadata recovery, cancelled superseded deployments, finalCI38910916980/Pages38910916845 success; public0.7.0 and Vietnamese title/description verified.
Limits: production read-only, no schema/data/auth changes; hosted authenticated email/Realtime/real Google roundtrip remain untested.

## R05 / E018 —16/10/2026
- [x]90 app tests/21 suites,201 SQL assertions/11 suites (embedded and full Supabase), lint/build/audit0/security advisors no issues.
- [x] Owner-only/version/direct-write denial, hidden REST/RPC content and invitations, exact restored planner/member/invitation equality.
- [x] Two-account UAT hide/reload/restore, self-membership Realtime, zero active trips and mobile320/375 no overflow.
- [x] Cached-null restore regression failed before/passed after; pending recipient refresh regression protects hide/reappear without membership event.
- [x] Four local simplify and scoped ITS passes; two read-only doc reviewers, README/AGENTS routing updated.
- [x] Exact migration applied first, production record counts unchanged, archived0; auth RPC allowed, anon/direct archive denied; dry-run up to date.
- [x] CI38908291944 and Pages38908291722 all success, public version0.6.0/login verified.
Limits: no production archive/test writes; hosted authenticated email/Realtime and real Google roundtrip not claimed. Active-page invitation refresh15s, offline copies cannot be erased.

## R14 / E017 —16/10/2026
- [x] Seven full40-character pins from5 official repositories; tag and release refs verified.
- [x] YAML parsed and full semantic comparison to356c83e differs only in reviewed action refs; whitespace clean.
- [x] Scoped security and four simplify passes; maintenance docs verified; no app/database changes.
- [x] CI38905743762 and Pages38905743731 verify/build/deploy success at ac051e8; hosted85 app/166 SQL/lint/audit/build pass.
- [x] Public HTTP200/app-version0.5.0; worktree clean/retained.

## P14 / E016 — 16/10/2026
- [x] 85 application tests/20 suites; lint and build on release0.5.0.
- [x] 166 SQL assertions/10 suites, both embedded PostgreSQL and full Supabase stack.
- [x] Local security advisors no issues; npm audit0.
- [x] UAT two accounts: optional name/global/realtime; checklist add/assign/edit/check/delete/reload/trip isolation and stale edit rejection.
- [x] Desktop screenshot and mobile320/375 no horizontal overflow; modal/focus/long names and checklist text inspected.
- [x] Independent DB connections assignment/removal both orderings serialized without deadlock; fixture data cleaned.
- [x] Scoped ITS corrected cross-trip validation error oracle; failed-before/passed-after. New RPCs re-reviewed after lock-order correction; direct writes denied.
- [x] Four local simplify passes full session range; two read-only doc-routing reviewers; scoped AGENTS/README correction.
- [x] Three production migrations/history verified; business counts unchanged; CI38904239001 and Pages38904238872 success; public0.5.0 metadata and login/Google button rendered.
Limits: hosted email/Realtime and real Google OAuth round trip not claimed. Production business data not used for QA.

Planning source reads only; no behavior tests executed. Each implementation: targeted tests, lint/build and relevant existing regressions. DB changes: local Supabase/pgTAP plus deployed schema comparison; report skipped checks.
Critical: owner-only revoke, capacity, invite duplication and concurrent accept/revoke; auth identity/session isolation; long names mobile; rapid clicks/realtime; RLS trip isolation; expense/Excel preservation; timezone/calendar escaping.
Rollback: compatible frontend revert, additive DB migrations and reviewed forward repair. Backup/rehearse before multi-trip changes; never delete existing trip data or blindly replay old migrations.

- [x] Embedded PG: 83 assertions across 4 suites.
- [x] Auth/workspace regression: 18 tests.
- [x] Demo create/select trip and capacity UI (2 members + 2 pending).
- [x] Final integrated checks and responsive screenshots, with browser automation limits recorded below.

## Final results
- [x] 53 application tests in14 suites, including failed-before/passed-after auth-route, late-account and late-trip-write regression checks.
- [x] 83 pgTAP assertions across4 suites on8 unchanged migrations in ephemeral PostgreSQL.
- [x] Lint, production build, diff whitespace, agent routing path verification.
- [x] Desktop/320px screenshot review and375px width check; long email contained.
- [x] Whole-session simplify review and scoped AGENTS update.
Skipped: full Supabase Auth/Realtime delivery and simultaneous database sessions (Docker daemon unavailable); cloud schema comparison/deployment (outside local authorized rollout); exhaustive browser interactions after native dialog control timed out. Residual release checks remain in README. These are not claimed to have passed.

## Production release0.2.0
- [x] Confirmed configured Supabase project and applied only missing004 transactionally.
- [x] New RPCs/internal RLS/invitation publication available; production record counts preserved.
- [x]83 embedded SQL assertions and release build passed.
- [x] GitHub CI and Pages succeeded at13583f1.
- [x] Live version0.2.0 and general login copy verified in two browser contexts.
Not performed: authenticated live create/invite/accept writes and email delivery because current application session expired; no unsolicited test messages sent.

## P08 — 15/10/2026
Baseline and daily QA started; results pending. No new live authentication or realtime proof claimed.

P08 baseline:53 app tests,83 SQL assertions, lint/build passed. Browser demo capacity/revoke/reinvite/create/select/save expense/reload/isolation and320px checks passed. Live login smoke passed; cloud authenticated flows/email and concurrent services not run (no app session, Docker down). Copy correction browser verified. Security underway; release not yet approved by checks.

P08 final local release checks:53 app tests,95 SQL assertions/5 suites on9 migrations, lint/build and npm audit0 passed. S01 failed-before/passed-after proof. Shared workflow chain/permissions independently reviewed. Browser Excel roundtrip2 unchanged rows,0 changes/errors. Simplify4 local passes clean; scoped agent docs accurate. Production preflight confirms target and missing privilege fix; release underway.

## P08 production result — completed15/10
- [x] Exact grant migration applied on matching project; table/column INSERT denied for authenticated and anon, create/respond RPC execute retained. Production record counts unchanged.
- [x] Code0f2d8af CI38740031478/Pages38740031692 success.
- [x] Final note commitc82d97bf7ebf6b53f84b29780800bddaccd3b0b3 CI38740411883/Pages38740411568 success. Pages verify,build,deploy jobs all success.
- [x] Live login renders and app-version0.2.1 rechecked after final deployment.
- [x] Release report, schedule and next-day priorities saved; current-session diff reviewed; worktree clean.
Remaining extended QA: authenticated cloud/email/Realtime/concurrent DB sessions; recorded for16/10 with C01 expense reassignment consistency. No additional blocking finding in scoped patch.

P09:24 cloud read-only migration-effect checks passed; exact2 missing versions repaired through official CLI; all9 list entries match; db push dry-run/skip-vault has no work.95 SQL regressions pass; business production record counts unchanged. No historical migration edits or user data writes.

P09 complete: documentation commit007d594 CI38741826088/Pages38741826230 success; all migration/history/data-preservation gates passed. No pending migration after dry-run.

P10:5 regression failures before fixes,8 focused tests/58 total tests passed after; lint/build/audit0. Browser demo pending/no-pending/focus/capacity transitions and320px passed. Scoped local security/simplify no new finding. Cloud authenticated view remains not performed.0.2.2 release underway, no SQL needed.

P10 final:CI38743778496 and Pages38743778575 success on24e8b57; live public0.2.2 confirmed. Current-session tests58/lint/build/audit0, hosted shared QA includes95 SQL assertions; no new migration. Authenticated cloud UX not performed, demo and component tests cover UI cases.

P11 local:59tests/lint/build/audit0;13 focused with2 failed-before versionregressions. Browserkeyboard/selector/version/removedlabel and responsivecorrected scrollWidth=clientWidth305 passed. Security/simplifylocalpasses clean. No authenticatedcloudUX check; nomigration. Deploymentpending.

P11 final:CI38746599479 and Pages38746599434 success on2d50f47. Public app-version0.2.3/login verified; screenshot saved.59app tests/95SQL hosted gate, lint/build/audit0 passed. No authenticatedcloudgroup QA claimed.

## P12 — 16/10 (Claude Code, E012)
- [x] C01 failed-before (2/6) / passed-after (6/6) pgTAP.
- [x] 101 SQL assertions/6 suites/10 migrations; 59 app tests; lint; build; audit 0.
- [x] Scoped security + simplify (same agent): no finding.
- [x] Production read-only: 9 migrations, 0 participants outside trip.
- [x] UAT (local full stack): magic link/expired link, Realtime two sessions, concurrent edit + invite race passed.
- [ ] NOT PERFORMED: hosted email delivery and hosted Realtime.
- [x] Go-live 0.2.4: migration applied, CI/Pages success, live 0.2.4; 5 production actual-0 expenses set NULL per user approval.

## P23 / E024 — 17/10/2026
- [x] Primary and dedicated worktree baseline synced to production 6becd6f; pre-existing primary ignore changes preserved.
- [x] npm ci; 129 app tests/23 suites; lint; demo build; 270 embedded SQL assertions/15 suites/21 unchanged migrations.
- [x] Production CI 39040577866 and Pages 39040577859 success; public metadata 0.9.3.
- [x] Two independent read-only docs reviewers; relative Markdown links/manifest/obvious credential-pattern scan (37 docs); whitespace checks.
- [x] Coordinator docs-only ITS and simplify reuse/behavior/quality/efficiency passes; no runtime changes or outstanding finding.
- [x] Portable workflow, same tracker, relative links and release reconciliation prepared for Git sharing.
NOT RUN: fresh full-stack/browser/hosted authenticated QA, hosted migration history, real Google/email/Realtime. No runtime/schema edits justify rerunning service tests for this docs package; remaining release follow-ups remain explicit. Local dependency engine warning and existing build warnings retained. Push not authorized/performed in P23.

## A029 / E025 — Sanitized remote handoff
- [x] Private original preserved outside tracked tree; shared historical evidence minimized and unnecessary financial/internal details removed.
- [x] Fresh branch from 6becd6f; original unsanitized candidates excluded from outgoing ancestry.
- [x] 38 file snapshot checks: credential/private-history patterns, no outgoing binary, relative links/manifest and whitespace passed; positive/negative scanner controls passed.
- [x] Package 1f8c3df pushed non-force; exact remote branch SHA independently read back.
- [x] Shared completion checkpoint prepared for the same authorized branch. No runtime/schema/CI changes, main merge or deploy.
Limits: pattern/manual review is not a proof against arbitrary encodings/steganography; pre-existing remote history was not rewritten or comprehensively audited.

## P28 / E044 — 28/10/2026
PASS: 155 app tests, 298 embedded SQL assertions, lint, demo build, audit high gate, diff whitespace; desktop demo selection/confirmation/cancel. Same-agent scoped ITS passed. Three existing moderate dependency findings.
NOT RUN: full Supabase upgrade/services/concurrent sessions/actual Realtime delivery/mobile/hosted UAT and production rollout.

## P28 / E045 — full-local UAT and ITS, 28/10/2026
| Check | Result |
| --- | --- |
| Local forward migration rehearsal / full Supabase pgTAP | PASS: only missing migration applied once; 298 assertions |
| Concurrent edited selected row / duplicate deletes | PASS: no partial deletion; one duplicate succeeds |
| Actual SDK and two-browser member Realtime | PASS: trip event delivered, member list refreshed without reload |
| Select subset / multi-day / stale confirmation / select all / reload | PASS |
| Expense, participants and membership preservation / trip date protection | PASS |
| Actual 320px / 375px viewport, list and confirmation | PASS, no horizontal overflow |
| Final 0.13.0 app tests / lint / demo build / audit-high | PASS: 155 tests; 3 existing moderate audit findings |
| Scoped ITS | PASS, same-agent review; see scoped report |
| Browser console / automated local advisor | NOT VERIFIED: collection timeout / no parseable CLI output |
| Hosted production, CI/Pages release and smoke | NOT RUN: pending current-batch go-live approval |

## P28 / E046 — production release, 28/10/2026
PASS: production migration 20261028163323 applied once with canonical history and tested definition/grants. PR #16 CI 40730599697; merge 58b2906; main CI 40730811586; Pages 40730811820 verify/build/deploy. Public HTTP 200/version 0.13.0. Existing authenticated read-only browser: itinerary route, selection controls and initially disabled bulk-delete button present. No production data deletion/smoke writes. Screenshot capture timed out; no screenshot claim. Local console/advisor limitations remain; hosted destructive/concurrency UAT not run.

## P28 / E047 — final docs publication, 29/10/2026
PASS: docs PR #17 CI 40731357042; merge acc310a; main CI 40731549138; Pages 40731548893 (verify/build/deploy); final public HTTP 200/meta 0.13.0. Docs-only follow-up, unchanged application behavior. No additional production data-write tests.
Separate Dependabot update run 40730842281 FAILED: existing fast-uri update not possible under current dependency constraints. CI/audit-high/Pages PASS; dependency maintenance deferred outside this release.

## P29/P30/P31 initial automated QA — A053/E049
PASS: 167 app tests, lint/demo build, 345 embedded SQL assertions, audit-high/diff whitespace. Existing 3 moderate dependency warnings unchanged. Full-local/browser/concurrency/scheduler/ITS pending under A054.

## P29/P30/P31 final candidate — 29/10/2026
0.14.0: 168 app tests, lint/build, 353 embedded and full-local SQL assertions PASS. Hardening regression covers trip/payload/deletion-instance binding; updated real SDK transport and demo restore tests PASS. Independent delta reviewer found no actionable defect; original High resolved, eight new pgTAP assertions pass in both engines. Three existing moderate audit findings remain; high gate passes. Prior actual browser owner/member/mobile/Realtime/concurrent-write/scheduler QA under E050 passed. Browser was not replayed after timestamp-only RPC fix. Production unchanged at 0.13.0; fresh go-live approval required.

## A056/E052 dependency remediation
Vitest4.1.12 and fast-uri3.1.9: clean npm ci, 168 app tests, lint/TypeScript/build, 353 embedded SQL PASS. npm audit --audit-level=low: zero vulnerabilities. Package set unchanged, no override/dependency added. Prior full-local SQL/browser evidence retained; not repeated for dependency-only patch.

## 0.14.0 go-live E053
Customer approved; PR18 b732461, CI40794182415/mainCI40794364399/Pages40794364198 PASS. Four missing migrations applied once after private schema/data backup; subsequent dry-run empty. RPC grants/signatures/trash constraints/Realtime/hourly cron verified. Public HTTP200/meta0.14.0; authenticated UI0.14.0, move/clone/trash open/cancel, zero console errors. No production data writes for smoke or actual expiry/backup restore rehearsal.

## A063/E059 P34 expense trash (candidate 0.16.0)
178 app tests, lint, demo build, audit-high 0, 406 embedded and 406 full-local SQL PASS. Demo browser and two-account full-local Realtime UAT PASS (delete, visibility, former-member refusal, owner restore). Same-agent ITS: no blocking finding. Not verified: hosted Supabase/expiry run. Go-live approval pending.
