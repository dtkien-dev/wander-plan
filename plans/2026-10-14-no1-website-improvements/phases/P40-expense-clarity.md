# P40 — Idea3: explain money before saving

Status: released0.19.0 · A082/E078 ·01/11/2026
Owner: primary agent, serial implementation and same-agent review.
Branch: feat/expense-clarity from verified0.18.1 app0ca2859 plus published release record9764f76. Reconcile final docs/main before completion.

## Authorization / scope
Customer approves0.18.1 go-live and explicitly asks to continue to the next work. Idea3 is next in the original ordered list. A080 permits local next work after the technical release; physical iPhone13 confirmation remains pending and must not be implied. Ideas4–5 remain subsequent work, not included in this release.

Add a read-only expense summary before Save: who pays, the actual amount (or estimate when actual is absent), participant count and exact allocated shares. Reuse the current schema, splitTargetAmount and splitExpenseAmount. Equal shares may use one per-person sentence only when every result is identical; otherwise list exact shares including leftover dong. Shares/exact amounts must show the same values as settlement. Actual0 must override estimates; never sum actual and estimate. Invalid/incomplete drafts show a completion hint rather than a misleading summary. Keep frozen former-member money banner/behavior.

Clarify settlement copy: balances account for recorded payments, only recipients confirm after receiving the full displayed transfer. Make confirm controls identifiable by payer/amount for assistive technology. No new payment state, partial payments, automatic transfer, money math, permission, SQL, repository, storage or dependency change.

## Acceptance / checks
1. Valid equal900000/3 preview reads300000 each; non-divisible equal, shares and exact splits show exact per-person amounts from the existing helper.
2. Estimate-only says it is excluded from settlement; actual amounts including0 take precedence. Invalid split/amount/participants never shows a valid allocation. User edits remain intact.
3. Former-member money remains frozen; recipient-only confirm/undo and existing confirmation dialog unchanged. Payer/other viewers still cannot confirm.
4. Focused behavioral tests, npm test/lint/demo build/unchanged SQL/audit, same-agent scoped ITS, compiled browser layout and save/reload as appropriate. Retain Safari patch, both themes,320/390/844/768/1280/reduced-height and long names; distinguish Windows emulation from physical iOS.
5. Candidate0.19.0 with reviewable release/rollback records. No publication/main merge until separate current-batch go-live approval.

## Result —01/11/2026
Local candidate0.19.0 complete;209 app/406 SQL/lint/build/audit-high and188 compiled browser cases PASS; demo save/reload/invalid-split refusal PASS. Same-agent scoped ITS clear, no independent claim. Source uses current schema/split helpers, no new money/API/SQL/access/storage/dependency rule. Physical iPhone13/hosted limits retained. Reconciled mainca876df plus final0.18.1 receipt49723b4. Next gate separate customer go-live approval using docs/releases/2026-11-01-0.19.0.md; ideas4–5 not implemented.

## E078/A082 — Verified0.19.0 rollout,01/11/2026
PR38 approved published head7ab4fd1 / source2c0a78c, PR CI41325365156 PASS; exact-head merge6f8e719. Main CI41325531686/Pages41325531690 PASS. Public HTML/entry HTTP200 and meta0.19.0. Existing authenticated session: version0.19.0, settlement explanation, blank-form hint and existing valid allocation summary PASS;390x844 document/dialog no horizontal overflow; open/cancel unchanged, viewport and original route restored, warnings/errors0. No migration/config/business-data writes, payment confirmations or login emails. Physical P40 iOS/native picker/keyboard/touch/screen-reader and hosted writes/concurrency NOT RUN; same-agent review only. Docs closeout under the same approval; ideas4–5 remain subsequent. Primary dirty checkout preserved.
