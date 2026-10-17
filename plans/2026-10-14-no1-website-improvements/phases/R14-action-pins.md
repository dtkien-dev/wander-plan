# R14: Immutable GitHub Action references
Status: Completed
Depends on: P14 completed
Wave: 17
Owner: Codex coordinator; no delegation for small coupled workflow patch.
Owned scope: .github/workflows/ci.yml, .github/workflows/deploy-pages.yml; README maintenance instructions, docs/releases/2026-10-16-action-pins.md; canonical tracker/roadmap/schedule.
Produces: Seven external action references pinned to full official commit SHAs, readable version comments, maintenance procedure, passing CI/Pages.

## Tasks
- [x] PO/BA: select ready R14; verify clean baseline and existing workflow contract.
- [x] IT: resolve current major tags in official actions repositories, pin full SHAs with version comments; preserve all other workflow semantics.
- [x] QA: YAML parse/semantic comparison, full-reference/provenance checks, existing tests/build/audit through hosted verification.
- [x] ITS/simplify: scoped workflow authorization/source review and four local simplify passes.
- [x] ITO: non-force push only after local checks, verify hosted CI/Pages and public version0.5.0.
- [x] PO: maintenance/release notes and roadmap/checkpoint.

## Acceptance and integration
All seven external uses resolve to verified40-character commit SHAs from official repositories; local shared workflow reference stays local. Verify trigger/input/job/permissions/needs/env semantics unchanged. CI and Pages verify/build/deploy pass; app remains0.5.0. No new dependency/secret/configuration scope. Check exact pins against official refs, including annotated-tag peeling if needed.

## Recovery
If a pinned action fails, diagnose action commit compatibility and select a verified compatible official commit; never weaken QA/permissions to bypass failures. Revert workflow change if necessary; database and application behavior unchanged. Preserve worktree and primary checkout edits.

Completed16/10: pins4bf0f0f and maintenance docs ac051e8 non-force pushed; CI38905743762 success, Pages38905743731 verify/build/deploy success; publicHTTP200/app-version0.5.0. Hosted gate ran85 application tests/166 SQL plus lint/audit/build. Worktree clean/retained; no database changes. Archive rules arrived during this batch and are recorded as R05 follow-up.
