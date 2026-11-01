# P39 — Safari mobile form overflow

Status: local_candidate · A079/E075 · 01/11/2026
Owner: primary agent, serial implementation/review.
Branch: fix/safari-form-overflow from main40c89ce plus reconciled release receipt e4ef7eb (no app delta).

## Authorization / scope
Customer reports unequal control widths and horizontal dragging when opening add/edit forms in mobile Safari; device iPhone13, iOS version unknown. Customer requests fixing this before remaining ideas3–5. Only this repair is authorized now; no implementation of3–5 or production go-live approval.

Trace shared modal/form CSS and caller layouts. Normalize intrinsic sizing of native controls and nested grid items; preserve native date/time pickers, vertical scroll, keyboard focus/sticky actions, current fonts/themes and unsaved-edit guards. No blanket clipping of document content or disabling browser zoom. No database/auth/money/persistence/dependency change.

## Acceptance
1. Shared add/edit forms fit mobile viewport, with equal full-width controls within a column; no document/modal horizontal scroll from controls or long options.
2. Preserve vertical scroll, input/date/time interaction, validation, focus, save/cancel and unsaved changes.
3. Exercise iPhone13-sized390px portrait/landscape, narrow320/375px, reduced height, tablet768 and desktop1280; light/dark; distinguish desktop WebKit mobile emulation from physical iOS Safari. Compare old/new browser measurements where reproducible.
4. Focused browser layout check plus existing npm test/lint/demo build; scope-specific same-agent ITS and outgoing diff/privacy review. Keep physical-iOS uncertainty explicit if the original device cannot be exercised.

## Evidence / release
WebKit upstream301648 documents date/time100% width with padding on iOS (not macOS);284644/299698 document select intrinsic overflow. These support investigation, not proof of this user's exact cause. Candidate0.18.1 after verification, current-batch go-live approval before push/main deployment. No new feature/dependency/migration.

## Result —01/11/2026
Status: local QA/ITS complete, candidate0.18.1; awaiting fresh go-live approval and physical iPhone13 acceptance. Confirmed WebKit select overflow reproduced on old CSS, fixed from643px scroll region to matching318/388/638px bounds.188 compiled browser cases/201 app tests/406 embedded SQL/lint/build/audit-high PASS; no dependencies/migration. Windows WebKit date/time text fallback is an explicit limitation; iOS native-picker aspect not verified. Full release/rollback and evidence in docs/releases/2026-11-01-0.18.1.md and scoped ITS report. No push/deploy; ideas3–5 deferred.
