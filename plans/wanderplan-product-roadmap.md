# WanderPlan — bảng kế hoạch sản phẩm tổng hợp

Chủ sở hữu: PO. Cập nhật: 18/10/2026 sau phát hành 0.11.0 (Asia/Saigon). Tracker thực thi: `wp-20261014-01` (bundle `2026-10-14-no1-website-improvements`).
File này là bảng kế hoạch chung cho IT, QA, ITS, BA, ITO. Lịch theo ngày chi tiết: [daily-schedule-2026-10-15.md](daily-schedule-2026-10-15.md).

## Quy trình mỗi đợt

| Bước | Vai trò | Đầu ra bắt buộc |
|---|---|---|
| 1 | PO | Đọc yêu cầu khách hàng và bảng này; chọn hạng mục, ưu tiên, tiêu chí nghiệm thu. |
| 2 | BA | Phân tích nghiệp vụ, câu hỏi cần khách hàng chốt, quy tắc dữ liệu/quyền, ảnh hưởng Excel/demo/dữ liệu cũ. Không tự suy diễn quy tắc. |
| 3 | IT | Giải pháp kỹ thuật, ghi phase/action/file nhận xử lý vào hồ sơ, code + test, triển khai lên UAT. |
| 4 | QA | Test case theo tiêu chí nghiệm thu và hồi quy trên UAT; đạt/lỗi/chưa kiểm tra kèm bằng chứng. |
| 5 | ITS | Quét bảo mật phạm vi thay đổi sau khi QA đạt; thông báo kết quả (đạt/phát hiện/kiểm tra lại). |
| 6 | ITO | Nhận bàn giao các bước Go-live từ IT: kiểm tra remote/migration/cấu hình, triển khai, xác nhận phiên bản, kiểm tra nhanh, phương án khôi phục. |
| 7 | PO | Ghi nhận phát hành, giới hạn, cập nhật bảng này và kế hoạch đợt sau. |

UAT hiện tại: Supabase stack đầy đủ chạy local (Auth, Realtime, Postgres, Mailpit) + app chạy ở chế độ `uat`. Chưa có UAT hosted (tạo Supabase branch có phí, cần chủ dự án duyệt).

## Đã phát hành

| Phiên bản | Ngày | Nội dung chính |
|---|---|---|
| 0.2.0 | 14/10 | Lời mời giữ chỗ/thu hồi, nhận/từ chối, nhiều chuyến, nhắc ngày, xuất .ics, lazy loading. |
| 0.2.1 | 15/10 | Bắt buộc người nhận đồng ý trước khi thành thành viên (S01), gate QA trước deploy. |
| 0.2.2 | 15/10 | Thông báo nhóm đầy, nhãn lưu trữ chính xác. |
| 0.2.3 | 15/10 | Hiện phiên bản thật, ô chọn chuyến đồng bộ style, sửa tràn ngang mobile. |
| 0.2.4 | 15/10 | C01 chuyển khoản chi giữa chuyến; ô Thực tế không còn lưu thành 0; UAT local. |
| 0.3.0 | 15/10 | Dropdown chọn chuyến theo giao diện web; di chuyển khứ hồi; lưu trú nhận/trả phòng; Excel cột Đến ngày. |
| 0.4.0 | 16/10 | Công tắc tài khoản mới (config/access.json, hook server); nút Google (ẩn chờ cấu hình). |
| 0.4.1 | 16/10 | Bật đăng nhập Google; hook chặn tài khoản mới đã xác minh trên production. |
| 0.4.2 | 16/10 | Hardening: link Maps chỉ https Google ở database; chặn file Excel nén quá lớn; người chưa đăng nhập không gọi được hàm nào. |
| 0.5.0 | 16/10 | Tên hiển thị tự đặt dùng chung mọi chuyến; checklist chung, người phụ trách tùy chọn, Realtime và chống ghi đè bản cũ. |
| 0.6.0 | 16/10 | Chỉ chủ nhóm lưu trữ/khôi phục; ẩn nội dung, giữ dữ liệu/thành viên/lời mời; khôi phục được khi không còn chuyến hoạt động. |
| 0.7.0 | 16/10 | Đồng bộ giao diện toàn website; Nhóm gọn, chỉnh sửa bằng hộp thoại; sửa tràn mobile/tablet và đồng bộ form/nút. |
| 0.8.0 | 16/10 | R06: người nhận tiền xác nhận “Đã nhận tiền”/hủy; lưu thành khoản đã trả, số dư tự tính lại khi chi thay đổi. |
| 0.9.0 | 16/10 | R10: chia đều/theo phần/theo số tiền; chặn lưu khi tổng chia lệch; Excel thêm cột Cách chia/Chi tiết chia. |
| 0.9.1 | 16/10 | QA tổng hợp R16/R08: chỉ loại thành viên khi đã quyết toán xong; khoản cũ giữ người đã rời và vẫn sửa được; nút Đóng 44px; gia cố quyền. |
| 0.9.2 | 17/10 | Khóa phần tiền và không cho xóa khoản chi có người đã rời nhóm (vẫn sửa tên/phân loại/ngày/ghi chú); mock UAT .ics, Excel, Google, email, Realtime. |
| 0.9.3 | 17/10 | Sửa đọc tiền Excel, phân trang đầy đủ, chống ghi demo cũ, tải workspace song song. |
| 0.10.0 | 18/10 | R11: cảnh báo trùng giờ trong lịch trình (không chặn lưu), đánh dấu “Trùng giờ” trong danh sách. |
| 0.11.0 | 18/10 | R11: hoạt động nhiều ngày (“Đến ngày”), hiện ở mọi ngày, cảnh báo trùng giờ qua nhiều ngày, Excel cột Đến ngày; migration `20261018000000`. |


## Bảng kế hoạch

Trạng thái: Đang làm / Đã phát hành / Sẵn sàng (đủ quy tắc) / Cần chốt (khách hàng/BA phải quyết trước khi code) / Hoãn.
Thứ tự theo chỉ đạo khách hàng 15/10: các đợt tính năng/sửa lỗi trước, monitoring và Việt–Anh đi sau cùng.

| ID | Đợt | Loại | Hạng mục | Ưu tiên | Trạng thái | Phụ thuộc | Tiêu chí nghiệm thu chính |
|---|---|---|---|---|---|---|---|
| R01 | P13 | UX | Danh sách xổ xuống ô **Chuyến đang xem** vẽ theo giao diện web: tên đậm, dòng phụ điểm đến · ngày, ✓ chuyến đang xem | Cao | Đã phát hành 0.3.0 | — | Bàn phím (mũi tên, Home/End, Enter, Esc, Tab), trình đọc màn hình, chạm trên mobile; không tràn 320px; disabled khi đang phản hồi lời mời. |
| R02 | P13 | Feature | Di chuyển **khứ hồi**: một khoản, thêm ngày về | Cao | Đã phát hành 0.3.0 | — | Ngày về ≥ ngày đi, trong thời gian chuyến; danh sách hiện “27/11 → 30/11 · Khứ hồi”; tiền tính vào ngày đi. |
| R03 | P13 | Feature | Lưu trú **nhận/trả phòng**, tổng tiền, hiện số đêm và giá ước tính mỗi đêm | Cao | Đã phát hành 0.3.0 | — | Trả phòng > nhận phòng, trong thời gian chuyến; số đêm đúng; tiền tính vào ngày nhận phòng; khoản cũ không có ngày trả vẫn hợp lệ. |
| R04 | P14 | Feature | Checklist chuẩn bị chung theo chuyến | Trung bình | Đã phát hành 0.5.0 | P13 | Mọi thành viên thêm/sửa/xóa/đánh dấu; gán người phụ trách tùy chọn; Realtime, tải lại giữ dữ liệu, tách chuyến và từ chối bản cũ. Loại thành viên bỏ phân công. |
| R05 | R05 | Feature | Lưu trữ và khôi phục chuyến | Trung bình | Đã phát hành 0.6.0 | P14 | Đã chốt16/10: chỉ chủ nhóm lưu trữ/khôi phục; ẩn nội dung đến khi khôi phục. Giữ nguyên lịch trình/chi phí/người trả/thành viên. |
| R06 | P16 | Feature | Đánh dấu khoản chia tiền đã thanh toán | Trung bình | Đã phát hành 0.8.0 | P13 | Không sai số dư/không tính hai lần, không tích hợp thanh toán. Đã chốt 16/10: chỉ người nhận tiền đánh dấu/hủy; lưu thành khoản “A đã trả B X đồng”, số dư tự tính lại khi chi thay đổi. |
| R07 | P17 | Feature | Lịch sử hoạt động theo chuyến (phạm vi nhỏ) | Thấp | Cần chốt | P14–P16 | Đúng người/sự kiện; chỉ thành viên xem. Cần chốt: loại sự kiện và thời gian lưu. |
| R08 | P18 | QA | QA tổng hợp, security, chuẩn bị bản phát hành | Cao | Hoàn tất 0.9.1 | P14–P17 | Kết quả và giới hạn rõ cho từng tính năng. |
| R09 | P14 | UX/Feature | **Tên hiển thị thành viên** | Cao | Đã phát hành 0.5.0 | — | Mỗi người tự đặt, tùy chọn, dùng chung mọi chuyến; chưa đặt thì hiện phần trước @; chủ nhóm không sửa tên người khác. Email chỉ hiện cho người cùng chuyến, tên dài không tràn. |
| R10 | P20 | Feature | Chia tiền **không đều** (theo phần hoặc số tiền) | Trung bình | Đã phát hành 0.9.0 | R06 | Mỗi khoản chọn chia đều/theo phần/theo số tiền. Số tiền phải khớp Thực tế (chưa có thì Dự kiến); lệch thì chặn lưu và báo chênh lệch. Phần lẻ khi chia theo phần: người trả chịu nếu có tham gia, không thì rải theo thứ tự cố định. Excel thêm cột Cách chia/Chi tiết chia; file cũ = chia đều. |
| R11 | P24/P25 | UX/Feature | Lịch trình: cảnh báo trùng giờ (0.10.0); hoạt động nhiều ngày “Đến ngày” (0.11.0) | Thấp | Đã phát hành 0.10.0 và 0.11.0 | — | A031/A033: khoảng [bắt đầu, kết thúc) giao nhau mới trùng, tính liên tục qua nhiều ngày; không chặn lưu; hoạt động nhiều ngày hiện ở mọi ngày; Excel cột Đến ngày. |
| R12 | ITS follow-up | Security | Allowlist HTTPS cho Google Maps URL ở database (hiện chỉ kiểm tra ở form) | Trung bình | Đã phát hành 0.4.2 | — | Từ chối URL không phải https/Google Maps qua API trực tiếp; dữ liệu cũ được kiểm tra trước khi thêm ràng buộc. |
| R13 | ITS follow-up | Security | Giới hạn kích thước file Excel trước khi giải nén | Trung bình | Đã phát hành 0.4.2 (giới hạn: dựa trên kích thước file tự khai báo) | — | File quá lớn bị từ chối trước khi đọc; thông báo rõ. |
| R14 | R14 | Security | Ghim GitHub Actions theo commit SHA | Thấp | Hoàn tất16/10 | — |7 tham chiếu/5 action chính thức ghim SHA; CI/Pages đạt; README có hướng dẫn cập nhật. App giữ0.5.0. |
| R15 | QA còn mở | QA | Kiểm tra gửi email và Realtime trên Supabase **hosted** | Cao | Cần chốt | — | Bằng chứng thực tế. Cần chốt: tài khoản thử của chủ dự án hoặc tạo Supabase branch (có phí). |
| R16 | QA còn mở | QA | QA mobile trong UAT (320/375px) cho các màn chính — Chi phí và dropdown đã kiểm 320px trong P13 | Trung bình | Hoàn tất 0.9.1 | P13 | Không tràn, thao tác chạm được. |
| R17 | Sau R08 | Ops | Monitoring lỗi runtime + cảnh báo bot IT (MVP) | Trung bình | Cần chốt | R08 | Chốt dịch vụ, kênh nhận, quyền, lọc dữ liệu trước; lỗi thử đến đúng nơi, không có token/email/nội dung chuyến. |
| R18 | Sau R17 | Feature | Chuyển ngữ Việt–Anh | Trung bình | Cần chốt | R17 | Đổi ngôn ngữ nhất quán, giữ lựa chọn, không dịch dữ liệu người dùng, giữ VND. |
| R20 | P14a | Feature | **Đăng nhập với Google** (giữ magic link dự phòng) | Cao | Đã phát hành 0.4.1 (chờ chủ dự án thử đăng nhập Google thật một lần) | Chủ dự án tạo Google OAuth client và bật provider trong Supabase | Một chạm đăng nhập; tài khoản cùng email đã xác thực được gộp; lỗi hiển thị rõ; nút chỉ hiện khi bật cờ googleSignIn. |
| R21 | P14a | Security/Ops | **Công tắc tài khoản mới** qua file `config/access.json` (allowNewAccounts) | Cao | Đã phát hành 0.4.0, hook xác minh trên production | Chủ dự án bật Before User Created hook trong Supabase | false: chỉ tài khoản đã có và email có lời mời chờ mới tạo được; true: mở; chặn ở server cho cả email và Google; ITO áp bằng `npm run access:apply`. |
| R22 | P19 | UX | Tối ưu giao diện toàn website, ưu tiên tab Nhóm | Cao | Đã phát hành 0.7.0 | R05 | Nhóm rõ thứ bậc, form thu gọn, đồng bộ Tổng quan/Lịch trình/Chi phí/Đăng nhập; mobile/tablet không tràn, phát hành chung. |
| R19 | Hoãn | Feature | Ảnh chụp chỉ đọc khi offline; email/push nền | Thấp | Hoãn | — | Lập kế hoạch riêng khi có nhu cầu. |

## Quy tắc đã chốt cho P13 (khách hàng 15/10)

- Khứ hồi: **một khoản chi**, chọn “Khứ hồi” để nhập “Ngày về”; một số tiền, một người trả, một nhóm chia.
- Lưu trú: **ngày nhận phòng + ngày trả phòng**, số tiền là **tổng** cả kỳ; app tính số đêm và giá ước tính mỗi đêm để tham khảo.
- Biểu đồ “Nhịp chi tiêu theo ngày”: toàn bộ số tiền tính vào **ngày bắt đầu** (ngày đi / ngày nhận phòng).
- Dropdown chọn chuyến: **tên + điểm đến + ngày**, dấu ✓ ở chuyến đang xem, theo token giao diện web.

## Việc cần khách hàng chốt cho đợt sau

R10 đã phát hành 0.9.0; R15 cách QA hosted; R17 dịch vụ/kênh nhận lỗi. R04/R09 đã chốt và phát hành.

## Đợt tiếp theo (đề xuất PO, cập nhật 16/10)

1. **P14 — R09 Tên hiển thị + R04 Checklist chung**: hoàn tất 0.5.0 (`356c83e`); 85 test ứng dụng/166 kiểm tra SQL, QA UAT hai tài khoản/mobile/concurrency đạt; CI/Pages/public version xác nhận. [Release note](../docs/releases/2026-10-16-0.5.0.md).
2. **R14 ghim GitHub Actions theo SHA**: hoàn tất16/10 (`ac051e8`), CI/Pages đạt. **R05 lưu trữ chuyến**: đã phát hành0.6.0 (`2100957`),90 test ứng dụng/201 SQL, UAT hai tài khoản/mobile/không còn chuyến hoạt động đạt; CI/Pages/public version xác nhận. **R10 chia tiền không đều** còn cần chốt cách chia.
3. **P16 — R06 Đã thanh toán**: cần chốt ai xác nhận/hủy xác nhận. R05 đã hoàn tất; tiếp theo có thể làm QA mobile tổng hợp R16.
4. Sau R08: R17 monitoring, R18 Việt–Anh.

Rủi ro mở: R15 đã có bằng chứng một phần (hook và chuyển hướng Google trên production); vẫn cần chủ dự án đăng nhập Google trọn vòng và kiểm tra Realtime/email hosted.

## P19 — Giao diện toàn website, hoàn tất16/10
Theo yêu cầu khách hàng, rà soát và phát hành chung0.7.0 (`eff7495`): Nhóm có tóm tắt chuyến, hộp thoại sửa có quyền chủ nhóm, hồ sơ/lưu trữ thu gọn, Thành viên/Checklist hai cột desktop; đồng bộ kiểu chữ/khoảng cách/nút ở Tổng quan, Lịch trình, Chi phí, Đăng nhập và các form.92 test ứng dụng/201 SQL, lint/build/audit0; QA320/375/768/1280 và sát breakpoint, hai quyền owner/member UAT đạt. Sửa tràn nút lịch trình/tablet và encoding metadata; CI38910916980/Pages38910916845/public0.7.0 xác nhận. Không đổi database/dữ liệu production; monitoring/VI-EN và quy tắc chưa chốt giữ nguyên backlog. [Release note0.7.0](../docs/releases/2026-10-16-0.7.0.md).

## P16 — R06 Đã thanh toán, hoàn tất 16/10
Claude Code (E020) phát hành 0.8.0 (`0c124eb`): chỉ người nhận tiền bấm “Đã nhận tiền” và hủy xác nhận; mỗi xác nhận lưu thành khoản “A đã trả B X đồng”, số dư tự tính lại khi chi thay đổi; chặn ghi trùng giữa hai tab. 97 test ứng dụng/223 SQL, UAT hai tài khoản + Realtime + mobile 320/375 đạt; ITS không phát hiện. Migration `20261016210500` áp trước, dữ liệu production giữ nguyên; CI/Pages/public 0.8.0 xác nhận. Ngoài phạm vi: số tiền trả một phần, Excel cho thanh toán, xử lý thanh toán. [Release note 0.8.0](../docs/releases/2026-10-16-0.8.0.md).

## P20 — R10 Chia tiền không đều, hoàn tất 16/10
Claude Code (E021) phát hành 0.9.0 (`355a60c`): mỗi khoản chọn Chia đều / Theo phần / Theo số tiền; số tiền phải khớp Thực tế (chưa có thì Dự kiến), lệch thì chặn lưu và báo chênh lệch; phần lẻ khi chia theo phần do người trả chịu nếu có tham gia; Excel thêm cột Cách chia/Chi tiết chia. 103 test/240 SQL, UAT hai tài khoản + Realtime + mobile, ITS đạt; UAT phát hiện và sửa lỗi ô số tiền giữ giá trị số phần. Migration `20261016220000` áp trước, dữ liệu production giữ nguyên (mọi khoản cũ = chia đều); CI/Pages/public 0.9.0 xác nhận. [Release note 0.9.0](../docs/releases/2026-10-16-0.9.0.md).

## P21 — R16/R08 QA tổng hợp, hoàn tất 16/10
Claude Code (E022): hồi quy toàn bộ tính năng với hai tài khoản trên UAT, quét giao diện 320/375/768/1280 mọi màn hình, rà soát bảo mật tổng hợp — không có lỗi bảo mật cao/trung bình. Phát hiện và sửa D1 theo quy tắc khách hàng chốt (chỉ loại thành viên khi đã quyết toán xong, kể cả khoản Dự kiến; khoản cũ giữ người đã rời và vẫn sửa được), D2 (nút Đóng 44px), gia cố quyền hàm trigger và cập nhật người tham gia. Phát hành 0.9.1 (`dd9de1b`): 106 test/258 SQL; migration `20261016230000` áp trước, dữ liệu giữ nguyên; CI/Pages/public 0.9.1 xác nhận. Cần khách hàng cân nhắc: có khóa sửa số tiền của khoản cũ có người đã rời không. [Release note 0.9.1](../docs/releases/2026-10-16-0.9.1.md).

## P22 — Khóa tiền khoản có người đã rời + mock UAT, hoàn tất 17/10
Claude Code (E023) phát hành 0.9.2 (`ea623eb`) theo quy tắc khách hàng A024: khoản chi có người đã rời nhóm giữ nguyên số tiền, cách chia, người trả, người tham gia và không xóa được; vẫn sửa tên, phân loại, ngày, ghi chú; thanh toán với người đã rời được giữ nguyên. Mock UAT trên stack local các phần trước đây chưa kiểm: .ics, Excel tải về/nhập lại/file đã sửa, Google (yêu cầu, hook, callback giả lập, lỗi), email qua Mailpit, Realtime — đều đạt. Chưa mock được: màn hình đồng ý của Google và gộp tài khoản cùng email, hạ tầng email/Realtime hosted. 107 test/270 SQL; migration `20261016240000` áp trước, dữ liệu giữ nguyên; CI/Pages/public 0.9.2 xác nhận. [Release note 0.9.2](../docs/releases/2026-10-17-0.9.2.md).

## P23 — Đồng bộ production và làm việc nhiều thiết bị
Production đã là 0.9.3 tại `6becd6f` (PR #1): sửa đọc tiền Excel, phân trang đầy đủ, chống ghi demo cũ và tải workspace song song. CI/Pages thành công; metadata public 0.9.3 xác nhận. Kiểm tra lại local: 129 app tests/270 SQL, lint/build đạt; không có migration mới. Hosted smoke có đăng nhập chưa kiểm lại. [Release note](../docs/releases/2026-10-17-0.9.3-pre-release.md).

P23 theo yêu cầu khách hàng: đưa hồ sơ plans vào Git và thêm [docs/agent](../docs/agent/README.md), giữ cùng tracker và quy trình PO → BA → IT → UAT/QA → ITS → duyệt go-live → ITO → PO. Không chọn thêm feature chưa chốt. R07/R11/R15/R17/R18 vẫn là quyết định đợt sau; lịch cũ phía trên là lịch sử, không phải lệnh chạy. Bước tiếp theo: chia sẻ nhánh bàn giao sau khi được phép push; sau đó chốt môi trường/tài khoản cho R15.

A029/E025: hồ sơ chia sẻ đã làm sạch và push nhánh `codex/portable-workflow-clean`; gói đầu `1f8c3df` đã xác nhận trên remote. Đọc checkpoint mới nhất sau fetch. Không merge main/deploy; giữ các quyết định nghiệp vụ còn mở.

A030: nhánh bàn giao hiện tại là `docs/portable-workflow`. Mọi nhánh mới đặt theo mục đích Git, không dùng prefix tên agent/công cụ.

## P24 — R11 cảnh báo trùng giờ, hoàn tất 18/10
Khách hàng chốt A031. Bản 0.10.0 (`ab7a517`, nhánh `feat/itinerary-overlap-warning`): form thêm/sửa cảnh báo trùng giờ (không chặn lưu), danh sách đánh dấu “Trùng giờ”. 136 test, lint/build/audit đạt; UAT local đạt. Không đổi database. Hoạt động nhiều ngày hoãn. Go-live A032: PR #4 merge `d36d741`, CI/Pages đạt, production 0.10.0 xác nhận; chưa smoke có đăng nhập trên production. [Release note 0.10.0](../docs/releases/2026-10-17-0.10.0.md).

## P25 — R11 hoạt động nhiều ngày, hoàn tất 18/10
Khách hàng chốt A033. Bản 0.11.0 (nhánh `feat/multi-day-itinerary`): “Đến ngày” tùy chọn, giờ bắt đầu ở ngày đầu và giờ kết thúc ở ngày cuối, hiện ở mọi ngày (“Ngày k/n”), cảnh báo trùng giờ liên tục qua ngày, Excel cột Đến ngày. Có migration `20261018000000` (áp trước frontend). 141 test, 281 SQL, UAT local đạt. Go-live A034: migration áp production trước, PR #6 merge `b113a60`, CI/Pages đạt, production 0.11.0 xác nhận; chưa smoke có đăng nhập trên production. [Release note 0.11.0](../docs/releases/2026-10-18-0.11.0.md).
