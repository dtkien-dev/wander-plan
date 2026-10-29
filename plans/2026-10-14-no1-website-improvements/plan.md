# Proposed roadmap
Current status: Implemented — A040/A041 synthetic local and browser UAT completed. Released baseline remains complete.
Current executable batch: [P33](phases/P33-site-admin-trip-co-owners.md) website admin and co-owners, A061/E057, candidate0.15.0 implemented locally with QA/UAT/independent ITS complete. Two forward migrations and private verified-account bootstrap require separate go-live approval. Baseline main3591711/P32 is released0.14.0; deferred product features unchanged.

## A041 — Browser Excel verification
P26 follow-up after E036. Coordinator only; ignored local fixtures/browser plus canonical evidence. Acceptance: browser export captured, unchanged import preview skips, edited workbook applied once and multi-day fields retained after reload. No production access or permission expansion. Recovery: stop owned UAT process and revoke synthetic sessions, retain non-secret local evidence.

## A040 — Synthetic local UAT, 18/10/2026
Customer requests mock UAT and prohibits touching production. P26 follow-up, depends on completed E035 automated gates; coordinator only. Owned scope: canonical tracker; ignored local harness/fixtures/env and runtime in .worktrees/post-release-qa; localhost Supabase synthetic accounts/trip and browser sessions. Verify multi-day save/reload, overlap warning, Excel import/export, toasts/history and Realtime with two synthetic members. No app source, dependency, schema, production or Git publication changes. Recovery: retain clearly named local synthetic fixtures for reproducibility; stop only the app process started for this action, preserve existing stack.

## A039 — Post-release verification, 18/10/2026
P26 follow-up, depends on released P26; coordinator only, sequential. Output: current automated and public live verification plus explicit hosted-session limitations. Owned scope: execution records and isolated local QA runtime; no production data changes or deployment. Recovery: stop local QA processes; preserve existing user changes.
Serial priority order; waves are dependencies, not five-hour promises.

| ID | Phase | Depends on | Wave | Model/effort | Ownership |
|---|---|---|---|---|---|
| [P01](phases/P01-invitations.md) | Lời mời và sức chứa | None | 1 | GPT-6.1 Sol / high | supabase migrations/tests; travelRepository; GroupPage; useWorkspace; types |
| [P02](phases/P02-auth.md) | Đăng nhập và nhận lời mời | P01 | 2 | GPT-6.1 Sol / high | AuthProvider; LoginPage; workspace loading; invitation RPC/UI/tests |
| [P03](phases/P03-copy-layout.md) | Nội dung và bố cục | P02 | 3 | GPT-6 Luna / medium | LoginPage; DashboardPage; ItineraryPage; affected CSS; README; metadata |
| [P04](phases/P04-performance.md) | Hiệu năng | P03 | 4 | GPT-6.1 Sol / medium | App routing; hooks/query/realtime; modal/mutation handlers |
| [P05](phases/P05-multiple-trips.md) | Tạo và chọn nhiều chuyến | P04 | 5 | GPT-6.1 Sol / high; Astra high chỉ cho review khó | Trip schema/RLS/RPC; repository/types/cache; create/select screens |
| [P06](phases/P06-reminders.md) | Nhắc chuyến đi tối giản | P05 | 6 | GPT-6 Luna / medium; Sol medium cho calendar/timezone | Dashboard; calendar export module/tests |

| [P07](phases/P07-release.md) | Publish prepared website | P01,P02,P03,P04,P05,P06 | 7 | Coordinator | GitHub main/Pages and matching Supabase migration |

## Units and gates
P01 schema/RPC/tests then UI/demo; P02 auth states then acceptance integration; P03 compact copy/layout fix; P04 measure then fix; P05 schema/RLS then selector/cache then E2E; P06 banner then calendar. P01+P02 invitation/auth E2E before release. P05 migration rehearsal and RLS isolation before deploy. Check usage before each new unit, checkpoint completed tested boundaries.

## Backlog
Shared preparation checklist; archive trips; activity history; settle-expense status without payment processing; offline read-only snapshot. Cloudflare and push/email require separate need-driven plans.

## Execution Structure
A002 supersedes strictly serial implementation scheduling for isolated subunits. Dependencies in table remain integration gates. One writer per file, coordinator sole record writer; no automatic push/deploy.

Status: Implemented locally. P01–P06 complete; release service checks/migration/deployment remain outside local implementation and are explicitly documented in README. No background refresh wait required.


A004 completed: website0.2.0 published with matching database; P07 complete. Prior no-deploy notes describe the earlier local-only checkpoint.

## A005 — daily workflow follow-up, 15/10/2026

| ID | Phase | Depends on | Wave | Ownership |
|---|---|---|---|---|
| [P08](phases/P08-daily-validation.md) | Daily QA, confirmed fixes, security, release decision and next-day notes | P07 | 8 | Coordinator; read-only security lenses if required |

User workflow: plan → code → QA → security → go-live → notes. Apply per change batch. Dates in ../daily-schedule-2026-10-15.md are tentative, not mandatory daily releases.

## Daily checkpoint — 15/10 follow-up
Security result: [audit report](security-audit-2026-10-15.md).16/10 prioritizes authenticated cloud/realtime/concurrent-session QA and C01 expense trip reassignment consistency before future checklist work.17/10 checklist remains conditional on resolving important defects and required release checks. Release details: dedicated-worktree docs/releases/2026-10-15-0.2.1.md.

## A008 — migration history correction
P09 depends onP08, wave9, coordinator only; [phase](phases/P09-migration-history.md). Reconcile missing004/015 history after verifying existing effects; keep historical SQL unchanged.

## A009 — priority UI/UX amendment
[P10](phases/P10-priority-ux.md), depends P09, wave10, coordinator only. Priority1 full-group message and priority2 misleading sync badge are current implementation scope. Future backlog: runtime monitoring→IT-bot alert/triage with privacy/deduplication and gated fixes; then VI/EN translation switching/persisted preference/locale formatting. Providers and bot destination remain future decisions, not release blockers for P10.

### Revised future dates under A009
15/10 priority UX now;16/10 existing cloud QA/C01;17/10 runtime monitoring + bot IT MVP (service/destination/privacy/credentials decisions first);18/10 VI/EN;19/10 checklist;20/10 archive;21/10 settle status;22/10 activity;23/10 integration. These are future backlog, not executable P10 tasks or automatic runs. Each batch follows plan→code→QA→security→go-live→notes. Existing plan dates shift conditionally if defects remain.

## A010 — immediate UX follow-up
[P11](phases/P11-selector-version-ux.md), dependency P10, wave11, coordinator only:actual version badge, cohesive native trip select and redundant group label removal. Follow plan→code→QA→security→go-live→notes. Future16–23-Oct priorities unchanged.

## A011 — 16-Oct cloud QA and C01
[P12](phases/P12-cloud-qa-c01.md), depends P11, wave12, Claude Code owner (E012). Monitoring/VI/EN not in scope.

## A012 — P13 dropdown and expense date ranges
[P13](phases/P13-dropdown-date-ranges.md), depends P12, wave13, Claude Code (E013). Customer moved monitoring/VI-EN after 19–23-Oct phases. Roadmap: ../wanderplan-product-roadmap.md.

## A015 — Resume P14 (16/10/2026)
[P14](phases/P14-names-checklist.md), depends P13 and completed E015 security rollout, wave16, coordinator sole writer. Implements roadmap R09/R04 using A014 customer decisions. Commit units: database contracts with pgTAP; display-name persistence/UI; checklist persistence/UI/realtime; integration/review and release notes/version. User explicitly requests continuing the established PO→BA→IT→UAT/QA→ITS→ITO→PO delivery workflow, including gated go-live to existing targets. Future undecided backlog is outside this batch. No delegation needed for coupled contracts.

## A016 — Continue R14 (16/10/2026)
[R14](phases/R14-action-pins.md), depends completed P14, wave17, coordinator only. User asks to continue after R14 was identified as next ready batch. Pin existing official action references to full verified commit SHAs, document update process, verify and publish through established CI/Pages. No app/schema/credentials/permissions change; retain app0.5.0. Commit unit1 workflow pins with semantic/security checks, unit2 maintenance and delivery notes. Future business-rule-dependent backlog stays deferred.

## A017 — Owner archive/restore (16/10/2026)
[R05](phases/R05-trip-archive.md), depends completed P14/R14, wave18, coordinator sole writer. Customer chose only-owner archive/restore and content hidden until restored. Commits: additive DB/security/tests; repository/cache/demo; archive/restore UI/tests; review/docs/release0.6.0. Restore metadata list exposes only archived trip ID/title/time/version to owner; no archived planner content to any member. No deletion, membership changes, invitation acceptance or settlement changes. Existing delivery workflow applies after QA/security gates.

## A018 — Unified UI release
[P19](phases/P19-interface-refinement.md), depends completed R05, wave19, coordinator serial shared-style ownership. User authorizes reviewing all screens, implementing coherent refinements and a single gated0.7.0 release through existing delivery workflow.

## A019 — R06 settlement payments
[P16](phases/P16-settlement-status.md), depends completed P19, wave20, Claude Code coordinator (E020). Customer rules in decisions A019. Release target 0.8.0 through PO→BA→IT→UAT/QA→ITS→ITO→PO. Completed 16/10 at 0c124eb.

## A021 — R10 unequal splits
[P20](phases/P20-unequal-split.md), depends completed P16, wave21, Claude Code coordinator (E021). Customer rules decisions A020. Release target 0.9.0; stop for customer approval before go-live. Completed 16/10 at 355a60c after approval.

## A022 — R16/R08 integrated QA
[P21](phases/P21-integrated-qa.md), depends completed P20, wave22, Claude Code (E022). QA/ITS of release 0.9.0; fixes only for confirmed defects; any go-live needs customer approval. Completed 16/10: 0.9.1 at dd9de1b after approval.

## A025 — P22 money lock and mock UAT
[P22](phases/P22-former-money-lock-mock-uat.md), depends completed P21, wave23, Claude Code (E023). Customer rule A024; release target 0.9.2; stop for go-live approval. Completed 17/10 at ea623eb after approval.

## A026 — Sync production and cross-device workflow
[P23](phases/P23-portable-workflow.md), depends completed P22 and deployed 0.9.3, wave24. User asks to sync, check, continue workflow and add a shared folder for multiple devices. Local commits authorized; push/deploy approval remains a separate gate. Preserve the existing tracker, relative links and unresolved business decisions.

## A029 — Privacy-safe handoff publication
User authorized sanitizing the shared records and pushing a fresh branch. E025 extends P23: preserve private history locally, publish only minimized docs on docs/portable-workflow from current main; no original candidate ancestors, force push, main merge or deploy. Verify outgoing snapshots, relative links, secrets/privacy and remote exact SHA.

## A048 — P28 selected itinerary deletion
Customer authorizes implementation, owner-only, select all, irreversible confirmation and atomic version checks. See phases/P28-bulk-delete-itinerary.md. Production rollout requires fresh approval.

A048 result: P28 implemented and locally verified; see E044/verification. Full-stack UAT and production go-live approval pending.

A049/E045 result: full-local QA/UAT then scoped ITS complete; metadata 0.13.0 candidate. See verification and scoped report. Next gate: customer go-live approval before production migration/push/merge.

A050/E046: 0.13.0 deployed and verified after go-live approval; A051/E047 publishes release notes and handoff. No new feature selected.

## A052 — P29–P31 trip planning improvements
Execute P29 trash/recovery first, P30 atomic reschedule preview second, P31 template clone third. Customer approves implementation, expense-date shifting is optional/explicit; preserve money/payments/membership consent. Each phase implements demo/cloud/UI and targeted contracts, then integrated local UAT/QA, scoped ITS, concrete go-live decision. No production deployment before current-batch approval. Full scopes and acceptance are in stable phase files.
