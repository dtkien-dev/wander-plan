# Evidence

Tracker: wp-20261014-01. Dates use Asia/Saigon.

## Historical evidence — E001–E023
The earlier workflow established invitations/consent, isolated trips and caches, reminders/calendar, expense date ranges, account access controls, display names/checklists, archive/restore, settlement payments, unequal splits and former-member financial locks. These batches are complete; individual phase files, decisions and release notes retain their rules and test outcomes.

The public handoff deliberately omits original workstation paths, chat identifiers, live record identifiers/amounts, production population counts and account-specific usage telemetry. Detailed original records remain in a local private backup outside the Git working tree. This summarized record does not claim the omitted evidence was independently reverified.

## A026 / E024 — Production reconciliation and portable workflow
17/10/2026. User requested synchronizing current production code, verification, continuing the agreed workflow and a folder usable across devices. Baseline: origin/main at 6becd6f938430c50432a7ef93f4240ebdf762410, app 0.9.3. Both local checkouts were safely fast-forwarded; pre-existing ignore changes preserved.

QA: 129 application tests/23 suites, lint, demo build and 270 embedded SQL assertions/15 suites/21 unchanged migrations passed. Locked dependency installation reported no vulnerabilities. Local runtime engine and existing nonblocking build warnings were recorded; no runtime dependencies changed. CI 39040577866 and Pages 39040577859 succeeded for the baseline; public app-version 0.9.3 confirmed. Authenticated hosted smoke and hosted migration history were not rerun.

Added docs/agent shared workflow and Git-tracked plans using the same tracker. Two independent read-only documentation reviewers identified clone-relative link and private-skill dependencies; corrected. Coordinator reviewed documentation security and reuse/behavior/quality/efficiency; no runtime/schema/CI changes.
<!-- workflow-action:E024 status:completed -->

## A027 — Text privacy scan
User requested pre-push inspection. Scanned baseline and both original local candidate snapshots: 187 unique UTF-8 text blobs, plus uncommitted evidence. No verified credential exposure; an initial token candidate was a mock fixture. Confirmed unnecessary private operational/financial history in imported records. Original candidate commits were not pushed and will not be ancestors of the shared clean branch.

## A028 — Binary hidden-data scan
No new or modified binary in original outgoing candidates. Inspected 10 existing WOFF2 font blobs, decoded 441225 bytes using built-in Brotli, checked declared sizes, directories, optional metadata/private blocks and trailing bytes. No metadata/private blocks, unexpected appended payload or sensitive-pattern hits. Two existing SVGs had no embedded data, script or external href. Reports remain ignored locally. This does not prove absence of steganography or arbitrary encodings; earlier remote history was not audited.

## A029 / E025 — Clean and publish cross-device handoff
17/10/2026. User explicitly authorized cleanup followed by remote push. Prepared fresh codex/portable-workflow-clean from origin/main, in .worktrees/portable-workflow-clean under the original repository anchor. Transferred only documentation/ignore changes, preserving original local candidates and private historical backup outside the published tree. No force push or remote history rewrite.

Scope: minimize historical evidence, remove unnecessary internal identifiers and machine paths from shared plans, preserve business decisions/phase IDs/test results, scan full outgoing snapshots and ancestry, commit and push this branch only. No merge into main, production deployment, credentials/configuration, application or database changes.
<!-- workflow-action:E025 status:completed -->

Remaining product decisions: R07/R11 rules, R15 authorized hosted sessions/environment, R17 service/channel/privacy; R18 follows R17. Real Google consent/identity linking and hosted email/Realtime remain unverified. Execute mode remains Active.

E025 pre-push validation: 38 staged documentation/ignore files checked; secret/private-history patterns had zero candidates, no outgoing binary, relative links/manifest and whitespace passed. Positive/negative scanner controls passed. Manually reviewed minimized evidence and remaining historical notes; preserved business decisions and test results. Four coordinator simplify passes (reuse/behavior/quality/efficiency) found no further issue. Runtime/schema/CI files unchanged; baseline tests were not redundantly rerun for Markdown-only cleanup. After commit, validate original candidate ancestry exclusion and exact outgoing snapshots before push.

E025 publication completed: commit 1f8c3dffb471426917b82303ec4e40d6bfef59dd (docs: share sanitized cross-device workflow and plan tracker) pushed non-force to refs/heads/codex/portable-workflow-clean on the verified origin repository. git ls-remote returned the identical SHA. Outgoing commit scan passed; original unsanitized candidates are not ancestors. No PR, main merge, deployment or production mutation. Original private records/candidate history retained locally only. This final documentation checkpoint records publication; its own SHA is intentionally resolved using Git log rather than embedded in itself. Execute remains Active; no current-scope tasks remain.

Local final receipt: checkpoint commit f759ab919fd4cb64e241bf97fad2381555173da4 (docs: record sanitized handoff publication) verified identical on origin/codex/portable-workflow-clean; origin main still 6becd6f938430c50432a7ef93f4240ebdf762410. Clean worktree retained, no uncommitted Git changes there. This local receipt is outside the published checkpoint to avoid self-reference; fetch/Git log provides the same final SHA on another device.

## A030 / E026 — Tool-neutral branch names
User requests remote publication and directs future branch names to use purpose-based Git conventions without tool/model prefixes. Supersedes the branch naming default. Authorized scope: rename the local clean handoff branch to docs/portable-workflow, record policy in AGENTS/shared workflow, update current handoff references, validate docs/privacy, commit and push the new branch. Preserve the prior remote branch; deleting remote refs or merging main is not requested.
<!-- workflow-action:E026 status:completed -->

E026 completed: commit 79781f087a282f53678418ba5791166c9423d23e (docs: use purpose-based branch names) pushed non-force to refs/heads/docs/portable-workflow; exact remote SHA read back successfully. AGENTS/shared workflow/current handoff updated; credential/privacy/link/manifest/whitespace checks passed; full outgoing scan excludes unsanitized candidates. Coordinator reuse/behavior/quality/efficiency pass found no further issue. Prior remote branch retained, no deletion/main merge/deploy. Resolve latest checkpoint SHA from Git log; execute remains Active.

## A031 / E027 — R11 itinerary overlap warning
17/10/2026. Customer selected R11 and its rules (A031). Branch feat/itinerary-overlap-warning from origin/main 97af85a. Scope: P24 owned files only; frontend-only, no migration/RPC/Excel/demo storage change. No push to main or deployment without go-live approval.
<!-- workflow-action:E027 status:completed -->

E027 result: feature commit ab7a517 on feat/itinerary-overlap-warning. QA/UAT/ITS PASS as recorded in docs/releases/2026-10-17-0.10.0.md; QA activity removed from UAT data. Not pushed; go-live (push branch, PR, merge main → Pages) needs customer approval.

## A032 / E028 — Go-live 0.10.0
18/10/2026. Customer approved go-live. First push was refused (403: fine-grained token without write access); the customer re-authenticated GitHub CLI, then the branch was pushed non-force. PR #4 verify passed; merged with a merge commit as d36d741. main CI and Deploy GitHub Pages succeeded; production app-version 0.10.0 and the itinerary chunk contains the warning. No migration; production data untouched. Authenticated production smoke not run.
<!-- workflow-action:E028 status:completed -->
