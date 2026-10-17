# P16: Settlement payments marked by the recipient (R06)
Status: Completed
Depends on: P19 completed
Wave: 20
Owner: Claude Code coordinator (E020); sequential, shared expense/cache contracts.
Owned scope: new forward migration + pgTAP for settlement payments; types/repository/demo/cache (WorkspaceProvider/useWorkspace); expenseSettlement lib + tests; ExpensesPage settlement section + styles/tests; README/AGENTS/release/version; canonical record/roadmap/schedule.
Produces: Recipient-confirmed payment records that reduce computed balances; undo by the recipient; history retained.

## Accepted rules (customer, 16/10/2026)
- Only the recipient (B in "A trả cho B") may mark a transfer paid and undo that mark.
- A mark is stored as a payment record "A đã trả B X đồng"; balances are recomputed from expenses minus recorded payments, so later expense changes show the new remaining difference. Records are history, not flags on computed transfers.

## Design (BA/IT, no new business rule)
- Amount recorded equals the currently suggested transfer amount (one action, no partial amounts in this batch).
- Undo is a soft delete (`deleted_at`) so Realtime can propagate removal, matching checklist convention.
- Writes go through member-authorized RPCs, EXECUTE to `authenticated` only; direct table writes revoked; archived trips hidden like other content. Removed members' payment rows are retained.
- Not in scope: payment processing, Excel export/import of payments, partial amounts.

## Tasks
- [x] IT: migration + pgTAP (recipient-only, active member, archived hidden, positive amount, undo, direct write denial).
- [x] IT: settlement math, repository/demo/cache/Realtime, Expenses UI with focused tests.
- [x] UAT/QA: full app/SQL/lint/build; two accounts mark/undo/Realtime/reload, expense change after payment, mobile 320/375.
- [x] ITS/simplify: scoped authorization review; correct and retest.
- [x] ITO: preflight, migration before frontend, release 0.8.0, CI/Pages/public verification.
- [x] PO: release notes, roadmap/schedule/checkpoint.

## Recovery
Forward database repair; payment rows never hard-deleted. Frontend revert is compatible (old UI ignores the new table).

Completed 16/10: release 0.8.0 at 0c124eb; 97 app/223 SQL, two-account UAT and mobile pass; migration 20261016210500 applied, counts unchanged; CI/Pages/public 0.8.0 verified.
