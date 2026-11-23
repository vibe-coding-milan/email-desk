# Guidance in Email Desk — 0.6.1

## Current 0.7.0 contract

Website and matching worker installed and independently verified from PR #24 / functional merge `198fd3e7e16b357a7356f00a9cfafbb07cd46535`. All eight worker files, startup and 36 fictional checks passed, with credentials, encrypted state and cron preserved; installation made zero mailbox/model calls. Real-mail archive outcomes remain scheduled/user acceptance. See HANDOFF.md for the exact website receipt and retained final-connection workflow timeout.

[Focus rounds and achievements](FOCUS_ROUNDS.md) supersedes older interface/history and inbox-preserving completion notes below. Only new explicit owner Handled/Not important decisions request exact-reviewed-message archival. Classifier proposals still cannot archive; pending legacy feedback is unchanged. Guidance retrieval, new-request reopening, 10/5 once-per-card XP and existing custom-label verification remain. The worker archives on the existing schedule, with encrypted write-ahead journaling and exact-message verification. No new scopes, cron, credentials or master change. Immediate Undo ends at a newer revision/worker acknowledgement; it does not restore archived Gmail placement.


## Everyday review

The board stays Needs action and Worth knowing. Cards offer Open email, Done and Guidance. The existing optional panel contains Attention (Needs action, Worth knowing, Not important), one editable Guidance field, Change labels and the existing Save button. Close stays visible and desktop board scrolling stays available. There is no guidance dashboard, rule builder, note timeline or extra navigation.

Guidance asks: “What should I remember when sorting emails like this?” It is for relationship facts and sorting preferences, not personal note-taking. For example: “This contractor handles our family property. Approval requests need attention; routine progress photos are worth knowing.” Save replaces the current statement. Opening or closing the panel does not require an edit. Done, Not important, later summaries and resurfacing retain saved guidance. Existing text is preserved exactly, without automatic rewriting or a schema migration. Earlier machine-summary snapshots remain stored but are no longer displayed in this panel.

## How future reviews use guidance

The current thread supplies its saved owner guidance through its existing card. For other conversations, the private reviewer retrieves at most three whole, deduplicated guidance entries, up to 26,000 JSON bytes in total. Candidate matching uses an exact non-owner correspondent address or at least two substantive shared words from the saved subject/guidance and current message content. Display names, shared owner addresses, topic labels and handled/dismissed states alone cannot establish a match. Both accounts share this memory.

Retrieved entries are candidates, not rules. The model must verify the actual relationship, project and message purpose, distinguish durable facts from old task progress, and apply guidance only where relevant. A one-off dismissal or completed task is not a sender-wide preference. Existing taxonomy, source/revision checks, exact-message label verification, reopening restrictions and mail-action boundaries still apply. No model rewrites guidance or changes the master playbook. Clearing a statement removes that card from future related-guidance retrieval; historical audit events remain preserved.

This is bounded contextual memory supplied during review, not model-weight training or a guarantee of perfect classification. Matching can miss a relationship when the sender and subject vocabulary both change. More saved text does not automatically mean better routing. System explains these limits; everyday triage stays uncluttered. The live Google Doc remains the master, with Markdown as a reference snapshot.

## Labeling, decisions and safe editing

Change labels retains the approved 37-label vocabulary, selected first, without label search/counts. Save queues exact-message custom-label corrections; applied status requires verified Gmail read-back. Done records handled, Not important records dismissed history, and neither sends, archives nor changes system labels. Editing guidance on a closed card does not reopen it or award more XP. History retains explicit Reopen.

Draft retention, visible Save errors, idempotent retry and revision checks are unchanged. A conflicting save preserves the draft and offers Discard draft & load latest. Stored private card/feedback payloads remain encrypted. The public demo uses the same wording with fictional browser-memory state; it does not perform classification or teach the private reviewer.

## Live testing

1. Open Guidance. Confirm the saved statement and the prompt explain future sorting, with no notes timeline or new navigation.
2. Edit guidance intentionally, Save, close and reopen. Confirm the statement persists. Leave it unchanged when there is nothing to teach.
3. Done/Not important and later resurfacing must retain guidance. Guidance edits in History must not reopen the card or duplicate XP.
4. Change labels retains explicit correction. Check System for later verification; a saved statement is not proof a future review has applied it.
5. After a future scheduled review, inspect a related new conversation and an unrelated one. Confirm the guidance helps where applicable without creating a blanket sender rule.

Source tests verify retrieval, bounds, preservation and actual delivery to the classifier with fictional data. Host installation/health and website acceptance are separate from observing model relevance on future real mail. Release acceptance is recorded in the release PR and HANDOFF; do not manufacture production email or decisions for QA.
