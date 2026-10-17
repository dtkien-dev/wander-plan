# Quy trình giao hàng

Áp dụng cho từng đợt thay đổi. Ngày trong kế hoạch là dự kiến, không tự tạo automation hoặc quyền triển khai. Vai trò dưới đây có thể do cùng một người/agent thực hiện; ghi rõ khi rà soát không độc lập.

| Bước | Việc phải hoàn tất |
| --- | --- |
| PO | Chọn mục trong roadmap, phạm vi và tiêu chí nghiệm thu. |
| BA | Chốt nghiệp vụ, quyền, dữ liệu cũ, Excel/demo, ảnh hưởng và phục hồi. Không tự suy diễn quyết định còn mở. |
| IT | Ghi phase/action và file nhận xử lý vào tracker; đọc callers/tests, sửa nhỏ nhất đủ yêu cầu, thêm kiểm tra có giá trị, commit từng đơn vị đã kiểm chứng; đưa lên UAT khi cần. |
| UAT/QA | Test tiêu chí nghiệm thu và hồi quy phù hợp. Ghi PASS/FAIL/NOT RUN, commit/môi trường/lệnh hoặc bước tái hiện và bằng chứng. |
| ITS | Sau QA đạt, kiểm tra bảo mật theo diff: quyền/cách ly dữ liệu, đầu vào, dữ liệu nhạy cảm và dependency/config liên quan. Audit dependency không thay cho rà soát logic. |
| Duyệt go-live | Chuẩn bị kết quả cụ thể để khách hàng duyệt trước push/merge main hoặc thay đổi production. Ghi nhận phạm vi được duyệt; không dùng phê duyệt đợt cũ cho đợt mới. |
| ITO | Kiểm tra remote/commit, đúng project/config, migration còn thiếu và phục hồi. DB trước frontend khi có hợp đồng mới; chỉ forward migration, không replay/reset. Xác nhận CI/Pages, phiên bản thật và smoke luồng bị ảnh hưởng. |
| PO | Ghi release note, giới hạn, việc còn lại; cập nhật roadmap và checkpoint bàn giao. |

QA/ITS lỗi thì quay lại IT và chạy lại kiểm tra liên quan. Không đánh dấu xong chỉ vì đã deploy. Giữ dữ liệu và validation, permission, accessibility hiện có; không thêm abstraction/dependency ngoài nhu cầu. Rà lại diff theo bốn góc: tái sử dụng, giữ hành vi, chất lượng, hiệu quả.

## Kiểm tra trong repo

- Tích hợp: `npm test`, `npm run lint`, `npm run build`; CI build dùng `VITE_DEMO_MODE=true` để không phụ thuộc cloud. PowerShell: `$env:VITE_DEMO_MODE='true'` trước build, bỏ biến sau khi dùng.
- Tập trung: `npx vitest run <test-file>`.
- Database: `npm run test:db:embedded`; full stack khi có Docker: `npm run supabase:start` rồi `npm run test:db`. Không dừng stack người khác đang dùng.
- Dependency: `npm audit --audit-level=high`. File/path/link và `git diff --check` cho tài liệu; không cần test mới chỉ để lặp lại nội dung Markdown.
- Embedded SQL không chứng minh email/OAuth/Realtime/concurrency hosted. Test mock/local và bằng chứng hosted phải ghi riêng.

UAT hiện được thiết kế là Supabase đầy đủ local + app chế độ `uat`; thiết lập riêng trên từng máy theo README/config. Không tự tạo Supabase branch trả phí. `config/access.json` cần áp qua runbook riêng; push frontend không tự áp hook/chính sách DB.

## Hồ sơ và bàn giao

Một tracker được nhận làm nguồn sự thật; không tạo bản kế hoạch mới mỗi lần chuyển thiết bị. Tracker hiện tại được trỏ từ [handoff.md](handoff.md). Giữ stable ID, quyết định, phase, manifest, bằng chứng và kết quả kiểm tra đồng nhất.

Trước mỗi đơn vị thay đổi, ghi action ID, authorization, phạm vi file/Git/external effects và marker `workflow-action:<ID> status:open` vào evidence, cập nhật Active action ở index. Khi xong/lỗi/bị chặn, chuyển marker sang terminal, ghi kết quả, cập nhật phase/verification và checkpoint. Dấu in_progress cũ có marker completed phía sau là lịch sử, không phải công việc đang được nhận.

Trước khi đổi máy, cập nhật index: trạng thái, phase/action/chủ sở hữu, nhánh, commit, kiểm tra đã chạy/chưa chạy, approval và bước tiếp theo. Commit thay đổi liên quan; chỉ push nhánh chia sẻ khi được phép. Không push main để chuyển máy vì [workflow Pages](../../.github/workflows/deploy-pages.yml) tự deploy khi main nhận push. Trên máy nhận, kiểm tra remote HEAD mới hơn checkpoint trước khi tiếp tục; nếu đã có người khác nhận cùng phase, phối hợp trước khi ghi.

Giữ kế hoạch và hướng dẫn trong Git; giữ `.env*`, token, credentials, local database, node_modules và ảnh QA riêng ngoài Git. Không cần đồng bộ skill cache hoặc toàn bộ chat. Commit cuối không thể chứa chính SHA của nó; khi bàn giao dùng Git log để xác định commit mới nhất, ghi rõ nếu còn thay đổi hồ sơ chưa commit.

Repository có thể công khai: chỉ ghi kết quả tổng hợp và dữ liệu kiểm thử giả trong hồ sơ dùng chung. Không đưa ID/số tiền khoản chi thật, số lượng tài khoản production, ID chat, đường dẫn máy hay credential vào kế hoạch/evidence. Giữ bản ghi vận hành chi tiết riêng ngoài Git; quét cả lịch sử commit sắp push, vì xóa nội dung ở commit sau không xóa bản trước.

Quy ước nhánh do khách hàng chốt: tên theo mục đích `feat/<topic>`, `fix/<topic>`, `docs/<topic>` hoặc `chore/<topic>`, chữ thường và kebab-case; tuân theo convention riêng của repo nếu có. Không dùng prefix tên công cụ/model như `codex/`, `claude/`. Nhánh bàn giao hiện tại: `docs/portable-workflow`.
