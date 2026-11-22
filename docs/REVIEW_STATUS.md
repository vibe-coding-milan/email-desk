# Review status and current acceptance

Current as of November 22, 2026 · Email Desk 0.5.1

## What the app tells you

Recent inbox review, review of older mail and execution of a scheduled slot are separate facts. An unfinished older-mail review is ordinary ongoing work; it does not by itself mean the current inbox review failed.

| Display wording | Meaning and evidence |
| --- | --- |
| Updated | The saved final review records complete recent coverage for both approved accounts. A legacy success record can retain its own recorded outcome, but cannot establish a scheduled slot without explicit identity. |
| Older mail review ongoing | The saved reporting snapshot explicitly records unfinished historical coverage. This is a separate, neutral progress message. A raw partial status alone cannot establish it. |
| Review ongoing | Typed recent coverage records unfinished review work. This is distinct from an execution error. |
| Needs attention | The saved review or an account’s coverage records an error. Retain prior cards and failed-account checkpoints. |
| Coverage unconfirmed | Evidence is missing or insufficient; do not infer success or failure from a summary. |
| Due / Missed | A scheduled final publication has not yet been recorded for that exact slot. Due allows the 15-minute completion window; Missed indicates that window passed. A later real publication can reconcile the slot without changing its actual timestamps. |

The Board, timeline, System publication history, per-account descriptions and empty-board copy use this vocabulary. Historical rows use their own recent coverage; they do not borrow a later report’s historical progress. The timeline counts only an explicitly scheduled final result for the matching New York slot. Manual, intermediate and legacy records do not impersonate scheduled completion. A completed result can arrive late: the planned slot, actual start, completion and publication remain separate.

Stored success/partial/error values remain intact for audit and compatibility. The interface interprets typed recent and historical evidence rather than replacing historical records or parsing prose. These terms describe review work; they do not change the 37 Gmail topic labels or the master organization playbook.

## Current operating evidence

DreamHost’s schedule is active: weekdays 09:00, 13:00 and 17:30; weekends 09:00 and 17:30, America/New_York including DST. The dispatcher runs separately from the Mac. The desktop registration monitors publication only and must not duplicate Gmail/model work.

- The November 21 17:30 scheduled review published its final result at 17:32:08 New York. Both recent mailbox scans completed; historical review remained ongoing.
- The November 22 09:00 scheduled review started at 09:14:17 and completed at 09:15:39 New York, processing 24 targets. Both recent checkpoints advanced through 09:14:20. Historical review remained ongoing. The late timing is recorded independently of coverage and is not the reason for the stored partial value.
- Positive evidence of a scheduled publication while the Mac is offline remains pending. Keep the monitor until that acceptance is recorded. No claim of perfect timing, physical-device continuity, screen-reader compliance or disaster recovery follows from these runs.

Private monitor snapshots retain the exact run/slot/coverage evidence outside Git. No mailbox scan, model request or host configuration change was performed by the publication monitor.

## Version 0.5.1 release and checks

[PR #17](https://github.com/vibe-coding-milan/email-desk/pull/17) introduced the consistent display vocabulary and a fictional scheduled catch-up preview. [PR #18](https://github.com/vibe-coding-milan/email-desk/pull/18) grounded older-mail wording in explicit historical coverage and recorded acceptance. Final runtime commit: `6debda9a8ab59c5039f8aebead3c98a04f5ab396`; release receipt: `arcade-20261122T182335060567Z`.

[Source CI 45054614754](https://github.com/vibe-coding-milan/email-desk/actions/runs/45054614754) and [production deployment 45054711855](https://github.com/vibe-coding-milan/email-desk/actions/runs/45054711855) passed. Independent verification matched the exact bundle and all 28 public hashes, the unchanged homepage and the complete private board across 82 cards, including comments, decisions, XP, checkpoints, reporting and history. The preceding 0.5.1 installation passed all 27 live access checks; the final presentation guard left backend/authentication files unchanged.

Local checks included npm run check, 34 release checks, 28 GitHub deployment checks, fictional preview compilation and git diff --check. Semantic checks cover completed recent work with unfinished history, ongoing recent work, error precedence, missing account evidence, absent/completed historical evidence and scheduled/manual/batch distinctions. Fictional browser inspection verified the Updated marker, neutral older-mail headline/details, mobile wrapping and consistent System labels. It was not a production card mutation or an independent physical-device/accessibility audit.

This was a frontend/documentation release. The installed hosted worker, credentials, encrypted processing journal, Gmail labels, schedule and master taxonomy were unchanged. Earlier dated release/audit records remain historical evidence; this page and the current handoff describe the latest state.
