# Using and refining 0.7.1

Use [Email Desk](https://mijatovic.com/email-desk/) during your normal day. Choose **Milan sign in** for the real board. The public **Play the demo** uses fictional messages; its Guidance, decisions and XP reset on reload.

Sign-in starts a round of up to five Needs action items. End round opens Classic; both modes share saved cards, Guidance, labels and decisions. Worth knowing is a separate attention category, not completed history.

Choosing Needs action or Worth knowing prepares a category change and keeps the current card visible. The destination is selected and a status says the item will stay open. **Move & continue** saves the category, Guidance and label edits and then advances, without archival, XP or achievement progress. **Cancel category change** restores the saved category while keeping other edits. Switching between game and Classic preserves drafts; reload discards edits that were never submitted. Saved moves survive reload and appear in the corresponding Classic column.

**Handled / Noted** explicitly completes the item; **Not important** dismisses it. Both save pending edits and request archiving of the exact reviewed messages at the next existing scheduled review. **Pass** also saves pending edits and leaves the item open at the back of the queue, without archival or XP. Guidance and label changes can use **Save changes** when no category move is pending. While a move is pending, Move & continue or a decision saves all edits together. The completion button follows the selected category, and moved items have their own round count. Failed saves retain the draft and do not advance.

A first handled/dismissed decision earns 10 XP within 48 elapsed hours of the original attention date and 5 afterward. Moving and passing earn no XP; already-earned XP is retained. This is a board target, not a sender deadline. No email is sent, deleted or marked read. Gmail archival is confirmed separately from a saved board decision.

The hosted reviewer schedule is active on DreamHost. Recent coverage, historical catch-up and actual scheduled publication are distinct. The board shows recent health; expand it for account coverage. Open **System** for saved review outcomes, usage, pending feedback and the master source. Reading System never starts a review. Historical records without trigger/slot metadata remain unverified for scheduled checkpoints; slots before activation are labelled separately. A manual publication can update freshness without satisfying a scheduled slot.

Use **History** for read-only decisions grouped by year, month and New York day, including saved Guidance and pending/verified archive status. There are no History search, filter or Reopen controls in the current game interface. Immediate Undo is available only in the current decision session before a newer revision or reviewer claim. Sign out is in the workspace header.

Usage is a private token ledger with 7/30/90-day and work-type filters. Costs use dated model rates and include returned paid usage even on incomplete/unverified responses. Unknown requests/rates are labelled; old work is legacy/unclassified. Neither the initial funding amount nor a monthly forecast is shown as a balance. Actual hosted scheduled publications are verified; Mac-offline acceptance remains pending.

For useful feedback, a short note is enough:

- **Where:** landing page, board, details, labels or History; device/browser and light/dark theme if relevant.
- **Trying to do:** the task in your own words.
- **Expected / happened:** what you thought the control would do and what it did.
- **Friction:** hesitation, extra steps, unclear wording, cramped layout or decoration that gets in the way.

Keep private email text and screenshots out of public GitHub issues. Share only the minimum context needed to explain the problem. Future refinements should be based on use; the current release does not change the organization playbook or reviewer schedule.

Desktop responsive browser QA is recorded in [design-qa.md](../design-qa.md). Physical-device use, cross-device continuity and long-term review reliability need observations from actual use; simulated viewport checks do not establish them.

## Reading review status

- **Updated:** both recent inbox scans completed.
- **Older mail review ongoing:** a separate, neutral description of unfinished historical work, supported by the reporting snapshot.
- **Review ongoing:** recent mail still being processed.
- **Needs attention:** a recorded error requires attention.
- **Coverage unconfirmed:** the app lacks enough evidence to confirm coverage.

A review can finish late and still complete both recent scans. Read its actual publication time separately from the planned slot. Manual or intermediate publications do not satisfy scheduled checkpoints. Stored partial values remain audit data; they are not a blanket user-facing failure label. See [the current status guide](REVIEW_STATUS.md).

## Hosted-reviewer follow-up

The broad recent/historical status ambiguity was addressed in 0.5.0 and refined consistently across the timeline, Board and System in 0.5.1. Continue checking whether actual start/completion times, missed/error results and recovery are clear during ordinary use. Record repeated dispatcher delays separately from coverage. Physical-device, screen-reader, cross-device and Mac-offline acceptance still need direct evidence. Preserve the two buckets, friendly sender names and quiet past-target card treatment; propose further changes from observed use.
