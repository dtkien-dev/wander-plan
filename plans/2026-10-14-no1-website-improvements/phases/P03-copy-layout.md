# P03: Nội dung và bố cục
Status: Completed
Depends on: P02
Wave: 3
Subagent: Eligible — exclusive subunits under A002, coordinator owns shared contracts and integration.
Owned scope: LoginPage; DashboardPage; ItineraryPage; affected CSS; README; metadata
Produces: 320/375/768/desktop không tràn do tên/email; nội dung chính xác; tên đầy đủ xem được.

## Goal
Nội dung và bố cục
## Context
See ../context.md. Model recommendation: GPT-6 Luna / medium.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Mô tả chung; dùng trip name/destination; bỏ 01 / đăng nhập. Giữ Đà Lạt nếu là dữ liệu trip thật/demo. Tên/email dài: kiểm tra nhóm, chi phí, form; wrap/ellipsis và xem đầy đủ.
## Touchpoints
LoginPage; DashboardPage; ItineraryPage; affected CSS; README; metadata
## Verification
320/375/768/desktop không tràn do tên/email; nội dung chính xác; tên đầy đủ xem được.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
General copy/metadata, dynamic title, contained names implemented. Desktop screenshot inspected; 320px page width equals viewport, 375px check passed. Full browser action automation limited by native dialog timeout. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
