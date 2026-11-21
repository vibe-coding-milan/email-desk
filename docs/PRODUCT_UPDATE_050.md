# Email Desk 0.5.0 implementation and release record

Milan authorized implementation of the [November 21 product review](PRODUCT_REVIEW_2026-11-21.md) and publication to GitHub and the existing DreamHost site. This release keeps the established visual system and two buckets, and adds the operational information needed for the hosted reviewer.

## Delivered scope

- Focused owner sign-in, Board/History/System navigation, bucket jumps and Sign out outside Appearance.
- Dedicated History with subject/sender/label/note search, status and first-decision-date filtering. Reopen returns to Board; XP remains once per card.
- Typed recent-coverage status separate from historical catch-up, explicit account coverage timestamps, publication timestamps and schedule activation.
- Explicit scheduled/manual run identity, start/completion/publication times, batch/final phase and attempt count. Manual and legacy records do not satisfy scheduled slots. Pre-activation slots are labelled separately.
- Private System reporting with recent publications, pending/error feedback including closed cards, a route to each card, and recorded master-source provenance.
- A 90-day aggregate token ledger, filterable by date and work type. Legacy requests remain unclassified; mixed routine/catch-up requests are labelled together instead of inventing a token split. Returned tokens for incomplete or unverified responses stay counted. Missing/uncertain usage and unknown models/rates remain visible.
- Readable per-card feedback explanation, “Why this appeared,” “Show in,” selected labels, label-result announcements, a mobile close-details action and explicit board-target wording.
- Scheduled-review landing copy and optional demo skip while preserving fictional state and decisions.

Snooze/waiting, grouped decisions, changes-since-last-visit, spending alerts/caps, auto-reload and automated rule adoption remain deferred because their behavior or measurement prerequisites are not yet established. The shared labels, 10/5 XP policy, Gmail boundaries and master authority are unchanged.

## Reporting contract and privacy

`api.php?action=system` requires the existing owner session and returns only the saved report, safe run fields and pending-feedback projection. It is read-only. The Store validates/allowlists reporting fields, recomputes known-rate costs, and encrypts metadata with the existing key. Aggregate reports never expose journal contents, request identifiers, prompts, message excerpts, secrets or grants. Feedback titles/explanations remain private owner data.

`publish` accepts optional structured run metadata and a reporting snapshot. `report_only: true` requires empty cards and no run; it cannot manufacture a review outcome or advance checkpoints. Timestamp ordering prevents an older recovered report from replacing a newer snapshot. Existing pending operations replay their exact original payload.

The worker aggregates existing encrypted usage by New York day, purpose, model and rate date. Stable provider request IDs are deduplicated privately. Unknown usage is counted separately, never priced as zero. Input includes cached reads/writes; ordinary input subtracts both before pricing, and reasoning tokens are not added again to output. Standard GPT-6 Luna rates per million tokens are input $0.10, cached reads $0.01, cache writes $0.125 and output $0.50, verified against [official model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna) November 21, 2026. Historical November 20 records retain that matching snapshot. Calculations are not posted charges, a balance or a routine monthly forecast.

The worker and Store use additive fields; no credential rotation, new access grant, database replacement or mailbox mutation is needed for rollout. The Google Doc stays master. Its operational setup history now includes a scoped factual addendum; no taxonomy change was made.

## Verification and rollout

Local source checks cover explicit slots, manual/legacy/batch exclusion, recovered publication, pre-activation slots, recent/historical health, unchanged timing/XP and guest-day behavior. Worker tests cover retry and private-data boundaries, exact legacy operation replay, paid failed-output accounting, unknown usage, date boundaries and cost arithmetic. Installer checks cover reviewed active code upgrades while retaining activation and private state. PHP Store/API checks must pass in CI before merge.

Fictional browser QA checks focused login, separate History, note search, filters, context save, handling/reopening without duplicate XP, System usage filtering, queue navigation and responsive light/dark layouts. Private-board screenshots are excluded. Physical-device/screen-reader/cross-device and scheduled/Mac-offline acceptance remain separate.

Rollout order: reviewed source/PR checks → website deployment → receipt/hash/access/state acceptance → guarded private worker upgrade → metadata-only `--report` → independent reporting/state read-back. A failed Actions verification remains recorded even if independent acceptance succeeds.


## Production acceptance

Version 0.5.0 is live through [PR #15](https://github.com/vibe-coding-milan/email-desk/pull/15), merge `a0462d6a66cd5eb8df4e2c4f7fda310104b57ae8`, receipt `arcade-20261121T173801463624Z`. [Source CI](https://github.com/vibe-coding-milan/email-desk/actions/runs/44930928713) and main/shared checks passed, including 81 PHP storage and 21 HTTP/API checks. [Deployment 44931032533](https://github.com/vibe-coding-milan/email-desk/actions/runs/44931032533) installed the exact bundle, then failed during its final public connection verification with a timeout. That workflow failure is retained; independent acceptance passed the exact receipt/bundle hash, 28 served public hashes, unchanged homepage and all 27 live access checks.

All 74 cards, comments, corrections, decisions, XP, labels, review history, checkpoints and pending feedback matched the private pre-release baseline, both after website installation and after worker/reporting initialization. Private worker source now matches the merge commit. Its locked, manifest-verified code upgrade retained the prior code backup and exact encrypted journal, grants, keys, configuration, activation and cron. No credentials were rotated and no SSH access was added.

Metadata-only `--report` initialization succeeded with zero mailbox reads and zero model requests. The authenticated UI independently read back 32 legacy requests, 379,721 input and 36,689 output tokens, calculated at $0.065807225 from the November 20 rate snapshot. These records are setup/validation/recovery/catch-up measurement, not routine monthly cost, posted billing or remaining credit. The full snapshot and access/preservation receipts remain ignored and private.

Live browser verified focused sign-in, the typed recent-success/historical-partial headline, pre-activation/next timeline labels, separate History, System totals, public demo/mobile wrapping, sign-out and empty warning/error logs. Owner inspection was read-only, without private screenshots or production decisions. Physical-device, screen-reader, cross-device, first scheduled/Mac-offline publication and disaster recovery remain separate acceptance work.

The Google Doc master received a guarded November 21 operational addendum clarifying the active hosted schedule and reporting boundaries. Read-back preserved every earlier paragraph and verified the new native heading and text. The Markdown reference was refreshed afterward; taxonomy version 1.1 and its rules are unchanged.
