# Decision Show design QA — November 23, 2026

final result: passed

## Source and evidence

- Source visual truth: `reference.png`, exact third displayed ideation result (`exec-7321ed09-3a7c-4c0b-b229-bd963543bef4.png`). Source is 1487 × 1058 pixels, normalized to 1440 × 1024 for comparison.
- Browser-rendered implementation: `qa/desktop.jpg`, 1440 × 1024 pixels at 1440 × 1024 CSS viewport, 1× capture. State: garden volunteer question, item 3 of 5, one handled and one deferred.
- Full-view combined comparison: `qa/comparison.jpg` (source left, implementation right; both normalized to 1440 × 1024). Focused task comparison: `qa/task-comparison.jpg`.
- Responsive evidence: `qa/mobile.jpg` at 390 × 844 CSS viewport and `qa/narrow.jpg` at 320 × 844 CSS viewport, full-page images. Completion evidence: `qa/round-complete.jpg`.

## Findings and comparison history

- Initial desktop pass: P2 vertical density/scale mismatch. Header and progress spacing pushed the decision area too low; task title and host were smaller than the selected mock. Evidence: `qa/desktop-before.jpg` (earlier fictional item state; used for layout diagnosis only). Fixed header height, progress/stage margins, desktop task type to 48px and mascot box to 190px. Same-state post-fix evidence: `qa/desktop.jpg`, `qa/comparison.jpg` and `qa/task-comparison.jpg`.
- Narrow pass: P2 Open email wrapped inside its action at 320px. Added non-wrapping text buttons and adjusted narrow link gaps/type. Re-captured `qa/narrow.jpg`; no horizontal document overflow at 320 or 390 CSS px.
- Final full and focused comparisons: no remaining actionable P0/P1/P2 findings. The task remains the dominant surface, with three clear decision controls and an unobtrusive finite-round indicator.

## Required fidelity surfaces

- Fonts/typography: supplied Inter and Silkscreen are loaded locally. Pixel display labels, bold question hierarchy, single-line desktop task, readable summary and supporting action labels match the reference's hierarchy. Mobile task text wraps naturally.
- Spacing/layout: horizontal header, centered round heading/progress, single peach task, robot perched above it, three equal desktop decisions and summary/Undo footer preserve the reference. Phone decisions stack with labels and sublabels. Scrolling exposes all controls; no horizontal clipping.
- Colors/tokens: offwhite #faf9f5, ink #171719, blue #3046f3, peach #ffebd8 and lavender account/progress accents align with existing app and mock.
- Images/icons: real transparent generated raster robot, not CSS art; consistent blue/yellow identity and smiling host pose. Standard controls use the Phosphor icon package. Minor pose and edge geometry differences are P3 below.
- Copy/content: selected garden question, sender, summary, dispositions and pending reassurance reproduced. Explicit fictional boundary, category indicator and source-preview explanation clarify the prototype's scope. No false mailbox clearing, sending or response-verification claim.

## Primary interactions verified in the in-app browser

- Open email displays invented source body; Back to decision leaves the current item and counts unchanged.
- Guidance saves a fictional preference; completion/history/reopening retain the exact text. Existing label vocabulary is represented in the editor, with no external label writes.
- Handled advances and counts once. Next round and Tomorrow deferrals preserve an open item and do not award XP.
- Undo returns to the previous item and restores counts.
- A five-item action round ends with three handled, one not needed and one deferred; total 40 demo XP. Reopening/rehandling an already awarded card leaves total XP at 40.
- History filter for Later shows only the deferred item; reopening brings an item into the next eligible round.
- Separate two-item Worth knowing round supports Noted and Not needed; no pending deferred work disappears.
- Restart resets fictional state. Dialogs support Escape and visible Close controls. Focus indicators and semantic controls are present; reduced motion removes transitions.
- Browser warning/error logs checked: empty during interaction acceptance.
- Build passed with `npm run build`. No production/backend files were changed, so PHP/live-auth/reviewer checks are outside this prototype's scope.

## Follow-up polish and limits

- P3: source uses stepped pixel corners; implementation uses restrained rectangular borders and a light offset shadow. Primary layout and hierarchy are preserved.
- P3: generated robot's small pose/scale details differ slightly from the reference; identity and placement match.
- Physical-device and screen-reader acceptance have not been performed. Native date-picker appearance varies by platform.
- This is a browser-memory prototype. Durable deferrals, cross-device progress, weekly comparisons and backend integration remain production work; no live publication occurred.
