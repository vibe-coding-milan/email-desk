# Changelog

## 0.7.1 — Explicit category moves — November 24, 2026

Changing Needs action / Worth knowing now stages a category edit and keeps the current card visible. A pending status names the destination and says the item stays open; Move & continue explicitly saves Guidance, labels and the category before advancing. Cancel category change preserves other edits. Handled/Noted, Pass and Not important can also save pending edits with their existing decision. Moves remain open, do not archive, award XP or create achievement events, and are counted separately in the round. Classic and the fictional demo use the same staged controls. Saved decisions and owner state are unchanged. No backend/worker, credentials, schedule or master-playbook changes are required.

Published through [PR #30](https://github.com/vibe-coding-milan/email-desk/pull/30), functional merge `0d4b1a0cc27f63963bd21cfa9c9630a4d643e14d`, receipt `arcade-20261124T234825442975Z`. Source PR CI [45512610545](https://github.com/vibe-coding-milan/email-desk/actions/runs/45512610545), branch CI 45512603563, main CI 45512847981 and [deployment 45512847945](https://github.com/vibe-coding-milan/email-desk/actions/runs/45512847945) passed, including installation and public verification. Independent acceptance matched the exact receipt/bundle, all 30 public hashes, unchanged homepage and all 27 live access checks. All 108 cards, Guidance, owner decisions/corrections, XP, achievement ledger, checkpoints, review history/report and pending feedback exactly matched the private pre-release baseline. Live fictional demo verified pending selection without advancement, explicit move, unchanged XP/achievements and the open card in Classic. No real card or Gmail mutation was used for QA. Physical-device, screen-reader and cross-device acceptance remain separate; existing reviewer/schedule/recovery limits are unchanged. Documentation-only follow-ups retain these runtime bytes and require no worker installation.

## Inbox-review HTML parser fix — November 23, 2026

Handle valid valueless HTML attributes without aborting an account review. Keep hidden content excluded and HTML inert. Add parser and full-review coverage regressions; all 38 fictional worker checks pass locally. Saved owner state and failed-account cursor protections remain intact. PR #28 is installed and the original failed window now parses. A real post-fix review verified 24 messages with zero errors and completed recent coverage for both accounts; prior failed history and older-mail catch-up remain distinct. See docs/HANDOFF.md for exact acceptance and workflow limits.

## Hosted-runner route fix — November 23, 2026

Use macOS for public release verification after paired probes reproduced Ubuntu TCP timeouts and healthy macOS connections to the same host. Retain Ubuntu checks/install, exact archive/receipt validation, complete cross-platform source-manifest binding, TLS/hash/access checks and bounded retries. Add failed-job diagnostics and cross-platform manifest/compression regressions (20 transport/phase tests total). No application/runtime/data changes. Evidence: PR #27.


## Deployment tooling — November 23, 2026

Separate confirmed installation from required public verification on a fresh GitHub runner. Add bounded transient-only retries, named-check diagnostics, same-origin HTTPS redirect enforcement, strict bundle binding and explicit phase summaries. Content/TLS/access failures remain terminal; exhausted connectivity remains failed without re-upload or rollback. Add 18 fictional transport/phase checks and a secret-free network diagnostic workflow. App version/runtime remains 0.7.0. Evidence and acceptance: PR #26 and docs/GITHUB_DEPLOYMENT.md.


## 0.7.0 — Focus rounds — November 23, 2026

Milan requested reconciliation of this chat and other project work, GitHub publication and production deployment. The selected compact pixel game now connects to real authenticated cards, with finite five-item rounds, one-click Pass, inline Guidance/multiple labels, independent Classic mode, read-only date-grouped History, verified robot review timeline, preserved server XP and four encrypted persistent achievements. New Handled/Not important decisions explicitly queue exact-reviewed-message archival; old decisions are untouched. Worker verification preserves all other labels and refuses blind replay after Inbox returns. Immediate Undo cancels only before acknowledgement/new revision and keeps earned XP immutable. Existing Guidance retrieval, master ownership, schedule, credentials and deployment access remain intact. See [FOCUS_ROUNDS.md](docs/FOCUS_ROUNDS.md) for decisions, cross-chat reconciliation, architecture, tests and deferred work.

Published through [PR #24](https://github.com/vibe-coding-milan/email-desk/pull/24), functional merge `198fd3e7e16b357a7356f00a9cfafbb07cd46535`, receipt `arcade-20261123T212216009075Z`. [Source PR CI 45268407344](https://github.com/vibe-coding-milan/email-desk/actions/runs/45268407344), branch CI 45268391317 and main CI 45268705750 passed, including the deterministic build, 30 game/achievement/connection checks, 98 PHP storage checks, 26 HTTP/API checks and 36 worker checks. Release/deployment regression checks passed (34/28).

[Deployment 45268705898](https://github.com/vibe-coding-milan/email-desk/actions/runs/45268705898) installed the exact bundle but failed its final homepage connection with a runner timeout. This failure is retained. Independent verification passed the exact receipt/bundle, all 30 served public hashes, homepage guard and all 27 live authentication/access checks. All 88 cards, Guidance, decisions, XP, board metadata and pending feedback matched the private pre-release baseline, after both website and worker installation. The new achievement ledger is empty; there is no historical backfill.

The matching private worker is installed from the functional merge, with all eight manifest files, startup health, scoped Guidance smoke and 36 fictional checks verified against installed code. The existing lock protected the upgrade; encrypted journal, grants, keys, configuration, activation and cron were verified unchanged, and the prior code backup was retained. Installation made zero mailbox/model calls. The Google Doc remains master and no credentials or schedule changed.

Live browser acceptance passed public game/classic decisions and rewards under the existing CSP, default owner five-item game, inline editing affordances, account-specific source link, independent Classic mode, read-only History, System and sign-out. Owner inspection was read-only; no real card or Gmail mutation was used for QA. The existing recent-review warning remains visible. The live fictional mobile game has three accessible decision actions and no horizontal overflow at 320×844; browser warning/error logs are empty. Actual real-mail archive execution in each account, physical devices, cross-device use and Mac-offline scheduled publication remain separate acceptance. Archive requests wait for the next existing scheduled review. Documentation-only follow-ups retain the same runtime bytes and do not require worker reinstallation.


## 0.6.1 — November 23, 2026

- Context becomes Guidance: one editable statement for future email sorting, with the same Attention, Change labels and Save controls. Remove the visible machine-summary timeline; retain stored history.
- Preserve existing guidance through completion and resurfacing. Retrieve bounded related owner guidance across future conversations and both accounts; model instructions require checking relevance and avoiding blanket sender rules.
- No new navigation, schema, credentials, schedule, master-playbook edits or Gmail actions. Fictional checks cover same/new/unrelated threads, shared-owner exclusion, bounds, edits and delivery to the classifier. Live website and worker acceptance: [PR #22](https://github.com/vibe-coding-milan/email-desk/pull/22). Deployment, all 28 public hashes, 27 access checks and preservation of all 87 cards/private state passed; worker manifest, protected state/cron and fictional smoke passed without mailbox/model calls.

## 0.6.0 — 2026-11-23

- Simplified cards to Open email, Done and Context. Kept the two attention columns and existing decision history; Not important records a dismissal rather than creating a third column.
- Added a compact nonmodal context editor with Attention choices, a note, one Save action and a Close control outside the scrolling area. Desktop board scrolling stays available and unsaved drafts survive closing or switching editors.
- Retained automatic Gmail labeling and explicit manual corrections under Change labels, with the same 37-label vocabulary and verified feedback path. Removed label search/counts from ordinary triage.
- Moved feedback/rules explanations to System. Reduced per-card XP/topic metadata, standardized centered button captions and condensed review status while preserving failure, missing-slot and historical-coverage information.
- Preserved authentication, encrypted storage, revision/idempotency checks, owner decisions, notes and XP. No reviewer, Gmail permission, schedule, credential or master-playbook change. Published through [PR #20](https://github.com/vibe-coding-milan/email-desk/pull/20), merge `d98ea58726e15d889cd26aa2f4630a04bad78342`, receipt `arcade-20261123T155257725392Z`. [Source CI 45209628930](https://github.com/vibe-coding-milan/email-desk/actions/runs/45209628930) and [deployment 45210050440](https://github.com/vibe-coding-milan/email-desk/actions/runs/45210050440) passed. Independent receipt/bundle, all 28 public hashes and 27 live access checks passed. All 87 saved cards, notes, decisions, XP, reported history/checkpoints and pending feedback matched the private baseline. Live owner inspection was read-only; the public demo was tested with fictional feedback and no browser warnings/errors.

## 0.5.1 — 2026-11-22

- Replaced the ambiguous Partial display with Updated when both recent inbox reviews completed. Historical review appears separately as Older mail review ongoing; unfinished recent work says Review ongoing, errors say Needs attention and missing evidence stays Coverage unconfirmed.
- Applied consistent wording to the timeline, Board details, System publications, account coverage and empty states. Typed evidence drives the display; stored statuses/history remain intact. No worker, Gmail, schedule, credential or taxonomy change.
- Published through PR #17 and the explicit-historical-coverage guard in PR #18. Final commit `6debda9a8ab59c5039f8aebead3c98a04f5ab396`, receipt `arcade-20261122T182335060567Z`. Source CI and [deployment 45054711855](https://github.com/vibe-coding-milan/email-desk/actions/runs/45054711855) passed. Independent exact bundle, 28 public hashes and complete 82-card/private-state preservation passed; all 27 access checks passed on the preceding 0.5.1 installation, with backend/authentication unchanged by the final guard.
- Local semantic/schedule/card/demo checks, 34 release checks, 28 deployment checks and fictional browser inspection passed. See [current status meanings and acceptance](docs/REVIEW_STATUS.md). First actual hosted scheduled publications are verified; Mac-offline acceptance remains pending.

## 0.5.0 — 2026-11-21

- Separate recent mailbox freshness from historical catch-up; preserve visible failed/stale/offline states and per-account checkpoints.
- Match scheduled checkpoints to explicit slot identity. Manual, batch, legacy and pre-activation records no longer impersonate scheduled success.
- Add focused sign-in, dedicated History with search/status/date filters, bucket jumps, and separate Sign out.
- Add private System reporting: token usage and calculated costs by date/work type, run metadata, pending/error feedback and master-source provenance. Unknown usage/rates remain visible; no credit balance or monthly forecast is inferred.
- Improve selected-label scanning, readable feedback results, mobile close-details controls and demo exploration.
- Add encrypted report-only publication and a reviewed code-only active-worker upgrade preserving grants, journal, activation and cron. No new model request or mailbox scan is required to initialize reporting.
- Preserve comments, corrections, decisions, audit history and the approved 10/5 XP policy. Exploratory snooze, grouping, spending caps and rule automation remain deferred.


0.5.0 acceptance: PR #15 merged as a0462d6a66cd5eb8df4e2c4f7fda310104b57ae8; receipt arcade-20261121T173801463624Z. CI, 28 public hashes, 27 live access checks and exact preservation of all 74 cards/feedback/run history/checkpoints/XP passed. The deployment job failed on final public verification timeout after installation; independent acceptance is recorded separately. Private worker code upgrade preserved credentials, encrypted state and cron. Metadata initialization made zero mailbox/model calls. The master received a verified factual operational addendum; taxonomy remains unchanged.

## 0.4.4 — 2026-11-21

- Updated the privacy notice’s factual activation status and the footer version. Data destinations, retention and approved access scope are unchanged.
- Updated current architecture, reviewer operations, measured usage and acceptance documentation for the active DreamHost schedule. The private worker is deployed separately; this code release does not copy credentials or change Gmail/board state.

Version 0.4.4 is installed through PR #13, commit 95f434204c4a06cd6170572eca0c767c4afda135, receipt arcade-20261121T163619225596Z. CI passed; [deployment run 44925421684](https://github.com/vibe-coding-milan/email-desk/actions/runs/44925421684) timed out on its final root-homepage connection after installation. Independent matching receipt/bundle hash, 28 public hashes, all 23 access checks and exact 74-card/private-state preservation passed. The workflow failure remains recorded separately from verified installation.

## Hosted operations — 2026-11-21

- Activated the private DreamHost reviewer after controlled live acceptance: 24 targets, zero errors, both recent mailbox scans complete, exact label verification and preserved owner state. Historical catch-up remains partial.
- Verified one managed five-minute dispatcher for New York weekday 09:00/13:00/17:30 and weekend 09:00/17:30 slots. The existing desktop heartbeat now monitors only. First scheduled and Mac-offline publication acceptance remain pending.
- PR #11 requires every model target and adds safe diagnostics and guarded pre-activation code repairs. PR #12 surfaces unsupported deadline evidence as uncertainty. Both passed CI and were installed with hash verification and private backups. No new credential scope or SSH permission was added.
- Documented actual release/host state, usage measurement and scoped status-UX findings. No frontend redesign or implicit owner card decision was included.

Changes are grouped by release. Dates use America/New_York. Email Desk is self-hosted under `/email-desk/`; release notes never contain private messages, feedback, credentials or connection settings.

## Historical preparation record — 2026-11-20

- Prepared a read-only DreamHost/API reviewer prototype, official-library Google OAuth bootstrap with PKCE and encrypted private grants, bounded API connectivity check and token-usage reporter. These tools have not been installed on the host or activated as a schedule; production remains 0.4.1.
- Verified local API access, both expected Google account grants, the live master playbook and the shared 37-label inventory. An explicitly approved four-message pilot used 9,279 tokens; calculated cost $0.001794675, not a posted charge or monthly estimate. No Gmail labels or board cards changed.
- Fixed an HTML extraction limitation discovered after the pilot. Eight fictional proposal/parser/host-boundary checks pass; the HTML fix has no live retest yet. Preserve that distinction when reporting the pilot's quality or cost.
- Consolidated current setup, permissions, measured usage and remaining production acceptance in [the hosted reviewer guide](docs/HOSTED_REVIEWER.md). The worker and guarded installer are now prepared in draft PR #8 with 42 passing fictional tests; initial CI passed and later changes await fresh CI. Durable authorization, live label/feedback verification, host installation and a real Mac-offline run remain pending. A post-implementation UX review is planned around review status, both-mailbox freshness and recovery.

## 0.4.3 — 2026-11-21

- Added optional transactional expected-revision checks to reviewer publication, rejecting stale card updates without changing existing publishers.
- Prepared the bounded hosted worker, private installation and verified progress import. Both Production grants are renewed; Milan explicitly approved private host credential transfer and bounded recurring OpenAI payloads. No server schedule is claimed until live validation and cron read-back pass.
- All 42 fictional reviewer checks and existing CI storage/API checks pass. Production is live through PR #8, merge aee34fb6a7ccf6f29c3f14b7ede4e312a5e87432, receipt arcade-20261121T153335637529Z. Independent 28 public hashes, 23 access checks and exact private-state preservation passed; deployment run 44919759279 remains failed. At code-release time, hosted live acceptance and cron were still pending; the Hosted operations entry above records their subsequent activation.

## 0.4.2 — 2026-11-21

- Published the owner-approved privacy notice and homepage footer link for Google OAuth branding. No worker, schedule, credential or private-state change is part of the code release.
- Version 0.4.2 is live through PR #9, commit 752c9812ca264e25e75b8a7ad3400e30e9da7305, release arcade-20261121T144224251467Z. CI passed. Deployment run 44915259854 installed the matching release but timed out during its final homepage request. Independent acceptance passed: restricted receipt, 28 public hashes, all 23 authentication/access checks and exact private board/checkpoint/progress preservation. Keep the workflow failure visible; do not repeat installation or weaken checks to conceal a connectivity failure.

## 0.4.1 — 2026-11-19

- Kept sender/content dividers aligned as cards cross the 24/48-hour targets by removing timing-dependent side borders and padding. Past-target cards show a quiet amber pill and no exhausted countdown meter.
- Owner and demo cards show friendly sender names for standard single-mailbox headers, remove surrounding quotes and retain the complete original sender on hover. Bare addresses and ambiguous mailbox lists stay intact; stored sender values are unchanged.
- Validation: sender cases, existing timing/XP boundaries, shared JavaScript/Python checks, release/rollback and deployment guards passed. Fictional desktop light/dark and narrow dark views showed aligned dividers, clean sender wrapping, no horizontal overflow and no browser warnings/errors. Published through [PR #7](https://github.com/vibe-coding-milan/email-desk/pull/7), commit `125393a2f9ee5162a08f4840eb6a640357be2dde`, release `arcade-20261119T195734457313Z`. [Deploy Email Desk](https://github.com/vibe-coding-milan/email-desk/actions/runs/44603489054) passed, including public verification. Independent acceptance verified all 27 public hashes, the unchanged homepage, all 23 live access checks and exact preservation of all 32 saved cards, comments, decisions, checkpoints and XP. Live browser verified the 0.4.1 version link, owner sign-in, friendly sender/original hover value, aligned fresh/late dividers, no exhausted meters, light/dark desktop and 390px wrapping without horizontal overflow or browser warnings/errors. Owner inspection was read-only; private screenshots remain ignored. No backend, Gmail, taxonomy, schedule or credential changes.

## 0.4.0 — 2026-11-19

- Refactored the landing page, demo and signed-in board around two stepped 16-bit sections, a compact Board/History rail and a locally served desk illustration. Smoother buttons and label tiles preserve the playful style while making actions consistent.
- Simplified the content and information hierarchy: visible review checkpoints replace repeated update summaries; card-level timing replaces the global overdue count. Failure, partial, stale and offline notices remain visible.
- Bucket is a two-part segmented choice. Searchable checkbox labels retain the shared vocabulary. Removed the duplicate Status editor: Save context preserves state, and Handled/Dismiss include unsaved context with explicit Save & handle / Save & dismiss labels. History retains Reopen.
- The meter decreases through the existing 48-hour 10-XP window; late decisions still earn 5 XP, and prior awards remain earned. Removed pause controls, extra dividers and routine congratulatory copy. The robot greets once and settles; the fictional demo advances automatically.
- Prepared for publication with desktop/mobile light/dark QA, context/history/XP checks and the complete 12-card demo. Authentication, encrypted storage, reviewer permissions, Gmail boundaries and review schedule are unchanged. Published through [PR #6](https://github.com/vibe-coding-milan/email-desk/pull/6), commit `9a21d30d3555dc2a9308aca1892adcb0cfa5d0fb`, release `arcade-20261119T192807422976Z`. [Deploy Email Desk](https://github.com/vibe-coding-milan/email-desk/actions/runs/44598409634) passed including public verification. Independently verified 27 served public hashes, all 23 live access checks and exact preservation of all 32 saved cards, notes, decisions, checkpoints and progress. Live owner sign-in/out, public/demo flow, fictional 10-XP handling/History and 390px wrapping passed; browser warning/error logs were empty. No real card decisions or Gmail writes were used.

## 0.3.2 — 2026-11-19

- Active cards show age and remaining full-credit time in both columns, with quiet emphasis after 24 hours and a text-labelled 48-hour target indicator. A compact notice counts cards past the target; timing refreshes without replacing editors.
- Milan selected 10 XP within 48 elapsed hours of receipt and 5 XP afterward, once per card handled or dismissed. The server freezes each award; earlier awards retain 10 XP. Summary/category changes cannot reset the window, and a materially new reviewer-reopened request gets a fresh target without another award.
- History records first-decision timing and earned XP. The meter supports 5-XP increments; the fictional day shows the same timing copy.
- Validation: npm checks including elapsed-hour/DST/boundary tests, Python compilation, and fictional browser QA of a 5-XP late decision, retained history, light/dark themes and 390px wrapping. GitHub CI passed PHP lint, 63 storage checks and 19 HTTP/API checks before merge. Published through PR #5 as bfc2412e7aaaf9c02fe093f7cd9686b18a399235, release arcade-20261119T165206798169Z. The deployment run (https://github.com/vibe-coding-milan/email-desk/actions/runs/44570797542) installed the release and verified its receipt, but final HTTP verification timed out connecting to the root homepage on both attempts. Independent acceptance verified all 25 public hashes, all 23 live access/security checks and unchanged 29 cards/checkpoints/progress. Live demo timing/history and mobile wrapping passed. No real card/Gmail writes were used. The documentation follow-up commit 8d6e41d34ec8e91759bc9206ddbf095237d8b520 subsequently deployed successfully through https://github.com/vibe-coding-milan/email-desk/actions/runs/44571631736 (release arcade-20261119T165707703718Z); its receipt, all 25 public hashes and unchanged cards/checkpoints/progress were verified. Runtime files are identical to the functional release.

## 0.3.1 — 2026-11-17

- Larger Inter text across the welcome, demo and private board, including history, forms, review status and notifications. Pixel type remains on branding and prominent decorative headings.
- Stronger secondary-text contrast in light and dark themes, larger touch targets, wrapping card metadata and stacked mobile form fields.
- Shorter onboarding, demo summaries, instructions, XP explanation, labels and empty states. Removed repeated fictional badges and corrected the source-repository link.
- Validation: JavaScript/assets, guest/empty-state and schedule checks; provisioning, release/rollback and GitHub deployment checks; fictional light/dark browser QA at 1280, 390 and 320px. Existing comments, decisions, history, authentication and review behavior are preserved.

- Published through [GitHub Actions](https://github.com/vibe-coding-milan/email-desk/actions/runs/44119249425), commit `6451533f9b3dfc62356c54bfb19573fa55ea47c6`, release `arcade-20261117T155249532810Z`. All 25 public hashes and 23 live access checks passed; saved cards/checkpoints/progress are unchanged. Live light/dark mobile typography and editor checks passed.

## 0.3.0 — 2026-11-17

- Public welcome explains the context-driven AI agent, periodic reviews, Needs action/Worth knowing and the feedback loop. Includes Milan’s GitHub profile, selected product notes and Milan sign in.
- Separate playable demo uses twelve invented cards across accelerated 9 a.m., 1 p.m. and 5:30 p.m. reviews. Includes inline feedback/label corrections, preserved history, pause/skip/restart, 10-XP decisions and a Level 2 celebration at 100 XP. Demo state stays in page memory and never writes to the private board or Gmail.
- Illustrated first-use, cleared-column and unconfirmed-coverage states are shared by the demo and signed-in workspace. Both columns remain visible when cleared; failed coverage never implies an all-clear. Added a compact How reviews work disclosure.
- Approved robot companion appears in the logo, splash, process, empty states and rewards. Four drawn idle frames animate the head, forearm and eyes beside stationary props. Added pause/resume, offscreen pausing and a neutral reduced-motion still. Removed whole-image bobbing/rotation/pulse effects.
- Extended locally hosted pixel typography into the signed-in board. Authentication, encrypted storage, feedback/revisions, reviewer permissions, Gmail boundaries and review schedule are unchanged.
- Validation: local JavaScript/assets, fictional day/XP/empty-state and schedule/DST checks; deployment destination, release/rollback and GitHub deployment checks; fictional desktop/mobile browser QA. Published through [GitHub Actions](https://github.com/vibe-coding-milan/email-desk/actions/runs/44023929595) from commit `bdd43a230d8504873fc992f57e1f17c554715c34`, release `arcade-20261117T052545918762Z`. Verified 25 public-file hashes, 23 live access/security checks and exact saved-card/checkpoint/progress preservation. Live public/demo, Level 2, animation pause, mobile layout and sign-in entry passed browser inspection.

## 0.2.3 — 2026-11-16

- Prepared a GitHub Actions deployment after shared checks, restricted to current `main`, with serialized releases, deterministic allowlisted bundles and a dedicated forced-command SSH key. Added bounded host receiver, private one-time bootstrap, receipt read-back, deduplicated retries, code rollback and public hash/access verification. Expanded the fixed bundle to include API/bootstrap/bridge/label code; credentials, state and deployment trust code stay excluded. Activated after explicit one-time access approval on November 16 (New York time). PR #1 merged; the first GitHub deployment and live acceptance succeeded.

- Grouped XP and update timing into one aligned status strip. One continuous route connects the 9 a.m., weekday 1 p.m. and 5:30 p.m. checkpoints. Its fill moves between those points as time passes; checkpoint marks show actual publication outcomes. Removed decorative rule fragments and the unused full-width XP rule.
- Added last publication time, Due for the first 15 minutes after a scheduled time, Missed thereafter, and distinct complete/incomplete day states. A later publication does not invent an earlier result. Confirmed reviews do not require new cards to count as updated.
- Covered loading, first-use, successful zero-card reviews, cleared history, partial/failed reviews, unavailable reads, saved offline results, overnight rollover, weekends, timezone consistency and reduced-motion layouts.
- Investigated the 1 p.m. Waiting marker: the existing heartbeat actually executed five hours early (the 1 p.m. run published at 8:02 a.m. New York; the 5:30 p.m. run at 12:32 p.m.). Kept historical publication timestamps unchanged. Corrected that same ACTIVE heartbeat to explicit UTC equivalents of the existing New York cadence. A local schedule helper and reviewer maintenance instructions account for the next slot’s DST offset without adding an automation. Corrected future execution remains to be verified.
- Local validation: schedule/outcome/analog-progress tests, UTC/DST helper checks and fictional browser QA across light/dark desktop/mobile, including the edge states above. Published through [GitHub Actions](https://github.com/vibe-coding-milan/email-desk/actions/runs/44007834191) from commit `9c19f58f447e9354d373af45e44d6d698435fe79`. The durable receipt, 18 public hashes, all saved cards/checkpoints and 23 live access checks were verified; authenticated browser confirmed the connected route and sign-out.

## 0.2.2 — 2026-11-16

- Replaced the countdown panel with a small row of today’s update times and pixel checkpoints. Shows actual Updated/Partial/Failed outcomes, Waiting for an elapsed slot without a recorded result, and Next/Later for remaining times. Shows No more planned today after the final slot.
- Removed countdown, explanatory panel, schedule disclosure and manual refresh control. Automatic saved-board loading remains.
- Reads timing/outcome metadata from the existing encrypted, deduplicated publish acknowledgements (up to 30 reviews among the latest 500 operations). A newer result never implies that earlier reviews happened. No schema, credential or card mutation.
- Validation: daily schedule/outcome/DST checks, 53 isolated PHP storage checks, 18 isolated API checks, and fictional light/dark browser QA at 1440/390/320px. Published as `arcade-20261116T215218Z`. All 23 live acceptance checks and 18 public-file hashes passed. Saved cards and account cursors exactly matched the private pre-release snapshot; authenticated browser confirmed the daily checkpoints and removal of countdown/refresh controls.

## 0.2.1 — 2026-11-16

- Pixel-style “Next drop” countdown, planned New York review time, last published result and expandable schedule.
- Mirrors the active cadence: 9 a.m. and 5:30 p.m. daily, plus 1 p.m. on weekdays. Handles daylight saving time. A due slot remains “Drop pending” until a review publishes; it never claims the reviewer is running.
- Automatically loads saved board updates every minute while visible and on return to the tab. Defers while editing, preserves drafts and avoids replacing unchanged cards.
- Moved Refresh out of the header and renamed it Check now beside the timer. This remains a saved-board reload, without starting a review.
- Local checks: schedule boundary/DST tests, JavaScript/assets, fictional browser QA for countdown/pending, manual and automatic reloads, focus/draft preservation, and light/dark layouts at 1440/390/320px. Published to https://mijatovic.com/email-desk/ as `arcade-20261116T213758Z`. All 23 live acceptance checks and 18 public-file hashes passed; saved cards exactly matched the private pre-release snapshot. Authenticated browser verified the timer and sign-out without page errors.

## 0.2.0 — 2026-11-15

### Added

- Arcade-inspired interface with cobalt accents, locally hosted Silkscreen and Inter, pixel artwork, and responsive layouts.
- System, Light and Dark theme choices. Only the theme preference is stored in browser local storage.
- Quick Handled and Dismiss actions that save current card edits together.
- Durable progress: 10 XP for the first successful decision on each card; 100 XP per level. Visible XP rewards, level-up celebrations and reduced-motion support.
- Earlier context history for changed machine-authored summaries on unfinished cards. History starts with this version and does not reconstruct previously replaced text.
- A guarded, manifest-verified code/assets release updater with private code and encrypted-database backups and automatic code rollback on installation failure.

### Protected

- Cards omitted from later reviews remain saved. Open action cards cannot be automatically downgraded; explicit owner corrections remain authoritative.
- User comments, labels, card status, feedback and XP survive review updates and reopening. Retries, edits, conflicts and repeated outcome changes cannot multiply XP.
- Refresh continues to reload saved cards, without starting a review. Review failures remain visible.
- Handling a card does not send, archive, delete, mark mail read or alter Gmail system labels.
- Existing authentication, encrypted payload storage, revision checks, write deduplication, restricted reviewer access and Google Doc master policy remain in place.

### Publication

Published to https://mijatovic.com/email-desk/ as release `arcade-20261115T154502Z`. Private code and encrypted-database recovery backups were retained; the uploaded staging archive was removed. All existing saved cards exactly matched the pre-release snapshot.

### Validation

- JavaScript syntax, 37-label vocabulary and 14 local asset references checked.
- 47 storage/progress/retention checks; 18 HTTP/API checks in an isolated PHP environment.
- Fictional browser QA: theme selection/persistence, 320px/390px layouts, draft preservation, inline editing, history, XP awards and a real 90-to-100 XP level boundary.
- 34 release/rollback checks, five provisioning-destination guards, 23 live acceptance checks and 18 public-file hash checks passed. Live fonts/artwork loaded without browser errors. See `docs/HANDOFF.md` for acceptance limits.

## 0.1.1 — 2026-11-15

- Simplified the board to Needs action, Worth knowing and handled/dismissed history.
- Added inline feedback editing and one Save action; preserved drafts during Refresh.

## 0.1.0 — 2026-11-15

- Initial authenticated self-hosted board, encrypted storage, durable feedback, restricted reviewer bridge and guarded DreamHost provisioning.
