# Releasing Email Desk

Use the existing mijatovic.com domain account. Verify the root homepage digest before any installation. Never use the financial-app deployment user, expand reviewer access, or rotate credentials as part of a code release. `.private/` stays ignored and outside web root.

Normal releases should use the GitHub Actions path after the one-time setup in [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). It was activated and live-verified on November 16, 2026. Push reviewed source to `main`; the Deploy Email Desk workflow calls the shared checks, packages the exact commit, deploys through a separate forced-command key and verifies served hashes/access. No owner password, reviewer key or database enters GitHub. The fixed host receiver and five Actions secrets are installed. Retain their separation from the reviewer connection.

The following remains the guarded release/recovery contract, including the previously used owner-connection installation path:

1. Update `CHANGELOG.md`, `package.json`, README and handoff. Use factual validation claims and distinguish local preview from production acceptance.
2. Run `npm run check`, `python3 tests/provision_checks.py`, Python compilation, and the affected PHP storage/API checks (`scripts/remote-check.py` uses an isolated temporary host directory). Complete fictional browser QA for affected flows.
3. Review the source diff and asset licenses. Commit/publish source only; do not add credentials, real email fixtures, screenshots containing private content, databases, feedback, connection files or old private deployment commands.
4. Package only the ten fixed UI/server files and `public/assets/` allowed by `scripts/update-release-remote.py`, with SHA-256 entries in `manifest.json`. Upload the archive to the private `.email-desk/` directory through the already-authenticated correct-domain Cyberduck connection. The restricted reviewer key is deliberately insufficient for deployment.
5. Execute the updater through that connection with the private archive path and the verified public-homepage digest. It refuses wrong owners, symlinks, unexpected archive members and mismatched hashes; lints PHP; snapshots encrypted SQLite through SQLite's backup API; backs up code privately; installs assets/backend before HTML; and verifies installed digests. No schema migration is needed for 0.2.0. It does not touch credentials, SSH configuration, sessions, the playbook or root website.
6. Run `scripts/live-check.py` for HTTPS, authentication, secure cookies, Apache security headers, protected private files and the restricted reviewer bridge. Verify release asset hashes, `font-src 'self'`, authenticated card preservation, and live browser appearance without fabricating production feedback.
7. Record the release identifier, commit, live acceptance counts and remaining limitations in the handoff. Update release status in README/changelog. Remove uploaded staging archives/scripts after successful verification; retain the private recovery release.

## Rollback

The updater automatically restores only files installed by a failing attempt. For a post-publication rollback, use the selected private `~/.email-desk/releases/arcade-*` backup and its manifest to restore prior code with correct permissions (public files 0644, private server code 0600); remove only newly introduced release files that had no predecessor. Verify the root homepage guard and live acceptance again.

Do not restore the database snapshot for a code rollback: doing so could erase decisions made since publication. The additive `decision_earned_at` and `context_history` payload fields are backward-compatible with the prior server. A database recovery is a separate deliberate procedure. Never expose or copy recovery files into web root.

Unattended review, physical-device/cross-device acceptance and recovery exercises are separate from deployment checks. Do not claim them from unit tests or a desktop preview.
