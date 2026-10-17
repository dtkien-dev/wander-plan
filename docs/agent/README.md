# Làm việc trên nhiều thiết bị

Thư mục này là điểm bắt đầu cho người và coding agent trên mọi máy. Quy trình nằm trong repository, không phụ thuộc lịch sử chat hoặc skill cài riêng trên máy cũ.

## Bắt đầu trên máy mới

1. Clone repository hoặc mở checkout hiện có. Chạy `git status --short --branch`, `git remote -v`, `git fetch origin`, `git branch -vv` và `git worktree list`.
2. Nếu checkout sạch và đang ở nhánh cần tiếp tục, dùng `git pull --ff-only`. Nếu có thay đổi hoặc nhánh phân kỳ, giữ nguyên và đối chiếu trước; không reset, ghi đè hay tự stash công việc người khác.
3. Đọc [AGENTS.md](../../AGENTS.md), [quy trình](workflow.md), [bàn giao](handoff.md), [roadmap](../../plans/wanderplan-product-roadmap.md), rồi `index.md` của tracker được bàn giao. Đọc các file trong manifest trước khi thực thi tracker; đọc phase đang nhận và quyết định liên quan.
4. Dùng phiên bản runtime theo [CI](../../.github/workflows/ci.yml) và yêu cầu trong [package.json](../../package.json)/lockfile. Chạy `npm ci`. Thiết lập môi trường riêng theo [README](../../README.md); không sao chép secrets vào Git/chat. Chế độ demo lưu riêng từng trình duyệt, không đồng bộ giữa thiết bị.
5. Ghi nhận nhánh, commit gốc, phạm vi và chủ sở hữu trong tracker trước khi sửa. Dùng worktree riêng dưới `.worktrees/` (tự thêm ignore cục bộ nếu chưa có); không đưa checkout lồng nhau vào commit. Đường dẫn tuyệt đối trong hồ sơ cũ chỉ là lịch sử máy đã thực hiện; xác định lại đường dẫn theo clone hiện tại.

Nếu gói bàn giao chưa được push, máy khác chưa nhận được nó. Fetch không chuyển file chưa commit hoặc commit chưa push. Khi chuyển máy, bàn giao cả tên nhánh đã push và commit; máy nhận kiểm tra chúng trước khi tiếp tục. Trước khi bắt đầu một phiên mới, fetch lại và đọc checkpoint mới nhất để tránh hai máy cùng sửa một phase.

## Câu lệnh mở đầu cho agent khác

> Đọc AGENTS.md và docs/agent/README.md, workflow.md, handoff.md. Fetch remote, đối chiếu nhánh/commit và thay đổi chưa commit. Tiếp tục tracker được chỉ định bằng đường dẫn tương đối trong repository, đọc manifest và phase hiện tại trước khi sửa. Giữ nguyên quyết định đã chốt; làm theo PO → BA → IT → UAT/QA → ITS → duyệt go-live → ITO → PO. Ghi bằng chứng và bước tiếp theo vào cùng tracker. Không giả định kiểm tra chưa chạy là đạt.

Không cần có `$execute` hay skill riêng để hiểu quy trình. Nếu có skill đó thì có thể dùng thêm; tài liệu chung và quyết định của khách hàng vẫn phải được đọc.
