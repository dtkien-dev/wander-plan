# P28 — selected itinerary deletion (local candidate)
Owner can tick activities/select all and confirm irreversible deletion. Multi-day activities count once. Any selected row edited/deleted concurrently aborts the complete batch. Unselected/new activities, expenses and members remain. Expense dates can still block trip date changes.

PASS: 155 app tests, 298 embedded SQL assertions, lint/build/audit-high; desktop demo selection/modal/cancel. Same-agent scoped ITS. Three existing moderate dependency findings. Full Supabase/concurrent-session/actual Realtime/mobile UAT pending.

Not deployed; no go-live approval. Rehearse and apply missing forward migration 20261028163323_bulk_delete_itinerary.sql before frontend. No historical migration replay. Check target/backup before production. Deleted rows cannot be restored through UI; frontend rollback may retain additive RPC.
