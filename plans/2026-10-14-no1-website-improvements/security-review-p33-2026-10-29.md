# P33 scoped security review — 29/10/2026

Findings (remediated)
- High: inherited direct membership DELETE let new co-owners/site admins bypass settlement-aware removal. Catalog/policy tracing verified the path. Forward `20261029122209_harden_co_owner_revocation.sql` revokes DELETE; grant/direct-delete denial regressions and final catalog confirm closure. UPDATE remains revoked.
- Medium: archive RPC authorized a co-owner before waiting for its trip lock, then could archive after concurrent demotion. Coordinator reproduced with two actual local sessions. Hardening rechecks registry/creator/current-owner authority after lock acquisition; identical race changes from stale archive success to denial/no archive. Authorized archived restore still works.

Independent coverage
- Access Control: registry/metadata spoofing, grants, creator protection, direct table paths, account/cache isolation and Realtime. Independently rechecked final DELETE/archive delta and ran389 embedded assertions; no remaining actionable finding.
- Business Logic/API: role/lock serialization, widened access helpers, recipient membership, frozen money, consent/seats, removal balances, checklist/archive/clone/reschedule and origin cache. Independently rechecked fixes and389 embedded assertions; no remaining actionable finding.
- Platform/Supply Chain + Unsafe Sinks: bootstrap literal quoting/verified account, default grants/search_path, registry RLS, React escaping, structured RPC inputs and version-only lockfile delta. No actionable finding; catalog checked.
- Coordinator adjudicated findings and owns actual race/browser evidence. Bounded multi-file review, not whole-repository assurance. Reviewers did not edit files, inspect ignored credentials or contact production.

Checks:175 app tests, lint/TypeScript/demo build,389 embedded/full-local SQL assertions, audit zero, local security advisor no issues, whitespace PASS. Actual two-browser promotion/demotion Realtime; admin non-member access and polling/cache revocation;320/375px without horizontal overflow after label fix; concurrent promotions and demotion authorization PASS. Synthetic bootstrap confirmed/idempotent/missing/unconfirmed cases PASS. Zero captured console errors.

Limits: no production/hosted tests/admin grant or independent replay of coordinator's concurrency test. Registry governs new requests; already-authorized in-flight direct RLS edits may finish. Active status/global lists poll15s; offline copies cannot be erased. One earlier embedded run intermittently failed an unchanged trash-provenance timing case; later embedded/full-local runs passed, no trash fix claimed.

Conclusion: scoped QA/ITS candidate ready for separate current-batch go-live approval. Both forward migrations precede frontend and controlled bootstrap.
