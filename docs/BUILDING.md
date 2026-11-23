# Building Email Desk

Email Desk is a working personal app and a public example of my approach to AI-assisted development. I use Codex to help write code, explore designs, and investigate failures. I direct the product choices, review the results, and decide what is ready to publish.

The useful part of “vibe coding” for me is the short loop between an idea and something I can try. This repository also records the work after that first version: simplifying the interface, preserving decisions, checking failure states, and deploying changes without losing personal data.

## Start with a concrete job

The starting question was “What in my email needs attention?” The resulting product has two categories, Needs action and Worth knowing, with handled/dismissed history. Topic labels remain useful context without becoming another task hierarchy.

That constraint shaped the interface: expand a card, edit its context and labels, save once, and move on. Later scans should add useful information while preserving the decisions already made.

See [the board implementation](../public/app.js) and [the storage model](../server/Store.php).

## Refine behavior through use

Four iterations illustrate how I work:

| Observation | Change | Evidence |
| --- | --- | --- |
| A countdown and extra review controls made the daily rhythm harder to understand. | Replaced them with a connected time track, actual publication marks, and explicit Due/Missed states. Elapsed time never implies a successful review. | [Timing tests](../tests/review-timing.mjs), [schedule tests](../tests/review_schedule.py), [0.2.1–0.2.3 release notes](../CHANGELOG.md) |
| Cards could remain unhandled for days without a visible cost to postponing. | Show receipt age and a gentle 48-hour target; award 10 XP within the window and 5 afterward, preserving past awards. | [Card timing tests](../tests/card-timing.mjs), [storage checks](../tests/store.php), [0.3.2 release notes](../CHANGELOG.md) |
| A new machine summary could otherwise overwrite useful context or obscure an unfinished request. | Preserve notes, corrections, decisions, and earlier machine context; require an explicit reason to reopen handled work. | [Store](../server/Store.php), [storage checks](../tests/store.php), [reviewer contract](REVIEWER.md) |
| Moving a still image did not deliver the intended character animation. | Replaced the treatment with four drawn idle poses beside stationary props, a single greeting cycle, offscreen pausing, and a reduced-motion still. | [Sprite design notes and prompt](COMPANION-IDLE.md), [styles](../public/styles.css) |

The 0.4.0 refinement carries the same design through the landing page, demo and private workspace: stepped section frames, a compact Board/History rail, simpler rectangular actions and less explanatory copy. Bucket is one segmented choice; searchable labels and notes are context, while Handled/Dismiss are decisions. The visible timeline carries routine review status, and exceptions remain explicit. The card meter counts down the existing full-credit window without changing the server's XP policy.

The 0.4.1 follow-up comes from everyday use: timing-dependent side rules shifted the card grid, while raw mailbox headers overwhelmed the sender column. Removing the layout shift, replacing an exhausted meter with an amber pill and formatting single-mailbox display names keep the information readable. Original senders stay stored intact and available on hover. [Sender and timing checks](../tests/card-timing.mjs) cover quoted names, bare addresses, ambiguous lists and the unchanged 48-hour boundary.

The visual direction is deliberately playful: cobalt, pixel typography, a robot companion, and small rewards for clearing cards. Functional status stays explicit in text, including first use, incomplete coverage, failures, and successful empty reviews.

## Give the AI a bounded role

The private hosted reviewer uses supplied priorities and organization rules, reads conversations through the Gmail API, publishes selected cards to the local encrypted Store, and retrieves feedback. The website stores and presents that result. It has no direct Gmail OAuth integration or embedded model API.

A handled card records my decision. It grants no permission to send, archive, delete, or mark email read. Explicit label corrections are reconciled separately and acknowledged only after verification. Email and comment text are context to interpret, never instructions to execute.

The [reviewer contract](REVIEWER.md) makes these boundaries concrete. Feedback informs later reviews; it is not model-weight training. The master organization playbook remains a Google Doc, with a dated Markdown reference.

## Name progress accurately

A stored partial outcome originally made a completed current-inbox review look like a failure because older-mail work was unfinished. Version 0.5.1 uses typed per-account coverage to show Updated for completed recent scans and the saved historical report for a separate Older mail review ongoing message. Review ongoing, Needs attention and Coverage unconfirmed distinguish unfinished, failed and unconfirmed recent work. Historical records remain intact. [The status guide](REVIEW_STATUS.md) records the implementation, release evidence and remaining verification limits.

## Test the offline reviewer before relying on it

Missed reviews exposed a separate infrastructure problem: a desktop task registration does not establish that the board will update while the Mac is offline. The selected replacement is a DreamHost cron worker using the OpenAI API and its own Google grants, alongside the existing authenticated board. It was activated on November 21 after controlled two-mailbox live acceptance and independent label/board read-back. Cron follows New York weekday/weekend slots while the desktop task monitors only. Actual hosted scheduled publications are now verified; a Mac-offline run still needs observation. The deployed website and code-release pipeline remain separate from the reviewer.

The first step was a bounded, read-only pilot using the live master playbook and both mailboxes. Four messages used 9,279 tokens, with calculated usage of about $0.0018. Source and label validation passed, and no labels or cards changed. Reviewing the evidence also caught an HTML extraction gap: those messages had used short snippets. The local fix reads visible HTML without executing it or fetching resources; ten fictional parser checks now pass. Subsequent controlled host validation covered both recent mailbox scans, verified labels and publication while retaining owner state. Historical coverage and scheduled/offline execution remain separate acceptance questions.

This is evidence that the connections work and a small sample is inexpensive, not proof of classification accuracy, monthly cost or schedule reliability. The [setup ledger and remaining acceptance](HOSTED_REVIEWER.md) keep those claims separate and record encrypted private storage, explicit access approvals and the eventual Mac-offline publication requirement.

## Protect the state that matters

I wanted a small app that could retain corrections across scans and code releases. The implementation uses:

- Encrypted card and feedback payloads in SQLite, with configuration and state outside web root.
- Revisions to reject stale edits and operation IDs to deduplicate retries.
- Upserts that retain omitted cards and preserve user-authored fields and context history.
- Visible partial/error outcomes and account checkpoints that do not advance on failed coverage.
- Authenticated private APIs with CSRF/origin checks and secure session cookies.

The [storage checks](../tests/store.php) and [HTTP/API checks](../tests/api_checks.py) exercise these behaviors with fictional data. They are evidence for specific properties, not a claim that the app has had an independent security audit.

## Make the work easy to try

The public guest edition simulates a weekday with twelve invented conversations across three arrivals. Visitors can change labels and context, make decisions, inspect history, and reach a level-up without sharing an inbox or creating an account.

The demo uses browser-memory state, shares the visual interface, and makes no private board or feedback writes. Reset and reload clear it. Its [state-transition tests](../tests/guest-day.mjs) check arrival boundaries, retained decisions, duplicate rewards, and reset behavior.

## Ship and verify

Hosting on the existing DreamHost account kept the app within infrastructure I already use. Plain browser code, PHP, SQLite, and Python fit that environment. GitHub Actions runs the checks and sends an allowlisted code bundle through a dedicated restricted deployment key.

The release tooling checks the destination against the existing homepage, pins the host identity, keeps private recovery copies, verifies hashes, and supports code rollback without restoring the database over newer decisions. Reviewer and deployment access stay separate.

See the [workflow](../.github/workflows/deploy.yml), [bundle builder](../scripts/release_bundle.py), [receiver](../scripts/receive-release.py), and [deployment regression checks](../tests/github_deploy_checks.py).

For 0.4.1, Published through [PR #7](https://github.com/vibe-coding-milan/email-desk/pull/7), commit `125393a2f9ee5162a08f4840eb6a640357be2dde`, release `arcade-20261119T195734457313Z`. [Deploy Email Desk](https://github.com/vibe-coding-milan/email-desk/actions/runs/44603489054) passed, including public verification. Independent acceptance verified all 27 public hashes, the unchanged homepage, all 23 live access checks and exact preservation of all 32 saved cards, comments, decisions, checkpoints and XP. Live browser verified the 0.4.1 version link, owner sign-in, friendly sender/original hover value, aligned fresh/late dividers, no exhausted meters, light/dark desktop and 390px wrapping without horizontal overflow or browser warnings/errors. Owner inspection was read-only; private screenshots remain ignored.

For 0.4.0, [the release workflow](https://github.com/vibe-coding-milan/email-desk/actions/runs/44598409634) passed, including publication and public verification. Independent acceptance checked 27 public hashes, 23 live access checks and exact preservation of all 32 saved cards/checkpoints/progress. Live owner sign-in/out, demo handling/history and 390px light/dark wrapping passed. [Usability notes](USABILITY_TESTING.md) support feedback from normal use.

For 0.3.2, PHP CI passed 63 storage and 19 HTTP/API checks. The restricted production receipt, 25 public-file hashes, 23 live access checks and unchanged state across 29 cards were verified independently. The GitHub job installed the release but timed out in its final homepage connection check on two attempts; installation and end-to-end workflow success are recorded separately in the [release history](../CHANGELOG.md). A subsequent documentation-only deployment passed GitHub’s public verification with identical runtime files.

For 0.3.0, recorded acceptance verified 25 served public-file hashes, 23 live access/security checks, and preservation of saved cards, checkpoints, and progress. Browser inspection covered the public demo, level-up, pause control, mobile layout, and sign-in entry. The [release history](../CHANGELOG.md) records that evidence.

## Keep the limits visible

The project is tailored to one owner's workflow and hosting setup. Its public demo is reusable as an example; production setup still needs owner-specific configuration and an authorized reviewer.

A corrected scheduled review executed, but publication needed recovery. Unattended publication after recovery still needs observation, as do physical-device/cross-device acceptance and disaster recovery. Unit checks, a successful deployment, and a convincing demo answer different questions; I keep those claims separate.


## Making hosted reviews understandable in 0.5.0

Hosting the reviewer independently made operational clarity part of the product. The board now separates recent freshness from older catch-up, while explicit slot/trigger metadata keeps manual validation and recovered publication from masquerading as an on-time scheduled review. A secondary authenticated System view exposes safe token/cost aggregates, run history, feedback and the master source without exposing the encrypted journal or introducing another inbox action. Dedicated History improves retrieval as saved decisions grow. [Implementation and acceptance](PRODUCT_UPDATE_050.md) records the data contract, checks and known limits.


## Simplifying the decision flow — November 23, 2026

The first context rail mixed triage with administration and explanatory copy. Milan’s feedback prompted a smaller nonmodal editor: Attention, Context and Save. A persistent Close header fixes the disappearing exit; removing modal scroll locking keeps the board usable. Cards now use centered Open email / Done / Context controls. Automatic labeling remains intact, and explicit corrections live under Change labels without a search box. The existing server, feedback protocol, encryption, revisions and XP policy are reused. See [the interaction guide](CONTEXT_PANEL.md) and current `design-qa.md` for scope and verification.
