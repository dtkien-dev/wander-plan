# P22: Lock money on expenses with former members + mock UAT of unverified paths
Status: Completed
Depends on: P21 completed
Wave: 23
Owner: Claude Code coordinator (E023).
Owned scope: new forward migration + pgTAP (money lock, payment guard); ExpenseForm locked mode, ExpensesPage delete lock, SettlementPanel undo lock, travelExcel locked rows, demo repository + tests; README/AGENTS/release 0.9.2/version; canonical records/roadmap/schedule; ignored local mock evidence.
Produces: A024 money lock; mock UAT evidence for Excel/.ics browser download+re-import, Google OAuth return path, email/Realtime on the local stack.

## Accepted rules (customer)
- A024: on an expense involving a former member (payer or participant who left), estimate/actual, split method/values, payer and participants cannot change and the expense cannot be deleted; title, category, dates and notes stay editable. (Settlement payments involving a former member are kept as recorded.)
- Customer asked to verify the remaining unverified paths with simulated/mock UAT instead of real Google/hosted services.

## Tasks
- [x] IT: DB lock + payment guard + pgTAP.
- [x] IT: form/list/settlement/Excel/demo + tests.
- [x] Mock UAT: Excel export captured in browser and re-imported through the file input; .ics content validated.
- [x] Mock UAT: Google button → authorize request; simulated OAuth callback session for a Google-identity user; hook blocks unknown Google account; email via Mailpit; Realtime two sessions.
- [x] ITS/simplify; release 0.9.2; customer approved; go-live verified.

Completed 17/10: release 0.9.2 at ea623eb; migration 20261016240000 applied, counts unchanged; CI/Pages/public 0.9.2 verified.
