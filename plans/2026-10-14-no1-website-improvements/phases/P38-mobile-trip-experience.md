# P38 — Protect editing and act from Today

Status: released0.18.0 · 01/11/2026 · A078/E074
Owner: primary agent, serial implementation and review.
Branch: feat/mobile-trip-experience from fetched origin/main 5eb5674.

## Authorization and scope
Customer requested implementing the proposed next batch through the repository workflow. Execute priorities 1 and 2 recommended in the preceding response. Current-batch go-live approval remains a separate final gate.

Protect modal editing (itinerary, expenses, trip create/settings, checklist, clone/reschedule and Excel preview) against accidental close, Escape, backdrop and browser navigation. Block leaving during pending writes. Keep form input and inline errors on failed saves. No server/browser draft persistence, new dependencies, SQL or access/money changes.

Today: open a read-only activity detail sheet with full dates/times, address, estimate and notes; show a validated Google Maps link when present, identify next activity through existing status, retain day-board identity and multi-day semantics. No fabricated map destination.

## Acceptance
1. Unchanged forms close directly; changed forms offer continue/discard, restoring original focus and preserving inputs on continue.
2. Cancel, close, Escape, backdrop and browser Back/route changes use the same protection. Reload/close gets the browser-native unsaved warning where supported. Pending saves cannot be abandoned or submitted twice.
3. Failed saves preserve input and allow retry; successful saves close without discard prompt. No draft crosses account/trip boundaries.
4. Today activity details are readable and keyboard accessible, preserve multi-day start/end dates, and expose only https Google Maps links. Missing links have clear copy.
5. Chromium demo viewport matrix 320/375/390/768/1280 and short height, both themes, keyboard/focus, long text; no horizontal overflow, controls >=44px. Physical keyboard/Safari limits recorded accurately.

## Reach and verification
Shared Modal, navigation entry point, form owners/cancel callers, Dashboard and local styles, meaningful behavioral tests. Preserve HashRouter URLs, lazy routes, error recovery and account/trip remounts. Read existing callers/tests before edits. Run focused tests, npm test/lint/demo build, unchanged embedded SQL, dependency audit; browser demo UAT then same-agent scoped ITS, privacy/diff review. Prepare candidate release and rollback before asking go-live approval.

No push, production configuration/data changes or deployment authorized by this action.

## Result — 01/11/2026
Status: local QA/ITS complete; awaiting fresh customer go-live approval.
201 app tests, lint/demo build,406 embedded SQL, audit-high/production audit and lock equality PASS. Actual demo browser Back/stay/discard, persistent create editor closure, scroll recovery, form cancellation, expense save/reload, Today details/Maps and keyboard focus PASS;320–1280/reduced-height current-dark viewport matrix PASS. Fixed QA findings are in scoped ITS report. Live light/physical-device/Safari/native keyboard/native unload/full hosted gaps remain explicit in release note. No migration/dependency change. Metadata0.18.0, local branch only; resolve commit via Git log. Next gate: customer approval of docs/releases/2026-11-01-0.18.0.md.

## Released01/11/2026
A078 approved; PR34 df9bd12 (head3da897c/CI41317406891), main CI41317557088/Pages41317557092 PASS. Public/authenticated0.18.0 and375px itinerary/expense open+cancel smoke PASS; no data writes/migration. Current preview day empty so hosted activity-details opening not exercised; demo evidence retained. Docs closeout on docs/release-0.18.0. All coverage limits remain explicit in release note.
