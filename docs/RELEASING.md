# Releasing Email Desk

Use the existing mijatovic.com domain account. Verify the root homepage digest before any installation. Never use the financial-app deployment user, expand reviewer access, or rotate credentials as part of a code release. `.private/` stays ignored and outside web root.

Normal releases should use the GitHub Actions path after the one-time setup in [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). It was activated and live-verified on November 16, 2026. Push reviewed source to `main`; the Deploy Email Desk workflow calls the shared checks, packages the exact commit, deploys through a separate forced-command key and verifies served hashes/access. No owner password, reviewer key or database enters GitHub. The fixed host receiver and five Actions secrets are installed. Retain their separation from the reviewer connection.

## Normal release checklist

1. Read README, HANDOFF, REVIEWER and the current playbook reference. Update package version, CHANGELOG, public selected notes and current documentation. Historical design/provisioning notes remain clearly dated; the Google Doc stays master.
2. Compare the working source to current remote main before publishing. This checkout’s local Git HEAD may lag previously connector-published commits. Build a commit parented to current main; never overwrite remote history with an old CLI base. Include only reviewed source, fictional demo data and local artwork. Keep .private/ and .local/ ignored.
3. Run npm ci, npm run build (generated public bytes must match), npm run check, the provisioning/release/GitHub deployment regression checks and Python compilation. GitHub CI also lints PHP and runs storage/API checks. For affected PHP behavior, use the documented isolated host checks if needed. Complete fictional browser QA for the changed UI.
4. Save a pre-release board snapshot privately through the existing reviewer bridge. Create a release branch/PR, wait for required checks, then merge to main. Deploy Email Desk runs from the exact main commit after shared checks; no owner credential/key/bootstrap changes are part of a normal release.
5. Follow the Actions run to completion. Verify the durable deployment receipt, root homepage guard, public-file hashes, anonymous/private-path denial and the full live-check.py acceptance suite. Read back the private board and compare cards, feedback-related fields and checkpoints with the pre-release snapshot. Do not fabricate production decisions for testing.
6. Inspect the live public welcome/demo, responsive layouts, one-cycle/reduced-motion artwork and sign-in/sign-out. Verify private state read-only. Distinguish browser/CI/live checks from unattended review, physical devices, cross-device acceptance and recovery exercises.
7. Record the deployed commit, Actions run, release receipt, preservation results and acceptance limits in README/CHANGELOG/HANDOFF. Documentation follow-up commits use the same main/Actions path. Retain private recovery archives; never restore the database for a code-only rollback.

The older owner-connection updater remains an authorized recovery path; it is not needed for routine GitHub releases. It must use the verified domain account, pinned host identity and homepage guard, with private code/database recovery copies and allowlisted manifest hashes. Never use the reviewer key for deployment. Version 0.3.2 uses additive encrypted payload fields. Versions 0.4.0 and 0.4.1 change only the interface and related assets; none requires a schema migration or credential change.

## Hosted reviewer prototype checks

The November 20 reviewer work is local preparation, not a released application version or installed cron job. See [HOSTED_REVIEWER.md](HOSTED_REVIEWER.md) for the current evidence and production acceptance. Documentation-only edits do not require a version bump or another live mail request.

For affected prototype code, run the eight fictional checks with the isolated dependency environment:

```sh
.private/hosted-reviewer/venv/bin/python tests/reviewer_pilot.py
git diff --check
```

The private environment is installed from `scripts/hosted-reviewer-requirements.txt`. `python3 scripts/reviewer-usage.py` reads usage metadata locally and makes no API call. Authorization and pilot scripts are live operations, not CI tests: do not run them automatically on a documentation change, copy their private files to GitHub, or treat the one-request pilot approval as permission for unrestricted future payloads. Host provisioning, durable Google grants, mutation/read-back checks and a Mac-offline publication are separate gates before schedule activation.

## Rollback

The updater automatically restores only files installed by a failing attempt. For a post-publication rollback, use the selected private `~/.email-desk/releases/arcade-*` backup and its manifest to restore prior code with correct permissions (public files 0644, private server code 0600); remove only newly introduced release files that had no predecessor. Verify the root homepage guard and live acceptance again.

Do not restore the database snapshot for a code rollback: doing so could erase decisions made since publication. The additive payload fields remain readable by earlier code. However, releases before 0.3.2 calculate every award as 10 XP and therefore misdisplay new 5-XP awards. Prefer a forward fix or rollback to a timing-aware release; never alter stored award amounts or restore the database to compensate. A database recovery is a separate deliberate procedure. Never expose or copy recovery files into web root.

Unattended review, physical-device/cross-device acceptance and recovery exercises are separate from deployment checks. Do not claim them from unit tests or a desktop preview.


## Reconciling a final public-verification failure

If the GitHub client fails after installation, read the existing restricted release receipt first. Compare its commit and deterministic bundle digest, then verify public hashes, homepage/access checks and private board preservation independently. A failed public connection is not proof that installation failed, and a matching receipt alone is not public acceptance. The 0.3.2 run installed successfully but its GitHub runner timed out connecting to the homepage twice; independent live acceptance passed. Keep the workflow’s failure visible and record it separately. Do not weaken TLS, homepage or authentication checks, expand keys, or restore the database to work around network reachability.

The legacy scripts/remote-check.py still reads obsolete financial-app deployment metadata; do not run it as-is. Use GitHub CI for PHP checks, or an isolated temporary check through the verified, authorized mijatovic.com domain-owner connection. The restricted reviewer/deployment keys do not provide a general test shell.


## Version 0.5.0 worker reporting rollout

Deploy the website/Store first, then prepare the exact reviewed worker commit with `prepare-hosted-reviewer.py`. The authorized domain-owner path may run `provision-hosted-reviewer.py --mode upgrade-code` with the expected current manifest commit, archive digest and explicit `--reviewed-active-code-upgrade`. This is a code-only upgrade under the reviewer lock; dependencies must match and old code is retained. It does not change activation, cron, grants, credentials or state. No unrestricted key is added. Run the upgraded worker with `--report` once to publish existing aggregate metadata without mail/model calls; verify cards, feedback, checkpoints, run history and XP independently. Future scheduled runs supply structured final outcomes. An old pending publication must replay its original payload unchanged.


## 0.7.0 frontend and worker

Editable game source lives in frontend/. The build retains the existing fixed public entry filenames and asset allowlist. Publish the authenticated Store/API and website, then install the matching reviewer commit using the existing locked upgrade-code path and domain-owner connection. Do not change grants, activation or cron. Preserve encrypted quest metadata during code rollback; pre-0.7.0 code cannot display achievements or process new archive requests, so prefer a forward fix. Never replay old decisions as archive requests or restore the database for rollback.


## Separate installation and public verification

The Deploy Email Desk workflow now reports install and verify as separate required jobs. Installation success confirms the exact bundle and durable receipt; release success additionally requires the fresh macOS runner's homepage/public-hash/access checks. Read the failed job name and named check before taking recovery action. Transient failures receive at most three bounded attempts; hashes, certificates, redirects and security-response failures do not retry. A public-verification failure never triggers another upload or database rollback. See GITHUB_DEPLOYMENT.md and PR #26 for probe evidence and acceptance.
