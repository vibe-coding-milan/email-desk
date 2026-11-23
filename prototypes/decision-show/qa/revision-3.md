# Decision Show — revision 3 QA

final result: passed

## Reference and evidence

Source: selected third concept in `reference.png`, followed by the accepted revision-2 prototype and Milan’s latest specific feedback. `qa/revision-2/preview.jpg` and current `qa/revision-3/desktop.jpg` both show the same first shelf task, item 1 of 5, zero new decisions, 80 fictional XP. Both are 1440 × 1024 pixels at a 1440 × 1024 CSS viewport, 1×; no density normalization required. Combined full comparison: `qa/revision-3/comparison.jpg`. Focused card comparison: `qa/revision-3/card-comparison.jpg`.

Additional evidence: `qa/revision-3/label-picker.jpg` (native picker open) and `qa/revision-3/narrow.jpg` (320 × 844 CSS viewport, full-page capture). Prior QA is retained in `qa/revision-2.md` and `qa/revision-1.md`.

## Changes and visual findings

- Card now reuses the existing production stylesheet’s stepped-frame token and layered border treatment, with inset peach trim and lavender offset shadow. This is existing code-native UI styling; no new illustration asset was invented. The XP badge and Attention label use the established pixel type; sender, task, summary and editing text remain readable Inter.
- Outcome totals and Undo moved directly beneath the queue count/blocks. The disconnected bottom totals were removed. Complete-round Undo remains next to the round’s outcome summary.
- Expanding Change labels disclosure replaced with a compact native Label select. Options open in the system picker without adding card content. Save changes commits both label and Guidance drafts.
- Date now shows only the source date. XP calculations and awards are unchanged. Handled retains its completion semantics, and its tooltip says the email stays in the inbox. Not important retains Archive from inbox copy.
- Initial narrow comparison exposed the mascot antenna overlapping relocated totals. Fixed by increasing mobile space above the task. Post-fix `narrow.jpg` shows separate totals and mascot, with all three actions still visible at the bottom.
- No unresolved P0/P1/P2 visual or interaction findings after the final combined full and focused comparisons.

## Required fidelity surfaces

Typography: retained local Inter and Silkscreen, unchanged 40 px desktop task and 26–28 px phone task; pixel treatment confined to frame/supporting UI. Layout: task prominence and large three-action row preserved; related progress information grouped. Colors: existing offwhite/blue/peach/lavender/ink tokens retained. Images/icons: existing raster robots and Phosphor icons retained; no new raster generation or placeholder art. Copy: removed redundant target wording, kept explicit archive action, retained original task/source text.

## Verification

- Label selection and Save changes preserve exact card height: 400.898 px desktop, 545.828 px at 320 px width. Opening the native dropdown shows an overlay instead of growing the card. Long label text remains within the control.
- Label saved as Education, then Pass and the relocated Undo restored the same item with Education retained; counts returned to zero and XP stayed at 80.
- At 320 px document scroll width equals viewport width, with no horizontal overflow. The native label select, Save changes and fixed decisions remain usable.
- Existing timeline robot, XP meter, task robot, transition/award effects, classic exit and date-grouped history remain intact. This revision does not change game state, awards or Gmail behavior.
- Ten existing meaningful state/XP/queue/schedule/history tests pass. Production client build passes. Browser warning/error log is empty.

## Limits

This remains a fictional browser-memory prototype. No production publication, Gmail mutation or backend change occurred. Handled does not archive. Physical-device soft-keyboard and screen-reader acceptance remain untested. Fine motion tuning remains available after Milan’s next review.
