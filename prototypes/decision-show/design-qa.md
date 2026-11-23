# Achievements foundation — revision 5 QA

final result: passed

## Target and evidence

The existing selected pixel design and compact revision-4 prototype are the visual baseline. Milan requested optional achievements or groundwork; this adds one small XP-area affordance and an Achievements view using the same design system, without replacing the decision loop.

- Existing source: `qa/revision-4/04-after-game.jpg`.
- Updated game: `qa/revision-5/07-game-affordance.jpg`, same first fictional task, 80 XP, item 1 of 5.
- Combined source/update: `qa/revision-5/game-comparison.jpg`. Both images are 1366 × 768 pixels and CSS viewport, 1×, no density normalization needed. Main actions still end at 682.094 px, unchanged from the compact baseline.
- New view: `01-achievements-empty.jpg` (zero progress); `04-classic-progress.jpg` (two unlocked, 2/5 handled, 1/3 days, celebrations off). Combined stable-state evidence: `progress-comparison.jpg`.
- Focused emblem/type/progress evidence: `badge-detail.jpg`.
- Interaction captures: `02-unlock-notice.jpg`, `03-first-unlocked.jpg`, `08-final-achievements.jpg`. Notification/exit/confetti frames are transient interaction evidence, not the stable layout reference.
- Narrow-phone evidence: `05-mobile-achievements.jpg`, `06-mobile-affordance.jpg`, at 320 × 844 CSS viewport (full-page screenshot height varies). No horizontal overflow.

The full combined game comparison, achievement states and focused badge region were opened and visually inspected. No unresolved P0/P1/P2 visual findings remain.

## Required fidelity surfaces

- Typography: local Inter/Silkscreen retained. Pixel status captions and readable milestone title/body distinguish unlocked state, requirement and progress. Existing game subject remains dominant; the new link is subordinate to XP.
- Spacing/layout: no extra main navigation item or taller desktop intro. Desktop achievement grid uses two columns; narrow phone uses one scrollable column. The compact game retains its previous above-fold decision position.
- Colors/tokens: existing ink frames, lavender offset shadows, offwhite surfaces and blue progress retained. Gold is used for earned milestones; unearned milestones say In progress rather than relying only on color or punitive copy.
- Imagery/icons: Phosphor trophy, return, list and calendar icons with consistent framed emblems. Existing robot images/sprites and XP motion are unchanged. No new raster, fake illustration or placeholder asset.
- Copy/content: four rules are explicit: first handled action, return-to-passed action, five unique handled actions, three distinct New York dates. No streak requirement, bonus XP, response verification or retroactive history claim. Details explain activation/Undo/demo reset.

## Behavior verification

- Initial fictional history/80 XP does not unlock anything: 0/4 achievements.
- First game handling produces +10 XP, First move, Five forward 1/5 and Steady progress 1/3. The small trophy notice appears after the ordinary XP reward and links to the view.
- Immediate Undo returns the milestone count to 0/4, and the prior decision remains in the internal append-only log as voided by an undo event. Rehandling correctly unlocks again without duplicate active credit.
- Passing an action item, switching explicitly into classic mode and handling it unlocks Loose end tied. Mode stays Classic view. XP goes from 90 to 95 for that older card, with no achievement bonus.
- Celebrate unlocks unchecked suppresses the notice while progress still becomes 2/4. Back to desk restores Classic view. Rechecking enables later celebrations.
- New tracking uses only versioned, content-free, deduplicated events. Unknown fields/conflicting IDs fail; Undo preserves event history and reverses its contributions. No persistence or real-mail write occurs.
- 25 tests pass: prior 12 queue/XP/schedule/backlog rules plus 13 achievement tests for mode parity, qualification, pass provenance, unique cards, retries, ID conflict, JSON serialization, append-only Undo, threshold reversal, New York dates and fall DST.
- Final client build passes, including the pending-notice deferral adjustment for continued play. First-unlock timing was browser-tested; rapid multi-unlock pacing remains a polish check.
- Browser warnings/errors empty. At 320 px, all four milestones and the preference are reachable without horizontal overflow. The level-meter link remains visible and the main fixed decision buttons retain their space.

## Findings / polish

- The desktop unlock notice was moved lower to avoid overlapping the tested 1366 × 768 decision row. Narrow phone notices remain above the fixed decisions.
- Unlock notices are optional, finite, dismissible and nonmodal, with no extra XP or additional confetti. Pending notices are invalidated by Undo/reset and deferred while subsequent rewards continue.
- P3: timing under very rapid repeated decisions can be tuned after use. Physical-device keyboard/screen-reader acceptance and smaller desktop heights remain separate checks.

## Scope boundary

This is a functional prototype and a persistence contract, not installed durable achievements. Browser state resets on reload. `ACHIEVEMENTS.md` specifies the proposed authenticated, revision-checked, encrypted Store integration and the remaining obligation-identity/rule-version decisions. The production app, private reviewer, Gmail, credentials, schedule and master playbook are unchanged.
