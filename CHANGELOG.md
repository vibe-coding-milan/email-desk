# Changelog

Changes are grouped by release. Dates use America/New_York. Email Desk is self-hosted under `/email-desk/`; release notes never contain private messages, feedback, credentials or connection settings.

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
