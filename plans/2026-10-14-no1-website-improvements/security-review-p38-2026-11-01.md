# P38 — Scoped ITS and correctness review

01/11/2026 · A077/E073 · feat/mobile-trip-experience from5eb5674.
Reviewer: implementing primary agent; this is not an independent review.
Result: no remaining scoped blocker after remediation and verification.

## Boundaries checked
- No changes to repository/RPC/SQL/RLS/authentication, membership consent, expense splitting, former-member money locks, settlements, storage keys or CI/deploy configuration. All existing application tests and406 unchanged embedded SQL assertions pass.
- Form guard markers contain booleans only; no draft data is copied into storage, URLs, messages or another identity. Account/trip keyed remounts and lazy route/error-recovery structure remain. createHashRouter preserves existing hash paths while enabling the installed router's navigation blocker.
- Dismissal uses the shared in-app Modal; native beforeunload is used only for browser-owned reload/close. Pending markers stop local close and route discard. Forms are inert while submitting; itinerary/expense submit and cancel buttons also use RHF isSubmitting. Successful save callbacks bypass the discard prompt; failures retain input and inline errors.
- Explicit navigation discard closes dirty persistent shell editors via a local event. Its listeners do not persist data or change access. Pending writes are rechecked at the final discard click; the navigation confirmation itself is not a dirty editor.
- Today details resolve the selected ID against the active trip data. All content remains React-escaped. Maps links use the existing https Google-host validator and noreferrer; no URL is invented from an address. Actual/estimate accounting and multi-day semantics are unchanged.
- No dependency changes: parsed lock differs only in root package version. npm audit-high passes with existing11 moderate dev-tool records; production-only audit0 findings.

## Findings fixed during QA
1. Persistent create-trip form survived confirmed route discard. Added explicit dirty-editor dismissal and a regression using an actual persistent shell/Modal and router.
2. Multiple dialogs could restore body overflow in the wrong order during route unmount. Shared Modal scroll-lock count now restores the original overflow only after the last dialog closes. Regression and compiled-browser Back/discard confirm recovery.
3. Existing constant modal title ID and Escape handlers were unsafe with the new navigation dialog over an editor. Each modal now has a unique useId title and only the top dialog handles keys; blocked background is inert.

## Evidence and limits
201 application tests/35 files, lint, TypeScript/demo build,406 embedded assertions, lock equality and whitespace checks PASS. Targeted old-source control:10 of11 new Modal/Dashboard cases fail on the preceding implementation; current implementation passes. Form failure/retry/pending behavior is covered at actual page boundaries. No test-only production interfaces added.

Chromium local-demo checks include Back stay/discard, persistent editor closure/scroll recovery, form cancellation, expense save/reload, activity details/validated Maps href, Tab loop/Escape/focus return and320–1280 CSS widths plus375x320. Current dark theme only; zero final compiled-browser warnings/errors. Browser automation date fill did not notify React; real ArrowUp keyboard input changed controlled state and the date-discard warning passed. No application fix was inferred from that automation limitation.

NOT RUN: physical device/Safari/WebKit/native keyboard/screen-reader, live light theme, full Supabase/hosted multi-user/concurrent writes, hosted CI or production smoke. beforeunload handling is verified in DOM tests; actual native unload prompting and mobile process termination are not guaranteed and are not draft recovery. No production changes or publication performed.
