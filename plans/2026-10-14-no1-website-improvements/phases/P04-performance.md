# P04: Hiệu năng
Status: Completed
Depends on: P03
Wave: 4
Subagent: Not eligible — shared contracts and serial execution; no delegation requested.
Owned scope: App routing; hooks/query/realtime; modal/mutation handlers
Produces: Bấm 10 lần không tạo trùng; không nhân subscription; dữ liệu realtime đúng; mạng chậm loading ổn định; ghi requests/chunks/render trước-sau.

## Goal
Hiệu năng
## Context
See ../context.md. Model recommendation: GPT-6.1 Sol / medium.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Đo trước/sau; lazy routes/modal và Suspense; Excel libraries đã dynamic. Pending guards chống bấm lặp; gom subscription theo workspace, lọc trip; refresh people khi invite đổi; giảm refetch toàn bộ khi không cần.
## Touchpoints
App routing; hooks/query/realtime; modal/mutation handlers
## Verification
Bấm 10 lần không tạo trùng; không nhân subscription; dữ liệu realtime đúng; mạng chậm loading ổn định; ghi requests/chunks/render trước-sau.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
Routes and Excel modal lazy; one scoped channel; single-flight writes; content-only invalidation; error recovery. Main bundle gzip81.67kB versus94.79kB baseline. No unsupported latency claim. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
