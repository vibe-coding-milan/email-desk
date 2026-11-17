# Email Desk

Personal, self-hosted AI email attention board with a public, fictional guest demo. Address: https://mijatovic.com/email-desk/.

The interface has two categories: Needs action and Worth knowing. Cards expand inline to edit category, status, a single label checklist and context, with one Save action. An aligned status strip groups XP with a connected daily time track, today’s actual outcomes and the latest publication time. Due and Missed distinguish missing results from completed reviews. Saved updates load automatically every minute while the board is visible, with checks deferred during editing. The board has no manual refresh control. Search, account filters, the playbook link and the footer have been removed. Version 0.2.0 adds a bold cobalt/pixel visual system, System/Light/Dark themes, quick Handled/Dismiss decisions, reduced-motion-aware feedback and durable XP (10 per card, once; 100 per level). Version 0.2.0 was published on November 15, 2026; all saved cards were verified unchanged. Handled/dismissed cards remain available in a compact history disclosure. Each card contains context, the reason it was surfaced, current or corrected labels, and a link to the original Gmail conversation. Comments and handled/dismissed status are stored on the server and preserved across scans. Handling a card does not send, archive, delete, or mark email read.

## Release documentation

See [CHANGELOG.md](CHANGELOG.md) for version history and [docs/RELEASING.md](docs/RELEASING.md) for packaging, verification and rollback. Release **0.3.0** is approved for publication on November 17, 2026 (New York time). Deployment and live acceptance are being completed through GitHub Actions; the prior live version is 0.2.3.

## Status

The public page explains how the AI agent uses supplied priorities and organization rules to surface requests and relevant updates. **Play the demo** opens a separate fictional workspace: twelve invented cards across an accelerated weekday, temporary feedback and labels, history, XP and a Level 2 celebration. The guest demo never reads or mutates private card data or Gmail; reloading/restarting clears its page-memory state. **Milan sign in** opens the original authenticated workspace.

Both workspaces share illustrated empty states and the approved pixel robot. The robot has four actual idle frames (head/arm/eye changes); props remain stationary. **Pause animation** is page-local, offscreen sprites pause, and reduced-motion preferences show a neutral still. Only the existing theme preference uses local storage. Original and selected artwork prompts are in [docs/ARTWORK.md](docs/ARTWORK.md), [docs/COMPANION-ARTWORK.md](docs/COMPANION-ARTWORK.md) and [docs/COMPANION-IDLE.md](docs/COMPANION-IDLE.md).

Authentication remains mandatory for every private API operation. Saved comments, labels, status, history, XP and account checkpoints are preserved by code releases. The public page contains invented demo content only. Publication remains self-hosted at https://mijatovic.com/email-desk/; the earlier Sites prototype is separate.

The active Codex review cadence, verified November 16, is 9:00 a.m. and 5:30 p.m. daily, plus 1:00 p.m. on weekdays, in America/New_York. The status strip mirrors that schedule; changes to the automation must also update the UI schedule. November 16 investigation found that the heartbeat evaluated its hours as UTC despite its New York TZID. The same heartbeat now uses explicit UTC equivalents. scripts/review-schedule.py computes the next slot’s New York offset, and the reviewer prompt requires comparing/updating those UTC hours before overnight DST changes. The corrected evening execution is verified; its publication required later recovery, so unattended publication after recovery still needs observation. Milan will pause the previous ChatGPT task to avoid duplicate reviews. Explicit user-originated label feedback has been applied and verified; deployment does not change Gmail.

The earlier Sites prototype is separate and is not the target architecture. Do not continue or automatically deploy that prototype. The user's chosen destination is a subfolder on the existing DreamHost site.

## Structure

- `public/`: HTML/CSS/JavaScript and authenticated PHP API, scoped to `/email-desk/`.
- `server/`: encrypted SQLite store, restricted reviewer CLI, shared label vocabulary.
- `scripts/`: checks, deployment, and the reviewer bridge client.
- `docs/`: handoff, decisions, and reference playbook.
- `.private/`: ignored local credentials and deployment configuration; never commit it.

Deployment installs service code and state in a private sibling directory outside the domain's web root. Browser access uses an owner password and secure HTTP-only sessions. The reviewer uses a separate SSH key with a forced command and forwarding disabled; it can read the board/playbook, publish selected cards, retrieve feedback, and acknowledge results. It cannot obtain an interactive shell through that key. This bridge does not connect the website directly to Gmail.

## Checks

`npm run check` validates both JavaScript files, the shared label vocabulary and local asset references. `php tests/store.php` requires PHP 8.2+ with PDO SQLite and sodium. `python3 tests/api_checks.py` runs temporary local PHP HTTP tests with fictional data. The host-check helper runs these in an isolated temporary folder on the configured existing PHP host and cleans it up.

## GitHub deployment

GitHub Actions deployment runs checks before sending a verified code-only release from `main` to the existing DreamHost site. It uses a dedicated forced-command deployment key, pinned host identity, private recovery backups, rollback and live hash/access checks. The Mac is not a normal deployment dependency. The one-time host bootstrap and five Actions secrets are installed. The first production Actions release passed, including receipt/hash verification, unchanged saved cards and all 23 live access checks. See [docs/GITHUB_DEPLOYMENT.md](docs/GITHUB_DEPLOYMENT.md).

## Private setup

Do not run `python3 scripts/deploy.py` until explicit approval covers creation of owner credentials, adding the restricted reviewer SSH public key, and publication to the selected destination. The command-line deployment script requires an explicit domain-owner .private/deployment.json; it refuses a different user or a destination that does not match the live homepage. It never falls back to the financial app's deployment account. Initial publication used the saved authenticated Cyberduck connection for the correct domain user. It preserves existing website files and stored feedback. First setup saves owner-login details and a configuration recovery copy into ignored `.private/` files. Store these securely outside the project as well.

Once provisioned, `python3 scripts/bridge.py` accepts one JSON request on standard input and prints its result. Read `docs/REVIEWER.md` before using the bridge or setting up scheduling.

GitHub publication, the restricted reviewer bridge, corrected review execution and a user-originated Gmail feedback correction are verified. Unattended publication after recovery, physical-device/cross-device acceptance and recovery exercises remain separate checks. See `docs/HANDOFF.md` for the precise remaining steps and acceptance limits.
