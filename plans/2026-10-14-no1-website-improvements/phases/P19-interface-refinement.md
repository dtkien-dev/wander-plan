# P19: Unified interface refinement
Status: Completed
Depends on: R05 completed
Wave: 19
Owner: Codex coordinator, serial shared-style changes
Owned scope: shared styles/tokens, shell/toolbar and all route UI/components, directly related interaction tests, release/version/docs, canonical records/roadmap/schedule and ignored local browser evidence.
Produces: Cohesive compact website interface, Group information hierarchy and one verified release0.7.0.

## Tasks
- [x] PO/BA: inspect all routes/components on desktop/mobile, define coherent changes using existing green identity.
- [x] IT: Group settings/profile disclosures and clear member/checklist/archive hierarchy; retain permissions, feedback, capacity focus and data behavior.
- [x] IT: refine shared typography/spacing/surfaces/navigation/toolbar and Dashboard/Itinerary/Expenses/Login/forms/states as warranted.
- [x] QA: focused interaction regressions, full app/lint/build, responsive320/375/768/desktop, forms/keyboard/empty/error and UAT cloud-role checks where available.
- [x] ITS/simplify: scoped security and four simplify passes; agent routing update if substantial new contract.
- [x] ITO/PO: single0.7.0 commit publication after gates, CI/Pages/public verification, release notes/roadmap/checkpoint.

## Acceptance
All screens inspected; clear hierarchy, contained long names and money, usable touch and keyboard controls, visible focus and reduced-motion support. Owner edit settings remains reachable, capacity action opens and focuses control, non-owner cannot edit. New profile disclosure retains own-name save/retry. Archive/restore/checklist/invitations/Excel/auth/cache unchanged. No DB schema or production test writes. No new dependencies required.

## Recovery
Compatible frontend revert or forward UI fix; retain existing database/data and dedicated worktree. No per-page deployment; publish all reviewed changes together.

Completed16/10: unified0.7.0 at eff7495;92 app tests/201 SQL/lint/build/audit0, all-route320/375/768/1280 and900/901/1024 boundary checks. Group owner/editor UAT and dialogs verified. CI38910916980/Pages38910916845/public version and correct Vietnamese metadata confirmed. No database migration/production data writes. Worktree retained; executeActive.
