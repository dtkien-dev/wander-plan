# P01: Lời mời và sức chứa
Status: Completed
Depends on: None
Wave: 1
Subagent: Eligible — exclusive subunits under A002, coordinator owns shared contracts and integration.
Owned scope: supabase migrations/tests; travelRepository; GroupPage; useWorkspace; types
Produces: 3 active + 1 pending/4: báo rõ giữ chỗ; huỷ rồi mời mới thành công; non-owner bị chặn; mời trùng và huỷ/nhận đồng thời an toàn.

## Goal
Lời mời và sức chứa
## Context
See ../context.md. Model recommendation: GPT-6.1 Sol / high.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Giữ chỗ pending; owner huỷ lời mời; chỉ active là thành viên. Khoá trip row cho mời/huỷ/nhận, owner check tại DB. UI tách số active và reserved; demo tương đương. Chuẩn bị accept RPC cho P02.
## Touchpoints
supabase migrations/tests; travelRepository; GroupPage; useWorkspace; types
## Verification
3 active + 1 pending/4: báo rõ giữ chỗ; huỷ rồi mời mới thành công; non-owner bị chặn; mời trùng và huỷ/nhận đồng thời an toàn.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
Reserved capacity and owner revoke implemented; 3-active/1-pending UI test and 42 SQL invitation assertions cover behavior. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
