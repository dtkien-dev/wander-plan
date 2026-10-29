# Scoped security review — 0.14.0

Scope: P29 itinerary trash, P30 trip rescheduling, P31 template cloning; baseline 3d7403c. Independent read-only Access, Business/API, Unsafe Sinks and Platform reviewers, followed by coordinator adjudication.

Confirmed High: trash keyed only by item ID could replace the snapshot with another trip's payload. Fixed through forward migration 20261028235649 with composite trip/item key, snapshot identity constraint, explicit authorized restore identity and mandatory original deletion timestamp. Old unbound RPC removed. Eight SQL regression assertions pass on embedded and full Supabase, including revoked membership and stale same-ID/version deletion requests. SDK/demo contracts updated.

Business/API independently reviewed the final hardening delta with no actionable issue and ran 26 repository tests. Access reviewer rerun failed at the tool service; no independent second Access proof claimed. Original independent proof and coordinator full-local regression provide before/after evidence. Other lenses found no additional security blocker. Platform identified accidental lockfile engine edits; restored without dependency changes.

Final: 168 app tests, lint/build, 353 embedded/full-local SQL and audit-high pass. Three pre-existing moderate dependency warnings remain. Actual browser/mobile/Realtime/concurrency/scheduler evidence is E050; timestamp-only delta was verified by transport/demo/SQL, without another browser replay. No production tests or deployment.

A056/E052 customer-authorized dependency follow-up resolves the three previously retained moderate warnings. Vitest/@vitest/mocker4.1.12 and fast-uri3.1.9; no overrides/new packages. npm ci/audit-low zero findings, 168 app and 353 embedded SQL/lint/build pass. Prior paragraphs describe the pre-patch checkpoint.
