# Changelog

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
