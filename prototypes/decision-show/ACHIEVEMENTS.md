# Achievement groundwork

Implemented in the fictional local prototype only. Live Email Desk, its database/API, reviewer and Gmail behavior have not changed. Progress and preferences remain in browser memory and reset on reload.

## Product rules, version 1

| Stable ID | Milestone | Qualifying evidence |
| --- | --- | --- |
| `first-move` | First move | One confirmed owner-handled Needs action card after tracking begins. |
| `loose-end` | Loose end tied | A confirmed action-card pass followed by handling that same card. |
| `five-forward` | Five forward | Five distinct handled action-card IDs. |
| `steady-progress` | Steady progress | Handled action cards on three distinct America/New_York calendar dates, with no consecutive-day requirement. |

The rules are the same in game and classic modes. Opening email, passing, dismissing as Not important, changing attention/labels, saving Guidance, and noting Worth knowing do not advance these handling milestones. Those actions keep their existing independent XP and card semantics: a dismissal/awareness decision may still earn normal XP. Achievements themselves never add XP or alter Gmail.

Milestones begin at a tracking boundary. The eight fictional historical cards and their 80 XP are not silently reinterpreted as achievement evidence. Production should begin from an explicit activation timestamp; historical backfill is a separate, reviewable choice.

Unlock celebrations can be disabled without disabling progress. A small notice follows the ordinary XP animation; it does not interrupt the queue, add another confetti burst, or require acknowledgement. Multiple pending unlocks can share a notice. Immediate Undo cancels related pending notices and reverses the latest decision’s contributions. Settled history remains read-only.

## Event contract

`src/achievements.mjs` contains the versioned definitions, strict event normalizer, idempotent append function and deterministic projection. The ledger is JSON-serializable:

```json
{
  "schemaVersion": 1,
  "events": [
    {"id":"operation-1","type":"decision","at":"2026-11-23T16:20:00.000Z","cardId":"opaque-card-id","category":"action","outcome":"handled","mode":"round"},
    {"id":"operation-2","type":"undo","at":"2026-11-23T16:21:00.000Z","targetId":"operation-1"}
  ]
}
```

Decision fields: opaque operation/event ID, server time, opaque card ID, category at the decision, outcome (`handled`, `dismissed`, `pass`), and presentation mode (`round`, `classic`). Undo names its target decision. No subject, sender, account email, message body, Guidance, label text or model output belongs in this event shape. Unknown fields and unsupported schema versions fail validation.

Replaying an identical ID/content pair is a no-op. Reusing an ID with different content fails. A settled card cannot count again under a different ID; an immediate Undo voids the prior contribution and permits a genuine replacement decision. Undo appends an event, preserving the previous record; it never erases the event log. Older active decisions cannot be targeted by an immediate Undo.

The projection returns capped progress, unlocked status, the first crossing event/time and rule version. Replaying schema-1 events against unchanged version-1 rules yields the same milestones. Definitions with awarded progress must not be silently redefined; a future rule change needs a new version/ID and explicit migration policy.

## Proposed live integration — not implemented

1. Derive event fields from the authenticated, revision-checked, confirmed Store decision, never from arbitrary client achievement claims. Append with the same deduplicated operation ID, inside the same transaction as the card/feedback/XP write. Failed or conflicting writes must emit no event.
2. Persist the ledger or indexed equivalent in encrypted owner state outside the web root. Keep IDs private, retain the existing audit records, and enforce uniqueness per owner/operation. Card summaries and reviewer upserts must not create duplicate milestone evidence.
3. Materialize versioned unlock records if needed for efficient reads. Keep definitions and unlock provenance so retries, time-zone boundaries, device changes and future rule versions are reproducible. Expose authenticated read-only progress plus an owner preference for unlock celebrations.
4. Do not replace the existing materially-new-request reopening contract. Schema 1 deliberately models distinct-card milestones and immediate Undo. Before tracking repeated obligations on one thread/card, define an explicit obligation-generation identity compatible with the Store’s reopen policy; retain existing once-per-card XP behavior. This needs a reviewed integration decision, not an inferred reviewer change.
5. Test rollback/retry, concurrent clients, failed saves, immediate Undo, timeline/reviewer updates, schema migration and restored backups before publication. No new Gmail scopes, scheduled reviewer, credential, deployment target or master-playbook change is required by this prototype.

The event seam also makes later weekly counts possible without guessing from a mutable card `updated_at`. No weekly score, streak, leaderboard, automated action, response-verification claim or achievement backfill is implemented.

## Verification

Twenty-five tests cover the existing queue/XP/schedule rules plus milestone activation, both modes, pass provenance, unique cards, idempotency/conflicting IDs, append-only Undo, threshold rollback, New York midnight/DST, schema fields and JSON round trips. Browser checks cover the XP affordance, unlock notice, immediate Undo, classic-mode return milestone, disabled celebrations, progress view and narrow layout. See `design-qa.md` and `qa/revision-5/`.
