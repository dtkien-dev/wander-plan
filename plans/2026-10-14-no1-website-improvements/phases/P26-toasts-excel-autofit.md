# P26: Toasts with local history and Excel auto-fit
Status: Completed
Depends on: P25 completed; production 0.11.1
Wave: 27
Owner: Claude Code
Owned scope: branch feat/toasts-excel-autofit; src/providers/NotificationProvider.tsx (+test), src/components/NotificationBell.tsx, src/components/AppShell.tsx, src/App.tsx, ItineraryPage, ExpensesPage, GroupPage, TripManager (+tests), src/styles/shared.css, src/lib/travelExcel.ts (+test); version 0.12.0; AGENTS.md; tracker, roadmap, release note.
Produces: A037.

## Tasks
- [x] Excel auto-fit for report sheets.
- [x] Toast provider, bell history, replace inline feedback.
- [x] QA: 147 tests, lint, tsc; UAT local incl. 320/375/768; four layout findings fixed.
- [x] ITS: same-agent review, no finding.
- [x] Go-live A038: PR #10 merged as cb2d549; CI/Pages succeeded; live 0.12.0 verified.

## Recovery
Frontend revert; no database change.

## A041 / E037 — Browser Excel roundtrip
- [x] In-app browser export/download and actual upload passed; unchanged re-import skipped both rows; edited file applied one update and retained three-day activity/dates/times after reload. Old version blocked with one conflict; console errors 0. No extension permission changes or production access. Evidence E037.

## A039 / E035 — Post-release verification, 18/10/2026
- [x] Automated regression: 147 app tests/26 suites, 281 SQL assertions/16 suites/22 unchanged migrations, lint, demo build and dependency audit (0 vulnerabilities).
- [x] Live 0.12.0; authenticated four-route loading, Excel export success toast and bell entry, later toast disappearance; no captured console errors. Draft multi-day form inspected and cancelled, no save.
- [x] Hosted test-trip request superseded by A040: customer prohibits production access and requests synthetic local UAT. Hosted service behavior remains unverified.

## A040 / E036 — Synthetic local UAT
- [x] Create isolated local accounts/trip and loopback-only UAT app configuration; no production env/session/data copied.
- [x] Browser: multi-day create/reload/list and edit warning passed. Excel export action succeeds; app-code workbook roundtrip and edited/legacy import passed. Browser download event capture timed out and file chooser upload is blocked by extension permission; do not claim browser file roundtrip PASS.
- [x] Two-member Realtime create and import updates without reload; real notification provider with mock success/error triggers, auto-hide/persistence/account isolation passed.
- [x] Local email captured by Mailpit; full local Supabase SQL 281 assertions passed; 11 focused UI/provider tests passed.
- [x] Record results and hosted limits; retain local synthetic data/harness, revoke synthetic sessions, remove credential fixtures, close owned browser tabs and stop owned app server. Existing local stack preserved.
