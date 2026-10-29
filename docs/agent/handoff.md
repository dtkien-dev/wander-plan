# Điểm bàn giao

Released 0.16.0 checkpoint 29/10/2026: P34/A064/E060 expense trash, PR24/96c419e, main CI40886069902/Pages40886070224 PASS; production migration 20261029150000 once after private backup, contracts verified; public meta 0.16.0. Authenticated smoke not run. Next: P35 full redesign (A063, PRODUCT.md written; impeccable skill installed locally under .claude/skills, not in Git). Docs closeout on docs/release-0.16.0.

Released0.15.0 checkpoint29/10/2026: P33/A062/E058, app PR22/7b647fa, main CI40875101095/Pages40875101197 PASS. Both canonical production migrations once after private backup; exact approved verified-account admin bootstrap and registry/RLS/grants checks PASS. Public HTTP200/meta0.15.0 and actual Google sign-in/admin/Group/promotion dialog open+cancel smoke PASS, app console0. No real trip/member/payment test writes or email. Docs closeout continues on docs/release-0.15.0; fetch/latest Git log/tracker before resuming. No new feature scope; primary checkout changes preserved. Never publish admin identity or private backup.

P33 candidate checkpoint29/10/2026: website admin/all-trip management and co-owners implemented on feat/site-admin-trip-co-owners from main3591711; candidate0.15.0.175 app tests,389 embedded/full-local SQL, lint/build/audit/advisor and actual two-browser Realtime/mobile/concurrent-role/cache-revocation QA PASS; independent ITS remediations rechecked. Read P33, review report and docs/releases/2026-10-29-0.15.0.md. Two forward migrations plus privately approved verified-account bootstrap required before matching frontend, only after fresh go-live approval. No production grants/schema/data/push/deploy. Synthetic sessions/admin grant/credential fixtures/UAT env removed; owned tabs/app stopped, shared stack/data retained. Resolve local commit via Git log; primary checkout changes preserved. Older checkpoints below are historical.

Latest released checkpoint 29/10/2026: P32/A060/E056 approved and deployed via PR20/fa59861. Main CI40866751685/Pages40866751533 PASS; public HTTP200/meta0.14.0 and actual-browser login smoke verified. Signed-out browser prevents authenticated-dialog smoke; no login emails/production writes/DB changes. Docs-only release closeout continues on docs/release-workspace-refactor; fetch and inspect latest branch checkpoint/PR/CI before resuming. Earlier pending-approval notes are historical. No new feature scope; primary checkout edits retained.

Latest local checkpoint 29/10/2026: P32/A059/E055 behavior-preserving workspace read/write hook separation on chore/workspace-refactor from fetched origin/main 9c7a872 (released 0.14.0). 32 focused before/after, 168 app tests, 353 embedded SQL assertions, lint/demo build/audit-high and semantic equivalence PASS; same-agent scoped ITS clear. Browser/full-Supabase/hosted not rerun. No push/merge/deploy or new go-live approval. Read P32 and resolve local commit via Git log; primary checkout pre-existing changes retained.

Current checkpoint (28/10/2026): 0.13.0 released at main 58b2906 via PR #16; production migration 20261028163323 and PR/main CI/Pages/public version/authenticated read-only itinerary controls verified. Docs closeout continues on `docs/release-0.13.0` under A051/E047; fetch/latest Git log before resuming. No real-data deletion tests or new backlog approvals. Primary checkout pre-existing edits preserved.

Đọc trạng thái thực thi mới nhất ở [index của tracker wp-20261014-01](../../plans/2026-10-14-no1-website-improvements/index.md). Đây là cùng hồ sơ đã dùng từ đầu; thư mục docs/agent chỉ hướng dẫn truy cập, không thay tracker.

- [Roadmap và quyết định còn mở](../../plans/wanderplan-product-roadmap.md)
- [Quyết định đã chốt](../../plans/2026-10-14-no1-website-improvements/decisions.md)
- [Kế hoạch và phase](../../plans/2026-10-14-no1-website-improvements/plan.md)
- [Bằng chứng](../../plans/2026-10-14-no1-website-improvements/evidence.md), [kiểm tra](../../plans/2026-10-14-no1-website-improvements/verification.md)
- [Release notes](../releases/2026-10-18-0.12.1.md)

Mốc production được xác minh ngày 18/10/2026 (Asia/Saigon): `main` tại `5ebbe82ee77ecf2a77bf564ab35364e2eda6fc31`, phiên bản 0.12.1. PR #13/main CI/Pages đạt; metadata và giao diện có đăng nhập xác nhận phiên bản, form Chi phí/Lịch trình mở đúng (hủy, không lưu dữ liệu production). Đây là mốc lịch sử: fetch và kiểm tra CI/Pages/live lại trước mỗi đợt.

Đợt gần nhất P27 đã phát hành 0.12.1 (A047/E043); kết quả và giới hạn nằm ở index/verification. R07/R17/R18 đang hoãn theo khách hàng; chưa chọn đợt mới. Hồ sơ cuối được chia sẻ qua nhánh docs/release-0.12.1; fetch và xem Git log để lấy checkpoint mới nhất.

Khách hàng xác nhận đã đăng nhập được và không yêu cầu đề xuất tiếp R15; gộp tài khoản thật/email/Realtime hosted chưa được xác minh đầy đủ. Smoke có đăng nhập 0.12.1 đã đạt ở mức chỉ đọc, không lưu dữ liệu production. R07/R17/R18 và R19 đang hoãn; R11 đã phát hành. Không tự mua branch, gửi email hoặc thử ghi trên dữ liệu thật. Không có tính năng backlog nào được tự động duyệt khi hoàn tất P27.

Nhánh chia sẻ hồ sơ phát hành: `docs/release-0.12.1`. Trên clone mới chạy `git fetch origin`, đọc main mới nhất và nhánh này (nếu còn hồ sơ chưa merge); chỉ switch/cập nhật fast-forward sau khi kiểm tra trạng thái.

## P28 checkpoint — 28/10/2026
Owner-only selected/select-all itinerary deletion implemented locally on `feat/itinerary-bulk-delete` from `origin/main` 727e0fb; resolve final commit via Git log. Tracker P28/A048/E044. 155 app tests, 298 embedded SQL, lint/build/audit-high PASS; desktop demo selection/confirmation/cancel checked. Same-agent ITS; full Supabase/concurrent-session/actual Realtime/mobile UAT pending. Apply `20261028163323_bulk_delete_itinerary.sql` before frontend after current-batch go-live approval. No push/merge/deploy or shared/production DB writes. Primary checkout pre-existing edits preserved.

## P28 QA/ITS checkpoint — 28/10/2026
Continue `feat/itinerary-bulk-delete`; resolve latest local commit via Git log (implementation 3e8d762). Candidate 0.13.0; A049/E045 complete. 298 full-local SQL, 155 app tests/lint/build/audit-high PASS. Actual concurrent edit/delete, two-browser member Realtime, selected/all/multi-day/stale/reload and 320/375px UAT PASS. Same-agent scoped ITS no blocker; report in tracker manifest. Console/advisor not verified. Synthetic sessions revoked, task credential fixtures removed, owned app stopped, shared local stack retained. Migration 20261028163323 applied only locally. No publication/production approval. Next: present candidate for go-live, then ITO check remote/target/backup and production migration before frontend, CI/Pages/live verification. Preserve primary checkout edits.

## Final checkpoint — 29/10/2026 (Asia/Saigon)
0.13.0 release complete. App PR #16: 58b2906; docs PR #17: acc310a. Final main CI 40731549138 / Pages 40731548893 PASS; final public HTTP 200/meta 0.13.0. Production canonical migration/grants/definition and existing authenticated read-only itinerary controls verified. No hosted deletion/test writes. Final receipt shared on `docs/release-0.13.0`; resolve latest SHA from Git log, fetch and read its tracker checkpoint before resuming. No active action/new feature. Separate Dependabot fast-uri update failed due dependency constraints; CI/audit-high/Pages passed, maintenance not included. Primary checkout pre-existing edits retained.

## Candidate checkpoint — 29/10/2026
P29/P30/P31 candidate 0.14.0 locally ready on feat/trip-reschedule-templates-trash. A055/E051 complete; fetch and inspect latest Git log. 168 app tests, 353 embedded/full-local SQL, lint/build pass; integrated UAT and independent ITS evidence in tracker. Four forward migrations, including final trash provenance hardening, required before frontend. No feature push or production mutation. Await current-batch go-live approval; prior 0.13.0 approval does not cover this release. Primary checkout edits preserved.

Dependency follow-up A056/E052 completed: Vitest4.1.12, fast-uri3.1.9; zero npm audit findings, clean install/168 app tests/353 embedded SQL/lint/build pass, independent lock/registry integrity review clear. Candidate remains local and awaiting go-live approval; resolve latest commit from Git log.

## Released 0.14.0 — 29/10/2026
App PR18 merged b732461 after approved go-live. MainCI40794364399/Pages40794364198 PASS, public/authenticated0.14.0 and read-only move/clone/trash dialogs PASS. Four production migrations, private backup, grants/Realtime/hourly cron verified; no business-data test writes. A058/E054 docs closeout on docs/release-0.14.0; fetch and inspect latest Git log/tracker before resuming. No new backlog scope; primary checkout edits retained.
