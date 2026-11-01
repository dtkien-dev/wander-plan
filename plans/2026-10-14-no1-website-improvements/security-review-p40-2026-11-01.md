# P40 — Scoped correctness / ITS

01/11/2026 · A081/E077 · implementing primary agent, not independent.
Result: no remaining scoped blocker; physical-device/hosted-write limits retained.

- Summary is derived read-only from schema.safeParse(watch()), existing toDraft and splitExpenseAmount. Invalid required fields/splits cannot produce a valid allocation. No new submit handler or side effect; existing resolver/RPC path remains. Integer/non-negative guards also prevent invalid live share targets being presented as amounts.
- Actual0 uses the existing null-coalescing split target, never estimate fallback. Uniform equal display requires every returned amount to match; leftovers list the exact existing helper allocations. No independent rounding/division formula. Unit/browser checks verify estimates, actual0, payer changes, remainder, shares/exact amounts and invalidation after actual changes.
- Existing former-member detection, locked banner and money fields are unchanged; the new summary is skipped for locked money. Extended frozen-form tests and unchanged SQL assertions pass. No changes to membership/consent, settlement calculation, authorization or RPC expected versions/counts.
- Recipient-only confirm/undo conditions and callbacks remain identical; explanatory copy and accessible payer/amount names clarify the current behavior. Existing confirmation dialogs and pending guards remain. UI name/amount text is React-escaped and visible only inside the same authorized trip view; no notification/history/storage/URL or telemetry added.
- Flat token-based summary CSS retains both themes, nowrap amounts and wrapping names. Existing Safari sizing/native-select/focus repair is retained.188 compiled browser cases cover the extended summary, long names/options, action bounds and both engines/themes without page errors. Actual iOS pickers/keyboard and real screen-reader behavior are not claimed.
- Optional local-demo browser tool only adds read-only form/summary checks and synthetic DOM text stress, with its loopback/demo guard intact; no new production interface/dependency. No private data/fixtures committed.

Evidence:209app tests/406embedded SQL/lint/demo build/audit-high/lock equality PASS. Old-source focused control9fail/14pass demonstrates added behavior is exercised. Demo save/reload and refused mismatched split preserve actual stored amount. No production writes or new-feature publication. Detector7existing type-ramp advisories,0blocking.11existing moderate dev-tool records remain,0high/critical; no dependency changes.
