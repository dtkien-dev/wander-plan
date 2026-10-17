# P13: Trip dropdown and expense date ranges
Status: Completed
Depends on: P12
Wave: 13
Owner: Claude Code (E013)
Owned scope: see evidence E013 claimed files.
## Tasks
- [x] PO/BA: requirements, customer decisions, roadmap file.
- [x] IT: migration + pgTAP; types/repository/form/list/Excel/demo; custom listbox.
- [x] UAT deploy (local full stack) and QA test cases.
- [x] ITS scoped security scan and report.
- [x] ITO go-live (migration, release, CI/Pages, live check).
- [x] PO release notes and next plan.
## Acceptance
See roadmap R01–R03.
## Recovery
Frontend revert compatible while no ranged rows exist; afterwards old frontend clears end_date on edit — prefer forward fix. Migration additive (column/check/trigger/function); remove via forward migration only.
