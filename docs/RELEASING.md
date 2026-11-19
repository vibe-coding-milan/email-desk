# Releasing Email Desk

Use the existing mijatovic.com domain account. Verify the root homepage digest before any installation. Never use the financial-app deployment user, expand reviewer access, or rotate credentials as part of a code release. `.private/` stays ignored and outside web root.

Normal releases should use the GitHub Actions path after the one-time setup in [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). It was activated and live-verified on November 16, 2026. Push reviewed source to `main`; the Deploy Email Desk workflow calls the shared checks, packages the exact commit, deploys through a separate forced-command key and verifies served hashes/access. No owner password, reviewer key or database enters GitHub. The fixed host receiver and five Actions secrets are installed. Retain their separation from the reviewer connection.

## Normal release checklist

1. Read README, HANDOFF, REVIEWER and the current playbook reference. Update package version, CHANGELOG, public selected notes and current documentation. Historical design/provisioning notes remain clearly dated; the Google Doc stays master.
2. Compare the working source to current remote main before publishing. This checkout’s local Git HEAD may lag previously connector-published commits. Build a commit parented to current main; never overwrite remote history with an old CLI base. Include only reviewed source, fictional demo data and local artwork. Keep .private/ and .local/ ignored.
3. Run npm run check, the provisioning/release/GitHub deployment regression checks and Python compilation. GitHub CI also lints PHP and runs storage/API checks. For affected PHP behavior, use the documented isolated host checks if needed. Complete fictional browser QA for the changed UI.
4. Save a pre-release board snapshot privately through the existing reviewer bridge. Create a release branch/PR, wait for required checks, then merge to main. Deploy Email Desk runs from the exact main commit after shared checks; no owner credential/key/bootstrap changes are part of a normal release.
5. Follow the Actions run to completion. Verify the durable deployment receipt, root homepage guard, public-file hashes, anonymous/private-path denial and the full live-check.py acceptance suite. Read back the private board and compare cards, feedback-related fields and checkpoints with the pre-release snapshot. Do not fabricate production decisions for testing.
6. Inspect the live public welcome/demo, responsive layouts, one-cycle/reduced-motion artwork and sign-in/sign-out. Verify private state read-only. Distinguish browser/CI/live checks from unattended review, physical devices, cross-device acceptance and recovery exercises.
7. Record the deployed commit, Actions run, release receipt, preservation results and acceptance limits in README/CHANGELOG/HANDOFF. Documentation follow-up commits use the same main/Actions path. Retain private recovery archives; never restore the database for a code-only rollback.

The older owner-connection updater remains an authorized recovery path; it is not needed for routine GitHub releases. It must use the verified domain account, pinned host identity and homepage guard, with private code/database recovery copies and allowlisted manifest hashes. Never use the reviewer key for deployment. Version 0.3.2 uses additive encrypted payload fields. Version 0.4.0 changes only the interface and related assets; neither requires a schema migration or credential change.

## Rollback

The updater automatically restores only files installed by a failing attempt. For a post-publication rollback, use the selected private `~/.email-desk/releases/arcade-*` backup and its manifest to restore prior code with correct permissions (public files 0644, private server code 0600); remove only newly introduced release files that had no predecessor. Verify the root homepage guard and live acceptance again.

Do not restore the database snapshot for a code rollback: doing so could erase decisions made since publication. The additive payload fields remain readable by earlier code. However, releases before 0.3.2 calculate every award as 10 XP and therefore misdisplay new 5-XP awards. Prefer a forward fix or rollback to a timing-aware release; never alter stored award amounts or restore the database to compensate. A database recovery is a separate deliberate procedure. Never expose or copy recovery files into web root.

Unattended review, physical-device/cross-device acceptance and recovery exercises are separate from deployment checks. Do not claim them from unit tests or a desktop preview.


## Reconciling a final public-verification failure

If the GitHub client fails after installation, read the existing restricted release receipt first. Compare its commit and deterministic bundle digest, then verify public hashes, homepage/access checks and private board preservation independently. A failed public connection is not proof that installation failed, and a matching receipt alone is not public acceptance. The 0.3.2 run installed successfully but its GitHub runner timed out connecting to the homepage twice; independent live acceptance passed. Keep the workflow’s failure visible and record it separately. Do not weaken TLS, homepage or authentication checks, expand keys, or restore the database to work around network reachability.

The legacy scripts/remote-check.py still reads obsolete financial-app deployment metadata; do not run it as-is. Use GitHub CI for PHP checks, or an isolated temporary check through the verified, authorized mijatovic.com domain-owner connection. The restricted reviewer/deployment keys do not provide a general test shell.
