# Điểm bàn giao

Đọc trạng thái thực thi mới nhất ở [index của tracker wp-20261014-01](../../plans/2026-10-14-no1-website-improvements/index.md). Đây là cùng hồ sơ đã dùng từ đầu; thư mục docs/agent chỉ hướng dẫn truy cập, không thay tracker.

- [Roadmap và quyết định còn mở](../../plans/wanderplan-product-roadmap.md)
- [Quyết định đã chốt](../../plans/2026-10-14-no1-website-improvements/decisions.md)
- [Kế hoạch và phase](../../plans/2026-10-14-no1-website-improvements/plan.md)
- [Bằng chứng](../../plans/2026-10-14-no1-website-improvements/evidence.md), [kiểm tra](../../plans/2026-10-14-no1-website-improvements/verification.md)
- [Release notes](../releases/2026-10-18-0.11.1.md)

Mốc production được xác minh ngày 18/10/2026 (Asia/Saigon): `main` tại `40ea587c90287137a9c31f6a16a7b33117682af3`, phiên bản 0.11.1. Đây là mốc lịch sử: fetch và kiểm tra CI/Pages/live lại trước mỗi đợt. Tên nhánh hoặc đường dẫn worktree ghi trong evidence có thể chỉ tồn tại trên máy thực hiện.

Đợt hiện tại P23: đồng bộ code, kiểm tra 0.9.3, sửa hồ sơ phát hành và đưa quy trình/kế hoạch vào Git để dùng nhiều máy. Trạng thái hoàn tất và commit bàn giao lấy ở index/Git log, không suy ra từ phiên bản app.

Chưa được coi là đạt: Google consent/gộp tài khoản thật, email/Realtime hosted và smoke có đăng nhập sau 0.9.3. R15 cần tài khoản/phiên thử của chủ dự án hoặc quyết định môi trường riêng; không tự mua branch, gửi email hoặc thử trên dữ liệu thật. R07/R11 cần quy tắc nghiệp vụ; R17 cần dịch vụ/kênh nhận/quyền/lọc dữ liệu; R18 hiện theo sau R17. R19 đang hoãn. Không có tính năng backlog nào được tự động duyệt chỉ vì hoàn tất P23.

Nhánh chia sẻ hiện tại: `docs/portable-workflow`. Trên clone mới chạy `git fetch origin`, rồi `git switch --track origin/docs/portable-workflow` nếu chưa có nhánh local; nhánh đã tồn tại thì switch và cập nhật fast-forward sau khi kiểm tra trạng thái.
