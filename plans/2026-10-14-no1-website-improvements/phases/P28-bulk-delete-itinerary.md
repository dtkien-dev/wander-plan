# P28 — Xóa lịch trình đã chọn
Date: 28/10/2026 (Asia/Saigon). Owner: current agent, serial.
Authorization: customer requested implementation of the proposed owner-only selection/select-all/confirmation flow. No go-live approval.
Baseline: origin/main 727e0fb; branch feat/itinerary-bulk-delete, isolated worktree.
Scope: ItineraryPage/CSS/tests; travelRepository/demo/cloud/tests; useWorkspace/cache; additive RPC migration/pgTAP; README and this tracker.
Acceptance: owner selects individual unique activities or all visible activities; explicit irreversible confirmation; atomic version-checked deletion; deny editor/outsider/anonymous/archived; preserve unselected rows, expenses and membership; stale requests delete nothing; refresh originating cache and connected members through existing channel. Multi-day copies share selection.
Recovery: cancel before confirmation; deletion cannot be undone. Apply migration before frontend; retain additive RPC on frontend rollback. No production writes, push or merge.
Status: released 0.13.0 under A050/E046 after customer approval. Migration, PR/main CI, Pages and read-only production smoke passed. Docs-only closeout A051/E047 in progress. See verification and scoped ITS report.
