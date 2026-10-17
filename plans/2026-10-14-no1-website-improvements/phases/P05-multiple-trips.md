# P05: Tạo và chọn nhiều chuyến
Status: Completed
Depends on: P04
Wave: 5
Subagent: Not eligible — shared contracts and serial execution; no delegation requested.
Owned scope: Trip schema/RLS/RPC; repository/types/cache; create/select screens
Produces: Hai trip/hai owner không truy cập chéo; user nhiều trip chọn đúng; dữ liệu cũ và chi phí/Excel hoạt động; đổi trip không lộ cache.

## Goal
Tạo và chọn nhiều chuyến
## Context
See ../context.md. Model recommendation: GPT-6.1 Sol / high; Astra high chỉ cho review khó.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Bỏ global single-trip gate, form tạo trip và active trip id; query/realtime/data scope theo trip. Giữ records cũ, expense history, Excel IDs/version. Schema/RLS trước; selector/cache sau; kiểm tra isolation trước deploy.
## Touchpoints
Trip schema/RLS/RPC; repository/types/cache; create/select screens
## Verification
Hai trip/hai owner không truy cập chéo; user nhiều trip chọn đúng; dữ liệu cũ và chi phí/Excel hoạt động; đổi trip không lộ cache.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
Create/select isolated trips and request-id idempotency implemented;22 SQL assertions plus demo preservation/isolation and workspace switch tests passed. Archive stays backlog. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
