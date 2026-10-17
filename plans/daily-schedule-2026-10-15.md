# Lịch làm WanderPlan từ 15/10/2026
# R14 hoàn tất16/10:7 tham chiếu/5 GitHub Actions ghim full SHA chính thức, README có hướng dẫn bảo trì. Commits4bf0f0f/ac051e8; CI38905743762 và Pages38905743731 đạt; publicHTTP200/0.5.0. Không đổi app/database. Khách hàng chốt R05: chỉ chủ nhóm lưu trữ/khôi phục, ẩn nội dung đến khi khôi phục; tiếp tục đợt R05.

Cập nhật: 15/10/2026, múi giờ Asia/Saigon.
Nguồn: yêu cầu khách hàng; đối chiếu bundle `2026-10-14-no1-website-improvements`.

## Phần đã hoàn tất

Theo báo cáo cuối chat và hồ sơ dự án, P01–P06 đã triển khai: giữ chỗ/hủy lời mời; nhận/từ chối lời mời và sửa đăng nhập; nội dung/bố cục; lazy loading và chống thao tác trùng; nhiều chuyến đi; banner nhắc ngày và xuất lịch .ics.

P07 đã phát hành website 0.2.0, commit 13583f1, cập nhật database và CI/Pages thành công. Đây là trạng thái ghi nhận từ hồ sơ, chưa kiểm tra lại môi trường cloud trong chat lập lịch này.

Đã báo cáo 53 test ứng dụng, 83 kiểm tra SQL, lint và build đạt. Kiểm tra luồng đăng nhập/email thực tế, realtime cloud và giao dịch đồng thời còn cần bổ sung. Không đưa P01–P07 vào danh sách xây mới.

## Lịch dự kiến

## Quy trình đã chốt

Người dùng chốt ngày 15/10/2026: **Lập kế hoạch → Code → QA test → Security test → Go-live → Ghi nhận tính năng và kế hoạch các ngày tiếp theo**.

Áp dụng cho từng đợt thay đổi trong lịch bên dưới; không gom QA/security đến ngày cuối tuần.

1. **Lập kế hoạch:** xác định vấn đề, phạm vi, quy tắc sản phẩm, tiêu chí nghiệm thu, ảnh hưởng dữ liệu/quyền và cách khôi phục khi phát hành lỗi.
2. **Code:** triển khai theo phạm vi đã chốt, bổ sung kiểm tra phù hợp với thay đổi.
3. **QA test:** kiểm tra chức năng theo tiêu chí nghiệm thu, hồi quy các luồng bị ảnh hưởng và giao diện liên quan; ghi kết quả đạt/lỗi/chưa kiểm tra cùng bằng chứng.
4. **Security test:** kiểm tra xác thực, phân quyền, cách ly dữ liệu giữa người dùng/chuyến, đầu vào và lộ thông tin theo phạm vi thay đổi; ghi phát hiện, cách xử lý và kết quả kiểm tra lại.
5. **Go-live:** chỉ thực hiện khi QA và security đạt các tiêu chí phát hành. Lỗi chặn sử dụng, lỗi bảo mật nghiêm trọng hoặc kiểm tra bắt buộc chưa thực hiện phải được xử lý trước. Kiểm tra migration/cấu hình, triển khai, xác nhận phiên bản và kiểm tra nhanh trên môi trường thật; có phương án khôi phục phù hợp.
6. **Ghi nhận sau phát hành:** lưu phiên bản/commit/ngày phát hành, tính năng và lỗi đã sửa, kết quả QA/security/kiểm tra sau triển khai, giới hạn còn lại; cập nhật việc hoàn tất, việc chuyển ngày và ưu tiên ngày kế tiếp.

Nếu QA hoặc security phát hiện lỗi, quay lại code và chạy lại kiểm tra bị ảnh hưởng trước khi đi tiếp. Nếu kiểm tra sau triển khai không đạt, sửa hoặc khôi phục rồi xác minh lại; chưa đánh dấu hoàn tất chỉ vì đã deploy.

Lịch bên dưới phân bổ chủ đề chính, không thay thế các bước này. Có thể chia một đợt qua nhiều ngày và ghi rõ đang ở bước nào; không bắt buộc phát hành mỗi ngày. Việc chốt quy trình không tự khởi chạy code, kiểm thử hay deploy.

## Phân bổ công việc

| Ngày | Ưu tiên và công việc | Điều kiện hoàn tất |
|---|---|---|
| 15/10 | Kiểm tra bản 0.2.0: đăng nhập/link hết hạn/đổi tài khoản; nhóm 3 người + 1 lời mời, hủy và mời lại; nhận/từ chối; tạo/chuyển chuyến; dữ liệu tách biệt; chi phí và Excel; tên dài trên mobile. Ghi lỗi và sửa lỗi chặn sử dụng trước. | Có checklist đạt/lỗi/chưa kiểm tra và bước tái hiện từng lỗi. Luồng cần tài khoản/email chỉ đánh dấu đạt sau khi thực sự kiểm tra. |
| 16/10 | Kiểm tra đăng nhập/email cloud, realtime hai phiên và thao tác đồng thời; sửa lỗi API chuyển khoản chi sang chuyến khác nhưng giữ người tham gia không thuộc chuyến đích. | Có bằng chứng kiểm tra cloud thực tế; lỗi tính nhất quán được sửa và kiểm tra hồi quy. Không coi kiểm tra chưa chạy là đạt. |
| 17/10 | Monitoring lỗi runtime và cảnh báo bot IT ở phạm vi MVP: chốt nơi nhận, thu thập lỗi đã lọc dữ liệu nhạy cảm, gom lỗi trùng và thử đường cảnh báo. | Một lỗi thử trong môi trường test đến đúng nơi nhận với phiên bản/trang/mức độ; không có token/email/nội dung chuyến trong payload. Nếu chưa có dịch vụ/kênh nhận thì ghi rõ phần chưa kết nối. |
| 18/10 | Chuyển ngữ Việt–Anh: tách chuỗi UI, chọn/lưu ngôn ngữ, định dạng ngày/số theo locale, fallback tiếng Việt; kiểm tra lỗi form và màn hình nhỏ. | Đổi ngôn ngữ nhất quán, tải lại giữ lựa chọn; không dịch dữ liệu người dùng hoặc đổi đơn vị VND; không còn key thô/chuỗi bị tràn. |
| 19/10 | Checklist chuẩn bị chung theo chuyến. | Nhóm thêm/đánh dấu việc, tải lại không mất; quyền và dữ liệu tách biệt giữa chuyến. |
| 20/10 | Lưu trữ và khôi phục chuyến. | Không mất lịch trình, chi phí hay lịch sử người trả; quyền xem/khôi phục rõ ràng. |
| 21/10 | Đánh dấu khoản chia tiền đã thanh toán; chốt ai xác nhận/hủy xác nhận trước khi code. | Không làm sai số dư hoặc tính hai lần; không tích hợp xử lý thanh toán. |
| 22/10 | Lịch sử hoạt động phạm vi nhỏ theo chuyến. | Ghi đúng người/sự kiện, chỉ thành viên được phép xem; không lộ dữ liệu chuyến khác. |
| 23/10 | QA tổng hợp, security, sửa lỗi và chuẩn bị bản phát hành tiếp theo. | Có kết quả và giới hạn rõ; mỗi tính năng vẫn đi đủ quy trình riêng trước Go-live. |


## Quy tắc điều chỉnh

- Đây là phân bổ dự kiến theo ngày, chưa phải cam kết thời lượng hoặc xác nhận các tính năng backlog đã có đặc tả đầy đủ.
- Nếu ngày 15–16/10 còn lỗi chặn sử dụng hoặc lỗi phân quyền/dữ liệu, dời các mục tính năng phía sau; không bỏ kiểm tra để giữ lịch.
- Mỗi ngày ưu tiên một đầu việc chính; dừng tại mốc đã kiểm tra và ghi lại việc xong, việc còn, bước tiếp theo. Không coi khung hạn mức 5 giờ là thời lượng cố định cho một phase.
- Ngày 17–23/10 là đề xuất thứ tự cập nhật theo phản hồi UX; các tính năng cũ được dời để ưu tiên monitoring và chuyển ngữ. Chốt quy tắc sản phẩm và phạm vi trước khi triển khai từng mục.
- Offline chỉ đọc, email/push nền và đổi hạ tầng để sau. Chat gốc đề xuất tiếp tục Supabase Auth và hosting hiện có; chưa có kế hoạch tạo repo backend, Keycloak hoặc microservices/Nginx.
- Ghi lịch không tạo automation, không tự chạy theo ngày và không tự phát hành.

## Nhật ký theo ngày

| Ngày | Trạng thái | Ghi nhận |
|---|---|---|
| 15/10 | Hoàn tất đợt kiểm tra/sửa lỗi và phát hành 0.2.1 | Đã đi đủ plan → code → QA → security → go-live → notes. Sửa lỗi thêm thành viên bỏ qua nhận lời mời, câu chữ chi phí trống và gate QA trước deploy. 53 test ứng dụng, 95 kiểm tra SQL, lint/build đạt; npm audit 0. CI/Pages thành công; website thật xác nhận 0.2.1. Kiểm tra đăng nhập/email/realtime cloud và database đồng thời còn trong lịch 16/10. |

Chi tiết: [release note 0.2.1](../docs/releases/2026-10-15-0.2.1.md). Commit cuối đợt UI/UX: `24e8b57`; worktree sạch và được giữ lại. Không có automation tự chạy theo ngày.

## Phản hồi UI/UX bổ sung — 15/10

Ưu tiên cao nhất, xử lý ngay trong P10: thông báo nhóm đầy và nhãn lưu trữ. Nguyên nhân: isFull hiển thị thông tin dưới màu lỗi và đưa hướng dẫn hủy dù0 lời mời; nhãn đã đồng bộ chỉ kiểm tra chế độ demo, không phản ánh lần lưu/kết nối. Bản sửa giữ nguyên sức chứa, quyền chủ nhóm và validation ở database.

Hiện trạng chuyển ngữ: chưa có hệ thống VI/EN; phần lớn UI và format hiện là tiếng Việt, một số tagline tiếng Anh cố định không phải hỗ trợ đa ngôn ngữ.

Hiện trạng monitoring: có fallback lỗi trên màn hình và kiểm tra CI, chưa có báo lỗi runtime tập trung hoặc gửi bot IT. Chưa có quy trình bot tự sửa/phát hành.

Phạm vi monitoring dự kiến17/10:
- Quyết định cần chốt trước tích hợp: dịch vụ nhận lỗi, kênh bot IT/người phụ trách, tài khoản/quyền cấu hình, giới hạn chi phí và lưu dữ liệu.
- Thu thập exception/lỗi tải trang/lỗi request phù hợp, gắn phiên bản/trang và mã lỗi; lọc token, email và dữ liệu cá nhân/nội dung chuyến; gom lỗi trùng, giới hạn tần suất.
- Cảnh báo→phân loại→ticket hoặc bản sửa review được→QA→security→Go-live→note. Không coi mọi lỗi là được phép cho bot tự sửa và deploy trực tiếp.
- Kiểm tra bằng lỗi mô phỏng trong môi trường test; không gây lỗi chủ động cho dữ liệu thật.

Phạm vi VI/EN dự kiến18/10: chuỗi chung rồi từng trang, form validation/thông báo lỗi, bộ chọn/lưu lựa chọn, ngày/số/tiền theo locale và fallback. Tên chuyến, tên người, ghi chú là dữ liệu gốc; không tự dịch. Kiểm tra cả2 ngôn ngữ với tên dài/mobile.

Các mốc là lịch dự kiến, không phải lịch chạy tự động. Nếu QA cloud hoặc lỗi dữ liệu16/10 chưa xong, dời phần sau.

P10 hoàn tất15/10:hai sửa UX ưu tiên đã phát hành0.2.2,58 test ứng dụng/lint/build và CI/Pages đạt; public version xác nhận. Nhóm đầy có/không lời mời, nút tăng sức chứa, mobile320px được kiểm tra demo; màn Nhóm đăng nhập cloud chưa kiểm tra. [Release note0.2.2](../docs/releases/2026-10-15-0.2.2.md). Monitoring và VI/EN vẫn là kế hoạch, chưa triển khai.


P11 hoàn tất15/10 — phát hành0.2.3 (`2d50f47`): thay Lưu trực tuyến bằng phiên bản thật lấy từ package; đồng bộ hover/focus/chevron của ô Chuyến đang xem; bỏ nhãn Cập nhật cùng nhóm; sửa tràn ngang mobile320px.59test ứng dụng,95kiểm tra SQL trên CI, lint/build/audit đạt; security/simplify phạm vi thay đổi không có phát hiện mới. CI/Pages thành công, public metadata0.2.3 xác nhận. QA giao diện bằng demo desktop/mobile/bàn phím; chưa kiểm tra Nhóm đăng nhập cloud. [Release note0.2.3](../docs/releases/2026-10-15-0.2.3.md). Lịch16–23/10 giữ nguyên; không tạo automation.

P12 hoàn tất 15/10 (đợt 16/10 làm sớm) — phát hành 0.2.4 (`b0fcd1b`): sửa C01 bằng migration chuyển tiếp `202610160001` (đã áp lên production, có lịch sử); sửa lỗi ô Thực tế bị lưu thành 0 (UAT phát hiện), dữ liệu bị ảnh hưởng được hiệu chỉnh theo xác nhận của chủ dự án. UAT trên Supabase stack local: magic link/liên kết hết hạn, Realtime hai phiên, sửa đồng thời và tranh chỗ lời mời đạt. 63 test ứng dụng, 101 kiểm tra SQL, lint/build/audit đạt; CI/Pages thành công, public 0.2.4. Chưa kiểm tra gửi email/Realtime trên Supabase hosted và mobile trong UAT. [Release note 0.2.4](../docs/releases/2026-10-15-0.2.4.md). 17/10 monitoring cần chốt dịch vụ/kênh nhận trước khi code.

## Điều chỉnh thứ tự — 15/10 (khách hàng)

Monitoring/bot IT (17/10) và Việt–Anh (18/10) chuyển xuống sau cùng, sau các đợt tính năng/sửa lỗi 19–23/10. Bảng kế hoạch tổng hợp: [wanderplan-product-roadmap.md](wanderplan-product-roadmap.md).

P13 hoàn tất 15/10 — phát hành 0.3.0 (`d830874`): dropdown chọn chuyến tự vẽ (tên + điểm đến + ngày, ✓); di chuyển khứ hồi một khoản có ngày về; lưu trú nhận/trả phòng tổng tiền, hiện số đêm; tiền tính vào ngày bắt đầu; Excel cột Đến ngày. Migration `202610160002` đã áp production qua CLI. Quy trình PO→BA→IT→UAT→QA→ITS→ITO→PO; 71 test, 115 kiểm tra SQL, lint/build/audit đạt; QA UAT hai phiên và 320px đạt; ITS không phát hiện mới. [Release note 0.3.0](../docs/releases/2026-10-15-0.3.0.md).

P14a 16/10 — phát hành 0.4.0 (`bce645b`): công tắc tài khoản mới `config/access.json` (`allowNewAccounts=false`: chỉ tài khoản cũ và email có lời mời chờ) thực thi bằng hook trước khi tạo tài khoản, áp bằng `npm run access:apply`; nút “Đăng nhập với Google” sau cờ `googleSignIn` (đang tắt). Migration `202610160003` và giá trị false đã áp production. Còn chờ chủ dự án: bật hook Before User Created trong Dashboard; tạo Google OAuth client và bật provider. [Release note 0.4.0](../docs/releases/2026-10-16-0.4.0.md).

0.4.1 16/10 (`a654495`): bật đăng nhập Google. Trước phát hành đã xác minh trên production: Google provider chuyển hướng đúng; hook chặn tài khoản mới (403, không tạo người dùng, không gửi thư). Bản live hiện nút Google và chuyển sang accounts.google.com. Chưa thử đăng nhập Google trọn vòng bằng tài khoản thật (chủ dự án thực hiện). [Release note 0.4.1](../docs/releases/2026-10-16-0.4.1.md).

P15 16/10 — phát hành 0.4.2 (`b1a2cc1`): link Maps chỉ https Google ở database và form; chặn file Excel khai báo quá nhiều dữ liệu nén; thu quyền gọi hàm của người chưa đăng nhập, hàm mới phải cấp quyền tường minh. 80 test, 136 kiểm tra SQL (cả stack đầy đủ), audit 0; QA/ITS UAT đạt; migration `202610160004` đã áp production, hook vẫn chặn đúng. P14 (tên hiển thị, checklist) đã chốt quy tắc, là đợt kế tiếp. [Release note 0.4.2](../docs/releases/2026-10-16-0.4.2.md).

P14 hoàn tất16/10 — Codex tiếp nhận và phát hành0.5.0 (`356c83e`): tên hiển thị tùy chọn do mỗi người tự đặt, dùng chung mọi chuyến; checklist nhóm thêm/sửa/xóa/đánh dấu, người phụ trách tùy chọn, Realtime và kiểm tra version. QA85 test ứng dụng/166 SQL, lint/build/audit0; UAT hai tài khoản,320/375px, hai kết nối DB gán việc/loại thành viên đạt. ITS sửa dò quan hệ thành viên qua lỗi validation; RPC khóa chuyến trước mục checklist và thu hồi ghi trực tiếp. Ba migration chuyển tiếp áp production, số dữ liệu cũ giữ nguyên; CI38904239001/Pages38904238872 thành công, public metadata0.5.0/login xác nhận. Simplify và cập nhật AGENTS/README phạm vi thay đổi hoàn tất. Hosted email/Realtime và đăng nhập Google thật vẫn chưa xác nhận. Tiếp theo R14 ghim Actions; lưu trữ/thanh toán/chia không đều cần chốt quy tắc; monitoring/VI-EN cuối. [Release note0.5.0](../docs/releases/2026-10-16-0.5.0.md).


R14/R05 hoàn tất16/10 — ghim7 tham chiếu GitHub Actions theo SHA chính thức (`ac051e8`), rồi phát hành0.6.0 (`2100957`): chỉ chủ nhóm lưu trữ/khôi phục, ẩn lịch trình/chi phí/checklist/lời mời cho đến khi khôi phục; giữ nguyên dữ liệu/thành viên.90 test ứng dụng/201 SQL, lint/build/audit0/advisors và UAT hai tài khoản/mobile320/375/không còn chuyến hoạt động đạt. Sửa cache null khi khôi phục và tự làm mới lời mời15 giây trên trang đang mở. ITS/simplify và cập nhật README/AGENTS hoàn tất; migration20261016131452 áp trước frontend, dữ liệu production giữ nguyên, archived0. CI38908291944/Pages38908291722 thành công; public0.6.0 xác nhận. [Release note0.6.0](../docs/releases/2026-10-16-0.6.0.md). Hosted email/Realtime và Google trọn vòng vẫn chưa kiểm tra; R06/R10 cần quyết định, R16 QA mobile tổng hợp sẵn sàng. Execute giữ Active; không tạo automation.


P19 hoàn tất16/10 — phát hành chung giao diện toàn website0.7.0 (`eff7495`), ưu tiên tab Nhóm và đồng bộ Tổng quan/Lịch trình/Chi phí/Đăng nhập, toolbar/form/dialog/empty state.92 test ứng dụng/201 SQL/lint/build/audit0, UAT owner/member, responsive320/375/768/1280 và900/901/1024 đạt. Sửa tràn lịch trình/tablet và metadata UTF-8; chỉ bản đã sửa được phát hành, CI38910916980/Pages38910916845 thành công, public0.7.0/title tiếng Việt xác nhận. Không migration/dữ liệu production/auth changes. README/release cập nhật; AGENTS hiện tại đủ routing. Worktree giữ lại, executeActive; hosted email/Realtime/Google trọn vòng vẫn chưa kiểm tra. [Release note0.7.0](../docs/releases/2026-10-16-0.7.0.md).

P16/R06 hoàn tất 16/10 (đợt 21/10 làm sớm) — Claude Code phát hành 0.8.0 (`0c124eb`): người nhận tiền xác nhận/hủy “Đã nhận tiền”, lưu thành khoản đã trả, số dư tự tính lại. 97 test/223 SQL, UAT hai tài khoản/Realtime/mobile, ITS đạt; migration áp production trước, dữ liệu giữ nguyên; CI/Pages/public 0.8.0 xác nhận. Rà soát công việc Codex P14/R14/R05/P19: đúng quy trình. Tiếp theo: R10 chia không đều (cần khách hàng chốt), R16/R08 QA tổng hợp sẵn sàng. [Release note 0.8.0](../docs/releases/2026-10-16-0.8.0.md).

P20/R10 hoàn tất 16/10 — Claude Code phát hành 0.9.0 (`355a60c`): chia tiền không đều theo phần/số tiền, chặn lưu khi lệch, Excel thêm cột. 103 test/240 SQL, UAT/ITS đạt; migration áp production trước, dữ liệu giữ nguyên; CI/Pages/public 0.9.0 xác nhận. Tiếp theo: R16/R08 QA tổng hợp sẵn sàng; R07/R11/R15/R17/R18 cần chốt. [Release note 0.9.0](../docs/releases/2026-10-16-0.9.0.md).

P21 R16/R08 hoàn tất 16/10 (đợt 23/10 làm sớm) — Claude Code phát hành 0.9.1 (`dd9de1b`): QA tổng hợp hai tài khoản + responsive + security; sửa D1 (loại thành viên chỉ khi đã quyết toán), D2 (nút Đóng 44px), gia cố quyền. 106 test/258 SQL; migration áp production trước, dữ liệu giữ nguyên; CI/Pages/public 0.9.1 xác nhận. Tiếp theo: R07/R11/R15/R17/R18 cần chốt quy tắc. [Release note 0.9.1](../docs/releases/2026-10-16-0.9.1.md).

P22 hoàn tất 17/10 — Claude Code phát hành 0.9.2 (`ea623eb`): khóa phần tiền và chặn xóa khoản chi có người đã rời nhóm; mock UAT .ics/Excel/Google/email/Realtime đạt. 107 test/270 SQL; migration áp production trước, dữ liệu giữ nguyên; CI/Pages/public 0.9.2 xác nhận. Tiếp theo: khách hàng chốt quy tắc R07/R11/R15/R17/R18. [Release note 0.9.2](../docs/releases/2026-10-17-0.9.2.md).

## Checkpoint mới nhất — 17/10/2026, P23
Lịch và ghi chú phía trên là lịch sử. Production xác minh 0.9.3 tại `6becd6f`, CI/Pages thành công; 129 app tests/270 embedded SQL, lint/build local đạt. P23 đồng bộ code, sửa hồ sơ và đưa plans/quy trình vào Git cho nhiều thiết bị. Xem [hướng dẫn](../docs/agent/README.md) và [tracker](2026-10-14-no1-website-improvements/index.md) để tiếp tục; R15 hosted/Google thật chưa kiểm lại. Không tự chạy feature hoặc deploy theo ngày.

A029/E025: hồ sơ chia sẻ đã làm sạch và push nhánh `codex/portable-workflow-clean`; gói đầu `1f8c3df` đã xác nhận trên remote. Đọc checkpoint mới nhất sau fetch. Không merge main/deploy; giữ các quyết định nghiệp vụ còn mở.
