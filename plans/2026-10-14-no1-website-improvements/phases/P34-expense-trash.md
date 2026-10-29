# P34 — Thùng rác khoản chi 7 ngày

Date: 29/10/2026 Asia/Saigon. Owner: current agent. Baseline: fetched origin/main 7e8dc7e (0.15.0); branch feat/ui-upgrade, worktree .worktrees/ui-upgrade. Candidate 0.16.0.
Status: BA rules settled (A063); IT in progress.

## Scope / PO and BA (A063)
- Deleting an expense moves a server-owned snapshot to trash for 7 days; hourly cleanup removes expired rows (reuse the P29 scheduler pattern).
- The deleting member and active owners (site admin owner-equivalent, A061) see and restore. Others, outsiders, archived trips and anon are denied.
- Restore keeps the original expense ID with an incremented version; stale edits cannot overwrite it. Restore is refused, with a clear Vietnamese reason, if a payer/participant is no longer an active member. Existing constraints (dates, splits, frozen money) still apply.
- Trashed expenses are excluded from balances, totals, settlement, Excel export, reschedule and clone. Frozen-money expenses remain undeletable (A024).
- UI: replace the native expense delete confirm with the in-app dialog and add an expense Trash dialog matching itinerary trash. Demo/browser storage keeps legacy data and prunes expired trash on interaction.
- Out of scope: member-removal undo, settlement-payment trash, visual redesign (P35).

## Acceptance
Delete/restore/expiry; role/deleter/archive/version boundaries; former-member restore refusal; balances recomputed after delete/restore; Realtime/cache refresh; old clients cannot bypass recovery; full SQL and browser UAT including mobile; forward migration applied before frontend.
