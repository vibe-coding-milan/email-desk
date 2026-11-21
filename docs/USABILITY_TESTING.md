# Using and refining 0.4.1

Use [Email Desk](https://mijatovic.com/email-desk/) during your normal day. Choose **Milan sign in** for the real board. The public **Play the demo** uses fictional messages; its notes, decisions and XP reset on reload.

Start with ordinary work rather than trying every control. Notice whether you can quickly identify what needs action, open the original email, record a decision, and find it again in History. When a card needs correction, try the bucket choice, label search or a note. Save context preserves its status; Handled/Dismiss include current edits. Reopen returns a decision to the board without awarding XP again.

The small card meter shows time left in the 48-hour 10-XP window. After that target, an amber “Past 48h” pill replaces the meter; later first decisions earn 5 XP. This is a board target, not a sender deadline. Friendly sender names appear when available; hover over a name for the full original sender. The review timeline reports saved publication results. A code release does not start an inbox review. Handling a card never sends, archives, deletes or marks email read.

The proposed offline reviewer is not activated. Its first read-only pilot changed no cards, labels or review checkpoints, so it should not create a new update marker on the live timeline. See [hosted reviewer readiness](HOSTED_REVIEWER.md) for measured usage and the remaining schedule checks. Report missing or partial real reviews as observed; a successful prototype or code deployment does not make those gaps successful.

For useful feedback, a short note is enough:

- **Where:** landing page, board, details, labels or History; device/browser and light/dark theme if relevant.
- **Trying to do:** the task in your own words.
- **Expected / happened:** what you thought the control would do and what it did.
- **Friction:** hesitation, extra steps, unclear wording, cramped layout or decoration that gets in the way.

Keep private email text and screenshots out of public GitHub issues. Share only the minimum context needed to explain the problem. Future refinements should be based on use; the current release does not change the organization playbook or reviewer schedule.

Desktop responsive browser QA is recorded in [design-qa.md](../design-qa.md). Physical-device use, cross-device continuity and long-term review reliability need observations from actual use; simulated viewport checks do not establish them.

## Hosted-reviewer follow-up

After the replacement reviewer passes hosted acceptance, review whether the board makes both-mailbox freshness, the latest verified result, the next New York review slot and partial/missed/error states understandable on desktop and mobile. Distinguish unfinished historical catch-up from a failed current scan. Check whether any necessary recovery step is clear. Preserve the two buckets and verify 0.4.1's friendly sender names and quiet amber past-target treatment with real hosted summaries. Record observed issues before choosing UI changes; this follow-up is planned, not completed.
