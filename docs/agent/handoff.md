# Điểm bàn giao

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
