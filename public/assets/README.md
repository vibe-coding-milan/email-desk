# Local interface assets

All fonts, icons and artwork are served locally; no private-page requests go to a font or icon CDN.

- `fonts/inter.ttf`: Inter variable font, Google Fonts official repository (`ofl/inter/Inter[opsz,wght].ttf`), SIL Open Font License. See `fonts/Inter-OFL.txt`.
- `fonts/silkscreen.ttf`: Silkscreen Regular, Google Fonts official repository (`ofl/silkscreen/Silkscreen-Regular.ttf`), SIL Open Font License. See `fonts/Silkscreen-OFL.txt`.
- `icons/*.svg`: unmodified Pixelarticons from https://github.com/halfmage/pixelarticons/tree/master/svg. MIT license in `icons/LICENSE.txt`.
- `mailbox.png`: generated with built-in ImageGen for the selected November 15 visual direction. Prompt: transparent cobalt 16-bit mailbox, raised red flag, cream envelope, dark pixel outline and a few green ground pixels; no text. Rendered as a small masthead asset, with pixelated sampling.

- `desk-clear.png`: built-in ImageGen illustration for the Needs action resting state and the process walkthrough; an orderly cobalt desk, lamp, completed letter and empty chair. Transparent PNG.
- `lookout.png`: built-in ImageGen illustration for the Worth knowing resting state and process walkthrough; an inanimate cobalt telescope on a wooden tripod and a notebook. Transparent PNG.

Full generation prompts for the November 16 additions are recorded in `docs/ARTWORK.md`. Artwork is decorative; state meaning remains available in text. Waiting/unconfirmed states now use the approved companion avatar rather than the completed-letter illustration.


## Approved AI companion

`agent-logo.png`, `agent-mail.png`, `agent-lookout.png` and `agent-rest.png` are transparent, built-in ImageGen derivatives of Milan’s approved companion concept. The recurring cobalt/cream robot now appears in branding, the splash/process illustrations, empty states, first-use guidance and level-up rewards. The original prop-only illustrations remain available but are no longer the main interface artwork (mailbox.png remains the favicon).

Full generation prompts: `docs/COMPANION-ARTWORK.md`. Motion comes from short CSS nod/light-pulse animations on first visibility and hover; reduced-motion users see still artwork. There is no video, animated GIF, new dependency or recurring playback timer. These decorative movements do not indicate that the reviewer is running.


## Drawn idle frames (current)

`agent-idle-sheet.png` is the current animated companion: four drawn poses in a transparent 2×2 sprite sheet (1254×1254; 627×627 cells). Head turn, forearm movement and blink are part of the artwork. CSS switches whole cells using discrete positions; it does not translate, rotate, scale, jitter or brighten the illustration. The same sprite stands beside the original static mailbox, telescope and desk props.

The earlier composite companion PNGs remain available as still artwork. The previous whole-image nod/pulse effects were removed after Milan’s feedback. Pause animation freezes playback for the page; reduced motion shows the first neutral frame. Offscreen sprites pause. Prompt and frame layout: `docs/COMPANION-IDLE.md`.


## Pocket Console desk vignette — November 19, 2026

`desk-vignette.png`: transparent RGBA PNG, 2092×751, generated with the built-in Image Gen tool using the selected stepped-frame mock as reference. Prompt: standalone crisp 16-bit header vignette with blue desk lamp, stacked books, cream mug, potted plant, thin wooden desktop and framed sunrise/city window; wide composition for a 460×165 slot; transparent background; no UI, text, robot or icons. Used decoratively on the public welcome and workspace headers. Real alpha was verified and the saved asset inspected. The original mock remains outside source; no private message imagery is included.


## Interaction refinement — November 19, 2026

`icons/archive.svg` is the unmodified Pixelarticons archive icon from the same official MIT-licensed library, used for History instead of reload. The idle character now plays one 4.8-second greeting cycle and settles; reduced-motion still freezes it. This supersedes earlier references to continuous idle playback and an explicit decorative pause button. The demo timeline also advances automatically; its Pause timeline control was removed in the subsequent polish pass.
