# P24: R11 itinerary overlap warning
Status: Completed
Depends on: P23 completed; production 0.9.3
Wave: 25
Owner: Claude Code
Owned scope: branch feat/itinerary-overlap-warning; src/lib/itineraryOverlap.ts (+test), src/components/ItineraryForm.tsx (+test), src/pages/ItineraryPage.tsx, src/styles/shared.css, version metadata, this phase, tracker records, roadmap, release note. No migration, RPC, Excel or demo-storage change.
Produces: Non-blocking overlap warning in the itinerary form and list (A031).

## Tasks
- [x] IT: overlap helper with [start, end) rule; live warning in add/edit form naming the overlapping activities; list marks overlapping activities.
- [x] QA: unit/component tests, full test/lint/build; browser UAT add/edit/boundary/mobile 320px.
- [x] ITS: scoped review of the diff.
- [x] Go-live approval, ITO deploy and verify, PO release note.

## Acceptance
Same-date activities with intersecting [start, end) ranges show a warning in the form before saving and a marker in the list; touching ranges and different dates do not warn; editing an item never warns about itself; saving is never blocked; old data unchanged.

## Recovery
Frontend-only; revert the commit. No database rollback.

Local result 17/10: commit ab7a517; 136 tests, lint, tsc, demo build, audit 0; UAT local Supabase + uat mode PASS (see release note 0.10.0). Same-agent ITS/simplify: one fix (incomplete draft range no longer warns). Second-account Realtime, remote CI/Pages/live NOT RUN.
Released 18/10 under A032: PR #4 merged as d36d741; CI/Pages succeeded; live app-version 0.10.0 with warning text in the itinerary chunk. Authenticated production smoke not run.
