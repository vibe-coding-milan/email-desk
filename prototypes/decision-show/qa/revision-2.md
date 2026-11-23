# Decision Show — revision 2 QA

final result: passed

## Visual truth and evidence

The selected third mock (`reference.png`, 1487 × 1058) remains the identity/task-focus reference, with Milan’s November 23 follow-up explicitly superseding its Later modal, reassurance copy, hidden Guidance, missing review/XP progression and lack of motion. This is a scoped functional revision, not a pixel clone of the earlier mock.

- Current comparison: `qa/revision-2/desktop.jpg`, 1440 × 1024 pixels / CSS viewport, 1×, garden task, item 3 of 5, one handled / one passed. Source normalized to 1440 × 1024.
- Combined source/implementation: `qa/revision-2/comparison.jpg`. Focused task/inline editor comparison: `qa/revision-2/task-comparison.jpg`. Subject/sender/body/round position match; restored status rail and inline editor are intentional requested additions.
- Additional evidence: `initial.jpg`, `classic.jpg`, `history.jpg`, `weekend.jpg`, `reward.jpg`, `level-up.jpg`, `mobile.jpg`, `narrow-inline.jpg`, `narrow-after-pass.jpg`, all under `qa/revision-2/`.
- Desktop viewport 1440 × 1024; phone 390 × 844; narrow phone 320 × 844. Full-page captures exceed viewport height intentionally. Native browser screenshots are JPEG.

## Findings and fixes

- P2: the first revision hid Guidance and attention behind a dialog and made Pass ask for a return date. Removed dialogs; Attention, Guidance and labels are inside the card. Pass now advances once and moves the open card to the queue’s end.
- P2: level progress, existing age-based awards and the daily review route were missing. Restored the 10/5 XP boundary, persistent meter and New York weekday/weekend timeline. Verified three-slot and two-slot states.
- P2: inline content put phone decisions below the first viewport. A fixed bottom action row now keeps all three decisions reachable while reading/editing. At 390 and 320 px, no horizontal document overflow; all actions fit within the 844 px viewport.
- P2: after deciding from lower in a long mobile card, the next task could remain scrolled past its subject. Added a mobile-only scroll-to-card on transition completion. Post-fix `narrow-after-pass.jpg`: task top 65 CSS px, subject and inline controls visible; decisions remain at the bottom.
- The source’s larger empty-space/title scale was deliberately tightened to accommodate the requested status and inline content. The task subject (40 px desktop) remains larger than the generic round heading (37 px).
- No unresolved P0/P1/P2 findings after the final full/focused visual comparisons and responsive interaction pass.

## Required fidelity surfaces

- Typography: local Inter/Silkscreen retained, readable task hierarchy, 40 px desktop subject, 26–28 px phone subject, compact subordinate controls. No clipped task text; narrow Not important wraps within its usable control.
- Layout: original single peach task and three explicit outcomes retained. Inline form is secondary below a divider. Timeline/XP share a quiet top rail. Desktop controls, task and progress fit the frame; mobile content scrolls above a visible decision row.
- Colors: original offwhite #faf9f5, blue #3046f3, peach #ffebd8, ink #171719 and lavender accents retained. Selected attention and keyboard focus are clear.
- Imagery/icons: generated transparent raster host and existing four-frame robot art, Phosphor interface icons, actual library-generated confetti. No replacement ASCII, emoji or handmade illustration. Animation is event-triggered and finite.
- Copy: removed reassurance sentence, Later/date language and search. Pass, Not important / Archive from inbox, inline Attention/Guidance, End round/classic return and daily grouped history reflect the latest instructions. No unsubscribe or delete claim.

## Interaction and behavior acceptance

In-app browser checks:
- Guidance saved inline, fictional source expanded inline, with no dialog or completion side effect.
- Pass advanced Item 1 → 2, kept 80 XP unchanged, and retained the exact Guidance when re-entering the passed item from classic view.
- Old poster earned +5 XP; fresh garden earned +10 XP. Level 1 95/100 crossed to Level 2 5/100 with a visible celebration, sprite and confetti (`level-up.jpg`).
- Five-item round ended with 3 handled / 1 not important / 1 passed and +35 XP. Not important item appeared in history as Inbox archived and was absent from classic active columns.
- End round opened classic view, with passed work present. Review item re-entered the task at that item. Separate Worth knowing round remains available after action round completion.
- Inline attention change advanced without XP; Undo restored the prior category, item, saved Guidance and XP.
- History groups year → month → day, with no search. Weekday timeline has 9 AM, 1 PM, 5:30 PM; weekend has 9 AM, 5:30 PM.
- 320 px inline editing and attention reassignment worked without horizontal overflow. All three fixed actions remain reachable; post-decision scrolling exposes the next task.
- Browser warning/error logs empty during acceptance. Source explicitly uses reduced-motion settings for Motion, confetti and raster sprite; physical OS preference switching was not exercised.
- Ten meaningful Node tests pass: finite shared-account rounds, zero-XP queue passes, preserved inbox on handling, simulated archival on Not important, frozen single awards, exact 48-hour boundary, Guidance preservation, category changes, weekday/weekend/DST schedule and archive grouping.
- Production build passes. No production API, reviewer, Gmail, credential, schedule or deployment changes occurred.

## Remaining limits / P3

- Stepped mock corners remain simple restrained borders, as in the first prototype. The new inline fields and restored status intentionally change card height and proportions.
- No physical-device soft-keyboard or screen-reader test. The browser-memory demo cannot establish live archive behavior, backend revisions, authentication, durable audit history or cross-device state.
- Animation timing/celebration intensity are adjustable after Milan tries the revised loop. Weekly metrics/achievements are not part of this revision.
