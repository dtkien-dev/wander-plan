# P37 / 0.17.2 scoped correctness and ITS review

Date: 01/11/2026 Asia/Saigon. Reviewer: implementing agent; not independent. Baseline: P36 PR31 head b48f0a7. P37 implementation254139d, integrated base6c99509; final candidate resolved by Git log.

## Result

No actionable correctness defect or reachable security issue found in the scoped diff. No new RPC, SQL, auth, money, persistence, external request, dependency or deployment configuration change.

## Review evidence

- Diff scan: optional text is wrapped in inline spans inside the same labels; input registrations, validation/error rendering, types, min/max/step and submit/cancel callbacks are unchanged. Numeric inputMode is a keyboard hint, not validation.
- Removed-behavior pass: former two-column optional-label selector is replaced by natural inline wrapping; full-width grid spans remain across both tablet columns. Native checkbox/radio state is retained, with their accidental inherited minimum input height removed; selected backgrounds add feedback without changing state.
- Cross-file pass: Modal consumers include expense/itinerary, trip create/settings/reschedule/clone, checklist/profile and confirmations. No signature or pending/disabled guard changes. Modal focus trap, Escape/restore-focus and body scroll lock remain unchanged. Excel and Login keep their existing dedicated layout classes and behavior.
- Trust boundaries: no new rendering of HTML, storage or logs; no new transmitted values or widened access. Form errors and money-lock rules remain in the original code/database. Demo browser tests exercised split mismatch rejection and save/reload; tests cover unchanged financial/validation contracts.
- Supply chain: package and lock changes are version metadata only (0.17.2), with the same dependency graph/integrity. Production dependency audit has zero findings; 11 moderate development-tool findings remain from minimatch/ESLint, as in P36. No forced package migration included.
- Release/privacy: scope and rollback documented; no production writes. Same tracker retains P36 and P37 evidence; P36 approval is not reused for P37. P36 PR31 CI passed, but does not prove this new head passed hosted CI.

## Validation and limits

Fresh Node24.22.1 install,184 app tests/32 files, lint, TypeScript/demo build and406 embedded SQL assertions/21 suites PASS on integrated code. Browser save/reload and30 viewport cases are recorded in E068/E069; final compiled0.17.2 demo itinerary375px and expense768px open/cancel/overflow PASS. An old dev-page lazy import failed when the local server changed to compiled preview; the built-in Reload recovery loaded the final assets successfully. No source defect inferred from that server switch.

NOT RUN: physical devices, Safari/WebKit, actual touch/software keyboard, native theme switching/light theme for P37, screen reader, full Supabase/hosted/Realtime/concurrency and hosted CI for the new head. These are not claimed covered by viewport or embedded tests.
