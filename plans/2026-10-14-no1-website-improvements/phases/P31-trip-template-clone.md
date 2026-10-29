# P31 — Nhân bản chuyến làm mẫu
Owner: current agent. Depends: P29/P30 shared date/snapshot contracts. Status: released 0.14.0; final production verification complete.
Owner supplies new name/start date; retain trip duration/destination/budget/capacity/timezone and active itinerary shifted by offset. Checklist titles copied with completed=false/assignedTo=null. Only current user becomes owner; no member/invitation/expense/payment/former-person/trash copied. Members join through existing explicit invitation acceptance UI. Idempotent request UUID prevents duplicate trip/content on retry; source snapshot versions checked. Archived/unauthorized source rejected.
Acceptance: copy days/multi-day/settings/tasks, reset assignments/completion, empty source, stale source, repeat/concurrent request, no old financial/member data, demo persistence and identity-safe selection; local browser/mobile.

Final verification: E050 integrated browser/local UAT and E051 independent ITS/remediation complete. 168 app tests, 353 embedded/full-local SQL, lint/build PASS. Four forward migrations must precede frontend; no production approval yet.

Released 0.14.0 under A057/E053: production four migrations once, PR18 b732461, CI/Pages and authenticated read-only UI PASS. Customer go-live approval recorded; no business-data test writes.
