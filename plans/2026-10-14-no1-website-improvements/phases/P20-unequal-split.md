# P20: Unequal expense splits (R10)
Status: Completed
Depends on: P16 completed
Wave: 21
Owner: Claude Code coordinator (E021); sequential, shared expense contracts.
Owned scope: new forward migration + pgTAP for split method/values; types, expenseSettlement split math + tests; ExpenseForm split UI + tests; ExpensesPage split meta; travelRepository (demo/Supabase); travelExcel import/export columns + tests; README/AGENTS/release 0.9.0/version; canonical record/roadmap/schedule.
Produces: Per-expense equal / shares / exact-amount splits used by settlement and Excel.

## Accepted rules (customer, A020)
- Each expense: equal (default, unchanged), by shares, or by exact amounts.
- Exact amounts must total actual, or estimate while no actual; mismatch blocks saving with the difference shown (no automatic scaling).
- Share rounding: leftover đồng to the payer when the payer participates; otherwise spread one đồng each in the existing fixed order.
- Excel: new columns "Cách chia" and "Chi tiết chia"; files without them import as equal for new rows.

## Design (BA/IT)
- `expenses.split_method` ('equal'|'shares'|'amounts', default equal); `expense_participants.share_units` (1–1000) / `share_amount_vnd` (≥0).
- Deferred constraint triggers validate the whole split at commit, so direct API writes and amount edits cannot leave an inconsistent split.
- Save RPC gains `split_method`/`split_values` (jsonb userId→number). A null method (old cached frontend or old Excel row) on an existing non-equal expense is rejected instead of silently resetting it.
- Settlement counts only actual amounts (unchanged); exact amounts therefore match actual whenever settlement uses them.

## Tasks
- [x] IT: migration + pgTAP.
- [x] IT: split math, repository/demo, form, list meta, Excel, focused tests.
- [x] UAT/QA: full app/SQL/lint/build; two accounts shares/amounts/mismatch block/settlement; Excel roundtrip; mobile 320/375.
- [x] ITS/simplify.
- [x] ITO: preflight, release 0.9.0 — stop for customer approval before go-live.
- [x] PO: release notes, roadmap/schedule/checkpoint.

## Recovery
Forward repair only. Old frontend: equal-split saves still work; editing a non-equal expense is rejected (no silent data loss).

Completed 16/10: release 0.9.0 at 355a60c; 103 app/240 SQL, two-account UAT, mobile, ITS pass; migration 20261016220000 applied, counts unchanged; CI/Pages/public 0.9.0 verified.
