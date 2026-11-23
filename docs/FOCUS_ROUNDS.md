# Focus rounds and achievements — 0.7.0

November 23, 2026. This is the implementation record for the selected game direction and its five rounds of feedback. Email Desk remains the name; “Inbox Quest” was only a suggestion, not an adopted rename.

## Decisions carried into production

Sign-in opens a finite round of up to five Needs action items, one at a time. Item N of M and a maximum of five blocks remain stable during that round; a separate waiting count represents the full backlog. A completed action round offers Worth knowing, another round, or Classic view. End round opens Classic. Classic supports decisions and inline editing without navigating back into game mode. Both modes share the same saved cards and awards.

The compact header retains the robot’s New York review route and XP-to-next-level meter. Actual scheduled run identity and typed coverage determine checkpoint captions; time passing cannot manufacture a successful review. Weekdays use 9 AM, 1 PM and 5:30 PM, weekends 9 AM and 5:30 PM, with DST. Failed, stale, ongoing and unconfirmed coverage remains visible. The November 23 monitoring chat reported a personal Gmail verification issue at midday; deployment does not resolve or hide it.

The pixel frame now extends to attention choices, the handcrafted topic-label popover, Guidance, available XP and history. Guidance and all 37 shared labels are editable inline, with multiple labels retained. The popover overlays rather than expanding the card, rotates its caret and supports keyboard navigation. A source link opens the actual conversation in the correct Google account. Receipt date, source deadlines, reviewer reason and unresolved questions remain available. Available XP uses the server’s original attention-start clock, without redundant target prose.

Pass moves an open item to the back of the shared queue, with no date picker, archive or XP. Guidance and label changes made before a decision are saved with it. A failed or conflicting save retains the draft and does not advance the round. Reload latest board offers explicit recovery. Server operation IDs deduplicate ambiguous retries. Concurrent edits remain revision-checked.

Handled (Noted for Worth knowing) and Not important now explicitly request archiving of the exact reviewed message IDs. The button subtitles explain this. This supersedes the earlier prototype’s inbox-preserving Handled behavior and follows the separate archive discussion. Prior decisions are **not** retroactively archived. No deletion, unsubscribe, sender-wide rule, sending, star or read-state change is introduced.

## Archive contract

The authenticated decision, feedback request, server XP award and content-free achievement event save in one Store transaction. History shows Archive pending until the next existing scheduled reviewer processes the request. There is no new cron job or permission expansion. The existing gmail.modify grant suffices. Routine model classifications still cannot archive mail.

The worker uses the recorded account and individual reviewed message IDs, never a whole-thread archive call. It verifies thread membership and the exact preservation of every label except INBOX, including unknown custom labels, unread state and stars. New replies outside the reviewed set remain untouched. A superseding owner decision or reopened card cancels the old request. An acknowledgement must supply the exact verified IDs before Store displays Archived.

Archive writes are journaled before Gmail mutation. If a response is lost, retry can confirm that Inbox is absent, but cannot issue a second removal when Inbox is present again. That ambiguous write or deliberate inbox return remains a visible error for review. Combined label-correction/archive replay verifies the corrected labels without rerunning an earlier label write whose protected Inbox state has since legitimately changed. No old feedback payload is enriched with an archive request.

Immediate Undo is available in the current game/classic session, before a worker claim or newer revision. Before any archive write, the reviewer atomically claims the current revision through the existing acknowledgement endpoint; that revision change closes Undo before Gmail work begins. Interrupted processing remains queued for read-back recovery. It cancels the pending decision, restores card context and appends a compensating achievement event. Already-earned XP stays frozen, consistent with the existing once-per-card policy. Undo after the worker claim or confirmed archival is refused; this release does not implement restoring Gmail placement. History itself is read-only and grouped by decision month/year and New York day, without search or Reopen controls. Backend materially-new-request reopening remains intact.

## Achievements

Four modest milestones share one ledger across game and classic:

| Achievement | Requirement |
| --- | --- |
| First move | Handle a Needs action obligation |
| Loose end tied | Pass an action obligation, then return and handle it |
| Five forward | Handle five different action obligations |
| Steady progress | Handle action obligations on three New York dates; no consecutive streak |

Pass, Not important, Worth knowing, label correction and Guidance edits do not advance these handling milestones. Existing XP semantics remain 10 within 48 elapsed hours, 5 afterward, once per card; achievements award no bonus XP. An existing card’s earned award is never recalculated. Tracking starts at this release; historical decisions and existing XP do not fabricate progress.

Server-authored version-1 events contain operation ID, timestamp, opaque obligation identity, category, outcome and mode. They contain no subject, body, account, labels or Guidance. A materially reopened request increments its obligation generation, allowing renewed follow-through without blocking reopening or awarding XP again. Events, unlock provenance and the optional Celebrate unlocks preference persist in encrypted owner metadata outside web root. Unlocks are derived with versioned rules. Undo appends a compensating event rather than deleting the audit trail. Suppressing celebrations retains progress.

Motion uses locally bundled Motion, canvas-confetti and the existing drawn robot frames. Card transitions, XP fill/pop, level-up and delayed nonmodal milestone notices provide feedback after confirmed saves. Reduced-motion preference suppresses decorative motion. There are no external UI/CDN/API requests, sound, time pressure, streak penalties or achievement bonus points.

## Architecture and retained work

The existing PHP authentication, encrypted Store, reviewer, Google Doc master, revision checks, source chronology, audit history and shared board remain. React/Motion render the selected game UI in an isolated shadow tree; the established welcome, sign-in and private System screens remain available. `frontend/` is editable source. `npm ci && npm run build` deterministically generates the existing public/app.js and public/styles.css release files; CI refuses a mismatch. The DreamHost allowlist and restricted deployment access do not expand.

The public demo uses fictional browser-memory cards and resets on reload. Its progress is not private progress or evidence of live coverage. The original exploration remains under prototypes/decision-show; its documentation describes the earlier snapshot and is superseded by this production contract.

Related work reviewed for reconciliation: **Explore lightweight app enhancements** delivered 0.6.1 Guidance and scoped related-thread retrieval; **Assess archiving handled emails** established exact reviewed-message, new-reply and inbox-return safeguards; **Update Email Desk scheduled task** reported the midday verification issue. Existing review-status, API-usage/cost, custom-label and hosted-reviewer work remains in the release baseline. New per-run processing counters, weekly comparisons, a rename, prompt archive processing between scheduled reviews, archive restoration, and automatic resurfacing solely because an old message returns to Inbox remain future work. No master-playbook cutover or blanket archival rule is adopted.

## Acceptance

See design-qa.md and HANDOFF.md for the final source/CI/deployment evidence. Local tests cover finite queues, original XP chronology, multiple labels, API payload boundaries and ambiguous retry identities; versioned achievement tests cover thresholds, New York dates/DST, deduplication and Undo. PHP checks cover atomic save/event/award behavior, persistence, conflicts, archive acknowledgement requirements and Undo refusal after worker confirmation. Worker fictional checks cover both accounts, exact-message mutation, retained system/custom labels, uncertain read-back, inbox return and thread mismatch. Production verification uses read-only saved-state comparisons and the public fictional demo; it does not manufacture decisions against real mail.

Cross-device persistence is provided by the server contract; physical-device use and controlled real archive actions in each account remain user acceptance. The existing Mac-offline scheduled-review test remains pending. Release deployment alone does not establish either result.
