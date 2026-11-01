# P37 — Responsive form refinement

Date: 01/11/2026 Asia/Saigon. Owner: current agent, serial.
Authorization: A071; customer requests consistent mobile usability and visual refinement across forms, retaining current blue identity.
Status: Released0.17.2 on01/11/2026; A075/E071 complete, docs closeout A076/E072.

Scope: shared field/dialog/selection/action CSS; optional label markup in expense/itinerary forms; numeric keyboard for trip creation. Review all Modal/form consumers (trip settings/create/reschedule/clone, checklist, profile, confirmation, Excel) and Login styling. No schema, money rules, persistence, permissions, dependencies or production writes.

Acceptance: no horizontal overflow at 320/375/600/768/1280px; readable optional labels, 16px input text, 44px touch targets; single-column phone and usable tablet columns; safe-area-aware sheet actions, keyboard focus/validation/cancel/save preserved; existing light/dark tokens.
Verification: focused form tests, full tests/lint/demo build, browser layout and save/validation/cancel checks, scoped same-agent ITS. Physical phones, Safari keyboard and hosted Supabase must be reported separately. No push/main/deploy without fresh go-live approval.

Follow-up A072/E068: actual Chromium demo save/reload for trip, expense (including exact-split validation), multi-day itinerary and assigned checklist PASS. Checklist widths320–1280, Tab trap, Escape/cancel preservation and console PASS. Browser save gap closed for these flows; physical-device/Safari/light/hosted gaps remain.

## A074/E070 pre-release candidate
P36 b48f0a7 locally integrated at6c99509, preserving its unchanged code and record history. Candidate0.17.2 metadata aligned. Fresh Node24.22.1 clean install/184 app/406 embedded SQL/lint/demo build/audit-high PASS; production audit0. Same-agent formal correctness/ITS report has no blocker. Compiled0.17.2 itinerary375 and expense768 open/cancel checks PASS. See docs/releases/2026-11-01-0.17.2.md for current approval scope, sequential P36→P37 rollout and rollback. Current status: ready for customer approval; no P37 push/PR/deploy.

## Released01/11/2026
P36 PR31 released first; P37 PR32 ebfe72d after PR CI41278325968 PASS. Main CI41278446256/Pages41278446221 PASS; public/authenticated0.17.2 and read-only mobile/tablet form smoke PASS. No production writes/migration; physical-device/Safari limits retained. Docs closeout continues under A076/E072.
