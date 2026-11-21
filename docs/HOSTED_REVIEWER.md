# Offline reviewer readiness

## Hosted schedule activated — November 21, 2026

The DreamHost reviewer is active as of 11:24:53 AM New York (16:24:53 UTC). Cron installation and exact read-back passed under the verified domain owner/homepage guard; there is one managed dispatcher block. The first unattended dispatch was observed in the private cron log returning due:false, correctly avoiding a retroactive morning review. This proves dispatch execution, not a scheduled mailbox publication. It checks for due slots every five minutes, using America/New_York rather than server-local time: **weekdays 09:00, 13:00, 17:30; weekends 09:00, 17:30**. Allow dispatcher delay plus review runtime. Activation does not backdate a missed slot. The next real slot is November 21 at 17:30 New York.

Host source is 741c6e592d59f1f0f7320a76f00b513c6aaf25d1, merged through PR #12 after CI 44924042520 passed. PR #11 (8b37d7bf4183aadb248cfeb178abbb7ca3a36771; CI 44922253829) made all model thread/message targets required and added safe issue codes/results plus a locked, manifest-verified pre-activation upgrade with retained backups. PR #12 converts an unsupported deadline into explicit source-verification uncertainty, omitting the unverified date and timing prose. Semantic message, custom-label, source, revision and reopen checks remain mandatory.

Final live validation finished at 11:23:33 AM New York: **24 targets processed, zero errors, both recent mailbox scans complete, 24 exact-message label read-backs and two actual custom-label changes**. A separate read-only pass independently verified 12 exact messages per account, including unchanged system/unknown labels. Independent restricted-bridge read-back confirmed publication and both checkpoints, with all pre-existing 66 cards retained, owner comments/decisions/corrections and XP preserved; 74 cards were saved afterward. The run truthfully remains partial because historical catch-up is incomplete. No fake historical success or card deletion was used to pass acceptance.

Private code, pinned dependencies, API/encryption keys, renewed encrypted Google grants and encrypted processing journal are outside web root. No SSH privilege expansion was used. Initial host Python lacked pip; the isolated venv was bootstrapped from the official pip source with a verified digest, without system-package changes. Protected transfer copies and code backups remain private. The Google Doc stays master.

The local activation receipt now makes the existing desktop heartbeat **monitor only**: no duplicate mail classification, model requests or labeling. Keep it until an actual hosted scheduled publication and a Mac-offline run are independently observed. Those two checks remain pending; installed cron and controlled live publication do not prove them. This is a DreamHost schedule and will not appear in ChatGPT Scheduled Tasks.

Usage is recorded by slot in the encrypted host journal. The first 32 host requests (validation, recovery and bounded catch-up, including final acceptance) used 379,721 input and 36,689 output tokens and calculate to $0.065807225 using the November 20 rate snapshot. This is not posted billing or a routine monthly forecast. Milan chose actual measurement before calibrating a ceiling; no auto-reload or monthly cap was added. Later totals should include recurring reviews, keeping dry-runs, catch-up and routine slots separate.

A scoped authenticated desktop status review captured and inspected collapsed/expanded notice screenshots privately. The next-review time is clear, but the broad “incomplete” headline hides that both recent scans passed while older catch-up remains partial. Prioritize separate recent freshness, historical progress, actual recovery publication time and a concise hosted-schedule indicator. Do not parse prose to infer health or turn historical partial coverage into success. No frontend redesign was included. Mobile, dark-mode, keyboard/screen-reader and physical-device acceptance remain open. Private screenshots and source contents remain out of Git.

Earlier dated sections below are historical records; this section supersedes their current-state claims.


## Operating the active worker

The approved bounds are 12 new/unprocessed incoming messages plus four active conversations per account per run, at most eight model requests per slot, 240,000 context bytes per request and 8,192 output tokens. Requests use store:false; no attachments are downloaded. Routine topic proposals add approved custom labels; only exact saved owner corrections can remove them. Every write receives an exact-message read-back that also protects system/unknown labels. The master playbook is read from the fixed Google Doc, not silently replaced by the reference snapshot.

From the already-authorized domain-owner host session, inspect health without making a model/mail request:

```sh
cd ~/.email-desk/reviewer/code
../venv/bin/python -m reviewer.main --health
```

Read the private activation receipt and managed crontab to inspect configuration; the private cron log proves dispatch execution, while saved run/checkpoint read-back proves publication. Check both recent mailbox checkpoints and errors separately from historical backfill. Do not print grants, API/encryption keys, message payloads or the decrypted journal. Keep usage/evidence exports private and metadata-only.

The dispatcher uses the latest due slot, an exclusive journal lock, a maximum of three attempts and 15-minute retry spacing. A completed slot is deduplicated. Uncertain Gmail/publication acknowledgements retain exact work for read-back/replay; failed-account cursors remain unchanged. A missing model acknowledgement is not permission to repeat a charged request blindly. Inspect the encrypted pending operation before any recovery. Manual --run-now performs a real authorized review and consumes API credit; --dry-run also makes paid classification requests but changes no Gmail/board data. Neither substitutes for a scheduled/offline acceptance test.

Routine source deployment does not update the separately installed private worker or transfer credentials. Current upgrade-code is deliberately limited to pre-activation repair; it rejects an activated installation. Future active-worker maintenance needs a reviewed pause/update/resume procedure with exclusive locking, manifest checks and preserved private state. Do not overwrite installed code, grants or journal to work around these guards. If authorization fails, retain cards/checkpoints and use the approved same-account renewal flow with the owner completing consent; never expand scopes or adopt another account implicitly.

Keep the existing desktop task on its monitor-only branch while observing the first real 17:30 publication and a Mac-offline run. Record the actual slot, publication time, both checkpoints and label read-back independently. Then retire the redundant desktop registration. Do not add another reviewer task to ChatGPT or another machine.

## Hosted validation — November 21, 2026

Version 0.4.3 is live (PR #8, merge aee34fb6a7ccf6f29c3f14b7ede4e312a5e87432). Independent receipt arcade-20261121T153335637529Z, 28 public hashes, 23 access checks and exact private-state preservation passed. Deployment run 44919759279 reported failure; independent acceptance is recorded separately and does not erase that workflow result.

Milan approved private DreamHost installation and recurring bounded API reviews. The correct domain-owner/homepage guard passed. Private code, isolated dependencies, renewed encrypted Google grants, API/encryption keys and the encrypted journal are installed outside web root. The seed contains 263 previously verified IDs and retains incomplete historical coverage. No SSH key privileges were expanded. Protected transfer copies remain private.

Read-only host validation processed 18 targets with zero errors and no Gmail/board writes. The first live validation processed 27 targets, verified 14 custom-label changes and published with one mailbox issue; the failed account checkpoint stayed unchanged. The retry identified decision_targets: a long-conversation response omitted required targets. Saved cards, owner decisions, comments and XP were preserved. Cron remains OFF pending successful validation. Existing partial updates must remain visible; historical catch-up is separate from recent mailbox freshness.

The repair requires exact thread/message keys through Structured Outputs, retains semantic validation and records safe per-slot issue codes/results. Routine interest matches alone should not become board cards. A pre-activation upgrade verifies the old manifest/base, new archive, unchanged dependencies and Python compilation under the reviewer lock; it retains an old-code backup and all private state. It refuses activated installations. These changes need CI, guarded host upgrade and live validation before cron activation. No successful unattended or Mac-offline review is claimed.

The agreed schedule is weekdays 09:00, 13:00, 17:30; weekends 09:00, 17:30, America/New_York including DST. Usage is measured before calibrating a spending ceiling. The desktop heartbeat switches to monitoring only after a verified local activation receipt exists. Retire it only after real scheduled and Mac-offline acceptance. Perform the requested UI/UX review after activation, with particular attention to partial coverage, mailbox freshness and recovery wording.

Earlier dated setup sections below are historical evidence; this section supersedes their current-state claims.



## Production renewal and install preparation — November 21, 2026

Both Production grants were renewed after Milan explicitly approved same-account/same-scope replacement and encrypted backups. Milan personally completed each Google consent screen. Exact Gmail profiles, required scopes, refresh grants, owner-only encrypted replacements and retained encrypted backups are verified. No message contents were read or changed during renewal. No host transfer has occurred. A fresh owner Cyberduck check passed the domain-account/homepage guard, confirmed Python venv support and confirmed the reviewer target does not exist. Encrypted initial progress is prepared from 263 verified exact-message IDs (120 personal, 143 Workspace) and current board checkpoints; historical coverage remains incomplete. Disabled private configuration is prepared, with API execution still unapproved.

Current checks: 21 worker, ten parser/pilot, six installer, two renewal-storage and three state-import tests pass (42 total). Routine worker proposals preserve existing custom labels and add approved topics; exact saved owner corrections can remove custom labels. The encrypted import contains only verified IDs, timestamps and coverage metadata, never message bodies, notes or model evidence. Broad historical completeness is not imported from the older category-filtered pass. Code, credential configuration and cron remain separate guarded operations; all host files belong outside web root under ~/.email-desk/reviewer.

## Current continuation — November 21, 2026

Version 0.4.2 is live through PR #9, commit 752c9812ca264e25e75b8a7ad3400e30e9da7305, release arcade-20261121T144224251467Z. CI passed. Deployment run 44915259854 installed the matching release but timed out during its final homepage request. Independent acceptance passed: restricted receipt, 28 public hashes, all 23 authentication/access checks and exact private board/checkpoint/progress preservation. Keep the workflow failure visible; do not repeat installation or weaken checks to conceal a connectivity failure.

Google branding is saved and Audience reads In production. The approved notice is live at https://mijatovic.com/email-desk/assets/privacy.txt. This resolves app publishing status, not the lifetime of existing Testing-issued grants or hosted activation. The explicit renewal helper keeps an encrypted backup and replaces a grant only after fresh consent, scope and exact-account verification. Its two fictional storage tests pass. Starting renewal was rejected by automatic approval review because Production approval did not explicitly cover credential replacement; the separate confirmation is pending. No renewal, host transfer or cron installation has occurred.

## Setup ledger — November 20, 2026

| Item | Observed state |
| --- | --- |
| DreamHost runtime and domain identity | Verified read-only; details below |
| User's ChatGPT workspace | Personal Plus/Pro; standalone API route selected |
| OpenAI API funding | $25 balance verified in the existing account after Milan's purchase |
| Recurring API spending ceiling | Milan chose to measure actual usage first and calibrate afterward; no recurring ceiling or auto-reload enabled |
| Google Cloud project | Created and selected: `mijatovic-email-desk`, display name Email Desk, under mijatovic.com |
| Gmail API | Enabled; status read back in the dedicated project |
| Google Drive API | Enabled; status read back in the dedicated project |
| Google consent configuration | Created; External audience for personal Gmail compatibility; owner support/contact address; Google API Services User Data Policy accepted with Milan's explicit confirmation |
| Google OAuth client | Created as Desktop app, named Email Desk reviewer authorization, with AI-powered-agent designation explicitly approved by Milan; creation success read back |
| OAuth credential export | Explicitly approved and saved to `.private/hosted-reviewer/google-oauth-client.json`; correct project and Google endpoints validated without printing values; file mode 0600, parent 0700, Git ignore verified |
| Google test users | Both exact approved accounts added after Milan's explicit confirmation; list read back |
| Mailbox grants | Both exact accounts verified using Gmail profile after Milan personally completed consent; offline refresh grants stored encrypted locally, with no mail contents read or changed during bootstrap |
| Master-document access | Live master read succeeded during the approved pilot; version 1.1, November 15, 2026; no playbook edits |
| OpenAI reviewer project/key | Milan created the Email Desk project and key, saved it privately; format/owner-only file permissions and successful bounded Responses request verified |
| Pilot implementation | Explicitly approved live pilot completed: four messages/threads across both accounts; one model request; proposals passed source/label validation; HTML extraction limitation found and fixed locally afterward; eight fictional tests now pass |
| Google publishing status | In production, confirmed in Firefox November 21 after explicit approval; exact branding URLs and authorized domain saved |
| Grant renewal | Separate approval pending; original encrypted Testing grants unchanged |
| Worker implementation | Local worker, guarded installer and fictional tests prepared in [draft PR #8](https://github.com/vibe-coding-milan/email-desk/pull/8); not installed or activated |
| Host credentials and cron | No host credential transfer or offline review verified; Google remains Testing |

The Desktop client is for a one-time loopback browser authorization bootstrap. Durable offline Google grants must be protected on the host, verified against each expected account, and refreshed without depending on a browser or the Mac. No new public OAuth callback endpoint is established by this setup. Confirm the final publishing state and token-expiry behavior before relying on unattended execution.

Automatic approval reviews required more specific authorization for the AI-agent designation and credential export; Milan subsequently approved both. The export was then blocked because Firefox's automatic Downloads destination did not satisfy the approved path. A safer flow enabled Ask where to save files before downloading, selected the approved private folder before saving, normalized the filename locally, verified the file, and restored the original Firefox setting. All these setup issues are resolved. These are authorization/setup events, not runtime failures. Do not work around a rejected action using another interface.

Never put OAuth client values, refresh tokens, API keys, real message fixtures, comments or connection files in this ledger. The approved private staging destination is `.private/hosted-reviewer/google-oauth-client.json`. The directory remains ignored; hosting credentials must remain outside web root.

## Implementation progress — not activated

The `reviewer/` package now contains the bounded mail reader, strict model proposal validation, custom-label-only application/read-back, feedback reconciliation and revision-guarded publication. A private encrypted journal records exact-message processing, write-ahead label operations, pending publications and per-account coverage. Lost final acknowledgements replay the same operation before cursors advance. Failed-account coverage stays unchanged; existing cards are retained. Models receive no tool access. Metadata-first reading omits routine authentication bodies and bounds response/context sizes.

The dispatcher calculates the latest due New York slot, with DST, a process lock, durable slot completion and bounded retry/backoff. `prepare-hosted-reviewer.py` builds a code-only hash manifest; `provision-hosted-reviewer.py` guards the domain owner/homepage and separates code, credential configuration and cron activation. It preserves unrelated jobs and checks a recent two-mailbox live acceptance result before installing cron. These are source-level controls, not evidence of a configured server.

Local checks pass: 20 worker tests, ten pilot/parser tests and six installer tests, all fictional and offline. The initial draft PR CI passed; subsequent reader/installer changes require a fresh CI result. Live production remains 0.4.1. The revision publication guard in `Store.php` is still a proposed backend change. No new model request, Gmail write, card publication, host installation or credential transfer occurred during implementation. Milan unlocked the Mac on November 21. Signed-in Firefox confirms Google remains Testing and Publish app is disabled until Branding configuration is complete. The homepage has no privacy notice. A proposed public notice is prepared at public/assets/privacy.txt with a homepage footer link; it is not published or saved into Google branding. Review the notice and obtain confirmation for the concrete privacy-publication/Production change before those steps. The latest worker commit 7e42aa65c1c3de35e334d38c3da3a736da3713e4 passed CI run 44857154539, including PHP storage and HTTP checks.

## November 21 continuation

The existing desktop morning review completed Gmail label verification but temporarily lost restricted SSH access before publication. After the connection recovered, the exact saved operation was published at 09:32:48 New York and independently read back. Saved cards, owner decisions/notes and XP were preserved; feedback was reconciled, and recent checkpoints now cover 09:00. The historical backlog remains partial. This was the existing desktop path, not a hosted-worker activation or a Mac-offline test. No key, SSH configuration or account setting was changed to recover connectivity.

That review also exposed malformed MIME alternatives: a full stale HTML template declared as text/plain can hide the actual message in the proper text/html alternative. The shared parser now prefers the declared HTML body in this case and extracts visible text from a standalone mislabeled HTML document. Two additional fictional regressions pass; no private message fixture is committed and no extra model call was made. Current local total: 20 worker, ten pilot/parser and six installer tests. Earlier eight-test statements describe the initial HTML fix; the latest parser changes still need their own CI result and hosted acceptance.

## UX review after hosted acceptance

Milan requested consideration of UI/UX changes after implementation. Review actual authenticated desktop/mobile screens once hosted acceptance is established. Keep the two-bucket board and existing visual system. Inspect whether the current interface clearly communicates the latest verified result, next scheduled review in New York time, freshness for each mailbox, bounded historical catch-up versus a failed current scan, and the action needed for an authorization or review failure. Avoid presenting a registered job or a code deployment as a successful mailbox review.

Use observed confusion to prioritize the smallest changes. Consider a compact run-details view for account coverage and recovery information rather than routine technical prose on every card. A Retry control should be considered only with authenticated, idempotent server execution and meaningful failure feedback; its necessity has not been established. Do not expose credentials, raw mail, model prompts or private diagnostics.

The sender-name and post-48-hour divider/color issues from the supplied screenshot were addressed in live 0.4.1. Verify those treatments still work with new hosted summaries, long senders and partial/error states in both themes and mobile widths. This is a planned post-implementation review, not a completed audit or approval for a redesign.

## Next setup inputs and work

- The dedicated OpenAI project/key is now present and works. Before production, verify its final permission and expiry configuration. The creation-page observation showed All permissions and Never expiry; the earlier recommendation of Responses Write only and 90 days was advice, not a verified setting. Key-file possession and a successful request do not prove endpoint restrictions. Do not change or rotate credentials implicitly.
- Milan's latest instruction is to measure actual usage and calibrate afterward, rather than select a speculative monthly ceiling now. Run a bounded pilot with explicit message, request and token limits. Record model/version, reviewed message count, input/cached/output tokens, retries and observed API cost without logging email content. Reconcile against API usage/billing; identify calculated estimates separately from posted charges. Separate initial historical catch-up from routine incremental reviews before projecting the 19 scheduled reviews per week. Agree ongoing controls from that evidence. Project budget notifications are not a substitute for worker-enforced usage controls. No auto-reload change is authorized here.
- The authorization bootstrap and first bounded live pilot are complete. Finish worker CI, live fuller-context/action/feedback validation and guarded host installation separately. Further live model requests must stay within their explicitly authorized scope; the completed pilot approval was for one request. Check external-app publishing/verification requirements and avoid relying on seven-day testing tokens for sustained operation.
- Keep all scheduled times in America/New_York: weekdays 09:00, 13:00, 17:30; weekends 09:00, 17:30. Use a frequent bounded cron dispatcher with New York timezone calculations, a lock and durable slot identifiers so DreamHost server timezone and DST do not shift the reviews. Install only after meaningful tests, credentials and a bounded successful review.
- Verify an actual scheduled publication independently with the Mac offline, read back the result, and only then retire the desktop heartbeat. Record partial coverage and missed/failed slots honestly; do not rewrite historical scan timestamps.

## First API check and authorization evidence

At 8:31 p.m. New York on November 20, `scripts/test-reviewer-api.py` successfully requested an OK reply using `gpt-6-luna`. It sent no email or board content, set `store: false`, allowed at most 128 output tokens and made no automatic retries. The response completed with 18 input tokens, zero cached/cache-write tokens and 5 output tokens: 23 total. At the published $0.10 input/$0.50 output per million tokens, calculated usage is $0.0000043. This is a rate-based calculation, not a posted billing charge or representative email-review estimate. [Official model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna). Metadata is retained in an ignored private usage record; no key or raw response content is logged.

Google authorization uses `scripts/authorize-reviewer-google.py`, the official google-auth-oauthlib client, PKCE, random state and loopback-only ports 8766/8767. The browser opens manually through computer-use tools; the script never opens a browser itself. It requests offline access, checks granted scopes and a refresh token, verifies the expected Gmail profile, then encrypts the grant with Fernet into owner-only ignored storage. It refuses to replace an existing grant implicitly. No tokens or authorization codes are printed. The personal account grants Gmail modify. Workspace grants Gmail modify and Docs read-only. The latter Google scope covers all Docs; implementation is limited to the fixed master document. Gmail modify is broader than label operations; worker restrictions must enforce the narrower task behavior.

The initial personal authorization was blocked because no test users existed. Milan explicitly approved adding both accounts. He then personally completed the unverified-app warning/consent for the personal account and the Workspace consent. Both helpers returned exact-account verification and encrypted local storage success. No host transfer or unattended-read claim follows from this local bootstrap. The app remains in Testing; its publishing state and refresh-token lifetime are an outstanding production gate.

Local dependencies were installed only in `.private/hosted-reviewer/venv`; versions are pinned in `scripts/hosted-reviewer-requirements.txt`. Initial network-sandbox attempts failed without a model response; approved network execution completed the single smoke request and dependency installation. This is distinct from a failed inbox scan.

## Read-only calibration pilot

`scripts/pilot-hosted-reviewer.py` is prepared for one model request using the live master playbook, account-specific label inventories and existing board context. It samples at most two recent incoming messages per account, groups their threads, reads at most eight message excerpts per thread and limits body excerpts to 1500 characters. It omits authentication-labelled/code-link subjects, URLs and long number strings; downloads no attachments. These limits make this a calibration sample, not complete recent or historical coverage.

The pilot validates each exact account, all 37 existing labels, the fixed master document and model source IDs. Model proposals must cover each sampled thread once, target only candidate incoming message IDs and use approved custom labels/buckets. No model tools, Gmail mutation operations or board publication exist in this pilot. Context is capped at 160000 bytes, output at 4096 tokens, with no automatic model retries. Proposals and abbreviated source evidence stay encrypted privately; separate usage metadata contains no email bodies. Refreshed Google credentials remain encrypted.

The initial five fictional tests in `tests/reviewer_pilot.py` passed before execution: valid proposals, rejection of unknown accounts/threads/message targets/system or invented labels, rejection of missing/duplicate thread coverage, Docs tab/table text extraction, and refusal of an unapproved Google host before network access. After the extraction fix below, eight tests pass. Syntax and whitespace checks pass. No routine per-review cost estimate is established yet.

### First live pilot result

Milan explicitly approved the exact bounded live payload and OpenAI API destination after the automatic-review rejection. One request completed using gpt-6-luna: four candidate messages in four threads, two per account, 35924 context bytes. Both expected account identities and the shared 37-label inventory were checked; the live master Google Doc was read successfully, version 1.1 dated November 15. Matching saved-card context was empty for these sampled threads, so the pilot did not exercise comment/correction handling.

Actual returned usage: 7586 input tokens, including 7583 cache-write tokens (30-minute tier), zero cached-read tokens; 1693 output tokens including 1281 reasoning tokens; 9279 total tokens. Using the published standard rates, calculated cost is $0.001794675 (about $0.0018 or 0.18 cents), including the cache-write premium. Combined with the connectivity check, calculated total is $0.001798975. These are calculations from returned usage, not posted billing reconciliation. `scripts/reviewer-usage.py` reports the breakdown without reading content evidence. No monthly projection is justified by this small sample.

The output passed exact source-message/custom-label/bucket checks. Manual review found plausible topic proposals, three awareness suggestions and one none, with no action suggestions. This sample contains no substantive outstanding request, reopened/handled conversation, conflicting correction or matching existing comments; it does not establish recall or accuracy for those cases. No labels or board cards changed and no automation or credential transfer was installed.

A material input limitation was found during review: these HTML messages used short Gmail snippets because the first extractor handled only plain text MIME. The pilot cost and proposals reflect that abbreviated input. Fixed the extractor locally to read HTML visible text without rendering/fetching resources, omit script/style/hidden content and attachments, decode entities/charset, and prefer plain text in alternative MIME parts. Added three fictional extraction tests; all eight tests pass. No second live model request was made. Original encrypted evidence is retained unchanged; do not describe the first pilot as a full-body or post-fix live validation.

## Verified host inventory — November 20, 2026

The signed-in DreamHost panel identifies mijatovic.com as Shared Unlimited hosting with PHP 8.3. Its existing domain user has SSH enabled. A read-only command through the existing owner Cyberduck session verified the expected domain account and the unchanged root homepage SHA-256 before inspecting the host.

The host has Python 3.12.3, Node, PHP 8.3 and the existing Email Desk Store. Crontab is readable and contains zero jobs. Codex is not installed on the host. No software, credentials, permissions, cron jobs or production application files were changed by this check.

This establishes basic hosting capability, not an enabled unattended reviewer. The desktop Codex heartbeat does not establish a ChatGPT cloud task or offline operation. Earlier schedule restoration claims must be read with that distinction.

## Selected route — standalone API reviewer

Milan confirmed a personal Plus/Pro account, approved a dedicated Google Cloud project, and explicitly offered to fund separate OpenAI API usage on November 20. A $25 API credit purchase was confirmed by both Milan and the billing UI. This is an initial balance, not approval for auto-reload or a recurring monthly budget.

Proceed with a DreamHost cron worker using the OpenAI API and its own Google OAuth grants. It must read and label both approved mailboxes, read the master playbook, reconcile board feedback and publish through the existing local CLI Store boundary. It will run without the Mac. This is a server schedule, so it will not appear in ChatGPT Scheduled; expose actual review outcomes in Email Desk and document the server job separately.

Use a dedicated OpenAI project/key with only required API access. Keep the key and Google refresh tokens outside web root and Git; do not copy ChatGPT desktop authentication. The Google project must allow both the Workspace and personal mailbox. Select appropriate external/personal-use publishing settings and verify refresh-token durability; testing-mode tokens alone do not establish reliable long-term operation. A Gmail modify grant is broader than label-only: the worker must enforce its own allowlist for reads and approved custom-label changes, with no send, trash, archive or system-label mutation operation. Playbook access is read-only, ideally limited to the selected document.

Local credential bootstrap and the draft worker are prepared, while live validation and host credential transfer/installation remain pending. Do not install an empty cron placeholder or call funding evidence of an operational reviewer. Before activation, verify a bounded dry run, exact labels/system-label preservation, board/comment/status/history preservation, encrypted durable processing progress, bounded model usage, DST handling, overlap/retry recovery, and a real unattended publication. Keep the current reviewer until the replacement passes, then retire it to prevent duplicates.

## Earlier cloud connector evaluation

The earlier option was a ChatGPT cloud task reusing connected Gmail/Drive tools and a separately authenticated hosted Email Desk MCP connector. It was not implemented. The existing forced-command SSH reviewer key remained restricted; it was not converted to a general remote execution credential.

At the November 20 evaluation, OpenAI's [custom MCP guidance](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt) documented full custom write tools for Business and Enterprise/Edu, with read/fetch custom connections for Pro. [Scheduled-task guidance](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt) also noted that required approvals can pause tasks. After confirming a personal plan, Milan selected the standalone API route and funded it explicitly. This earlier option is not a pending cloud-task activation instruction.

The selected route uses its own API key and Google grants. ChatGPT/Codex credits and desktop authentication were not copied or repurposed for it.

## Acceptance before claiming operation

This checklist applies to the selected standalone DreamHost/API route. The earlier cloud-connector option above is historical; creating a ChatGPT Scheduled task is not an activation step for this design.

1. Validate full visible-message extraction on live data within specifically authorized request bounds, including substantive action requests, sent-reply chronology, handled/reopen cases and explicit corrections/comments. The first snippet-based pilot and fictional tests do not establish these properties.
2. Resolve the Google app's Testing/publishing and refresh-token lifetime. Verify final API key permissions/expiry and protected refresh persistence. Do not silently rotate credentials or broaden access.
3. Verify the prepared production worker on the host, including encrypted durable processing/retry progress, per-account coverage, bounded historical catch-up and model usage metadata. Preserve the current master and shared taxonomy; never treat labels, unread state or card presence alone as completed processing.
4. Verify exact approved custom-label changes and read-back without system-label changes. Verify feedback acknowledgements, revision checks, idempotent publication, preserved comments/status/history/XP and explicit reopen reasons. Failures must be visible and must not erase cards or advance failed-account cursors.
5. Provision only through the verified domain-owner path after specific approval for credential destinations and access changes. Keep grants, model/encryption keys, journals and evidence outside web root and Git. Do not repurpose reviewer/deployment keys for a general shell or put these credentials into the code-release pipeline.
6. Measure complete routine and historical-catch-up review usage separately, then calibrate the ongoing spending controls with Milan. Install the actual cron dispatcher with America/New_York slot calculations, locking, deduplicated slot IDs and tested DST/retry behavior: weekdays 09:00/13:00/17:30, weekends 09:00/17:30.
7. Observe a real scheduled run while the Mac is offline, verify labels and stored publication/checkpoints independently, and record the outcome accurately. Only then retire the desktop heartbeat to avoid duplicates. A code release, local consent or successful read-only pilot cannot satisfy this gate.

## Local verification and resuming work

From the project directory, the following checks use fictional data or existing metadata and make no mail/model request:

```sh
.private/hosted-reviewer/venv/bin/python tests/reviewer_pilot.py
.private/hosted-reviewer/venv/bin/python tests/hosted_reviewer.py
python3 tests/hosted_reviewer_provision.py
python3 tests/hosted_reviewer_probe.py
python3 scripts/reviewer-usage.py
git diff --check
```

The isolated environment uses `scripts/hosted-reviewer-requirements.txt`. Its directory, all keys/grants, usage files and encrypted real evidence are ignored under `.private/hosted-reviewer/`. Do not print or commit their contents. `reviewer-usage.py` reports returned token metadata and rate-based calculations; it does not query billing or reconcile posted charges. Its rates are the November 20 gpt-6-luna snapshot; reverify pricing before using them for future projections, and do not apply them to another model.

`authorize-reviewer-google.py` starts a real Google grant flow and refuses implicit replacement of an existing grant. `test-reviewer-api.py` makes a real paid connectivity request. `pilot-hosted-reviewer.py` reads real sources and makes a paid model request. None is a CI check or an automatically approved rerun. Before further live execution, review the precise scope, recorded consent and remaining gates above.

The Google Doc remains the master organization playbook. This readiness record changes no taxonomy or Gmail handling authority.
