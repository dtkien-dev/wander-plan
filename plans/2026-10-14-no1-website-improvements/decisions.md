# Decisions

## A062 — P33/0.15.0 go-live approval,29/10/2026
Customer explicitly approves the concrete candidate: private backup, forward migrations20261029120247/20261029122209, bootstrap only the privately specified verified account, branch/PR/CI-gated main merge, Pages/public and approved-account read-only smoke. Implementation914a2a5 plus approval/delivery records; existing GitHub/Pages/Supabase targets only. No real trip/member/payment test writes, signup/config changes or new scope authorized.

Result E058: both production migrations and exact verified-account bootstrap completed; PR22/7b647fa/main CI/Pages/public/authenticated read-only UI verified. Publish docs closeout within this approved batch; no new feature scope.

## A061 — P33 permission model, 29/10/2026
Customer approves implementing separate website admin and multiple trip owners through the delivery workflow. Website admin can view/manage all trips even without membership. Owners may appoint accepted members as co-owner; only trip creator may demote co-owners. Retain creator and at least one owner. No consent/financial invariant override or new account lifecycle feature implied. Initial admin identity held outside public records. Local implementation/synthetic verification authorized; fresh production go-live approval required.

## A060 — P32 go-live approval, 29/10/2026
Customer explicitly approves go-live in response to the concrete P32 request: push chore/workspace-refactor, create PR, merge main only after CI passes, verify Pages and live website. Scope is reviewed implementation 78f6d5a plus this approval and delivery records. Existing GitHub/Pages target only; no DB migration, business-data writes, permission/dependency changes or new feature scope. Version stays 0.14.0; identify deployment by commit.

## A059 — refactor inspection and execution, 29/10/2026
Customer requests checking and proceeding through the repository workflow after discussion of refactoring. Select a small behavior-preserving read/write hook separation (P32); preserve existing business contracts and deferred features. Implementation, local verification and local commits authorized. No go-live approval inferred. Full workspace refresh redesign remains deferred pending measured need.
## A047 — Go-live 0.12.1, 18/10/2026
Customer explicitly approves pushing fix/forms-and-local-checks, creating a PR to main, merging after CI passes and verifying Pages for candidate 0.12.1. Scope: reviewed P27 runtime/config/test/version changes and sanitized delivery records. No database migration or production test-data writes.

## A046 — Follow delivery workflow before publishing, 18/10/2026
Customer requests completing the shared delivery workflow before push/deploy. E042 completes synthetic full-local browser QA, independent ITS, version 0.12.1/release-candidate records and local commits. Current-batch go-live approval remains a separate gate under docs/agent/workflow.md; earlier batch approvals do not apply.

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

## A048 — 28/10/2026
Implement the proposed owner-only bulk itinerary deletion flow. Select all means the displayed snapshot, not future concurrent inserts. Any stale/missing selected item aborts the whole batch. Expenses/members unchanged; expense dates may still prevent trip date changes. No go-live approval.

## A049 — P28 verification continuation
Customer requests next steps and adherence to existing delivery workflow. Complete full-local UAT/QA, then scoped ITS and concrete release handoff before requesting current-batch go-live approval. Production remains unapproved.

## A050 — 0.13.0 go-live approval, 28/10/2026
After the concrete 0.13.0 go-live request (production forward migration, branch/PR/CI, merge, Pages and live verification), customer instructed proceeding with the next step. This authorizes that current batch for existing wander-plan Supabase/GitHub targets. No real itinerary deletion, unrelated features, permission/config changes or paid services authorized.

## A051 — release closeout
Publish verified 0.13.0 release outcomes and checkpoint under the current approved batch; no new feature approval or hosted destructive-test authorization.

## A052 — Three-feature implementation batch, 29/10/2026
Customer requests all three proposed features through the existing automatic delivery workflow: date-shift preview, template cloning and 7-day itinerary trash. Authorizes implementation/verification and local synthetic UAT; current-batch production go-live approval remains required at the final gate. Follow the existing tracker, not a new bundle.
Customer explicitly selected optional shifting of expense dates along with the trip; all amounts/splits/payments must remain unchanged. Administrative shift/clone/restore actions default to active trip owner. Clone does not add former members automatically: new trip owner uses existing invitations/recipient consent. Retain trip duration when moving/cloning. Trash restoration window is 7 days, followed by hourly server cleanup; deployment must verify scheduler availability. No paid infrastructure/background automation/thread creation authorized or required.

## A063 — UI review, expense trash and redesign batch, 29/10/2026
Customer asked for a full UI review and upgrade through the standard workflow. Impeccable critique/audit (dual-agent, demo 0.15.0): Nielsen 26/40, technical 13/20, no P0; P1 contrast/focus, estimate-vs-actual money clarity, settlement moment/native confirms, Group member row; P2 mobile density/form ergonomics. Snapshot kept outside Git in the worktree `.impeccable/critique/`.
Customer decisions: address all four finding groups; stronger redesign that keeps only the WanderPlan name (palette, fonts, layout may change); add an expense trash. Release order: P34 expense trash first (0.16.0), then P35 redesign including every report finding (0.17.0). Each release needs its own go-live approval.
Expense trash rules: deleted expenses stay 7 days, then hourly server cleanup like itinerary trash. The deleting member and active trip owners may view/restore (site admin has owner-equivalent access per A061). Restore is blocked, with a clear reason, when any payer/participant is no longer an active member. Trashed expenses do not count in balances, totals, exports or other trip operations. Member removal remains unchanged with an in-app confirmation dialog; no member undo.
Product truth for PRODUCT.md: primary users are a trip organiser plus friends/family groups of up to 20; organiser plans on desktop, the group views plans and records spending on phones during the trip. Positioning: itinerary and shared spending in one place, transparent splitting, Vietnamese/VND/Excel.

## A064 — 0.16.0 go-live approval, 29/10/2026
Customer approved releasing P34 expense trash as 0.16.0 with the prepared ITO checklist. P35 needs its own approval.

## A065 — P35 direction and conditional go-live, 29/10/2026
Customer started P35, answered the Operate questions (first screen = today's plan + own balance; avoid gaudy/game-like, accounting-dry and text-heavy; dark mode follows the device) and chose the "Bảng giờ tàu" (station departure board) direction on the impeccable decision page. Telemetry to impeccable.style was disabled for the round.
A066: customer approved the 0.17.0 go-live on condition that QA, ITS, documentation and release steps complete, and instructed that any failed step be fixed per QA/ITS before continuing. No migration is involved.
