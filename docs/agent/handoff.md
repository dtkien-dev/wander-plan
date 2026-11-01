# Final release checkpoint —0.18.0, 01/11/2026

App PR34 df9bd12 and docs PR35 40c89ce merged. Docs headc4193e9 CI41317989557 PASS. Final main CI41318165271 and Pages41318165277 at40c89ce verify/build/deploy PASS; final public HTTP200/meta0.18.0 and existing authenticated footer0.18.0 verified, no dialogs left open. App source remains identical to approved release; no database/config/business-data writes. Owned local preview stopped; user browser viewport restored and original homepage retained.
Release complete. This final receipt is shared on docs/release-0.18.0 without another main deployment; resolve its exact SHA through Git log. No active action/new feature. Physical-device/Safari/native keyboard/screen reader/live light/full hosted-write and current-empty-day production details limits remain as documented.

---

# Điểm bàn giao

## Latest released checkpoint —01/11/2026
0.17.2 app rollout complete: P36 PR31 dc7e48e (CI41278137602/Pages41278137603 PASS), then P37 PR32 ebfe72d (head58d8bcd/PR CI41278325968, main CI41278446256/Pages41278446221 PASS). Public HTTP200/meta and authenticated footer0.17.2; read-only mobile/tablet itinerary/expense dialog smoke PASS, no new console errors. No DB/config/data writes or login email. Same-agent ITS; physical Safari/iOS/touch/software-keyboard limits remain. A075/E071 complete; docs-only closeout A076/E072 on docs/release-0.17.2, resolve final SHA via Git log and verify CI/Pages before claiming final closeout. No new feature queued; primary checkout changes preserved.


vite 6.4.5 patch 30/10/2026 (A067/E063): PR29 9b8f231, PR CI PASS, main CI 40983007374/Pages 40983007605 PASS; Dependabot alert 7 fixed, PR27 closed as superseded; app still 0.17.0.

Released 0.17.0 checkpoint 30/10/2026: P35/A066/E062 Bảng giờ tàu redesign, PR26 7393752 (head 180dec5), PR CI PASS, main CI 40981612990/Pages 40981612923 PASS; no migration; public meta 0.17.0, signed-out console 0. Authenticated smoke not run. DESIGN.md is the visual source of truth. No feature queued. Docs closeout on docs/release-0.17.0.

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

## Local UI refinement — 31/10/2026
P36/A068/E064 completed locally on fix/ui-polish from fetched origin/main daead9b. Itinerary title/amount stack below900px and row layout matches app shell. 184 tests/lint/demo build PASS; demo mobile/tablet/desktop and selection verified, console errors0. Same-agent CSS security review clear. No push/merge/deploy. Primary checkout remains untouched at d877371 with pre-existing dirty records; do not replace latest records with that old snapshot. Read P36 and index; next review local candidate, broader UAT if required, fresh go-live approval before main publication.

## Pre-go-live candidate — 31/10/2026
P36/A069/E065 candidate0.17.1 on fix/ui-polish. QA184 app/406 embedded SQL/lint/build/audit-high PASS, prod-dependency audit0 findings, independent scoped ITS clear. Light-token and dark demo/long-title/large-amount/selection+Escape QA completed. Full hosted/service/real-device UAT not run; see release checklist docs/releases/2026-10-31-0.17.1.md. No push/PR/main merge/production changes. Current-batch go-live approval pending. Primary old dirty checkout preserved; continue isolated branch and resolve head from Git log.

## P37 responsive forms — 01/11/2026
Local candidate on fix/mobile-forms from fetched main daead9b; resolve commit via Git log. E067/A071/P37: shared field/dialog/selection polish, optional-label markup and numeric keyboard hints.184 tests/lint/demo build and Chromium demo widths320–1280/short viewport PASS; same-agent ITS clear. No DB/dependency change, push or deploy. Physical phones/Safari/hosted and browser save/reload not tested;11 moderate dev-tool audit findings unchanged. Separate fix/ui-polish P36/A070 remains unmerged and must be reconciled before release; its approval does not cover P37. Primary checkout edits retained.

## Current pre-release checkpoint —01/11/2026
P37 candidate0.17.2 ready locally on fix/mobile-forms; resolve final SHA by Git log. Local merge6c99509 preserves P36 b48f0a7. P36 PR31 open, CI41220417353 PASS, approval A070 still scoped to P36. E070/A074: supported Node24.22.1 clean install,184 app/406 embedded SQL/lint/demo build/audit-high PASS; production audit0 and11 moderate dev-tool findings unchanged. Same-agent P37 correctness/ITS report clear; final compiled-browser checks PASS; physical-device/Safari/touch/light/hosted limits remain. Earlier P37 browser save/reload gap closed by E068. No P37 push/PR/deploy; fresh approval pending. Read docs/releases/2026-11-01-0.17.2.md for exact sequential P36→P37 ITO/rollback. No DB/dependency change or production write; primary old dirty checkout retained.

## Current local candidate — 01/11/2026
P38/A077/E073 completed locally on feat/mobile-trip-experience from fetched origin/main5eb5674. Candidate0.18.0: shared modal/navigation unsaved protection, pending-write guard, Today activity details/current-next shortcut/validated Maps.201app tests/406embedded SQL/lint/demo build/audit-high PASS; production audit0, same-agent scoped ITS clear, compiled Chromium demo QA PASS. No migration/dependency change. Physical-device/Safari/native keyboard/screen reader/live light/full hosted/native unload gaps remain; see P38 and docs/releases/2026-11-01-0.18.0.md. Primary dirty checkout preserved. No push/PR/main merge/deploy. Next gate fresh customer go-live approval, then exact-head CI/Pages/live verification. Resolve local candidate SHA via Git log.

## Latest released checkpoint —0.18.0, 01/11/2026
P38/A078/E074 released via PR34 df9bd12, approved head3da897c and PR CI41317406891 PASS. Main CI41317557088/Pages41317557092 PASS; public HTML/entry HTTP200/meta0.18.0, existing authenticated footer and375px itinerary/expense open+cancel/scroll smoke PASS, new warnings/errors0. No DB/config/business-data writes or login emails. Today preview day empty; live details not exercised, demo QA retained. Same-agent ITS; physical-device/Safari/native keyboard/light/full hosted limits remain. Closeout on docs/release-0.18.0 from df9bd12; resolve final docs SHA/PR/CI/Pages via Git history. No new feature; primary dirty checkout preserved.
