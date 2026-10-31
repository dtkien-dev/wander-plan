# P37 — Responsive form refinement

Date: 01/11/2026 Asia/Saigon. Owner: current agent, serial.
Authorization: A071; customer requests consistent mobile usability and visual refinement across forms, retaining current blue identity.
Status: Locally complete; QA/scoped ITS passed, production approval pending. Baseline: origin/main daead9b; branch fix/mobile-forms in isolated worktree. Primary checkout edits preserved. P36/A070 on fix/ui-polish is a separate unmerged approved batch; do not overwrite its records or treat its approval as this batch's approval.

Scope: shared field/dialog/selection/action CSS; optional label markup in expense/itinerary forms; numeric keyboard for trip creation. Review all Modal/form consumers (trip settings/create/reschedule/clone, checklist, profile, confirmation, Excel) and Login styling. No schema, money rules, persistence, permissions, dependencies or production writes.

Acceptance: no horizontal overflow at 320/375/600/768/1280px; readable optional labels, 16px input text, 44px touch targets; single-column phone and usable tablet columns; safe-area-aware sheet actions, keyboard focus/validation/cancel/save preserved; existing light/dark tokens.
Verification: focused form tests, full tests/lint/demo build, browser layout and save/validation/cancel checks, scoped same-agent ITS. Physical phones, Safari keyboard and hosted Supabase must be reported separately. No push/main/deploy without fresh go-live approval.
