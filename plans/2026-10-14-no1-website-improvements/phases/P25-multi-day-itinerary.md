# P25: R11 multi-day itinerary activities
Status: In progress (A035 follow-up awaiting go-live)
Depends on: P24 completed; production 0.10.0
Wave: 26
Owner: Claude Code
Owned scope: branch feat/multi-day-itinerary; migration 20261018000000_multi_day_itinerary.sql + multi_day_itinerary_test.sql; src/types.ts, src/services/travelRepository.ts, src/data/demoData.ts, src/components/ItineraryForm.tsx, src/lib/itineraryOverlap.ts, src/lib/format.ts, src/pages/ItineraryPage.tsx, src/lib/travelExcel.ts (+ tests); version 0.11.0; AGENTS.md routing; tracker, roadmap, release note.
Produces: Optional end date for itinerary activities (A033).

## Tasks
- [x] DB: nullable end_date, time rule only for single day, end date after start and inside trip, trip-date guard, import RPC (same signature) keeps stored end_date when the key is omitted.
- [x] App: model/repository/demo, form "Đến ngày", interval overlap, list under every day, Excel column.
- [x] QA: 141 tests, lint, tsc, demo build, 281 embedded + full local SQL, audit 0; UAT local Supabase + uat mode PASS; one UAT finding fixed (warning showed only times for multi-day clash).
- [x] ITS: scoped review, no finding.
- [x] Go-live approval; ITO: apply migration to production before frontend, merge, verify; PO release note.

## Acceptance
A033 holds in UI, DB and Excel; single-day items, old Excel files and the 0.10.0 frontend keep working.

## Recovery
Frontend revert is safe: the nullable column is ignored by 0.10.0 and the import RPC keeps stored end dates for clients that omit it. Forward fix for the migration; no destructive rollback.
Released 18/10 under A034: migration 20261018000000 applied to production first and verified; PR #6 merged as b113a60; CI/Pages succeeded; live app-version 0.11.0. Authenticated production smoke not run.

## A035 follow-up — readable Excel export (0.11.1)
- [x] Fix text colours, column placement, gridlines and wrap; 142 tests; real workbook inspected; UAT export PASS.
- [ ] Go-live approval, merge, verify live 0.11.1.
