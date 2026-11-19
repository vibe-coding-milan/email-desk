# GitHub deployment

The production destination remains https://mijatovic.com/email-desk/ on the verified existing DreamHost domain account. GitHub Actions builds and sends code directly to that host; the Mac and Cyberduck are not part of normal releases.

## Release flow

A push to `main`, or a manual **Deploy Email Desk** run on `main`, calls the shared Project checks workflow before the deployment job receives secrets. Pull requests run checks without deploying. Jobs have read-only GitHub contents permission, do not persist checkout credentials, and serialize releases without interrupting a running installation. A queued commit is skipped if it is no longer the current `main` head.

The runner packages the fixed PHP/JavaScript/CSS/HTML/label files and local assets, with version, source commit and SHA-256 manifest. It sends the deterministic archive over SSH with strict host-key checking. The separate deployment key invokes a fixed receiver outside web root. Its SSH channel accepts only `email-desk-release <full-commit-sha>` and `email-desk-release-status`; shell commands, SFTP, PTY and forwarding are unavailable. The reviewer key remains separate and unchanged.

The receiver limits compressed/expanded bytes and archive entries, checks the account and homepage, serializes installations, and calls the host-installed guarded updater. The updater allows only application code/assets, lints all packaged PHP, backs up encrypted SQLite and prior code privately, installs the backend before public files and HTML last, verifies hashes, and rolls code back on failure. Configuration, login files, encryption keys, sessions, playbook, comments and database files are never part of a bundle. The deployment helpers and their trust configuration cannot update themselves through this channel.

An identical acknowledged commit/bundle is deduplicated. An altered bundle under the same commit is refused. If the SSH acknowledgement is lost, the runner reads the durable receipt before considering another upload; it does not blindly retry. Successful jobs verify the receipt, served static-file hashes, root homepage and denied anonymous/private-path access. No owner password or reviewer key is stored in GitHub. Live owner sign-in and card preservation remain separate acceptance checks during initial enablement or affected authentication/storage releases.

## One-time setup

This section is bootstrap, not a step required for each release. It can be performed from any existing authorized domain-owner SSH session; it does not require this specific Mac. Creating the deployment access does not authorize changing the existing owner login, encryption key or reviewer access.

1. Run `python3 scripts/prepare-github-deploy.py` in the local project. It creates a dedicated Ed25519 key if absent and prepares the guarded installer plus secret-value files under ignored `.private/`. It never uploads them or prints their values.
2. Review the installer at `scripts/install-github-deploy.py`. The generated `.private/github-deploy-bootstrap.py` contains only the public deployment key, homepage guard and fixed receiver/updater code. Run it once as the verified domain owner through an existing authorized connection. It refuses wrong owners, homepage mismatches, symlinks and conflicting existing key access. It appends one `restrict,command=...` key and preserves all existing keys. A byte-for-byte matching re-run is a no-op; a differing installation needs a deliberate reviewed update.
3. In the private repository’s [Actions secrets settings](https://github.com/vibe-coding-milan/email-desk/settings/secrets/actions), create the five repository secrets below from the corresponding local files. Use the dedicated deployment key; never use the reviewer key, a personal key or a financial-app connection. The connected GitHub content tools cannot write Actions secrets.
4. Run a read-only SSH `email-desk-release-status` using that key. Verify that an arbitrary command and SFTP are refused, then merge the reviewed change to `main` or run **Deploy Email Desk** manually.
5. Verify a real Actions release, public hashes, unchanged homepage, owner authentication and saved cards. Record the run URL and commit before calling GitHub deployment operational.

| Actions secret | Prepared value file under `.private/github-actions-secrets/` |
| --- | --- |
| `EMAIL_DESK_DEPLOY_HOST` | Verified existing domain SSH host |
| `EMAIL_DESK_DEPLOY_USER` | Verified domain account; the client refuses another owner |
| `EMAIL_DESK_DEPLOY_KEY` | Dedicated deployment private key, retained only locally and in encrypted Actions secrets |
| `EMAIL_DESK_KNOWN_HOSTS` | Host key pinned from the already verified known-hosts file; never a fresh unverified scan |
| `EMAIL_DESK_HOMEPAGE_SHA256` | Existing verified root homepage digest |

The local generated installer and all secret-value files must stay ignored and must not be pasted into issues, PRs, logs or source. Back up the private key securely and remove the local copy only as a deliberate credential-management step. No key has been authorized merely by preparing these files.

## Recovery and maintenance

The private `~/.email-desk/releases/arcade-*` folders retain code and encrypted-database snapshots plus the uploaded bundle. A code rollback restores code only; restoring a database is a separate procedure that could erase newer decisions. See [RELEASING.md](RELEASING.md).

Changes to the host receiver/updater or deployment key require a reviewed bootstrap through an existing authorized owner connection; ordinary app releases cannot change that trust boundary. To revoke deployment access, remove only this dedicated public-key line and remove its Actions secret. Keep the reviewer key intact. Trusted production PHP runs under the existing domain account, so repository write access remains release authority; the SSH restrictions constrain the transport, not arbitrary behavior of deliberately deployed application code.

Activated November 16, 2026 (New York time). Milan approved the concrete one-time access setup at activation. The verified domain connection installed the fixed receiver and separate forced-command key; all five encrypted Actions secrets were saved through the signed-in repository settings. Status access and refusal of unrelated commands were verified. [The first production Actions run](https://github.com/vibe-coding-milan/email-desk/actions/runs/44007834191) succeeded from commit `9c19f58f447e9354d373af45e44d6d698435fe79`, publishing version 0.2.3 as `arcade-20261117T030725099400Z`. All 18 public static hashes and 23 live access checks passed. Saved cards and review checkpoints exactly matched the private pre-release snapshot; authenticated browser verified the connected route, XP, no overflow/errors and sign-out. Owner credentials, reviewer access and the homepage were preserved. Future normal releases run from GitHub without an unlocked Mac.

References: [GitHub encrypted secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions), [GitHub workflow concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency), [OpenSSH forced commands and restrict](https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE).


## Subsequent release verification

Version 0.3.0 was published November 17, 2026 through [Deploy Email Desk](https://github.com/vibe-coding-milan/email-desk/actions/runs/44023929595) after PR #2 passed CI and merged. Receipt commit bdd43a230d8504873fc992f57e1f17c554715c34, 25 public hashes, all 23 live access checks and unchanged saved cards/checkpoints/progress were verified. No bootstrap or credential changes were needed. See HANDOFF for the exact release identifier and acceptance limits. Documentation-only follow-ups retain the same validated runtime behavior.


## 0.3.2 acceptance note — November 19, 2026

The release installed through the restricted key and its receipt was verified. The GitHub runner then timed out connecting to the public root homepage on two attempts, so that Actions run is failed even though independent checks verified the 25 public hashes, all 23 live access checks and unchanged saved board/checkpoints/progress. See HANDOFF and RELEASING for the evidence and reconciliation procedure. No keys, trust rules, authentication or homepage checks were changed to work around the timeout.

The subsequent documentation-only deployment https://github.com/vibe-coding-milan/email-desk/actions/runs/44571631736 passed all checks and public verification with identical runtime files. Its receipt, public hashes and saved-state preservation were read back successfully; the earlier timeout remains a historical run failure.
