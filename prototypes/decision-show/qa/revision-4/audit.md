# Product Design review — Email Desk revision 4

Scope: the current local prototype’s game entry, classic decision flow and settled history. Goal: put the actual email and decisions above the fold, retain the established pixel character, and let each mode support its own work.

All before evidence was captured and inspected during this review, at 1366 × 768 CSS pixels / 1×. This report records the original findings and resulting fixes; it is not a production or accessibility certification.

## 1. Game entry — improved

![Game before and after](</Users/milan/Documents/Codex/Email Desk/prototypes/decision-show/qa/revision-4/game-comparison.jpg>)

Before: the status strip, broad centered introduction and queue consumed the upper half of the viewport. Task top was 445.2 px; the decision row ended at 958.1 px, below the 768 px fold. Strengths were the robot timeline, XP meter, clear single task and distinct decisions. The generic native label select did not share the visual language.

After: compressed status strip and a single mode/queue bar retain the robot and nearby totals. Classification and topic are grouped on the left, Guidance on the right. Task top is 246.5 px and decisions end at 682.1 px: approximately 199 px and 276 px higher respectively. A themed label popover, pixel captions, inset editor field and matching selected states carry the style inside the card. The game subject remains the dominant text.

Accessibility: all outcomes are semantic buttons; inline editing has labels and visible focus. A custom picker introduces keyboard obligations, so Arrow keys, Home/End, Enter, Escape, selected-state announcement and internal option scrolling were implemented and exercised. Narrow-screen controls remain fixed at the bottom.

## 2. Classic decisions — fixed

![Classic before and after](</Users/milan/Documents/Codex/Email Desk/prototypes/decision-show/qa/revision-4/classic-comparison.jpg>)

Before: Review item returned directly to game mode. This was a flow error, not merely a styling issue. The layout offered two clear categories but could not finish work independently.

After: every classic item has its own Open email, Handled/Noted, Pass, Not important and Edit controls. Editing expands inside that list item. Completion, passing and category changes stay in classic view; only the explicit Game mode control changes modes. Recent Undo also restores the original mode. Browser acceptance confirmed completion (+10 XP), passing, archival and no-XP reclassification without leaving classic view; saved Guidance and labels were retained.

Accessibility: compact mobile decisions have 44 px minimum height, labelled edit toggles and source disclosure state. No hover-only action is required. Screen-reader and physical-phone acceptance remain outstanding.

## 3. Settled history — fixed

![History before and after](</Users/milan/Documents/Codex/Email Desk/prototypes/decision-show/qa/revision-4/history-comparison.jpg>)

Before: Reopen invited settled work back into the queue and the typography/surfaces looked separate from the game. Date grouping was already useful.

After: read-only records retain collapsible year/month groups and daily sections. Pixel headers, completion marks and XP badges make it part of the same product. There are zero Reopen buttons and no history mutation handler. Back to desk returns to the originating game/classic mode. Immediate Undo exists only in the active working view and is cleared when navigating into history.

Accessibility: year/month groups use native details/summary semantics and visible caret changes. State is shown with words as well as icons/color. Screenshot evidence cannot establish full assistive-technology support.

## Scale and boundaries

Rounds remain capped at five items, including on a 1,000-item test backlog. Queue blocks describe the fixed round, while the waiting count describes the remaining open category. Passes retain the obligation, move it to the back and award no XP. Classification changes also award none. Existing 10/5 XP, single-award rules, daily schedule and motion preferences remain in force.

This prototype uses invented in-memory data. No live app, Gmail, reviewer, authentication or deployment change occurred. Real archive behavior, persisted history and cross-device behavior are not established by this review.

See the project’s `design-qa.md` for final checks and artifact paths.
