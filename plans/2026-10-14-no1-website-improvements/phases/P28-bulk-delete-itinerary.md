# P28 — Xóa lịch trình đã chọn
Date: 28/10/2026 (Asia/Saigon). Owner: current agent, serial.
Authorization: customer requested implementation of the proposed owner-only selection/select-all/confirmation flow. No go-live approval.
Baseline: origin/main 727e0fb; branch feat/itinerary-bulk-delete, isolated worktree.
Scope: ItineraryPage/CSS/tests; travelRepository/demo/cloud/tests; useWorkspace/cache; additive RPC migration/pgTAP; README and this tracker.
Acceptance: owner selects individual unique activities or all visible activities; explicit irreversible confirmation; atomic version-checked deletion; deny editor/outsider/anonymous/archived; preserve unselected rows, expenses and membership; stale requests delete nothing; refresh originating cache and connected members through existing channel. Multi-day copies share selection.
Recovery: cancel before confirmation; deletion cannot be undone. Apply migration before frontend; retain additive RPC on frontend rollback. No production writes, push or merge.
Status: 0.13.0 candidate, full-local QA/UAT and same-agent scoped ITS passed under A049/E045. Production deployment remains unapproved. See verification/E045 and security-review-p28-2026-10-28.md.
