# WanderPlan — Mobile actions menu

Released 2026-11-11 (Asia/Saigon) under A086/E082. [PR #41](https://github.com/dtkien-dev/wander-plan/pull/41) merged approved head 600b531 at cd1a003.

The Itinerary and Expenses ellipsis trigger stays at the right edge of its row on mobile. This keeps the 220px panel inside the page when the trigger wraps. At 320px the panel now spans x=84–304px instead of starting at x=-105px.

[PR CI](https://github.com/dtkien-dev/wander-plan/actions/runs/43046064481), [main CI](https://github.com/dtkien-dev/wander-plan/actions/runs/43046302683) and [Pages](https://github.com/dtkien-dev/wander-plan/actions/runs/43046302689) passed. Live HTML and new stylesheet index-BKbISkMR.css returned HTTP 200. Deployed Chromium/WebKit browser smoke used synthetic owner data at widths 320, 375, 390, 768 and 1280px. Both menus fit, opened Excel import and closed on Escape with focus restored. Physical phones and real hosted account flow were not tested.

Frontend CSS only. No migrations or config changes. Roll back through a reviewed revert of the CSS change and normal CI/Pages.