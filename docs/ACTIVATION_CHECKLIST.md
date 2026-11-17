# Activate GitHub deployment when back at the MacBook

Current state: GitHub deployment and the prepared review status strip are in PR #1, https://github.com/vibe-coding-milan/email-desk/pull/1. The push and PR checks passed. The dedicated deployment key, guarded host installer and five secret-value files already exist locally under ignored `.private/`. Host authorization, GitHub secrets and the first live Actions deployment remain pending.

1. **Milan: unlock the MacBook and resume this chat.** Open the Email Desk project in Codex, the saved `mijatovic.com` connection in Cyberduck, and GitHub in the browser. Complete any sign-in or two-factor prompts yourself. Keep the Mac awake and unlocked during this one-time setup.
2. **Together: review the one-time access change.** Install the prepared deployment-only public key and fixed receiver on the existing verified DreamHost domain account; store the matching private key in this private repository's Actions secrets. Confirm this concrete access change when prompted. The installer checks the actual account/homepage and preserves the existing reviewer key, login and application state.
3. **Assistant: install the host receiver.** Refresh the generated bootstrap from the reviewed source if necessary, run it through the existing authorized domain connection, and verify the success result. The prepared command is `.private/github-deploy-bootstrap-command.txt`; the standalone installer is `.private/github-deploy-bootstrap.py`.
4. **Assistant, with Milan handling any sign-in: add five Actions repository secrets.** Open https://github.com/vibe-coding-milan/email-desk/settings/secrets/actions. Each value is already in the identically named file under `.private/github-actions-secrets/`: `EMAIL_DESK_DEPLOY_HOST`, `EMAIL_DESK_DEPLOY_USER`, `EMAIL_DESK_DEPLOY_KEY`, `EMAIL_DESK_KNOWN_HOSTS`, `EMAIL_DESK_HOMEPAGE_SHA256`. Enter values directly into GitHub; keep them out of chat, PRs and logs.
5. **Assistant: verify access and merge PR #1.** Check the new key's read-only deployment status and refusal of arbitrary commands/SFTP. Confirm the source and CI are current, then merge the PR. This should start **Deploy Email Desk** automatically on `main`. Watch both shared checks and the deployment job through completion.
6. **Together: verify the live release.** Confirm the public file hashes and homepage guard, owner sign-in, preserved cards/comments/decisions and the XP/time status strip. Record the successful Actions run URL and deployed commit. Update the release documentation with verified production status.

Done means a real GitHub-hosted job has published successfully and live acceptance passed. Until then, the deployment is prepared rather than operational. Subsequent reviewed pushes to `main` deploy from GitHub without Cyberduck or an unlocked Mac. The inbox-review automation is separate from code deployment.

Resume message: **I'm back at my MacBook and it is unlocked. Let's activate GitHub deployment using the checklist.**

Technical reference: [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). No secrets need to be recreated or shared in chat.
