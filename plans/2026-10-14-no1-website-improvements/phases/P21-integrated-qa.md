# P21: Integrated QA, mobile QA and security (R16/R08)
Status: Completed
Depends on: P20 completed
Wave: 22
Owner: Claude Code coordinator (E022).
Owned scope: QA/ITS evidence in this bundle; fixes for confirmed defects only (files claimed per defect in evidence); release note/version only if a fix ships; roadmap/schedule.
Produces: Per-feature pass/fail/not-run matrix for 0.9.0, mobile/tablet results for every route, integrated security review, fixes for blocking defects.

## Scope (PO/BA — no new business rule)
- R08: regression of every released feature on the local full stack (UAT) with two accounts: sign-in/link, trip create/select, invitations/capacity/revoke/accept/decline, display names, checklist, itinerary, expenses incl. round trip/stay ranges, unequal splits, settlement payments, Excel export/import, archive/restore, calendar export, version badge.
- R16: Login, Tổng quan, Lịch trình, Chi phí, Nhóm and dialogs at 320/375/768/1280 — no horizontal overflow, touch targets ≥44 px where interactive, long names contained.
- ITS: RLS on every public table, function grants/search_path, anon access, cross-trip isolation, Supabase advisors, npm audit.
- Out of scope: hosted email/Realtime (R15), new features. No production writes; go-live of any fix needs customer approval.

## Findings and fixes in scope
- D1 (Medium, pre-existing): expenses with a removed member uneditable → fix per A023 (DB removal guard + former-member handling in save RPC, form, list, Excel).
- D2 (Low): feedback "Đóng" button 36 px < 44 px touch target → CSS fix.
- L1 (accepted): legacy `claim_trip_invitations` (no-op) / `create_default_trip` stay callable for tested compatibility.
- L2 (Low hardening): trigger functions executable by authenticated → revoked; direct participant updates limited to split columns.
- Fixes ship as 0.9.1 only after customer go-live approval.

## Tasks
- [x] Automated gates.
- [x] Two-account functional regression.
- [x] Responsive sweep.
- [x] ITS sweep.
- [x] Defect fixes (if any) and report.
- [x] Go-live 0.9.1 after customer approval; PO notes.

Completed 16/10: release 0.9.1 at dd9de1b; migration 20261016230000 applied, counts unchanged; CI/Pages/public 0.9.1 verified.
