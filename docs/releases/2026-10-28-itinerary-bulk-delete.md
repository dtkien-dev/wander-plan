# 0.13.0 candidate — selected itinerary deletion

Owner can tick activities or select all, then confirm permanent deletion. Multi-day activities count once. Any stale/missing selected item aborts the whole batch. Unselected/new activities, expenses and membership are retained; expense dates may still block changes to trip dates.

## Validation

PASS: 155 app tests; 298 full-local SQL assertions and prior embedded SQL; lint/build/audit-high; actual concurrent update/delete, duplicate delete protection, owner/member browser Realtime, subset/all/multi-day/stale/reload, expense/membership readback and responsive 320/375px. Same-agent scoped ITS found no blocker; no independent review. Existing dependency audit has 3 moderate findings. Browser console and automated local advisor unverified; hosted writes not tested.

## ITO handoff — pending customer go-live approval

1. Fetch and reconcile candidate/main; resolve final candidate commit from feat/itinerary-bulk-delete Git log. Confirm scope/version 0.13.0 and current-batch approval.
2. Verify intended existing production Supabase project, migration history and backup/recovery readiness. Apply only missing 20261028163323_bulk_delete_itinerary.sql before frontend, then verify signature/grants/history. Local rehearsal applied this migration once; never replay historical migrations/reset data.
3. Publish candidate branch/PR, require shared CI (tests/lint/embedded SQL/audit/build); merge approved candidate to main. Main triggers production Pages deployment.
4. Verify main CI/Pages, public version 0.13.0 and authenticated read-only UI smoke. Use a separately approved disposable hosted trip for any destructive hosted test; never delete real itinerary data to smoke-test.
5. Record release receipts and remaining limitations, update tracker/roadmap/handoff. Production outcomes currently NOT RUN.

## Recovery

Cancel before confirming. Deletion cannot be undone through the app; export Excel beforehand if a copy is needed. Frontend rollback can retain the additive RPC. Restoring deleted rows requires backup/reimport, not replaying migrations. Expenses and memberships stay unchanged.
