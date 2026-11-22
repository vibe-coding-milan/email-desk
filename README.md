# Email Desk

An AI-assisted email attention board, built by **Milan Mijatovic** with Codex and self-hosted on DreamHost.

Email Desk turns inbox conversations into two useful views: **Needs action** and **Worth knowing**. It is a personal app I use and a public example of how I work: define a practical problem, build with AI, refine the experience, and verify what ships.

**[Try the live demo](https://mijatovic.com/email-desk/)** · **[How I built it](docs/BUILDING.md)** · **[Release history](CHANGELOG.md)**

Choose **Play the demo** to explore an accelerated day with twelve fictional conversations. You can skip to later reviews without clearing every card. Try handling a card, changing a label, adding context, and skipping to the next review. Decisions move into history, earn XP, and carry through later arrivals. Demo changes live in browser memory and reset on restart or reload; no sign-in or inbox access is needed.

## The problem

An inbox mixes requests, useful updates, receipts, and noise. Labels help organize it, but they do not answer “What needs my attention?” Email Desk adds that missing layer: a short explanation of what matters, why it matters, and a link back to the original conversation.

The board stays small. Both email accounts share one organization vocabulary and one attention board. Handled and dismissed items remain in history, and later scans preserve my notes, corrections, and decisions.

## How I work

I use AI to help implement and explore ideas, while directing the product, reviewing behavior, and setting the boundaries. A few decisions show that process:

- **Simplify through use.** A countdown and extra controls became a compact daily review track. The interface distinguishes confirmed updates from missing or failed reviews.
- **Make feedback durable.** Corrections and notes survive new summaries. Revision checks and deduplicated writes protect against stale edits and retries.
- **Make the real interaction explorable.** The public demo simulates arrivals, feedback, history, and rewards using invented conversations, separate from the private workspace.
- **Carry the idea through delivery.** The project includes automated checks, a restricted deployment path, code rollback, and live verification on the existing host.

The [build notes](docs/BUILDING.md) connect these choices to source files, tests, and specific iterations.

## What the app does

Cards explain the conversation and why it was surfaced. They expand inline for bucket, label, and context edits. Handling a card records a decision; it does not send, archive, delete, or mark email read.

The interface pairs readable Inter text and pixel branding with light, dark, and system themes, illustrated empty states, and a four-frame robot companion. The companion plays one short greeting and settles; reduced-motion preferences keep it still. XP rewards confirmed decisions once per card: 10 XP within 48 hours of receipt and 5 XP afterward. Existing awards stay earned.

## How it works

A private worker on DreamHost reads both Gmail accounts, consults the master organization playbook, applies approved custom labels and publishes selected cards to the encrypted Store. It retrieves saved feedback and preserves owner decisions and comments. Its API keys and encrypted Google grants stay outside web root; the website does not expose them. A restricted SSH bridge remains available for maintenance and publication monitoring.

```text
Gmail + master playbook → hosted API reviewer → encrypted Store
                              ↑                      ↕
                              └── saved feedback ── authenticated board

DreamHost cron → New York schedule dispatcher → bounded review
Public guest demo → fictional browser-memory state
```

The frontend uses plain JavaScript, HTML, and CSS. The backend uses PHP 8.2+, SQLite, and sodium encryption for stored card and feedback payloads. Python handles packaging, deployment, and bridge tooling. GitHub Actions checks and deploys reviewed code to the existing DreamHost site.

Private API operations require authentication. State and configuration live outside web root; reviewer and deployment keys have separate forced commands. The guest demo cannot read or change the private board.

## Explore the code

| Area | Start here |
| --- | --- |
| Board, guest simulation, and review status | [public/app.js](public/app.js) |
| Visual system and motion | [public/styles.css](public/styles.css) |
| Durable cards, feedback, and revisions | [server/Store.php](server/Store.php) |
| Authentication and API boundaries | [public/api.php](public/api.php) |
| Reviewer contract | [docs/REVIEWER.md](docs/REVIEWER.md) |
| Checks and deployment | [.github/workflows](.github/workflows), [deployment guide](docs/GITHUB_DEPLOYMENT.md) |

## Run a fictional preview

Requires Python 3. From a clone of this repository:

```sh
python3 tests/preview.py
```

Open http://127.0.0.1:8000/. The public demo is available without signing in; the mocked owner workspace uses the password `preview-only`. This server binds to localhost, uses fictional data, and keeps changes in memory. It is a UI preview, not the production PHP backend.

For checks, use Node.js and Python 3:

```sh
npm run check
```

This covers JavaScript syntax, local assets, shared labels, guest-day behavior, card-age/XP boundaries, and review timing including DST. PHP 8.2+ with PDO SQLite and sodium is needed for `php tests/store.php` and `python3 tests/api_checks.py`. GitHub CI also runs provisioning, release, and deployment regression checks.

## Current state

**Version 0.5.1 clarifies review-status wording.** A completed review of both recent inboxes says Updated; separate older-mail work says Older mail review ongoing. Unfinished recent scans say Review ongoing and errors say Needs attention. Board health separates recent inbox freshness from historical catch-up. Scheduled checkpoints use explicit run identity; manual and legacy publications do not impersonate scheduled success. History has its own view with search/status/date filters. The private System view shows run history, pending feedback, master-source provenance and aggregate API tokens/calculated costs by date and work type. No credit balance, monthly forecast or spending cap is inferred. See [the implementation and acceptance record](docs/PRODUCT_UPDATE_050.md).

The DreamHost schedule is active: weekdays 9 AM, 1 PM and 5:30 PM; weekends 9 AM and 5:30 PM, America/New_York including DST. The dispatcher operates independently of the Mac. Recent mailbox coverage was verified in both accounts; historical catch-up remains partial. The first actual scheduled publication and Mac-offline run remain pending. The desktop task monitors only.

[PR #15](https://github.com/vibe-coding-milan/email-desk/pull/15) passed CI and installed 0.5.0. Its deployment job timed out during final public verification; independent receipt/bundle, all 28 public hashes, 27 live access checks and exact 74-card/feedback/checkpoint/history/XP preservation passed. The separately upgraded private worker retained credentials, encrypted state and cron. Reporting initialization used existing metadata with zero mailbox/model requests. See the [handoff](docs/HANDOFF.md), [reviewer contract](docs/REVIEWER.md), [hosted ledger](docs/HOSTED_REVIEWER.md) and [usability notes](docs/USABILITY_TESTING.md).

This remains a personal application with an owner-specific reviewer and hosting setup. Physical-device, screen-reader, cross-device, unattended recovery and disaster-recovery acceptance remain separate work. The demo demonstrates interaction; it does not establish live inbox coverage.

For maintenance, read [AGENTS.md](AGENTS.md), the [handoff](docs/HANDOFF.md), [reviewer contract](docs/REVIEWER.md), and [release guide](docs/RELEASING.md). The Google Doc remains master; its November 21 operational addendum was verified before refreshing the Markdown reference. Credentials, connection configuration, real message fixtures, and recovery material stay outside Git in ignored private storage.
