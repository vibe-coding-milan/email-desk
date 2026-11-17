# Building Email Desk

Email Desk is a working personal app and a public example of my approach to AI-assisted development. I use Codex to help write code, explore designs, and investigate failures. I direct the product choices, review the results, and decide what is ready to publish.

The useful part of “vibe coding” for me is the short loop between an idea and something I can try. This repository also records the work after that first version: simplifying the interface, preserving decisions, checking failure states, and deploying changes without losing personal data.

## Start with a concrete job

The starting question was “What in my email needs attention?” The resulting product has two categories, Needs action and Worth knowing, with handled/dismissed history. Topic labels remain useful context without becoming another task hierarchy.

That constraint shaped the interface: expand a card, edit its context and labels, save once, and move on. Later scans should add useful information while preserving the decisions already made.

See [the board implementation](../public/app.js) and [the storage model](../server/Store.php).

## Refine behavior through use

Three iterations illustrate how I work:

| Observation | Change | Evidence |
| --- | --- | --- |
| A countdown and extra review controls made the daily rhythm harder to understand. | Replaced them with a connected time track, actual publication marks, and explicit Due/Missed states. Elapsed time never implies a successful review. | [Timing tests](../tests/review-timing.mjs), [schedule tests](../tests/review_schedule.py), [0.2.1–0.2.3 release notes](../CHANGELOG.md) |
| A new machine summary could otherwise overwrite useful context or obscure an unfinished request. | Preserve notes, corrections, decisions, and earlier machine context; require an explicit reason to reopen handled work. | [Store](../server/Store.php), [storage checks](../tests/store.php), [reviewer contract](REVIEWER.md) |
| Moving a still image did not deliver the intended character animation. | Replaced the treatment with four drawn idle poses beside stationary props, plus pause, offscreen pausing, and a reduced-motion still. | [Sprite design notes and prompt](COMPANION-IDLE.md), [styles](../public/styles.css) |

The visual direction is deliberately playful: cobalt, pixel typography, a robot companion, and small rewards for clearing cards. Functional status stays explicit in text, including first use, incomplete coverage, failures, and successful empty reviews.

## Give the AI a bounded role

The reviewer uses supplied priorities and organization rules, reads conversations through connected tools, publishes selected cards, and retrieves feedback. The website stores and presents that result. It has no direct Gmail OAuth integration or embedded model API.

A handled card records my decision. It grants no permission to send, archive, delete, or mark email read. Explicit label corrections are reconciled separately and acknowledged only after verification. Email and comment text are context to interpret, never instructions to execute.

The [reviewer contract](REVIEWER.md) makes these boundaries concrete. Feedback informs later reviews; it is not model-weight training. The master organization playbook remains a Google Doc, with a dated Markdown reference.

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

For 0.3.0, recorded acceptance verified 25 served public-file hashes, 23 live access/security checks, and preservation of saved cards, checkpoints, and progress. Browser inspection covered the public demo, level-up, pause control, mobile layout, and sign-in entry. The [release history](../CHANGELOG.md) records that evidence.

## Keep the limits visible

The project is tailored to one owner's workflow and hosting setup. Its public demo is reusable as an example; production setup still needs owner-specific configuration and an authorized reviewer.

A corrected scheduled review executed, but publication needed recovery. Unattended publication after recovery still needs observation, as do physical-device/cross-device acceptance and disaster recovery. Unit checks, a successful deployment, and a convincing demo answer different questions; I keep those claims separate.
