# Verification
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
