# Version 0.5.0 product update — November 21, 2026

final result: passed for the fictional local UI and scoped live read-back. Production access and preservation acceptance passed; the deployment workflow’s final network timeout is recorded separately in docs/PRODUCT_UPDATE_050.md.

Preserved the existing pixel identity, artwork, two buckets and card hierarchy. Inspected focused login, board/status, standalone History and System in the in-app browser. Verified note saves without closing, handling, note search, no-match status filtering, reopening with unchanged XP, feedback-to-card navigation, selected labels through search, optional demo skip and independent run identity. At 390px light/dark and 320px, System and card editing reflow without horizontal overflow. Corrected the mobile three-control navigation and desktop History filter specificity during QA. Fictional failed-review and unavailable-board fixtures retain visible warnings and never claim an all-clear. No private email screenshots were captured.

Accepted screenshots are ignored under `.local/product-update-050/`. Existing audit evidence contains public/fictional data only and is published with the product review. Full-page capture may render the offscreen skip link; a DOM/geometry check confirmed it sits above the viewport unless focused. Browser error/warning logs were empty on the tested flows. Physical-device, screen-reader, cross-device, and scheduled/Mac-offline reliability remain separate acceptance work.

Earlier records below remain historical.

# Card timing and sender follow-up — November 19, 2026

final result: passed (local and production)

Everyday-use feedback identified timing-dependent red/amber card edges shifting sender/content dividers and raw quoted mailbox headers overfilling the sender column. Removed those side rules/padding, hid the exhausted meter and used a quiet amber past-target pill. Standard single-mailbox display names now appear without outer quotes; the original remains in the hover title. Bare addresses and ambiguous lists are preserved. No real message fixtures were added.

Fictional owner preview checked 1440px light/dark and 390px dark: fresh and late cards share aligned edges/dividers; late cards have no meter; sender names wrap cleanly with original hover values; no horizontal overflow or browser warnings/errors. Screenshot: ignored .local/card-polish/desktop.jpg. Shared checks and sender/timing cases passed. XP policy and stored data are unchanged. Physical devices and screen-reader acceptance remain separate.


Published through [PR #7](https://github.com/vibe-coding-milan/email-desk/pull/7), commit `125393a2f9ee5162a08f4840eb6a640357be2dde`, release `arcade-20261119T195734457313Z`. [Deploy Email Desk](https://github.com/vibe-coding-milan/email-desk/actions/runs/44603489054) passed, including public verification. Independent acceptance verified all 27 public hashes, the unchanged homepage, all 23 live access checks and exact preservation of all 32 saved cards, comments, decisions, checkpoints and XP. Live browser verified the 0.4.1 version link, owner sign-in, friendly sender/original hover value, aligned fresh/late dividers, no exhausted meters, light/dark desktop and 390px wrapping without horizontal overflow or browser warnings/errors. Owner inspection was read-only; private screenshots remain ignored. Physical-device, cross-device and screen-reader acceptance remain separate.

---

# Control and copy polish — November 19, 2026

final result: passed

## Live acceptance

Version 0.4.0 published November 19 through PR #6, commit 9a21d30d3555dc2a9308aca1892adcb0cfa5d0fb. Actions run 44598409634 passed. The exact tested UI bytes and artwork were verified by all 27 public hashes. Live browser confirmed landing/demo/version, a fictional 10-XP decision and History, segmented details, owner sign-in/read-only details/sign-out, 390px light demo/dark owner without overflow and empty warning/error logs. Public screenshots: `.local/live-040/landing.jpg`, `demo.jpg`, `demo-mobile.jpg`, `landing-final-dark.jpg`; private owner capture is excluded from public artifacts. All 23 live access checks passed and all 32 saved cards/checkpoints/progress matched exactly. Earlier local-only statements describe pre-publication QA. Physical devices/cross-device use and new unattended review remain separate.

## Target and evidence

The latest user feedback supersedes the prior stepped-control treatment: retain the accepted pixel section frames, artwork and palette; simplify interactive edges, binary choice, dividers and copy. Original selected source remains the 1487×1058 image recorded below. This scoped pass uses `.local/polish/before-demo.jpg` as its rendered baseline, with the same fictional morning, light theme, four active cards and 1440px desktop viewport in `.local/polish/demo-final.jpg`. `.local/polish/comparison-full.jpg` puts their top 1440×1024 regions together at 1:1 density and was opened and inspected after the final capture. Content height changes deliberately with reduced toolbar copy/dividers. `.local/polish/comparison-controls.jpg` shows readable before/after controls and was also inspected.

Focused/editor evidence: `editor-initial.jpg`, `owner-desktop.jpg`, `owner-mobile.jpg`, `owner-320-dark.jpg` in the same folder. Final 320px `demo-320.jpg` and `landing-mobile.jpg` were opened and inspected. Desktop landing is `landing-final.jpg`. Screenshots are ignored local artifacts, all using fictional content.

## Findings resolved

- P2 jagged interactive shapes and inconsistent action affordances: replaced stepped buttons/nav/label tiles with restrained 3–4px corners, common target sizes and consistent outlined secondary actions. Stepped section headings remain. Bucket is now one two-part segmented control with native radio semantics and keyboard navigation.
- P2 redundant demo structure: removed Pause timeline, repeated demo heading and outer toolbar/guide divider lines. Clearing a batch advances automatically and shows one transition empty state. Retained dividers separate cards inside the containers.
- P2 copy and feedback density: shortened landing, board, demo instructions and decision feedback; removed routine congratulatory reward prose. Level-up remains explicit. No extra slogan was introduced.
- P2 meter direction/award ambiguity: meter now counts down the remaining 48-hour full-credit window. The accessible explanation states 10 XP before the boundary, 5 afterward, and distinguishes it from a sender deadline. Cards with an existing award do not advertise a new countdown. XP policy is unchanged.

## Final surfaces and behavior

Typography retains local Inter and short Silkscreen landmarks. Layout keeps both accepted stacked containers and full wrapping; 320/390/1440px checks found no horizontal overflow, and final 320px demo actions fit. Cream/cobalt/lavender tokens and dark theme mapping remain; secondary borders were strengthened. Existing local artwork is unchanged and crisp. Copy is direct and shorter across public, demo and owner views.

A complete fictional demo passed all three review batches, automatic advancement, 12 history entries, 120 XP and Level 2. A context-only note save left XP/state unchanged, then survived handling and History. Keyboard Left changed the segmented selection. Read-only fictional owner checks confirmed countdown values against receipt age (within the one-minute refresh interval), and suppressed countdowns on awarded cards. Light/dark editors and mobile action rows were inspected. Browser warning/error logs were empty. `npm run check` and `git diff --check` passed after the final source edit.

No actionable P0/P1/P2 findings remain in this scope. Native radio semantics were tested by keyboard; this is not a full screen-reader, physical-device or cross-browser acceptance claim. Local preview uses port 8000. Firefox successfully rendered that port in the prior port-fix pass; this polish pass was validated in the in-app browser, with no browser-security override. No backend, live-data or production changes.

---

# Interaction refinement — November 19, 2026

final result: passed

## Scope and visual truth

Milan's latest detailed feedback supersedes the selected mock's status/editor/timing treatment. Preserve the approved two stacked pixel containers, rail, fonts and artwork; refine the specific controls and repeated copy. Original source: `/Users/milan/.codex/generated_images/01a1f4ce-9f44-7760-b76c-8dca9063cc2f/exec-ae2970d4-8368-4617-8d99-46efcb6f084a.png`, 1487×1058, normalized to 1440×1024 at `.local/design-refactor/reference.jpg` (rounding below one pixel). Final owner capture `.local/interaction-refinement/board-final.jpg` is 1440×1024 CSS/pixels, density 1, light, four active fictional conversations, disclosures collapsed. `.local/interaction-refinement/comparison-final.jpg` combines both in one input and was opened and inspected. New visible timeline, framed History, visual age/XP and actual fixture awards are deliberate user-directed changes.

Focused editor evidence: `.local/interaction-refinement/editor-final.jpg`; same-input initial/final control comparison `compare-editor.jpg` was opened and inspected. Left has the first implementation's plain bucket tiles/closed labels; right has final stepped choices and open searchable labels. Disclosure state differs intentionally to expose the refinement, so do not treat increased editor height as a fidelity defect. This focused image predates only the final compact desktop timeline layout; editor controls are unchanged. `editor-dark.jpg`, `editor-320.jpg` and `labels-mobile.jpg` show dark/light responsive editors. The 320px dark capture and final desktop editor were opened and inspected. Existing sections/fonts/palette/artwork remain the visual baseline; there is no new illustration or concept selection.

## Changes and comparison history

- Replaced the ambiguous reload icon with the unmodified MIT Pixelarticons archive icon and gave both navigation buttons stepped outlines. Fill still identifies the current location.
- Removed decorative Pause animation and How reviews work. Idle character animation now completes one 4.8-second cycle and settles; reduced-motion settings still disable motion. The demo's Pause timeline remains a functional simulation control.
- Made the daily timeline visible; removed Last update/Next review/coverage-summary duplication and the global overdue count. Actual scan failures/partial/stale/offline notices remain, and timeline markers retain Updated/Missed/Failed/Partial/Due states. A P2 density pass compacted desktop times/states onto one row below the markers; all four primary card action rows fit in the final 1440px capture.
- Replaced the two-option Category select with native radio choices styled as stepped tiles. Removed Status from the context editor entirely. Handled/Dismiss are the only closing actions; History has explicit Reopen. Save context appears only for dirty context. Primary decisions include unsaved context and change their visible/accessibility names to Save & handle / Save & dismiss / Save & reopen. A context save preserves the existing state and never awards XP.
- Added stepped checkbox label tiles and local search over the existing vocabulary. Selected hidden matches remain selected. Labels still use the existing pending-feedback/reviewer contract; no Gmail labels are applied by the page itself.
- Replaced long receipt/target/XP sentences with age, a small elapsed-window meter, a compact XP chip and quiet card-level age borders. Past 48h retains a short text marker; full timing is available in an accessible group name and a focus/hover explanation. Unknown/future dates do not invent an available award. No XP policy/server change.

## Fidelity surfaces

Typography: existing local Inter remains on prose/controls; Silkscreen on short landmarks. Full content wraps, no line clamp. Spacing/layout: approved shell and containers preserved; direct radio choices and wrapped label tiles have at least 44px targets; 320/390/1440px geometry checks showed no horizontal overflow. Color/tokens: cream/ink/cobalt and peach/ice/lavender retained, with readable dark mapping and text as well as color for late/missed states. Assets: existing robot/desk artwork unchanged; only genuine local library archive.svg added. Copy/content: repeated explanations removed, precise context/decision labels added, saved feedback and prior notes retained. No new account boards or taxonomy.

## Behavioral checks

Fictional owner preview 4190: changed bucket and selected an additional label while searching; Save context moved the open card and preserved both selected labels (including one filtered out of view), without changing state or XP. Restored the comparison bucket/label while preserving its prior note. Typed a note on a late card, used Save & handle, verified +5 XP and retained note in History, then used Reopen and verified total XP stayed 15. Notes, revisions and existing feedback mechanisms remain intact. Context saves explicitly name Context saved. No real card or Gmail mutation.

Isolated fictional demo 4191: Save context saved a note without closing the card or increasing XP, restored the plain Handled/Dismiss labels, then Handled awarded 10 demo XP and moved the card to History. Native radios, searchable labels and no Status select were verified in both editors. New preview 4191 was isolated from owner state; its temporary browser tab was closed after checking. Existing public/owner tabs remain.

Checks: npm run check passes syntax, shared vocabulary/local assets, timing/DST, card policy and guest-day tests. git diff --check passes. Browser warning/error logs were empty in owner and demo. Browser read-back confirmed animation iteration count 1 and no decorative pause control. No PHP/backend change; no production deployment, live-auth/access/security/cross-device or screen-reader claim. Root report retains earlier releases below for history.

## Remaining findings

No actionable P0/P1/P2 issues in the tested scope. P3: native radio/checkbox internals vary slightly by browser while retaining semantics and keyboard support. Source mock's exact data/counts/clock and four illustrative XP blocks differ from actual fixture progress by design.

---

# Pocket Console refactor — November 19, 2026

final result: passed

## Target and evidence

Milan selected the third displayed concept, then approved the revised stepped-container treatment. Visual truth: `/Users/milan/.codex/generated_images/01a1f4ce-9f44-7760-b76c-8dca9063cc2f/exec-ae2970d4-8368-4617-8d99-46efcb6f084a.png` (1487 × 1058). Reference normalized proportionally to 1440 × 1024, rounding below one pixel: `.local/design-refactor/reference.jpg`. Browser-rendered owner screenshot: `.local/design-refactor/board-final.jpg`, 1440 × 1024 CSS/pixels, density 1. State: light, authenticated fictional preview, four active conversations, disclosures collapsed.

Full-view same-input comparison: `.local/design-refactor/comparison-final.jpg`. Focused same-input comparisons: `compare-header.jpg` and `compare-frames.jpg` in the same folder. All three combined images were opened and inspected. Fixture copy, actual timestamps, a 3-day-old card, retained award after reopening, and the visible age notice differ from the illustrative source; these are intentional functional constraints, not fabricated state. Longer summaries wrap fully. Both sections and all four primary action rows fit in the desktop capture.

Other evidence in `.local/design-refactor/`: `landing-desktop-final.jpg`, `landing-mobile-final.jpg`, `landing-320.jpg`, `board-dark.jpg`, `mobile-light-final.jpg`, `mobile-dark-final.jpg`, `mobile-320.jpg`, `appearance-320.jpg`, and `demo-tablet.jpg`. Some intermediate captures predate the final compact menu/navigation refinements; browser read-back checked those fixes afterward.

## Comparison history

1. Initial capture `implementation-initial.jpg` / `comparison-initial.jpg`: P2 density and border fidelity. Separate metadata rows and large chrome pushed the fourth conversation below the viewport; clipped controls lost their border corners. Fixed grouped card metadata, compact review/notice spacing, and independent stepped border/fill layers for sections, tabs and controls.
2. Refined capture `board-refined.jpg`: checked practical full-summary wrapping and the visible overdue notice. Reduced excess header/row space; increased subject hierarchy; exposed source email as the primary link and kept Handled, Details and Dismiss beside it. `comparison-final.jpg` and focused comparisons show the post-fix result.
3. Narrow-screen captures: P2 cramped navigation, third action wrapping and a crowded appearance menu. Fixed one-line Board/History beside compact XP, two aligned action rows, separate full-width motion/sign-out menu buttons, nonbreaking review times, and a simple sender row at tablet widths. Geometry checks passed at 320/390/900/1440px with no horizontal overflow. Mobile source was not supplied, so responsive states are adaptations, not claims of 1:1 mobile fidelity.

## Required fidelity surfaces

- Typography: local Inter for 17px prose, 23px desktop subjects/21px mobile, and readable form controls. Local Silkscreen for short wordmark, section tabs and eyebrow. Main heading 56px desktop, 32px mobile. Full summaries/labels wrap; no line clamps. Pixel headings remain restrained and legible rather than replacing email prose.
- Spacing/layout: 220px desktop rail, full-width reading rows and two vertically stacked framed groups match the selected composition. Desktop metadata is beside the message, actions at right; smaller widths move metadata/actions into reading order. Each bucket has one stepped outline, inset edge and hard lavender shadow. History is an existing expandable area reached by the rail, not a new data route. Appearance holds themes, motion and owner sign-out.
- Colors/tokens: retained cream/ink/cobalt, peach action tab, ice awareness tab and lavender button/shadow accents. Dark mode retains readable contrast and semantic late/failed/partial text. Palette details differ slightly from raster antialiasing. No scanline or texture layer competes with reading.
- Image quality: new transparent `public/assets/desk-vignette.png` generated with the selected reference attached and inspected. Existing robot idle sheet/mailbox and unmodified Pixelarticons are reused. No illustration is replaced by CSS drawing. Stepped container/button borders are functional UI treatments. The supplied illustration is decorative, not review telemetry.
- Content/IA: public page now leads with promise, demo and two-bucket preview, followed by three short steps and footer links for build story/changelog/source. Owner view leads with the same identity, compact confirmed/next review status, visible exceptions, then work. Help is below the board. Source email is exposed; deadline text is shown before expansion when present. Notes, category/label corrections and earlier context remain in Details. Shared board/account vocabulary and 48-hour XP policy are preserved. Raw timezone/internal concept wording from the mock is omitted.

## Interaction and checks

Fictional local server on `http://127.0.0.1:4190/` (owner password `preview-only`); existing preview on 4180 left intact. Verified public/demo entry/exit, owner sign-in/out, light/dark theme, review disclosure/checkpoints, card details, saved note + Handled, preserved note in History, reopening without another XP award, demo note + decision + history/XP, and History navigation in both views. Original email links were inspected, not opened or used to change Gmail. Keyboard order of primary actions matches visual order. Focus/disclosure attributes, revision-aware existing saves, draft deferral and confirmed-save rewards remain intact.

`npm run check` passes syntax, 37-label/local-asset validation, review timing/DST, card timing and guest-day tests. `git diff --check` passes. HTML has 82 unique IDs. Browser warning/error logs checked; no application errors. No backend change or new PHP claim; no deployment, live-auth/Apache/restricted-key, physical-device or screen-reader acceptance is implied.

## Findings and follow-up

No actionable P0/P1/P2 findings remain in the tested scope. P3: existing library trend/history icons and the exact desk vignette drawing vary slightly from the mock; the robot retains its approved four drawn poses. The XP bezel uses real ten-segment values rather than the mock's illustrative segment count. Those differences preserve the established functional system.

Implementation checklist: selected direction implemented; landing content/IA revised; shared board/history preserved; local asset placed; affected checks passed; desktop and responsive comparisons reviewed. Publication to the existing DreamHost site remains a separate next step.

---

# Historical design QA (earlier releases)

# Email Desk graphics refactor — visual QA

final result: passed

## Comparison target and evidence

- Selected visual truth: `/Users/milan/.codex/generated_images/01a1de69-1e8b-78c3-bc8a-0a873041f42a/exec-95c9ed79-025e-4ec8-890a-ca2c9a9db07e.png` (third displayed concept).
- Source pixels: 1487 × 1058. Normalized proportionally to 1440 × 1024 (rounding below one pixel) at `.local/visual-qa/reference.jpg`.
- Browser-rendered implementation: `.local/visual-qa/desktop-final.jpg`, 1440 × 1024 pixels, CSS viewport 1440 × 1024, density 1.
- Full-view same-input comparison: `.local/visual-qa/comparison-final.jpg` (source left, implementation right).
- Focused same-input comparisons: `.local/visual-qa/compare-header.jpg` and `.local/visual-qa/compare-cards.jpg`. Both were opened and reviewed, alongside the full composition.
- Other states: `.local/visual-qa/desktop-dark-final.jpg`, `.local/visual-qa/mobile-final.jpg` (390 × 844). Earlier dark/mobile captures also remain in this ignored folder.
- Local URL: `http://127.0.0.1:4180/`. Fictional examples only, served by `tests/preview.py`.
- State: authenticated fictional board, light theme, four active cards (two per category), first card highlighted through keyboard focus, editor collapsed. Source uses an illustrative toast/history and invented level/XP. The implementation displays real fixture progress after exercising a decision and reopening it; those data-dependent differences are intentional.

## Comparison history and fixes

1. Initial comparison: `.local/visual-qa/comparison-initial.jpg`. Blocked on P2 typography and rhythm: condensed typography, small email/section headings, and separate lines for details/actions weakened the selected visual hierarchy. Replaced Inter Tight with locally hosted Inter, enlarged headings/body text, increased word spacing, and grouped the decision controls and details on one row. Enlarged the generated mailbox's rendering slot.
2. Refined comparison: `.local/visual-qa/comparison-refined.jpg`. Strengthened email/body sizes and practical button targets. Mobile interaction review found a P2 anchoring issue: native details expansion pushed the focused action row below the editor. Replaced only the per-card disclosure with an accessible `aria-expanded`/`aria-controls` button that reveals the editor after the stationary action row. Retained native disclosures for history, progress and labels.
3. Post-fix evidence: `.local/visual-qa/comparison-final.jpg` and the focused comparisons. Updated desktop and 390px layouts were captured after fixes. Browser geometry confirmed the editor follows the action row; no horizontal overflow at 320px, 390px or 1440px. No remaining actionable P0/P1/P2 findings.

## Required fidelity surfaces

- Typography: local Inter variable font supplies the bold masthead, strong 37px desktop section headings, 29px subjects and 20px summaries; mobile subjects/summaries use 22px/16px. Local Silkscreen appears only in the compact level/XP strip. Browser font checks succeeded. Readable wrapping and the hierarchy match the selected direction; exact raster font antialiasing is platform-dependent.
- Spacing/layout: two equal columns, 48px desktop gutter, flat rows, generous margins, fine rules and peach emphasis. One-column mobile layout preserves the same order and readable form fields. Real label tags remain below the summaries and quick decisions are available on every card, making rows taller than the selective controls in the concept; these are deliberate functional adaptations.
- Colors/tokens: warm off-white, near-black ink, cobalt, peach emphasis and ice-blue success notice. Dark mode maps these to ink surfaces, light foregrounds and a periwinkle control accent. Selected themes, focus rings, saving and completion states are differentiated. No gradient/card-dashboard treatment was introduced.
- Image/asset quality: the transparent generated mailbox preserves the cobalt/red/cream pixel subject. Pixelarticons are genuine local library assets used as CSS masks; no handcrafted SVG or decorative CSS illustration substitutes. Progress segments are functional UI, not illustration. The concept subtitle and decorative pixel confetti are omitted to preserve the user's prior request for a quiet utility board.
- Copy/content: the original two category names, history, context, labels and coverage notices are preserved. Mock email subjects/senders are fictional and match the concept for comparison. XP is transparent: 10 points once per card, 100 per level; the UI never invents historical awards. The empty state describes the saved board rather than claiming the entire inbox was reviewed.

## Functional checks and accessibility

- Browser QA verified login; inline expansion; draft preservation across Refresh; saving a note with Handled; history and preserved context; reopening and later dismissing without another XP award; quick decisions with current edits; light/dark controls; dark preference across reload; and System resolving to the browser's dark preference.
- Rechecked draft preservation and completion after the anchored-editor fix. Confirmed the action row precedes the visible editor on mobile.
- Keyboard buttons use visible focus, explicit names, `aria-expanded` and `aria-controls`. Form inputs retain labels; success notices are polite live regions. In-flight saves lock board/history interactions to prevent detached edits or competing refreshes. Departure animation/XP happen only after server confirmation. CSS respects `prefers-reduced-motion`.
- Browser error/warning log: empty. Local font/image assets loaded. `npm run check` passes JavaScript syntax, shared labels and all 14 referenced local assets.
- Isolated existing-host PHP checks: 42 storage/progress/encryption/retry checks and 18 HTTP/API/authentication checks pass. Progress survives restart/publishing, combines accounts, rejects repeated awards and cannot be incremented by failed revision writes.

## Limits and follow-up polish

- No production deployment, physical-device acceptance, new live Apache-header test, recovery exercise or live cross-device test was performed for this refactor. The local browser uses a fictional HTTP fixture; real PHP/API behavior was tested separately in an isolated temporary host directory.
- Reduced-motion CSS was inspected; OS-level preference changes and assistive-technology sessions were not simulated. System initial resolution was checked; OS theme changes were not triggered.
- P3: the library's trend/arrow icons are a small stylistic variation on the concept's abstract stepped marks. Normal semantic buttons use crisp rectangular surfaces and an offset edge rather than rasterizing the concept's stepped button silhouette.
- Optional later iteration: richer level-up artwork or cosmetic unlocks, after the basic habit proves useful.

## Implementation checklist

- [x] Preserve existing authentication, encryption, feedback history and review coverage behavior.
- [x] Match the selected visual direction with responsive local assets.
- [x] Implement themes, durable/deduplicated XP and confirmed-save motion.
- [x] Verify affected PHP, JavaScript, assets and browser interactions.
- [x] Capture and compare full-screen and focused visual evidence; fix P2 issues.
- [ ] Publish the coordinated UI/assets/Store release through the correct-domain connection when requested, then verify live acceptance.

## User-directed refinement: retention and arcade feedback

The user requested stronger game typography and more conspicuous rewards after accepting the direction. This overrides the prior quieter type/reward treatment. Silkscreen now covers the masthead, column headings and Handled button, while email text remains Inter. A separate fictional 90-XP fixture verified a real confirmed transition to Level 02 and then a +10 XP dismissal reward; evidence: `.local/visual-qa/level-up.jpg`, `.local/visual-qa/xp-gain-mobile.jpg`. These captures show entrance-animation frames; the final animation now uses transform only so the panel remains opaque. 390px browser geometry showed no horizontal overflow, and browser warning/error logs were empty. The transient reward is noninteractive and pointer-transparent; the persistent live status provides the equivalent announcement. Reduced-motion CSS disables entrance animation.

47 isolated storage tests and 18 API tests pass, including new omitted-open-card retention, automatic downgrade prevention, earlier-context preservation, unchanged-scan deduplication and explicit owner correction precedence. The earlier visual comparison remains the accepted layout reference; the changed typography/reward intensity is the user's explicit refinement. No new actionable P0/P1/P2 findings; final result remains passed. Production acceptance still requires publication and live verification.

### Interface typography consistency refinement

User explicitly requested arcade typography for the date, theme picker and empty-state message. All interface chrome now uses Silkscreen with smaller optical sizes and normal weight; email prose and editable context remain Inter. Browser-computed fonts verified all named surfaces. Evidence: `.local/visual-qa/arcade-empty-mobile.jpg`. The cleared board on the normal preview reflects the user's fictional card decisions; those states were preserved. 320px/390px checks showed no horizontal overflow; console warnings/errors empty. Screenshot reviewed for readable wrapping, heading hierarchy and navigation fit. Local syntax/asset checks pass. final result: passed.

## Production publication

Version 0.2.0 was published as `arcade-20261115T154502Z`. Authenticated live browser inspection confirmed Silkscreen interface typography, loaded artwork, the preserved active cards and visible incomplete-review coverage notice. Desktop DOM width matched viewport and browser logs were empty. Live evidence is private at `.private/arcade-live-desktop.jpg` and is intentionally excluded from source control. All 18 public asset hashes and 23 live acceptance checks passed; saved cards exactly matched the pre-release snapshot. Production feedback was not changed to demonstrate rewards. Physical-device/cross-device acceptance remains outstanding. final result: passed.


## Version 0.3.0 guest edition acceptance

Current design uses the approved cobalt/cream robot with actual four-frame idle poses beside fixed props. The earlier still-image rotation/bob treatment is superseded. Fictional localhost QA covered public/process/demo navigation, all three review batches, 100-XP level-up, retained notes/history/labels, both illustrated empty columns, sign-in/out, light/dark responsive layouts, pause/resume and no horizontal overflow or console errors. Production acceptance is recorded in docs/HANDOFF.md: 0.3.0 live browser public/demo/level-up/pause/mobile checks passed on November 17, with 25 public hashes, 23 access/security checks and unchanged saved state. No production card decisions are used for visual QA.


## 0.3.2 card age and XP — November 19, 2026

Fictional browser QA verified fresh/one-day/three-day age labels, the count of cards beyond the 48-hour target, a confirmed late decision earning 5 XP, retained first-decision timing in history and half-filled XP segments. Light/dark themes and 390px phone wrapping were checked without horizontal overflow; no browser warnings/errors. Timing text updates in place to preserve editors. The generic target is distinct from a sender deadline, and decisions are not presented as verified replies. Screenshot evidence is ignored under .local/visual-qa/card-timing.jpg. Physical-device acceptance remains separate. Production browser acceptance passed: published 0.3.2 notes, both demo columns’ age/full-credit labels, a fictional 10-XP decision, first-decision history, light/dark UI, 390px wrapping and no console warnings/errors. Evidence: ignored .local/visual-qa/live-032-demo.jpg. Exact real-board state preservation and 23 live access checks were verified separately; see HANDOFF for the GitHub runner connection-timeout distinction.
