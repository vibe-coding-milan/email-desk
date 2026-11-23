# The simpler Email Desk — 0.6.0

## Everyday review

Cards show a sender, subject and short summary. Open email goes to the original Gmail conversation. Done records that you are finished with the card. Context opens the optional editor. The robot, pixel section headings, shared palette and brief confirmed-decision rewards retain the game-inspired character; ordinary reading and controls use Inter.

The two board columns stay Needs action and Worth knowing. Within Context, Attention offers Needs action, Worth knowing or Not important. Save commits the choice and note together. Not important moves the card to existing dismissed history rather than creating another column, archiving Gmail, or adopting a sender-wide rule. History offers explicit Reopen. Editing a closed card's note does not silently reopen it, and reopening never awards XP twice.

## Labeling is retained

The scheduled reviewer continues using the approved shared 37-label vocabulary. Change labels opens the existing explicit custom-label correction controls, with selected labels first and no search field or result counter. Save queues that exact correction using the existing revision-checked feedback path. Gmail changes are reported applied only after exact-message verification. Inbox, unread, starred and other system labels remain outside this action.

## Context and rules

Notes and decisions remain encrypted with their conversation and inform later reviews. They do not retrain model weights or silently become broad rules. The Google Doc remains the master playbook, and Markdown remains a reference snapshot. System contains the playbook link, latest reported rule fetch, feedback status and explanations of how context is used. That source information is deliberately absent from the everyday editor.

## Editor behavior

The desktop editor is nonmodal. Opening it does not shrink cards or lock board scrolling. Its labelled Close control stays outside the independently scrolling body. Escape also closes and returns focus to the originating Context control. Closing or switching cards retains the current unsaved draft in page memory; refreshing or signing out is a separate action. Small screens use the available viewport with the same persistent close header.

A conflicting save preserves the draft and exposes an explicit Discard draft & load latest action. Loading the latest replaces the local unsaved edits only after its saved-board read succeeds. Existing idempotent operation retries, authentication, encryption and revision checks remain intact.

## Status, progress and boundaries

The main review line is compact; missed scheduled slots, unconfirmed coverage and actual failures remain visible. System retains detailed run/coverage/usage reporting. Per-card timing/XP/topic chips are removed from everyday triage; earned XP and the approved 10/5 policy remain stored and available through the existing progress summary. No credit balance, per-run label count, forecast or new spending policy is inferred.

The public demo uses the same editor with invented conversations in browser memory. It cannot read or change private mail, cards, feedback or rules. The local preview server is not deployable production software.

## Live testing checklist

1. Sign in and open Context on a card. Confirm that the three attention choices and note are easy to scan.
2. Scroll a long board and an expanded Change labels list; Close should remain visible.
3. Save a small note or an intentional label correction. Inspect the saved result; actual label execution remains a later verified reviewer operation.
4. Mark a card Done or Not important, find it in History, and Reopen if desired. Existing notes and XP should remain intact.
5. Inspect phone and dark-mode layouts. Report the screen size and specific control if anything clips or feels unnecessary.

Production publication and preservation evidence are recorded in README, CHANGELOG and HANDOFF after acceptance. Local/browser checks do not establish physical-device, screen-reader, cross-device or unattended-review acceptance.
