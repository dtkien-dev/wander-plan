# P39 — Scoped ITS / correctness review

01/11/2026 · A079/E075 · primary implementing agent; not independent.
Result: no remaining scoped blocker in the candidate. Physical iOS validation remains an explicit release limit.

Production delta is shared CSS plus0.18.1 metadata. No changes to components, handlers, registrations, validation, amounts/splits, former members, auth, RPCs, SQL, localStorage keys, CI/config or external data transmission. Parsed lock equality confirms no dependency delta. Existing201 application tests/406 embedded SQL assertions/lint/build and audit-high PASS.

Native select styling remains auto (not replaced by a custom picker); containment is at its parent field. That field gets a2px token-based focus outline so clipping does not remove the usable focus indicator. Both themes, select changes, equal control widths and scroll/action bounds are checked. No document-wide clipping or zoom disabling. Date/time input attributes are unchanged; appearance styling does not add a custom picker or change payloads. Native iOS behavior cannot be certified from Windows WebKit's text fallback and is not claimed.

New optional browser script is a local-demo regression tool, not a shipped app module or CI/dependency addition. It only accepts loopback targets, requires the demo badge, isolates fresh browser contexts, stresses synthetic names/text and never submits saves. It checks layout and interaction instead of reading/mirroring CSS source. Regression failed against old CSS with a643px modal scroll region and passes after containment. No test-only production interface. Playwright runtime/browser binaries installed outside the repository, with no credentials or private fixtures committed.

Compatibility: current WebKit/Chromium light/dark188-case compiled matrix PASS. Windows WebKit native date/time is unsupported here; physical iPhone13/Safari, actual keyboard/touch, real screen reader, hosted writes and concurrent sessions NOT RUN. Impeccable detector only reports existing type-ramp advisories. Existing11 moderate dev-tool audit records retained,0high/critical. Rollout/physical-device checks and revert plan are in docs/releases/2026-11-01-0.18.1.md.
