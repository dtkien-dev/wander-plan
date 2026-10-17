# Security audit — 15/10/2026

## Findings
- [Medium] S01 — direct membership creation bypasses recipient consent. Status: Verified on released baseline; corrected locally and production INSERT privileges revoked under E008.
  Preconditions: authenticated trip owner knows another account UUID and has spare capacity.
  Path: owner INSERT policy plus authenticated table grant permits forced membership; shared-membership profile policy then discloses that account profile without acceptance.
  Evidence: initial migration owners-add-members policy and grant; 004 validates capacity but not consent. Independent full-migration PGlite proof; new membership_consent_test.sql fails six assertions before fix and all12 pass after.
  Fix:202610150001_require_membership_consent.sql revokes INSERT from PUBLIC,anon,authenticated; authorized security-definer create/accept RPCs retain functionality. Production metadata confirms INSERT=false and RPC EXECUTE=true, with rowcounts unchanged.

## Hardening observations
- Pages previously ran independently of CI. Corrected by shared verify prerequisite and dependency audit; Pages/OIDC limited to deploy job. Independent platform recheck passes; hosted execution pending at report creation.
- Maps URL persistence/rendering lacks an HTTPS allowlist; no demonstrated script execution (React blocks javascript links). Follow-up.
- Workbook row cap is enforced after parsing; compressed file size alone is not a decompression bound. No resource-exhaustion proof executed; follow-up.
- Mutable GitHub Action version tags remain a supply-chain hardening opportunity; no compromise evidenced.
- C01 correctness: a member of two trips may directly move an expense while keeping participants absent destination. Verified locally, but no additional authority shown. Track for16/10; do not label as a second security vulnerability.

## Reviewer coverage
Mode: four read-only independent agents for initial broad audit; coordinator owns synthesis/fixes.
- Access Control: effective migration grants/RLS, security-definer RPCs, auth/session; S01 verified, no separate escalation/tenant-read finding.
- Unsafe Sinks: React rendering, maps, Excel, calendar, redirect handling and structured database arguments; no verified exploit.
- Business Logic/API: invitation state/seat locks, trip request idempotency, expense RPC/import; C01 correctness noted, no independent security finding.
- Platform/Supply Chain: lockfile, install/build, CI/Pages, tracked example config; no reachable exploit. Release gating and token-scope corrections independently reviewed.
- AI/LLM: not applicable to application runtime.

## Synthesis notes
Access/logic direct-member candidates merged into S01. Role promotion by an already-authorized owner not treated as privilege escalation without a violated product rule. Cross-trip expense movement remains correctness, not unproven cross-tenant disclosure. Access agent's optional post-fix recheck did not complete; coordinator reviewed the three-role revoke, actual RPC ownership/execute attributes and full SQL regressions. No repeated exploit request or production payload proof.

## Checks run
-53 application tests;95 SQL assertions/5 suites/9 migrations; lint/build passed on0.2.1.
- Failed-before/passed-after consent regression.
- npm audit:0 vulnerabilities.
- Independent unsafe-sinks focused suite26 tests passed.
- YAML parsing and dependency/permission assertions; independent platform recheck.
- Read-only production permission/RPC and aggregate counts before/after minimal migration.

## Residual risk
No live exploit probes. No authenticated end-to-end app/email test, full Supabase Realtime or independent concurrent DB sessions; Docker unavailable and application login absent. Hosted auth/IAM settings and branch protections not comprehensively audited. Embedded identity bootstrap verifies database behavior, not hosted transport. External spreadsheet/calendar clients not exhaustively tested.

## Summary
One verified Medium consent/privacy issue corrected. No other verified security finding in reviewed scope; residual risks remain explicitly scheduled for follow-up. This is bounded testing, not a guarantee that all vulnerabilities are absent.
