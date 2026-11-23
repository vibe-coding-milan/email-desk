# Decision Show — revision 4 design QA

final result: passed

## Source and comparison

The selected third concept remains the identity/task-focus source. Milan’s latest explicit feedback authorizes the compact layout, styled inline controls, independent classic mode and read-only history. Baselines were captured in this review before editing: `qa/revision-4/01-before-game.jpg`, `02-before-classic.jpg`, `03-before-history.jpg`.

Final rendered implementation: `04-after-game.jpg`, `05-after-classic.jpg`, `06-after-history.jpg` in the same directory. All six are 1366 × 768 pixels, at 1366 × 768 CSS viewport and 1× density, with the initial fictional dataset (80 XP). No scaling normalization needed.

Combined full-view comparisons: `game-comparison.jpg`, `classic-comparison.jpg`, `history-comparison.jpg`. Focused equal-scale card comparison: `card-comparison.jpg` (metadata, type hierarchy, source and control regions); its baseline cannot show below-fold controls that were outside the original viewport. These combined inputs were opened and inspected, not inferred from code.

Additional current evidence: `07-label-menu.jpg`, `09-after-mobile.jpg`, `10-mobile-picker.jpg`, `11-mobile-classic.jpg`. Mobile viewport is 320 × 844 CSS pixels; full-page captures intentionally exceed viewport height. `08-mobile-before-fix.jpg` records the initial overlap finding.

## Findings / iteration history

- P1: classic Review item forced entry into game mode. Replaced with independent per-item decisions and inline editing. Browser acceptance confirmed Handled, Pass, Not important, Guidance save, topic change and attention reassignment all remain in Classic view. Back from history restores that mode.
- P2: game actions below fold. At 1366 × 768 baseline task starts at 445.2 px and decisions end at 958.1 px. Final task starts at 246.5 px, decisions end at 682.1 px, at scrollY 0. The entire initial card/decision row now fits above fold.
- P2: generic native label picker and weak inner visual identity. Introduced a custom pixel-styled popover, matching captions and selected attention buttons. Popover height is independent of the card; measured 342.094 px before and after selection. Keyboard acceptance includes ArrowDown, End, Enter, Escape, correct selected label and scrolling the last option into view (menu scrollTop 48).
- P2: narrow layout initially let the robot overlap the waiting count/round summary. Moved waiting count into the mode heading and reserved space beside the robot for summary text. `09-after-mobile.jpg` and `10-mobile-picker.jpg` show post-fix spacing and usable overlay, no horizontal overflow.
- Settled history now has no Reopen buttons or mutation handler. Year/month/day grouping retained, with matching pixel headers, completion marks and XP badges. Immediate Undo remains in working modes only, not in history.
- Final combined full/focused comparisons show no remaining actionable P0/P1/P2 issues.

## Required fidelity surfaces

- Typography: Inter body and Silkscreen supporting UI retained. Generic hero removed; 34 px desktop subject and 25–27 px phone subject dominate. Controls have consistent labelled pixel framing; Guidance stays readable in Inter.
- Spacing/layout: short shared status rail and compact mode/queue bar replace broad centered sections. Classification/topic and Guidance are grouped within the card. Classic columns provide direct outcomes and local editing. History is denser, read-only and date-grouped.
- Colors/tokens: original offwhite, ink, blue, peach, lavender and stepped-frame token preserved across all modes. Custom picker includes clear focus/selected states and a rotating caret. Status colors never stand alone without text.
- Imagery/icons: existing real raster host/timeline robot and four-frame sprite retained; Phosphor supplies control icons. No new raster generation, placeholder art, invented illustration or remote animation service.
- Copy/content: no “What’s your next move?” hero or Decision Show banner; concise Needs action/Focus round context and stable Item N of M remain. Waiting count is separate from round capacity. Dates, available XP, source action and archive meaning are retained. History is explicitly settled.

## Verification

- Twelve Node tests pass, including a 1,000-item backlog capped at five and classic outcomes using the same XP/inbox resolver without round state.
- Production client build passes.
- In-app browser warning/error logs empty.
- Classic: initial handling changed XP 80 → 90 while h1 remained Classic view. Reclassification changed columns from 4/2 to 3/3 without changing 90 XP. Passing and simulated archival stayed in classic view. Guidance/label save worked in the item.
- History: no Reopen control; records remain unchanged on read. Back to desk returned to Classic view.
- Picker: full displayed labels, selected-state marker, arrow navigation, End, Enter, Escape and local scroll verified. Selection does not resize card.
- Narrow screen: game and classic editing tested with scrollWidth equal to 320 CSS px; fixed game decisions remain visible; classic decision minimum height 44 px. Dropdown overlays fit the viewport.
- Weekday/weekend/DST and 10/5 XP tests retained; existing Motion/confetti/reduced-motion integration unchanged.

## Limits / follow-up

This is a fictional browser-memory prototype. Physical-device keyboard, full screen-reader support, durable storage, real mailbox actions and production integration remain separate acceptance. Small secondary text and celebration intensity can receive further user tuning; there are no known blocking visual findings. The live app and its private reviewer were not changed.
