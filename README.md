# Email Desk

An AI-assisted email attention board, built by **Milan Mijatovic** with Codex and self-hosted on DreamHost.

Email Desk turns inbox conversations into two useful views: **Needs action** and **Worth knowing**. It is a personal app I use and a public example of how I work: define a practical problem, build with AI, refine the experience, and verify what ships.

**[Try the live demo](https://mijatovic.com/email-desk/)** · **[How I built it](docs/BUILDING.md)** · **[Release history](CHANGELOG.md)**

Choose **Play the demo** for a five-item focus round with fictional conversations. Handle, pass, change labels, add Guidance, explore Classic view and unlock achievements. Demo changes live in browser memory and reset on reload; no sign-in or inbox access is needed.

## The problem

An inbox mixes requests, useful updates, receipts, and noise. Labels help organize it, but they do not answer “What needs my attention?” Email Desk adds that missing layer: a short explanation of what matters, why it matters, and a link back to the original conversation.

The board stays small. Both email accounts share one organization vocabulary and one attention board. Handled and dismissed items remain in history, and later scans preserve my guidance, corrections, and decisions.

## How I work

I use AI to help implement and explore ideas, while directing the product, reviewing behavior, and setting the boundaries. A few decisions show that process:

- **Simplify through use.** A countdown and extra controls became a compact review summary. The interface distinguishes confirmed updates from missing or failed reviews.
- **Make feedback durable.** Corrections and guidance survive new summaries. Revision checks and deduplicated writes protect against stale edits and retries.
- **Make the real interaction explorable.** The public demo simulates arrivals, feedback, history, and rewards using invented conversations, separate from the private workspace.
- **Carry the idea through delivery.** The project includes automated checks, a restricted deployment path, code rollback, and live verification on the existing host.

The [build notes](docs/BUILDING.md) connect these choices to source files, tests, and specific iterations.

## What the app does

Sign-in opens a focus round of up to five items, one at a time, with a separate Worth knowing round and an independent Classic list. Inline Guidance, multiple shared topic labels, source links, a robot review timeline and the XP meter retain the useful context. History is read-only and grouped by date.

Handled and Not important save a decision and request archiving of the exact reviewed messages at the next scheduled review. Pass moves an item to the back without archiving or awarding XP. Pending and failed archive requests remain visible. New replies, existing decisions, labels, stars and read state are protected. Four persistent achievements reward follow-through without bonus XP or streak pressure. [Interaction, storage and archive contract](docs/FOCUS_ROUNDS.md).


## How it works

A private worker on DreamHost reads both Gmail accounts, consults the master organization playbook, applies approved custom labels and publishes selected cards to the encrypted Store. It retrieves saved feedback and relevant owner guidance for related future conversations, while preserving owner decisions and guidance. Its API keys and encrypted Google grants stay outside web root; the website does not expose them. A restricted SSH bridge remains available for maintenance and publication monitoring.

```text
Gmail + master playbook → hosted API reviewer → encrypted Store
                              ↑                      ↕
                              └── saved feedback ── authenticated board

DreamHost cron → New York schedule dispatcher → bounded review
Public guest demo → fictional browser-memory state
```

The welcome and System screens use plain JavaScript, HTML and CSS; the game workspace uses locally bundled React and Motion. Editable frontend source lives under frontend/. The backend uses PHP 8.2+, SQLite, and sodium encryption for stored card and feedback payloads. Python handles packaging, deployment, and bridge tooling. GitHub Actions checks and deploys reviewed code to the existing DreamHost site.

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
npm ci
npm run build
npm run check
```

This covers JavaScript syntax, local assets, shared labels, guest-day behavior, card-age/XP boundaries, and review timing including DST. PHP 8.2+ with PDO SQLite and sodium is needed for `php tests/store.php` and `python3 tests/api_checks.py`. GitHub CI also runs provisioning, release, and deployment regression checks.

## Current state

**Version 0.7.0 is live** at [mijatovic.com/email-desk](https://mijatovic.com/email-desk/), with the matching website and private worker installed through [PR #24](https://github.com/vibe-coding-milan/email-desk/pull/24). Independent verification passed all 30 public hashes, 27 live access checks and exact preservation of all 88 cards, Guidance, decisions, XP and pending feedback. The deployment runner’s final homepage connection timed out after installation; [the handoff](docs/HANDOFF.md) retains that failure and the independent acceptance evidence. The selected game flow and persistent achievements now use the real saved board. See [focus rounds](docs/FOCUS_ROUNDS.md), [release history](CHANGELOG.md) and [handoff](docs/HANDOFF.md) for deployment evidence and remaining acceptance. The 0.6.1 Guidance retrieval, shared labels, System usage/cost reporting and verified review-status meanings are retained. No rename has been adopted.

The DreamHost schedule is active: weekdays 9 AM, 1 PM and 5:30 PM; weekends 9 AM and 5:30 PM, America/New_York including DST. The dispatcher operates independently of the Mac. Recent mailbox coverage was verified in both accounts; historical catch-up remains partial. Actual hosted scheduled publications are verified, including November 22’s morning review. Mac-offline acceptance remains pending. The desktop task monitors only.

The previous 0.5.1 release, [PR #18](https://github.com/vibe-coding-milan/email-desk/pull/18) and [deployment 45054711855](https://github.com/vibe-coding-milan/email-desk/actions/runs/45054711855) passed for the final 0.5.1 runtime. Independent receipt/bundle, all 28 public hashes and exact preservation of 82 cards and private state passed. The preceding 0.5.1 installation passed 27 live access checks; backend/authentication files were unchanged by the final wording guard.

The earlier [PR #15](https://github.com/vibe-coding-milan/email-desk/pull/15) installed 0.5.0. Its deployment job timed out during final public verification; independent receipt/bundle, all 28 public hashes, 27 live access checks and exact 74-card/feedback/checkpoint/history/XP preservation passed. The separately upgraded private worker retained credentials, encrypted state and cron. Reporting initialization used existing metadata with zero mailbox/model requests. See the [handoff](docs/HANDOFF.md), [reviewer contract](docs/REVIEWER.md), [hosted ledger](docs/HOSTED_REVIEWER.md) and [usability notes](docs/USABILITY_TESTING.md).

This remains a personal application with an owner-specific reviewer and hosting setup. Physical-device, screen-reader, cross-device, unattended recovery and disaster-recovery acceptance remain separate work. The demo demonstrates interaction; it does not establish live inbox coverage.

For maintenance, read [AGENTS.md](AGENTS.md), the [handoff](docs/HANDOFF.md), [reviewer contract](docs/REVIEWER.md), and [release guide](docs/RELEASING.md). The Google Doc remains master; its November 21 operational addendum was verified before refreshing the Markdown reference. Credentials, connection configuration, real message fixtures, and recovery material stay outside Git in ignored private storage.
