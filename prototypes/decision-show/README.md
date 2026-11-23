# Archived design exploration

Production implementation, dependencies and build commands live at the repository root under frontend/. This folder preserves the selected image, fictional source, tests and design-review evidence from this chat; local hosting/template scaffolding is intentionally excluded. The production contract in docs/FOCUS_ROUNDS.md supersedes the prototype-only semantics below.

# Email Desk — focused rounds prototype

A standalone browser-memory prototype based on the selected third Product Design concept, with Milan’s latest refinements. The self-hosted app, backend, reviewer, credentials and deployment are unchanged.

## Run and verify

Run `npm install`, then `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` in this directory. `npm test` runs 25 meaningful game/XP/schedule/backlog/achievement checks; `npm run build` checks the client build. Template hosting outputs are unused: no Sites project or deployment was created.

## Current interaction

- Game mode opens by default with one item at a time in a round of up to five. The round’s count/blocks remain fixed; the waiting count describes all remaining open items in that category. A 1,000-item backlog still creates only five markers. Needs action is followed by an explicit Worth knowing round.
- Pass is one click, moves the card to the queue’s end, keeps it open/in its inbox and awards no XP. No snooze dates or return-time modal.
- Handled/Noted closes the attention card without simulating a reply or removing Inbox membership. Not important closes it and simulates archive from inbox. Nothing deletes, unsubscribes or mutates Gmail.
- Attention, Topic and Guidance live in the task card. Classification and topic are grouped beside Guidance, with a source action and date above. Attention moves an item between categories without completion XP. Draft Guidance/labels travel with decisions; Save changes also commits them.
- Topic uses a styled listbox popover, with full labels, selected state, rotating caret, outside dismissal and Arrow/Home/End/Enter/Escape support. Options scroll within the menu. It does not change card height. Open email expands invented source content in place.
- End round opens classic view. Each classic item can be handled, passed, archived, read or edited within the list, with no forced game transition. Only explicit Game mode enters a round. Both modes share cards and XP but classic decisions do not advance a hidden round.
- History is read-only: collapsible year/month groups and daily settled records, with no search or Reopen action. Immediate Undo stays in the active working view, restores its original mode and is cleared on navigation to history. Back to desk returns to the mode used before history.
- All data resets on reload. There is no API, real authentication, durable storage or mailbox integration.

## XP, schedule and motion

The demo starts with eight invented completed items (80 XP), five open action items and two open awareness items. Three initial completions earn 10, 5 and 10 XP, demonstrating Level 2. The production policy is mirrored: first completion within 48 elapsed hours earns 10 XP, afterward 5 XP, once per card. Pass, classification and Guidance edits award none; existing awards stay frozen.

New York timeline: weekdays 9 AM / 1 PM / 5:30 PM; weekends 9 AM / 5:30 PM. Demo time starts November 23, 2026 at 11:20 AM. Demo controls preview November 28’s weekend schedule, also advancing simulated message age. Review results are invented.

Motion for React provides card transitions, source expansion, XP fill and rewards. canvas-confetti provides finite completion/level-up bursts. The existing four-frame raster robot animates on completion/level-up. Device reduced-motion preferences suppress movement/confetti/sprite playback. Libraries run locally, with no email sent to animation services.

A compact status rail and queue bar put the initial game decisions above the fold at 1366 × 768: action bottom 682 px, versus the prior 958 px. Phone game actions stay fixed at the bottom; classic mobile decisions have 44 px minimum height.

## Evidence and limits

The latest achievement evidence is in `qa/revision-5/`. The compact-mode Product Design audit remains in `qa/revision-4/`, including `audit.md`, full before/after comparisons and keyboard/mobile evidence. `design-qa.md` records final acceptance. Earlier QA/ideation images are retained as history; their native label picker, classic Review item and history reopening behavior are superseded.

Physical-device keyboard and screen-reader acceptance remain outstanding. Production integration must preserve the existing authentication, encryption, revisions, deduplicated writes, Guidance, immutable audit history, coverage errors and server-owned XP. Real archive/undo semantics must be implemented explicitly against the existing backend. Publishing remains on DreamHost at mijatovic.com/email-desk. Weekly comparisons remain future work; achievement rules and the event foundation are described in `ACHIEVEMENTS.md`.

## Assets

Local Inter and Silkscreen fonts retain their license files. Phosphor supplies standard icons. `robot-host.png` was generated with built-in Image Gen from the selected mock: smiling blue/yellow pixel robot host, upper body, two hands resting at the bottom, small yellow aerial accent, transparent square framing, matching existing Email Desk identity. `agent-idle-sheet.png` reuses the existing app’s real four-frame art. Pixel frames reuse the existing stylesheet’s code-native stepped-frame treatment. No new raster was generated for this revision.

## Achievements

The level meter now links to four forward-looking milestones: First move, Loose end tied, Five forward and Steady progress. Both working modes contribute through the same content-free, versioned event ledger. Unlock notices can be disabled without stopping progress. They follow the XP animation and add no extra XP. Immediate Undo appends a compensating event and reverses related milestone contributions. Seeded XP/history does not manufacture milestones. Progress/preferences are still in-memory; `ACHIEVEMENTS.md` specifies the proposed authenticated, encrypted, transactional persistence contract and its remaining integration decisions. No live persistence or mailbox change was made.
