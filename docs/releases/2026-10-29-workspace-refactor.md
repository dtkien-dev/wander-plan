# Workspace hook refactor — 29/10/2026

P32 separates workspace read adapters from writes: `useWorkspaceMutations` now has its own module, and all consumers/mocks use the new import. Function bodies, cache/session guards, subscriptions and business behavior are unchanged. App version remains 0.14.0; deployment is identified by commit.

Customer approved publication and deployment under A060. [PR #20](https://github.com/dtkien-dev/wander-plan/pull/20) passed [PR CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40866629066) and merged as `fa59861822f858eb81032b20ce7caaa270bee9bb`.

Local checks: 32 focused tests before/after, 168 app tests, 353 embedded SQL assertions, lint, TypeScript/demo build, audit zero findings and semantic equivalence passed. Same-agent scoped ITS found no blocker. No schema, dependency, configuration or money-handling changes. No migration required; production business data was not used for write testing.

Deployment verified under E056: [main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40866751685) and [Pages](https://github.com/dtkien-dev/wander-plan/actions/runs/40866751533) PASS for fa59861. Public HTML and entry script return HTTP200, metadata is 0.14.0, and the actual browser login page loads after reload. Initial pre-deployment navigation encountered a stale refresh-token error; no new console error was captured after deployed-page reload. The current browser is signed out, so authenticated dialogs, hosted Realtime/email and full service concurrency are not reverified in this batch. No login email or production write was performed.

Docs closeout [PR #21](https://github.com/dtkien-dev/wander-plan/pull/21) merged `3591711` after PR CI40867109754 passed. Final [main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/40867271365) and [Pages](https://github.com/dtkien-dev/wander-plan/actions/runs/40867271453) PASS; public HTTP200/meta0.14.0 and unchanged app entry asset verified after that deploy. Final receipt shared on docs/release-workspace-refactor; resolve its commit through Git log. No new feature scope.

Recovery: revert PR #20 through a reviewed frontend PR and the same CI/Pages gates; no database rollback. Whole-workspace refetch optimization and deferred product features remain outside this batch.
