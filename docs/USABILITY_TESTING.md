# Using and refining 0.5.1

Use [Email Desk](https://mijatovic.com/email-desk/) during your normal day. Choose **Milan sign in** for the real board. The public **Play the demo** uses fictional messages; its notes, decisions and XP reset on reload.

Start with ordinary work rather than trying every control. Notice whether you can quickly identify what needs action, open the original email, record a decision, and find it again in History. When a card needs correction, try the bucket choice, label search or a note. Save context preserves its status; Handled/Dismiss include current edits. Reopen returns a decision to the board without awarding XP again.

The small card meter shows time left in the 48-hour 10-XP window. After that target, an amber “Past 48h” pill replaces the meter; later first decisions earn 5 XP. This is a board target, not a sender deadline. Friendly sender names appear when available; hover over a name for the full original sender. The review timeline reports saved publication results. A code release does not start an inbox review. Handling a card never sends, archives, deletes or marks email read.

The hosted reviewer schedule is active on DreamHost. Recent coverage, historical catch-up and actual scheduled publication are distinct. The board shows recent health; expand it for account coverage. Open **System** for saved review outcomes, usage, pending feedback and the master source. Reading System never starts a review. Historical records without trigger/slot metadata remain unverified for scheduled checkpoints; slots before activation are labelled separately. A manual publication can update freshness without satisfying a scheduled slot.

Use **History** to find decisions by subject, sender, label or note, filter handled/dismissed, or select a first-decision date. Reopen returns the card to Board without another XP award. **Sign out** sits outside Appearance. The focused owner sign-in is separate from the public landing page.

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
