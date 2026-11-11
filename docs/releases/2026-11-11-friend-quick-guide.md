# WanderPlan — Friend quick guide

Released on 2026-11-11 (Asia/Saigon) under A084/E080. [PR #40](https://github.com/dtkien-dev/wander-plan/pull/40) merged approved head 898b9e4 at e8bee8a.

## User behavior

A hint beside pending invitations points to the Accept action. Active editor memberships see a guide linking to Itinerary, Expenses and Group. Dismissal is stored per browser account and trip. The guide can be reopened.

## Verification

[PR CI](https://github.com/dtkien-dev/wander-plan/actions/runs/43042764402), [main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/43043146077) and [Pages](https://github.com/dtkien-dev/wander-plan/actions/runs/43043146161) passed. Live HTML and new entry index-DiYJg6vV.js returned HTTP 200. App version remains 0.19.0. Signed-out login smoke passed. On the deployed build, Chromium at 320/390/1280px passed the pending invitation, acceptance, links, dismiss/reload/reopen and width checks with synthetic data and intercepted Supabase traffic. Physical phones and real hosted invitation acceptance were not tested.

## Rollback

Frontend-only rollout. No migrations, config changes or production data writes. If needed, revert the app PR through the usual CI and Pages workflow. The browser dismissal flag has no effect when the guide is absent.