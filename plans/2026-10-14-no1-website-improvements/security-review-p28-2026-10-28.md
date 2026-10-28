# P28 / 0.13.0 — scoped ITS, 28/10/2026

Findings
- No reachable blocking vulnerability found in this diff. This is a scoped review, not a whole-repository assurance.

Reviewer Coverage
- Mode: sequential local passes by the implementing agent, not independent review; small single-purpose diff.
- Access Control: actual authenticated editor/outsider RPC calls rejected; anonymous EXECUTE revoked; owner helper requires active trip; authorization repeated after trip lock. pgTAP covers archived/cross-trip/invalid inputs and grant boundaries. Catalog read confirms fixed search_path and authenticated-only grant.
- Business Logic/API: selected IDs/versions matched in one DELETE; affected count mismatch raises exception and rolls back. Actual concurrent edited-row transaction rejects stale batch without partial deletion; duplicate simultaneous requests produce one success. New/unselected items are excluded from the explicit selection. Trip UPDATE delivers actual member Realtime event and refreshes the second browser UI.
- Unsafe Sinks: typed UUID/integer JSON recordset and parameterized SDK RPC; no dynamic SQL, shell, HTML injection, fetcher or new URL surface in shipped change. React renders titles/errors as text.
- Platform/Supply Chain: no dependency version/config/CI change. Only release metadata moves to 0.13.0. Existing shared CI remains deployment prerequisite; new additive migration must precede frontend. Local credential fixtures are ignored, sessions revoked and files removed. Audit high gate passed with three existing moderate findings (Vitest tooling and optional AJV/fast-uri dependency); production uses Zod resolver, no new AJV path.
- Cache/session: mutation captures originating identity/trip; existing App identity/trip remount boundaries preserved. No new subscriptions or selection changes after late writes.
- AI/LLM: not applicable.

Checks Run
- 155 app tests, lint, demo build, 298 full-local SQL assertions; prior 298 embedded SQL; audit high gate; SQL catalog grants; SDK/API concurrency; actual owner/member browser UAT, readback and responsive 320/375 px.

Residual Risk
- No hosted production write/exploit testing or independent reviewer. Browser console collection timed out; zero-console-error claim is not made. Local advisor CLI produced no parseable result, so advisor is unverified; permission/catalog/tests/manual review are separate evidence.
- Permanent deletion is intentional. Expenses/members retained; out-of-range expense dates continue to block trip-date changes. Frontend rollback retains additive RPC; restoring deleted records requires backup/reimport and is not automatic.

Summary
- QA/ITS candidate ready for customer go-live decision; no production approval inferred.
