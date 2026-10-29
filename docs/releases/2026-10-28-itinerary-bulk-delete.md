# 0.13.0 — selected itinerary deletion

Owner can tick activities or select all, then confirm permanent deletion. Multi-day activities count once. Any stale/missing selected item aborts the whole batch. Unselected/new activities, expenses and membership are retained; expense dates may still block changes to trip dates.

## Validation

PASS: 155 app tests; 298 full-local SQL assertions and prior embedded SQL; lint/build/audit-high; actual concurrent update/delete, duplicate delete protection, owner/member browser Realtime, subset/all/multi-day/stale/reload, expense/membership readback and responsive 320/375px. Same-agent scoped ITS found no blocker; no independent review. Existing dependency audit has 3 moderate findings. Browser console and automated local advisor unverified; hosted writes not tested.

## ITO rollout checklist (completed under A050/E046)

1. Fetch and reconcile candidate/main; resolve final candidate commit from feat/itinerary-bulk-delete Git log. Confirm scope/version 0.13.0 and current-batch approval.
2. Verify intended existing production Supabase project, migration history and backup/recovery readiness. Apply only missing 20261028163323_bulk_delete_itinerary.sql before frontend, then verify signature/grants/history. Local rehearsal applied this migration once; never replay historical migrations/reset data.
3. Publish candidate branch/PR, require shared CI (tests/lint/embedded SQL/audit/build); merge approved candidate to main. Main triggers production Pages deployment.
4. Verify main CI/Pages, public version 0.13.0 and authenticated read-only UI smoke. Use a separately approved disposable hosted trip for any destructive hosted test; never delete real itinerary data to smoke-test.
5. Record release receipts and remaining limitations, update tracker/roadmap/handoff. Initial app release outcomes are recorded below; docs-only closeout follows.

## Recovery

Cancel before confirming. Deletion cannot be undone through the app; export Excel beforehand if a copy is needed. Frontend rollback can retain the additive RPC. Restoring deleted rows requires backup/reimport, not replaying migrations. Expenses and memberships stay unchanged.

## Release outcome — 28/10/2026

Released after current-batch customer go-live approval. Only missing forward migration 20261028163323 applied before frontend; definition matches tested local RPC, canonical history and authenticated-only grants verified. Schema-only recovery snapshot saved privately before additive DDL; no existing business rows modified by migration.

[PR #16](https://github.com/dtkien-dev/wander-plan/pull/16) CI [40730599697](https://github.com/dtkien-dev/wander-plan/actions/runs/40730599697) PASS; merged app commit 58b29061e1f2af92e6bdd25a6f4c0eb3cd88441e. [Main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40730811586) and [Pages verify/build/deploy](https://github.com/dtkien-dev/wander-plan/actions/runs/40730811820) PASS. Public HTTP 200/meta 0.13.0; existing authenticated browser confirms itinerary selection controls and disabled delete button before selection.

No real production itinerary deletion or business-data smoke writes. Hosted destructive/concurrency UAT not performed; full-local UAT covered deletion/concurrency/Realtime. Same-agent scoped ITS; console/advisor collection and production screenshot capture not verified. Three existing moderate dependency findings remain. Docs-only publication records the release and requires its own CI/Pages confirmation; see latest tracker checkpoint.

## Final documentation receipt — 29/10/2026

[Docs PR #17](https://github.com/dtkien-dev/wander-plan/pull/17) passed [CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40731357042), merged acc310a, then [main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40731549138) and [Pages verify/build/deploy](https://github.com/dtkien-dev/wander-plan/actions/runs/40731548893) passed. Final public HTTP 200/version 0.13.0 confirmed. Release complete; final receipt shared on docs/release-0.13.0 without another main deployment.

Separate [Dependabot update](https://github.com/dtkien-dev/wander-plan/actions/runs/40730842281) failed because existing fast-uri 3.1.9 could not be resolved under current constraints. No dependency change made; CI/audit-high/Pages remain passing. Track dependency maintenance separately.
