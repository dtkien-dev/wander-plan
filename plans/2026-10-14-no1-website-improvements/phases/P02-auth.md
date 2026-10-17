# P02: Đăng nhập và nhận lời mời
Status: Completed
Depends on: P01
Wave: 2
Subagent: Eligible — exclusive subunits under A002, coordinator owns shared contracts and integration.
Owned scope: AuthProvider; LoginPage; workspace loading; invitation RPC/UI/tests
Produces: Hai tài khoản: accept/decline/revoked; email mismatch; expired link; logout cache isolation; boot lỗi không treo.

## Goal
Đăng nhập và nhận lời mời
## Context
See ../context.md. Model recommendation: GPT-6.1 Sol / high.
## Tasks
- [x] Revalidate relevant source and migration contracts; deployed schema verification remains a documented release gate, not performed locally.
- [x] Implement intended logic in small verified units.
- [x] Record tests, diff and checkpoint.
## Intended Logic
Tách xác thực và explicit accept/decline; không auto-enrol user mới hoặc đã có account. Xử lý link hết hạn, sai email, không thuộc nhóm; resend cooldown; cache cách ly và dọn theo session. MVP lời mời trong app, chủ nhóm chia sẻ link; không giả định đã gửi email.
## Touchpoints
AuthProvider; LoginPage; workspace loading; invitation RPC/UI/tests
## Verification
Hai tài khoản: accept/decline/revoked; email mismatch; expired link; logout cache isolation; boot lỗi không treo.
## Acceptance Gate
All checks pass; preserve expense/Excel and permission contracts.
## Rollback or Recovery
Frontend revert only if schema-compatible; reviewed forward database repair; preserve records. See ../verification.md.
## Execution Notes
Explicit accept/decline, auth recovery/cooldown, account isolation implemented; auth/workspace/late-mutation tests passed. Local implementation complete. Live Auth/Realtime, concurrent sessions and cloud rollout require staging checks before release; no deployment performed.
