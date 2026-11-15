# Email Desk

Private, self-hosted attention board for Milan's two email accounts. Planned address: https://mijatovic.com/email-desk/.

The interface has two categories: Needs action and Worth knowing. Cards expand inline to edit category, status, a single label checklist and context, with one Save action. Refresh reloads saved cards and preserves unsaved edits on the page; it does not start an inbox review. Search, account filters, promotional copy, the playbook link and the footer have been removed. Handled/dismissed cards remain available in a compact history disclosure. Each card contains context, the reason it was surfaced, current or corrected labels, and a link to the original Gmail conversation. Comments and handled/dismissed status are stored on the server and preserved across scans. Handling a card does not send, archive, delete, or mark email read.

## Status

Live at https://mijatovic.com/email-desk/. The owner explicitly approved credential creation, the restricted reviewer connection, and publication on November 15, 2026. Thirty storage tests, eighteen HTTP/API tests and twenty-three live checks passed. The live checks include owner login, protected data, Apache headers, preserved homepage and forced-command reviewer access. Five freshly checked email conversations have been published as a limited initial review; broader inbox and historical coverage remain incomplete.

A daily 9:00 a.m. America/New_York review is configured in Codex after Milan's explicit approval. The first actual scheduled run is not yet verified. Milan will pause the previous ChatGPT task to avoid duplicate reviews. No Gmail labels have been changed by the app integration yet.

The earlier Sites prototype is separate and is not the target architecture. Do not continue or automatically deploy that prototype. The user's chosen destination is a subfolder on the existing DreamHost site.

## Structure

- `public/`: HTML/CSS/JavaScript and authenticated PHP API, scoped to `/email-desk/`.
- `server/`: encrypted SQLite store, restricted reviewer CLI, shared label vocabulary.
- `scripts/`: checks, deployment, and the reviewer bridge client.
- `docs/`: handoff, decisions, and reference playbook.
- `.private/`: ignored local credentials and deployment configuration; never commit it.

Deployment installs service code and state in a private sibling directory outside the domain's web root. Browser access uses an owner password and secure HTTP-only sessions. The reviewer uses a separate SSH key with a forced command and forwarding disabled; it can read the board/playbook, publish selected cards, retrieve feedback, and acknowledge results. It cannot obtain an interactive shell through that key. This bridge does not connect the website directly to Gmail.

## Checks

`node --check public/app.js` and `node scripts/check.mjs` run locally. `php tests/store.php` requires PHP 8.2+ with PDO SQLite and sodium. `python3 tests/api_checks.py` runs temporary local PHP HTTP tests with fictional data. The host-check helper runs these in an isolated temporary folder on the configured existing PHP host and cleans it up.

## Private setup

Do not run `python3 scripts/deploy.py` until explicit approval covers creation of owner credentials, adding the restricted reviewer SSH public key, and publication to the selected destination. The command-line deployment script requires an explicit domain-owner .private/deployment.json; it refuses a different user or a destination that does not match the live homepage. It never falls back to the financial app's deployment account. Initial publication used the saved authenticated Cyberduck connection for the correct domain user. It preserves existing website files and stored feedback. First setup saves owner-login details and a configuration recovery copy into ignored `.private/` files. Store these securely outside the project as well.

Once provisioned, `python3 scripts/bridge.py` accepts one JSON request on standard input and prints its result. Read `docs/REVIEWER.md` before using the bridge or setting up scheduling.

Publication and the manual bridge are verified; scheduled execution, real Gmail feedback application and physical-device acceptance remain to be verified. See `docs/HANDOFF.md` for the precise remaining steps and acceptance limits.
