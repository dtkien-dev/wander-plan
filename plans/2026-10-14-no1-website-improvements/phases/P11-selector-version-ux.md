# P11: Version badge and coherent trip selector
Status: Completed
Depends on: P10
Wave:11
Subagent: Not eligible — small shared UI patch; coordinator-only local checks.
Owned scope: AppShell/version badge; TripManager select/CSS; GroupPage redundant badge; tests/metadata/release notes.
Produces: Visible real version, cohesive accessible trip selector, simpler Group header, verified0.2.3.
## Tasks
- [x] Review current component/style/test callers and preserve existing app conventions.
- [x] Implement version from package source, selector visual states and remove redundant collaboration badge.
- [x] QA regressions/full suite/lint/build and browser desktop/mobile/keyboard/reduced motion.
- [x] Scoped local security and simplify reviews; no permission/API changes.
- [x] Publish after gates, verify CI/Pages/live and record release/next days.
## Intended Logic
Version matches actual release, never use example version as a fake value. Native select keeps label, keyboard/mobile behavior, disabled response state and trip-ID selection. Match existing palette/radii; focus visible, reduced motion respected. Remove vague status rather than invent synchronization guarantees.
## Verification and Acceptance Gate
Version contract in demo/cloud; selector changes selected ID and disables during response; owner controls/selection isolation tests pass. Desktop/mobile no overflow, focus visible. Deployment and version verified; disclose no live authenticated group test.
## Recovery
Compatible frontend revert; no schema changes. Keep existing data/cache/auth behavior.

Completed15/10:0.2.3 published at2d50f47; CI/Pages/public version verified, release and next-day notes saved. No SQL or permission change.
