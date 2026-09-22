---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/project-context.md"
  - "codebase (types/, stores/, lib/, components/, app/, hooks/) — used in place of a missing PRD/Architecture doc"
---

# Todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Todo, decomposing the requirements from the existing implementation (baseline scope, since no PRD.md exists), the UX Design Specification, and technical constraints from `project-context.md` (used in place of a missing Architecture.md) into implementable stories.

## Requirements Inventory

### Functional Requirements

**Baseline (already implemented — captured for coverage and regression protection):**

FR1: Users can create a task with a title, optional description, priority level, category, tags, due date, estimated time, and pinned flag.
FR2: Users can edit any field of an existing task via a form.
FR3: Users can delete a task; deletion removes that task's id from other tasks' dependency lists.
FR4: Users can mark a task as completed and restore a completed task back to an active state.
FR5: Users can manually reorder tasks via drag-and-drop; the app persists the new order.
FR6: Users can set a task's status (backlog, next, in-progress, completed).
FR7: Users can pin a task so it always sorts to the top of any active-task view regardless of sort mode.
FR8: The system computes a priority score per task from importance, urgency, due-date pressure, priority weight, and a dependency-block penalty, and recalculates it whenever relevant task data changes.
FR9: Users can mark a task as depending on other tasks; a task with an incomplete dependency is flagged as "blocked" and receives a score penalty.
FR10: Users can choose among multiple sort modes (recommended, manual, priority, due date, estimated time, importance, urgency) for the active task list.
FR11: Users can view a dedicated Completed page listing completed tasks grouped by completion date, with the ability to edit or permanently delete (individually or via "clear archive") completed tasks.
FR12: The app shows at-a-glance stats (active count, completed today, overdue count, total remaining estimated time).
FR13: All task, settings, and category data persist to local storage and rehydrate on app load without a network call.
FR14: Users can create custom categories with a name and color.

**Redesign scope (new/changed behavior required by the UX Design Specification):**

FR15: The main view presents a single continuous "Single Stream" list: a persistent quick-add bar, then a "Today/Priority" section, a quiet section divider, then the "Backlog" section — replacing the current separate quick-capture panel + queue layout.
FR16: Adding a task from the quick-add bar requires only text entry + Enter/tap; an empty submit is a silent no-op (no validation error shown), and the input remains focused after submission for rapid successive capture.
FR17: Dragging a task across the Today/Backlog divider changes its status (promotes to Today or demotes to Backlog) in the same gesture used for reordering, without a separate control.
FR18: Users can complete a task directly from the Backlog section with the same one-tap checkbox affordance used in the Today section, without first promoting it.
FR19: Deleting a task uses an in-place, non-modal confirm affordance (tap delete → brief "confirm?" state for ~2-3s → tap again to confirm, or tap elsewhere/wait to cancel), replacing the native browser `confirm()` dialog.
FR20: Task priority is displayed as a single-color `PriorityDot` (no emoji, no colored pill/badge), replacing the current emoji + colored-border `TaskCard` treatment; priority remains identifiable via list position and dot color together (never color-only).
FR21: Keyboard-only users can reorder a focused task row (e.g. via arrow keys) as a fallback to pointer/touch drag-and-drop, so priority-setting is not mouse/touch-only.

### NonFunctional Requirements

NFR1: Visual design must conform to the Graphite Violet dark-mode-first color palette and design tokens (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high/med/low`), applied as CSS custom properties rather than hardcoded Tailwind color utilities.
NFR2: All spacing must follow the 8pt grid scale (4/8/12/16/24/32/48px); ad hoc margin/padding values are not permitted in redesigned components.
NFR3: Typography must use the defined type scale (12/13/15/17/22/30px) with Manrope for UI/body text and JetBrains Mono (`tabular-nums`) for meta/data text (dates, counts, priority tags).
NFR4: The app must be usable equally on mobile (≤767px: BottomNav, single column, ≥44×44px touch targets) and desktop/tablet (≥768px: Sidebar, mouse+touch drag), with no distinct tablet-specific layout.
NFR5: The app must meet WCAG 2.1 AA: color contrast, visible focus outlines (`--accent`) on all interactive elements, semantic HTML (list semantics, real `button`/`input` elements), and full keyboard operability of the three core journeys (Add, Reprioritize, Review & Complete).
NFR6: Drag-to-reorder must feel immediate — no perceptible lag between gesture and visual reorder; other rows must reflow live during a drag.
NFR7: Routine actions (add, complete, reprioritize) must give no toast/banner/modal feedback — the visual state change (settle animation, opacity/strikethrough) is the only feedback; explicit feedback surfaces are reserved for genuinely unexpected states (e.g. a save failure).
NFR8: Motion must be minimal and purposeful (subtle transitions only) — no celebratory effects (confetti, popups) on task completion.
NFR9: Initial data hydration may show a brief skeleton/blank state but never a loading spinner, consistent with local-storage-backed (no network round-trip) persistence.

### Additional Requirements

_No Architecture.md exists for this project; the following technical constraints are drawn from `project-context.md`, which documents the actual established stack and patterns._

- Next.js 15 App Router / React 19 / TypeScript strict mode; never use `any` — use domain interfaces from `@/types`.
- All internal imports use the `@/*` path alias; relative imports (e.g. `../../types`) are prohibited.
- All local storage reads/writes must go through `@/lib/storage/task-storage.ts` — no direct `localStorage` access in components or stores.
- Interactive components using state, Zustand, or `@dnd-kit` must be tagged `"use client"` at the top of the file.
- `useTaskStore.getState().hydrate()` must run inside a `useEffect` on root client wrappers (already wired via `HydrationProvider`) to avoid SSR/hydration mismatches.
- Any task addition/update/priority-change/deletion must run through `recalcScores()` to keep `priorityScore` consistent.
- Forms use `react-hook-form` + `zod` (`@hookform/resolvers/zod`); validation schemas stay separate from presentational components.
- Drag-and-drop uses `@dnd-kit/core` + `@dnd-kit/sortable` inside dedicated client components under `components/tasks/`, with drag items wrapped in `<SortableContext>` using unique stringified IDs.
- No inline styling — style via Tailwind CSS v4 utilities and tokens in `@/app/globals.css`. This directly affects the redesign since `TaskForm.tsx`, `Button.tsx`, `Card.tsx`, `EmptyState.tsx`, and `Badge.tsx` currently use inline `style` objects and must migrate.
- E2E tests live in `./tests/e2e/*.spec.ts` using Playwright, with custom fixtures from `@/tests/support/auth-fixture.ts` and factories from `@/tests/support/factories/`; test reports must output to `_bmad-output/test-artifacts/`; no hardcoded base URLs (`process.env.BASE_URL || 'http://localhost:3000'`).

### UX Design Requirements

UX-DR1: Define Graphite Violet design tokens (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high`, `--pri-med`, `--pri-low`) as CSS custom properties in `globals.css`/Tailwind config, replacing the current ad hoc Tailwind color utilities (amber/rose/emerald/zinc mixes) used across `TaskCard`, `Badge`, `Button`, `Card`, `EmptyState`, `Sidebar`, `BottomNav`.
UX-DR2: Apply the 8pt spacing scale (4/8/12/16/24/32/48px) consistently across all redesigned components, replacing ad hoc padding/margin values.
UX-DR3: Apply the defined type scale and font families (Manrope for UI/body, JetBrains Mono with `tabular-nums` for meta/data) consistently, including uppercase mono section labels with `0.08em` letter-spacing.
UX-DR4: Build a new `TaskRow` component (replacing `TaskCard`) matching the row anatomy: drag handle, priority dot, title, optional due/meta tag (mono), checkbox; states: default, hover (`--surface-2`), dragging (subtle elevation/shadow, no colored ring), completed (faded + strikethrough), overdue (meta tag only, no full-row color change); Backlog rows rendered at `.88` opacity.
UX-DR5: Build a new `PriorityDot` component (replacing the emoji-based `PriorityBadge`) — a single 7px solid dot using `--pri-high/med/low` tokens, no emoji, no colored pill background.
UX-DR6: Build a new `QuickAddBar` component — a persistent capture control pinned at the top of the main content area, with plus icon, text input, and mono keyboard hint (`↵ add`); states: default, focused (accent border), disabled (offline/error only); `aria-label="Add a task"`; Enter submits, Escape clears without losing focus.
UX-DR7: Build a new `SectionDivider` component — the quiet boundary between Today and Backlog sections; uppercase mono label (`BACKLOG`) with a hairline rule.
UX-DR8: Restyle `Sidebar` and `BottomNav` to Graphite Violet tokens; desktop active nav item shown via `--accent-soft` background (no bright active-color chrome); mobile active tab distinguished by accent color only (not size or added labels).
UX-DR9: Restyle `TaskDrawer`/`TaskForm` to Graphite Violet tokens and migrate inline `style` usage to Tailwind utilities/`globals.css` tokens (per the project's no-inline-styling rule); keep the existing react-hook-form + zod validation architecture; inline field errors shown in a quiet, small, non-red-unless-necessary style.
UX-DR10: Restyle `EmptyState` to Graphite Violet tokens; keep copy short and plain (e.g. "Nothing here yet" / "Backlog is clear") — no illustrations or emoji.
UX-DR11: Replace the native browser `confirm()` delete dialog with an in-place, non-modal confirm affordance (tap delete → ~2-3s "confirm?" state → tap again to confirm, or tap elsewhere/wait to cancel) on both the active list and the Completed archive's "clear archive" action.
UX-DR12: Restyle `Button` variant tokens (primary/secondary/ghost/danger) to Graphite Violet, preserving the existing variant structure; migrate from inline styles to Tailwind/`globals.css` tokens; enforce the button hierarchy rule (at most one primary button visible per context; danger reserved only for the confirmed-delete state, never a first-tap button).
UX-DR13: Implement accessibility requirements: WCAG AA contrast, a visible `--accent` focus outline on all interactive elements, 44×44px minimum touch targets for the drag handle/checkbox/row tap area on mobile, `aria-label`s on the drag handle ("Reorder task") and checkbox ("Mark complete"/"Restore task"), and semantic HTML (list semantics, real `button`/`input` elements).
UX-DR14: Implement a keyboard-accessible reorder fallback (e.g. arrow-key reorder while a task row is focused) alongside `@dnd-kit` pointer/touch drag, so priority-setting is not mouse/touch-only.
UX-DR15: Implement the responsive breakpoint strategy — mobile (≤767px): `BottomNav`, single column, enlarged touch targets; desktop/tablet (≥768px): `Sidebar`, generous row padding — using mobile-first Tailwind media queries and no fixed-pixel layout widths.
UX-DR16: Add Playwright coverage for the mobile/desktop breakpoint switch and touch-target sizing (viewport emulation), automated accessibility checks (e.g. axe) integrated into the existing Playwright suite, and a manual keyboard-only pass over the three core journeys (Add, Reprioritize, Review & Complete).

### FR Coverage Map

FR1: Epic 1 - Quick capture via QuickAddBar; full-detail create also via Epic 2's TaskForm
FR2: Epic 2 - Restyled TaskDrawer/TaskForm
FR3: Epic 2 - Delete via in-place confirm (FR19)
FR4: Epic 1 - Complete/restore via TaskRow checkbox, incl. from Backlog (FR18)
FR5: Epic 1 - Drag reorder within Single Stream
FR6: Epic 1 - Status change via drag-across-divider (FR17)
FR7: Already delivered - Pin logic unchanged; control resurfaced in Epic 2's form restyle
FR8: Already delivered - Score calc unchanged; visualized via PriorityDot (Epic 1)
FR9: Already delivered - Dependency/blocked logic unchanged, out of scope
FR10: Already delivered - Sort modes unchanged, out of scope
FR11: Epic 2 - Completed archive uses restyled TaskRow/EmptyState + delete-confirm
FR12: Already delivered - Stats panel unchanged, out of scope
FR13: Already delivered - Persistence/hydration infra reused as-is
FR14: Already delivered - Category logic unchanged; field resurfaced in Epic 2's form restyle
FR15: Epic 1 - Single Stream layout
FR16: Epic 1 - Quick-add silent no-op + refocus
FR17: Epic 1 - Drag-across-divider promote/demote
FR18: Epic 1 - Complete from backlog
FR19: Epic 2 - In-place delete confirm
FR20: Epic 1 - PriorityDot display
FR21: Epic 3 - Keyboard reorder fallback
NFR1: Epic 1 - Design tokens
NFR2: Epic 1 - 8pt spacing scale
NFR3: Epic 1 - Type scale/fonts
NFR4: Epic 3 - Responsive breakpoints
NFR5: Epic 3 - WCAG 2.1 AA
NFR6: Epic 1 - Drag latency/live reflow
NFR7: Epic 1 - Quiet feedback (no toasts)
NFR8: Epic 1 - Minimal motion
NFR9: Epic 1 - Hydration skeleton, no spinner
UX-DR1: Epic 1 - Design tokens
UX-DR2: Epic 1 - Spacing scale
UX-DR3: Epic 1 - Typography
UX-DR4: Epic 1 - TaskRow
UX-DR5: Epic 1 - PriorityDot
UX-DR6: Epic 1 - QuickAddBar
UX-DR7: Epic 1 - SectionDivider
UX-DR8: Epic 3 - Sidebar/BottomNav restyle
UX-DR9: Epic 2 - TaskDrawer/TaskForm restyle
UX-DR10: Epic 2 - EmptyState restyle
UX-DR11: Epic 2 - In-place delete confirm pattern
UX-DR12: Epic 2 - Button hierarchy/restyle
UX-DR13: Epic 3 - Accessibility (contrast, focus, touch targets, aria)
UX-DR14: Epic 3 - Keyboard reorder fallback
UX-DR15: Epic 3 - Responsive breakpoint strategy
UX-DR16: Epic 3 - Playwright responsive/a11y test coverage

Additional (technical) requirements apply globally across all three epics as implementation constraints, not epic-specific scope.

## Epic List

### Epic 1: Calm Visual Foundation & Core Prioritization Loop
Establishes the Graphite Violet design tokens, spacing/type scale, and the new `TaskRow` / `PriorityDot` / `QuickAddBar` / `SectionDivider` primitives, assembled into the Single Stream layout on the home page — delivering the "drag to prioritize, tap to capture" core loop the whole redesign exists for.
**FRs covered:** FR1, FR4, FR6, FR15, FR16, FR17, FR18, FR20
**NFRs covered:** NFR1, NFR2, NFR3, NFR6, NFR7, NFR8, NFR9
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7

### Epic 2: Trustworthy Everyday Interactions
Restyles the secondary surfaces users touch less often but still need to trust — full task editing (`TaskDrawer`/`TaskForm`), the Completed archive, empty states, and button hierarchy — and replaces the jarring native `confirm()` delete dialog with the calm in-place confirm pattern.
**FRs covered:** FR2, FR3, FR11, FR19
**UX-DRs covered:** UX-DR9, UX-DR10, UX-DR11, UX-DR12

### Epic 3: Everywhere & Everyone — Responsive, Navigation & Accessibility
Restyles `Sidebar`/`BottomNav` to the new tokens, adds the keyboard-reorder fallback, and verifies WCAG 2.1 AA compliance, touch-target sizing, and the mobile/desktop breakpoint strategy across everything built in Epics 1–2.
**FRs covered:** FR21
**NFRs covered:** NFR4, NFR5
**UX-DRs covered:** UX-DR8, UX-DR13, UX-DR14, UX-DR15, UX-DR16

## Epic 1: Calm Visual Foundation & Core Prioritization Loop

Establishes the Graphite Violet design tokens, spacing/type scale, and the new `TaskRow` / `PriorityDot` / `QuickAddBar` / `SectionDivider` primitives, assembled into the Single Stream layout on the home page — delivering the "drag to prioritize, tap to capture" core loop the whole redesign exists for.

### Story 1.1: Establish Graphite Violet Design Tokens & Type Scale

As a user,
I want the app's colors, spacing, and typography to follow one consistent, dark-mode-first system,
So that the interface feels calm and legible instead of visually cluttered.

**Acceptance Criteria:**

**Given** the app's `globals.css`/Tailwind config
**When** the Graphite Violet tokens are defined (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high`, `--pri-med`, `--pri-low`)
**Then** they are available as CSS custom properties consumable by any component
**And** no component built or restyled in this epic set may use a hardcoded Tailwind color utility (e.g. `amber-400`, `rose-300`, `emerald-400`, `zinc-*`) in their place

**Given** the type scale requirement
**When** Manrope (400/500/600/700/800) is set as the UI/body font and JetBrains Mono (400/500) as the meta/data font
**Then** both font families load
**And** the six-step scale (12/13/15/17/22/30px) is defined once and reused, with mono meta text using `font-variant-numeric: tabular-nums`

**Given** the 8pt spacing grid
**When** spacing tokens/utilities for 4/8/12/16/24/32/48px are defined
**Then** these are the only spacing values used in components built or restyled in this epic set

**Given** `--text` rendered on `--bg` and `--surface`
**When** checked against WCAG AA
**Then** contrast meets or exceeds AA for body text sizes

### Story 1.2: Priority Dot Component

As a user,
I want to see a task's priority as a single quiet colored dot,
So that I can read priority at a glance without emoji or colored badges.

**Acceptance Criteria:**

**Given** a task with priority critical/high/medium/low
**When** its `PriorityDot` renders
**Then** it shows a single 7px solid dot in the mapped token color
**And** no emoji or colored pill/background is rendered

**Given** the Task type has 4 priority levels but the design system defines 3 dot tones
**When** mapping priority to color
**Then** `critical` and `high` both render `--pri-high`, `medium` renders `--pri-med`, `low` renders `--pri-low`
**And** this mapping lives in one place as the source of truth

**Given** a color-blind or low-vision user
**When** viewing a `PriorityDot`
**Then** priority is still inferable from the task's list position, not from dot color alone

### Story 1.3: Task Row Component (replaces TaskCard)

As a user,
I want each task shown as a single quiet row,
So that my list feels calm instead of cluttered with colored borders and mixed iconography.

**Acceptance Criteria:**

**Given** an active task
**When** rendered as a `TaskRow`
**Then** it shows drag handle, `PriorityDot`, title, optional mono due/meta tag, and checkbox
**And** no colored left border, no colored ring, and no emoji are rendered

**Given** a `TaskRow` is hovered
**When** the pointer is over it
**Then** its background becomes `--surface-2` with no layout shift

**Given** a `TaskRow` is being dragged
**When** active
**Then** it shows subtle elevation/shadow with no colored ring (replacing the current amber ring glow)

**Given** a completed task
**When** rendered
**Then** its title is faded (`--text-dim`) and struck through

**Given** an overdue task
**When** rendered
**Then** only its meta tag reflects overdue state
**And** the row background/border does not change color

**Given** a `TaskRow` in the Backlog section
**When** displayed
**Then** it renders at `.88` opacity relative to a Today row

**Given** the drag handle and checkbox
**When** inspected
**Then** the handle has `aria-label="Reorder task"` and the checkbox has `aria-label="Mark complete"` or `aria-label="Restore task"`

**Given** the existing `@dnd-kit` wiring
**When** `TaskRow` replaces `TaskCard`
**Then** drag-and-drop reordering keeps working without regression

### Story 1.4: Quick Add Bar & Silent-No-Op Capture

As a user,
I want a persistently visible input to capture a task in one action from anywhere,
So that adding a task never interrupts my train of thought.

**Acceptance Criteria:**

**Given** the `QuickAddBar` pinned at the top
**When** the user types text and presses Enter/taps Add
**Then** a task is created with that title and default priority, inserted at the position matching its priority score

**Given** empty text
**When** Enter/Add is triggered
**Then** no task is created, no error is shown, and the input is left as-is (silent no-op)

**Given** a task was just added
**When** the input clears
**Then** it stays focused for immediate next entry

**Given** the bar is focused
**When** displayed
**Then** its border shows `--accent`; unfocused, it shows the default treatment

**Given** the bar
**When** inspected
**Then** it has `aria-label="Add a task"`, Enter submits, Escape clears text without losing focus, and it shows a mono `↵ add` hint

### Story 1.5: Section Divider Component

As a user,
I want a quiet boundary between Today and Backlog,
So that I can tell the groups apart without heavy chrome.

**Acceptance Criteria:**

**Given** the Single Stream list has both sections
**When** rendered
**Then** a `SectionDivider` shows an uppercase mono "BACKLOG" label (`0.08em` letter-spacing) with a hairline rule

**Given** zero Backlog tasks
**When** the Backlog section is displayed
**Then** the divider still renders, above the Backlog EmptyState

### Story 1.6: Single Stream Home Layout — Today & Backlog Sections

As a user,
I want one continuous list with a Today section and a Backlog section instead of separate capture/stats/queue panels,
So that the app matches how I actually think about my tasks — one ranked stack.

**Acceptance Criteria:**

**Given** the home page
**When** it renders
**Then** it shows (top to bottom): `QuickAddBar`, Today section (tasks with status `next`/`in-progress`, or due today/overdue), `SectionDivider`, Backlog section (remaining active tasks with status `backlog`)
**And** this replaces the current quick-capture panel, stats grid, and flat queue

**Given** Today tasks
**When** displayed
**Then** they follow the existing "recommended" sort (pinned first, then `priorityScore` descending)

**Given** Backlog tasks
**When** displayed
**Then** they use the same `TaskRow` and ordering logic, at `.88` opacity

**Given** zero Today tasks
**When** displayed
**Then** the Today `EmptyState` shows instead of an empty gap

**Given** a task is added via `QuickAddBar`
**When** created
**Then** its status defaults to `"next"` (Today) rather than `"backlog"`, matching the UX spec's Add flow

### Story 1.7: Drag Across the Divider to Promote or Demote a Task

As a user,
I want dragging a task across the Today/Backlog divider to change its status,
So that reordering and promoting/demoting use one familiar gesture.

**Acceptance Criteria:**

**Given** a Backlog task
**When** dragged above the divider into Today and dropped
**Then** its status becomes `"next"` and `recalcScores()` runs

**Given** a Today task
**When** dragged below the divider into Backlog and dropped
**Then** its status becomes `"backlog"` and `recalcScores()` runs

**Given** a drag that starts and ends in the same section
**When** dropped
**Then** only position changes — no status change

**Given** a promote/demote drag completes
**When** the drop settles
**Then** no confirmation dialog or toast appears

### Story 1.8: Complete a Task Directly From the Backlog Section

As a user,
I want to mark an old backlog item done without promoting it first,
So that clearing small backlog items stays a single tap.

**Acceptance Criteria:**

**Given** a task in the Backlog section
**When** its checkbox is tapped
**Then** its status becomes `"completed"`, `completedAt` is set, and it moves out of Backlog into the Completed view

**Given** the same checkbox affordance as Today
**When** used in Backlog
**Then** no extra promotion step is required

**Given** a task completes from Backlog
**When** counts are shown elsewhere (Sidebar/BottomNav)
**Then** the Backlog count decreases accordingly

### Story 1.9: Quiet Motion for Add, Reprioritize, and Complete

As a user,
I want every routine action to give calm, wordless feedback,
So that the app never interrupts my focus with toasts or celebration.

**Acceptance Criteria:**

**Given** a new task is added
**When** it appears
**Then** it uses a subtle non-celebratory entry transition — no toast confirms it

**Given** a drag ends
**When** the row settles
**Then** a quiet, quick settle animation plays — no modal/banner confirms it

**Given** a task completes
**When** its state updates
**Then** the row fades and strikes through with no confetti, popup, or success banner

**Given** any of these actions
**When** they occur
**Then** the UI updates optimistically with no spinner

### Story 1.10: Quiet Initial Hydration State

As a user,
I want the app to load without a spinner,
So that opening it feels calm and immediate.

**Acceptance Criteria:**

**Given** the app loads and `hydrate()` hasn't completed
**When** the Single Stream page renders
**Then** it shows a brief quiet skeleton/blank state (Graphite Violet tokens), never a spinner

**Given** hydration completes
**When** `hydrated` becomes true
**Then** the skeleton is replaced with real content, with no layout jump or flash of unstyled content

**Given** hydration is typically near-instant for local storage
**When** it completes within a very short window
**Then** no skeleton flash is perceptible (a small delay before showing skeleton is acceptable)

## Epic 2: Trustworthy Everyday Interactions

Restyles the secondary surfaces users touch less often but still need to trust — full task editing (`TaskDrawer`/`TaskForm`), the Completed archive, empty states, and button hierarchy — and replaces the jarring native `confirm()` delete dialog with the calm in-place confirm pattern.

### Story 2.1: In-Place Delete Confirm

As a user,
I want deleting a task to use a quiet in-place confirm instead of a browser popup,
So that removing something never jars me out of flow.

**Acceptance Criteria:**

**Given** the delete icon on a `TaskRow` (active list or Completed archive)
**When** tapped once
**Then** it transitions to a brief "confirm?" state for ~2-3 seconds
**And** no modal or native `confirm()` dialog is used

**Given** the row in "confirm?" state
**When** tapped again within the window
**Then** the task is permanently deleted

**Given** the row in "confirm?" state
**When** the user taps elsewhere or the window elapses
**Then** the delete cancels and the icon returns to normal

**Given** the "Clear archive" action on the Completed page
**When** triggered
**Then** it uses the same in-place confirm pattern instead of native `confirm()`

**Given** the `window.confirm()` calls currently in `TaskCard` (delete) and `CompletedPage` (clear all)
**When** this story is complete
**Then** no `window.confirm()` calls remain for these actions

### Story 2.2: Restyle Task Editing (TaskDrawer & TaskForm)

As a user,
I want the full task-editing drawer to match the calm Graphite Violet visual language,
So that editing details feels consistent with the rest of the app.

**Acceptance Criteria:**

**Given** `TaskForm`'s current inline `style` objects
**When** this story is complete
**Then** all are replaced with Tailwind utility classes/token-based classes
**And** no inline `style` props remain for color, spacing, or typography

**Given** `TaskForm`/`TaskDrawer`'s references to the old `--color-*` tokens
**When** restyled
**Then** they reference the new Graphite Violet tokens from Story 1.1 instead

**Given** a validation error (e.g. empty title)
**When** shown
**Then** it appears directly under the field in a small, quiet `--text-dim` style
**And** a restrained error tone is reserved only for actual failures

**Given** the existing react-hook-form + zod validation logic
**When** this story is complete
**Then** validation behavior is unchanged — only visual styling changes

**Given** the priority/status selects
**When** rendered
**Then** the emoji-prefixed priority labels are replaced with plain text + `PriorityDot` (Story 1.2), consistent with the no-emoji rule

### Story 2.3: Restyle Buttons & Enforce Hierarchy

As a user,
I want buttons across the app to follow one calm, restrained hierarchy,
So that the interface never has more than one loud action competing for my attention.

**Acceptance Criteria:**

**Given** `Button.tsx`'s existing primary/secondary/ghost/danger variants
**When** restyled
**Then** their token values change to Graphite Violet (`--accent` fill for primary, `--surface-2`+border for secondary, transparent+`--text-dim` for ghost)
**And** the variant structure/API stays unchanged

**Given** `Button.tsx`'s current inline-style implementation
**When** this story is complete
**Then** it migrates to Tailwind utilities/`globals.css` tokens

**Given** any screen
**When** rendered
**Then** at most one `primary` button is visible at a time in a given context

**Given** the `danger` variant
**When** used
**Then** it appears only for the confirmed-delete state from Story 2.1, never as a first-tap button

### Story 2.4: Restyle Empty States

As a user,
I want empty Today/Backlog/Completed views to feel calm and plain,
So that an empty list doesn't feel like a broken screen.

**Acceptance Criteria:**

**Given** `EmptyState.tsx`'s current inline styles and old tokens
**When** restyled
**Then** it uses Tailwind utilities and the new Graphite Violet tokens

**Given** the Today section with zero tasks
**When** displayed
**Then** it shows short plain copy (e.g. "Nothing here yet") with no illustration or emoji

**Given** the Backlog section with zero tasks
**When** displayed
**Then** it shows short plain copy (e.g. "Backlog is clear") with no illustration or emoji

**Given** the Completed page with zero completed tasks
**When** displayed
**Then** its existing empty-state copy/link ("View active tasks") is preserved but restyled to the new tokens

## Epic 3: Everywhere & Everyone — Responsive, Navigation & Accessibility

Restyles `Sidebar`/`BottomNav` to the new tokens, adds the keyboard-reorder fallback, and verifies WCAG 2.1 AA compliance, touch-target sizing, and the mobile/desktop breakpoint strategy across everything built in Epics 1–2.

### Story 3.1: Restyle Sidebar & BottomNav

As a user,
I want the desktop sidebar and mobile bottom nav to match the calm Graphite Violet visual language,
So that navigation feels like the same product as the task list.

**Acceptance Criteria:**

**Given** `Sidebar.tsx`
**When** restyled
**Then** it uses Graphite Violet tokens instead of the current amber styling
**And** the active nav item shows via `--accent-soft` background (no bright active-color chrome)

**Given** `BottomNav.tsx`
**When** restyled
**Then** it uses Graphite Violet tokens
**And** the active tab is distinguished only by accent color, not size or added labels

**Given** both components' current amber/emerald Tailwind utility classes
**When** restyled
**Then** no such ad hoc color utilities remain for branding/active-state purposes

### Story 3.2: Responsive Breakpoint & Touch Target Compliance

As a user,
I want the same calm interface to work equally well on my phone and my desktop,
So that switching devices never feels like switching apps.

**Acceptance Criteria:**

**Given** a viewport ≤767px
**When** the app renders
**Then** `BottomNav` shows, `Sidebar` hides, and layout is single-column

**Given** a viewport ≥768px
**When** the app renders
**Then** `Sidebar` shows, `BottomNav` hides, with no distinct tablet-only layout

**Given** the drag handle, checkbox, and row tap area on mobile
**When** measured
**Then** each meets at least 44×44px

**Given** the CSS approach
**When** implemented
**Then** it uses mobile-first Tailwind media queries and no fixed-pixel layout widths

### Story 3.3: Keyboard-Accessible Reorder Fallback

As a user,
I want to reprioritize a task using only the keyboard,
So that priority-setting isn't locked to mouse or touch.

**Acceptance Criteria:**

**Given** a `TaskRow` focused via keyboard
**When** the user triggers the arrow-key reorder shortcut (consistent with `@dnd-kit`'s `KeyboardSensor`)
**Then** the task moves up/down within its section
**And** `recalcScores()`/`reorderTasks()` runs the same as a pointer drag

**Given** a focused task at the top/bottom edge of its section
**When** moved further via keyboard
**Then** it crosses the Today/Backlog divider and its status updates (promote/demote), consistent with Story 1.7

**Given** a keyboard reorder
**When** performed
**Then** the same quiet settle feedback from Story 1.9 applies — no distinct style for keyboard vs. pointer

**Given** a screen reader user
**When** a keyboard reorder occurs
**Then** the new position/section is announced via an ARIA live region

### Story 3.4: Accessibility Pass — Contrast, Focus, and Semantics

As a user,
I want every interactive element to have a visible focus state and proper semantic markup,
So that the app is fully operable and legible without a mouse or perfect vision.

**Acceptance Criteria:**

**Given** any interactive element (row, quick-add, drag handle, checkbox, buttons, nav items)
**When** focused via keyboard
**Then** a visible `--accent` outline appears

**Given** all text/background pairs introduced across Epics 1-2
**When** checked
**Then** they meet WCAG AA contrast at their defined sizes

**Given** task list markup
**When** inspected
**Then** it uses semantic HTML (list semantics, real `<button>`/`<input>` elements) rather than div-soup

**Given** the three core journeys (Add, Reprioritize, Review & Complete)
**When** performed using only a keyboard
**Then** each can be completed start to finish without a mouse

### Story 3.5: Responsive & Accessibility Test Coverage

As a user (and future maintainer),
I want automated tests to catch responsive and accessibility regressions,
So that the calm, accessible experience doesn't silently break over time.

**Acceptance Criteria:**

**Given** the existing Playwright suite in `tests/e2e/`
**When** new specs are added
**Then** they verify the mobile/desktop breakpoint switch and touch-target sizing via viewport emulation

**Given** an accessibility scanning tool (e.g. axe-playwright)
**When** integrated into the suite
**Then** it runs automated a11y checks against the Single Stream page, `TaskDrawer`, and Completed page

**Given** the three core journeys
**When** tested
**Then** automated specs cover Add, Reprioritize (drag or keyboard), and Review & Complete at both breakpoints

**Given** test output
**When** the suite runs
**Then** reports write to `_bmad-output/test-artifacts/` and no hardcoded base URLs are used
