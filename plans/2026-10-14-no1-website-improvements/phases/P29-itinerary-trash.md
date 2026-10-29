# P29 — Thùng rác lịch trình 7 ngày
Owner: current agent. Depends: released P28. Status: QA/ITS complete; awaiting current-batch go-live approval.
Scope: additive migration, existing delete RPCs, server-owned trash snapshots/RLS, restore RPC, hourly expiry cleanup when pg_cron is available; demo/cloud repositories/cache; itinerary trash modal/tests/runbook.
Rules: single member deletion and owner bulk deletion both retain snapshot 7 days. Only active owner sees/restores; archived/outsider/editor/anon denied. Restore preserves original itinerary ID with incremented version; stale edits cannot overwrite a restored row. Dates/Maps constraints still apply; out-of-range restore is blocked. Trash excluded from exports, overlap, reschedule and cloning. Scheduled cleanup removes expired snapshots; demo prunes on interaction. Legacy browser data retained. No production writes before new go-live approval.
Acceptance: delete/restore/expiry/multi-day, role/trip/archive/version boundaries, old clients cannot bypass recovery; no expense/member change; Realtime/caches after delete/restore; full SQL and browser UAT including mobile.

Final verification: E050 integrated browser/local UAT and E051 independent ITS/remediation complete. 168 app tests, 353 embedded/full-local SQL, lint/build PASS. Four forward migrations must precede frontend; no production approval yet.
