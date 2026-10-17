# P06: Nhắc chuyến đi tối giản
Status: Completed
Depends on: P05
Wave: 6
Subagent: Eligible — exclusive subunits under A002, coordinator owns shared contracts and integration.
Owned scope: Dashboard; calendar export module/tests
Produces: Ngày trước/bắt đầu/kết thúc đúng; import .ics vào lịch thành công; không hứa web đóng vẫn tự nhắc.

## Goal
Nhắc chuyến đi tối giản
## Context
See ../context.md. Model recommendation: GPT-6 Luna / medium; Sol medium cho calendar/timezone.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Banner sắp tới/đang đi/đã kết thúc theo trip timezone; export .ics với escaping/UID. Push/email nền là backlog cần opt-in/scheduler đặc tả riêng.
## Touchpoints
Dashboard; calendar export module/tests
## Verification
Ngày trước/bắt đầu/kết thúc đúng; import .ics vào lịch thành công; không hứa web đóng vẫn tự nhắc.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
Timezone banner and all-day calendar export implemented;6 calendar tests passed; no background push/email claimed. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
