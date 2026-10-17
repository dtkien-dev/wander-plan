# P26: Toasts with local history and Excel auto-fit
Status: Awaiting go-live approval
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
- [ ] Go-live approval, merge, verify live 0.12.0.

## Recovery
Frontend revert; no database change.
