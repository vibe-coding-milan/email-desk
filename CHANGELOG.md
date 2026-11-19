# Changelog

Changes are grouped by release. Dates use America/New_York. Email Desk is self-hosted under `/email-desk/`; release notes never contain private messages, feedback, credentials or connection settings.

## 0.3.2 — 2026-11-19

- Active cards show age and remaining full-credit time in both columns, with quiet emphasis after 24 hours and a text-labelled 48-hour target indicator. A compact notice counts cards past the target; timing refreshes without replacing editors.
- Milan selected 10 XP within 48 elapsed hours of receipt and 5 XP afterward, once per card handled or dismissed. The server freezes each award; earlier awards retain 10 XP. Summary/category changes cannot reset the window, and a materially new reviewer-reopened request gets a fresh target without another award.
- History records first-decision timing and earned XP. The meter supports 5-XP increments; the fictional day shows the same timing copy.
- Validation: npm checks including elapsed-hour/DST/boundary tests, Python compilation, and fictional browser QA of a 5-XP late decision, retained history, light/dark themes and 390px wrapping. PHP storage/API regressions run in GitHub CI before merge. Production acceptance is recorded after deployment. No real card/Gmail writes are used for release testing.

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
