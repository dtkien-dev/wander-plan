# Decisions
## A045 — Implement focused audit fixes, 18/10/2026
Customer authorizes E040 items 1–3: metadata edits for all-former expense participants, whole-dong monetary inputs and excluding nested worktrees from local test/lint discovery. Preserve financial locks and validation. R07/R17/R18 remain deferred; workspace refresh optimization excluded. Implementation/local verification and repository-workflow local commits only; production go-live requires separate approval.

## A044 — Defer R17/R18 and review current system, 18/10/2026
Customer defers R17 and R18 as well as the already deferred R07, and requests a whole-repository review for useful optimization. Review and local verification are authorized; findings do not authorize source fixes or production deployment. No further R15 proposal requested.

## A043 — Defer R07, 18/10/2026
Customer explicitly defers trip activity history R07. Reopen only on renewed customer need; event scope and retention remain undecided. R17/R18 are being assessed, not approved for implementation. Customer reports successful sign-in and requests no further R15 proposals; hosted email/Realtime are not thereby verified.

## A038 — Go-live 0.12.0,18/10/2026
Customer approved: push feat/toasts-excel-autofit, PR to main, merge when CI passes and verify production. Scope limited to 0.12.0.

## A037 — Toasts with local history and Excel auto-fit,18/10/2026
Customer chose: Excel columns sized to content with wrapped long columns and estimated row heights; action messages as toasts that hide after 3 s (errors stay until closed); history of the user's own action results kept per account in this browser (max 50, delete one/all, via a bell), not on the server. Local commits authorized; go-live needs separate approval.

## A036 — Go-live 0.11.1,18/10/2026
Customer approved: push fix/excel-report-readability, PR to main, merge when CI passes and verify production. Scope limited to 0.11.1.

## A035 — Readable Excel export,18/10/2026
Customer asked to check the exported Excel file and chose the full fix (0.11.1): apply text colours (`textColor`), place "Đến ngày" beside "Ngày" in exported and template sheets, gridlines on data sheets and wrapped address/notes. No database change. Local commits authorized; go-live needs separate approval.

## A034 — Go-live 0.11.0,18/10/2026
Customer approved: check production migration history, apply 20261018000000, push feat/multi-day-itinerary, PR to main, merge after CI passes and verify production. Scope limited to 0.11.0 (R11 part 2).

## A033 — R11 multi-day itinerary activities,18/10/2026
Customer chose (AskUserQuestion, recorded in a local discussion record): next batch R11 part 2. An activity may have an optional "Đến ngày": start time on the first day, end time on the last day, middle days full days. It is listed under every day of its range ("Ngày k/n"). Overlap warnings compare continuous [start, end) intervals across days; touching does not warn; still never blocks saving. Excel LichTrinh gains a "Đến ngày" column; files without it still import and keep a saved end date. Estimated cost stays one amount per activity. Local commits authorized; go-live needs separate approval.

## A032 — Go-live 0.10.0,18/10/2026
Customer approved: push feat/itinerary-overlap-warning, open PR, merge main after CI passes and verify production. Scope limited to 0.10.0 (R11).

## A031 — R11 itinerary overlap warning,17/10/2026
Customer chose (AskUserQuestion): next batch R11. Two activities on the same date overlap when their [start, end) ranges intersect; 09:00–10:00 and 10:00–11:00 do not overlap. The warning never blocks saving; existing data is unchanged. Multi-day activities are deferred (not in this batch). No database, Excel or demo-storage change.

## A024 — Lock money on expenses with former members,16/10/2026
Customer answered yes to locking amount edits, then chose the full lock: expenses involving a former member keep estimate/actual, split, payer and participants unchanged and cannot be deleted; title, category, dates and notes stay editable. Remaining unverified paths (Excel/.ics downloads, Google round trip, hosted email/Realtime) are to be covered by simulated/mock UAT. R07/R11/R15/R17/R18 rules still to be decided with the customer.

## A023 — Removing members with money involvement,16/10/2026
QA defect D1 (expenses with a removed payer/participant could no longer be edited). Customer chose: the owner cannot remove a member until that member's balance is settled — no remaining debt and nothing still owed to them (actual expenses minus recorded payments = 0); estimate-only expenses (no actual yet) involving them also block removal until an actual is entered and settled or they are taken off it. After a settled member is removed, old expenses keep their name shown as "(đã rời nhóm)" and stay editable; who paid/took part is preserved; former members cannot be added to other expenses.

## A020 — R10 unequal split rules,16/10/2026
Customer chose (AskUserQuestion): each expense chooses equal (default, unchanged), by shares (e.g. A 2, B 1) or by exact amounts. Exact amounts must total the expense's actual amount, or the estimate while no actual exists; when the amount no longer matches (e.g. actual entered/edited), saving is blocked with the difference shown until splits are re-entered — no automatic scaling. Share rounding: leftover đồng go to the payer when the payer participates; otherwise spread in the existing fixed order (same as equal split). Excel: add new columns for split method and split details; old files without them import as equal split. Not yet implemented; next batch P20.

## A019 — R06 settlement rules,16/10/2026
Customer chose (AskUserQuestion): next batch R06; only the recipient marks a transfer paid and undoes it; a mark is stored as a payment record so balances recompute when expenses change. Amount = current suggested transfer, no partial amounts, no Excel, no payment processing. R10 remains undecided.

## A017 — Archive rules,16/10/2026
Customer explicitly chose: only trip owner archives/restores; archived contents hidden until restored. R05 now ready for BA/implementation after current R14 delivery. Keep all data/history; do not implement R06 settlement permissions without a separate decision.

## A015 — Codex continuation,16/10/2026
User authorizes continuing agreed delivery workflow. P14 implements A014 R09/R04 rules; completed0.5.0 under E016. Checklist RPCs enforce member authorization and trip-before-item locks; removal tombstones preserve scoped Realtime. Existing profile choices preserved; email-as-name falls back to local part. Future business rules remain undecided as listed in roadmap.

Proposed, not approved: D01 pending reserves seat, owner can revoke; D02 explicit accept/decline; D03 copy cleanup before multi-trip; D04 measure performance then lazy/guards/cache/realtime; D05 banner/calendar first; D06 keep current hosting.

## Open Questions
Q01 optional seat policy; blocks final product approval of P01.
1. Reserve pending seats (Recommended): revoke frees seat, clear messaging.
2. Count accepted only: acceptance can fail when full; changes capacity design.
Draft default: 1. Display order matches user-input tool.
Final approval not requested this turn; incorporate feedback first.

2026-10-14: User explicitly approved execution and authorized model/effort selection and subagents. D01–D06 accepted; Q01 resolved to proposed reserve-seat policy. Keycloak/backend questions are advice, not authorization to create another repository.

## A018 — Unified UI release,16/10/2026
Customer explicitly requests reviewing all website interfaces and releasing together. Preserve green identity and business/data/permission contracts; apply compact Group settings, clearer hierarchy and coordinated responsive changes across all routes. One gated0.7.0 release completed; no per-page deployments or database changes.
