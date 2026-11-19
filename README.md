# Email Desk

An AI-assisted email attention board, built by **Milan Mijatovic** with Codex and self-hosted on DreamHost.

Email Desk turns inbox conversations into two useful views: **Needs action** and **Worth knowing**. It is a personal app I use and a public example of how I work: define a practical problem, build with AI, refine the experience, and verify what ships.

**[Try the live demo](https://mijatovic.com/email-desk/)** · **[How I built it](docs/BUILDING.md)** · **[Release history](CHANGELOG.md)**

Choose **Play the demo** to explore an accelerated day with twelve fictional conversations. Try handling a card, changing a label, adding context, and skipping to the next review. Decisions move into history, earn XP, and carry through later arrivals. Demo changes live in browser memory and reset on restart or reload; no sign-in or inbox access is needed.

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

An AI reviewer reads email through connected tools and uses my priorities and organization rules to curate cards. A restricted SSH bridge publishes those cards and retrieves feedback for later reviews. The website itself does not connect directly to Gmail or call a model API.

```text
Email + priorities → AI reviewer → restricted bridge → encrypted store
                         ↑                                  ↕
                         └──────── saved feedback ───── authenticated board

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

**Version 0.4.1 is live.** Cards retain aligned dividers as they age. After the 48-hour target, a quiet amber pill replaces the exhausted meter; first decisions still earn 5 XP. Friendly sender names replace raw mailbox headers where possible, with the original sender available on hover. The two-bucket board, History, context edits and shared labels retain their existing behavior. Local checks, CI and [deployment](https://github.com/vibe-coding-milan/email-desk/actions/runs/44603489054) passed. All 27 public hashes, 23 live access checks and exact preservation of 32 saved cards/checkpoints/progress were verified. Live desktop/mobile and light/dark browser checks passed. Release evidence is recorded in the [changelog](CHANGELOG.md) and [handoff](docs/HANDOFF.md). See the [usability notes](docs/USABILITY_TESTING.md) for everyday feedback.

This remains a personal application with an owner-specific reviewer and hosting setup. Unattended reviewer publication after a recovered failure, physical-device/cross-device acceptance, and disaster-recovery exercises remain open verification work. The demo demonstrates the interaction; it does not establish live inbox coverage.

For maintenance, read [AGENTS.md](AGENTS.md), the [handoff](docs/HANDOFF.md), [reviewer contract](docs/REVIEWER.md), and [release guide](docs/RELEASING.md). The Google Doc remains the master organization playbook; the Markdown copy is a reference snapshot. Credentials, connection configuration, real message fixtures, and recovery material belong outside Git in ignored private storage.
