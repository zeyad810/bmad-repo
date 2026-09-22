# Story 1.3: Task Row Component (replaces TaskCard)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want each task shown as a single quiet row,
so that my list feels calm instead of cluttered with colored borders and mixed iconography.

## Acceptance Criteria

1. **Given** an active task, **when** rendered as a `TaskRow`, **then** it shows drag handle, `PriorityDot`, title, optional mono due/meta tag, and checkbox, **and** no colored left border, no colored ring, and no emoji are rendered. [Source: epics.md#Story 1.3]
2. **Given** a `TaskRow` is hovered, **when** the pointer is over it, **then** its background becomes `--surface-2` with no layout shift. [Source: epics.md#Story 1.3]
3. **Given** a `TaskRow` is being dragged, **when** active, **then** it shows subtle elevation/shadow with no colored ring (replacing the current amber ring glow). [Source: epics.md#Story 1.3]
4. **Given** a completed task, **when** rendered, **then** its title is faded (`--text-dim`) and struck through. [Source: epics.md#Story 1.3]
5. **Given** an overdue task, **when** rendered, **then** only its meta tag reflects overdue state, **and** the row background/border does not change color. [Source: epics.md#Story 1.3]
6. **Given** a `TaskRow` in the Backlog section, **when** displayed, **then** it renders at `.88` opacity relative to a Today row. [Source: epics.md#Story 1.3]
7. **Given** the drag handle and checkbox, **when** inspected, **then** the handle has `aria-label="Reorder task"` and the checkbox has `aria-label="Mark complete"` or `aria-label="Restore task"`. [Source: epics.md#Story 1.3]
8. **Given** the existing `@dnd-kit` wiring, **when** `TaskRow` replaces `TaskCard`, **then** drag-and-drop reordering keeps working without regression. [Source: epics.md#Story 1.3]

## Tasks / Subtasks

- [x] Task 1: Build the `TaskRow` component (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `components/tasks/TaskRow.tsx` (`"use client"` — it calls `useTaskStore` and handles click events). Props: `{ task: Task; dragHandleProps?: React.HTMLAttributes<HTMLDivElement>; isDragging?: boolean; isBacklog?: boolean; onEdit?: (task: Task) => void }`. No `index` prop (the numeric badge it fed is removed) and no `showDragHandle` prop (this component has one caller now; derive handle visibility from `task.status !== "completed"`).
  - [x] Render exactly this anatomy, single row: drag handle (`GripVertical`, `aria-label="Reorder task"`, hidden when completed) → `PriorityDot` (import from `@/components/ui/PriorityDot`, built in Story 1.2 — do not reimplement priority→color logic) → title (`truncate`; `text-[var(--text-dim)] line-through` when completed) → at most one optional mono meta tag → complete/restore button (`aria-label="Mark complete"` or `aria-label="Restore task"`, calls `setStatus`) → edit button (calls `onEdit`, same trigger as today) → delete button (same `window.confirm()` + `deleteTask` call as today — do not change this interaction; see Dev Notes).
  - [x] Remove everything not in the anatomy above (none of it is in UX-DR4's defined `TaskRow` content list): the priority label pill/theme colors, the 3px colored left border, the numeric index badge (`01`, `02`...), the description preview/expand-collapse toggle, the per-tag hashtag chips, and the estimated-minutes chip.
  - [x] Colors: every color must resolve to a `--bg`/`--surface`/`--surface-2`/`--border`/`--text`/`--text-dim`/`--accent`/`--accent-soft`/`--pri-*` token (e.g. `bg-[var(--surface)]`, `text-[var(--text-dim)]`) — **zero** hardcoded hex values and **zero** `amber-*`/`rose-*`/`emerald-*`/`zinc-*` Tailwind palette utilities anywhere in this file (NFR1 / UX-DR1, binding on every Epic-1-touched file).
  - [x] Spacing: row container uses `px-4 py-3` and internal `gap-3` (16/12/12px — all 8pt-grid steps); no arbitrary spacing values (NFR2).
  - [x] States: hover → `hover:bg-[var(--surface-2)]` (no layout shift, AC #2). Dragging (`isDragging`) → shadow/elevation only, e.g. `shadow-2xl` — **no `ring-*` utility of any color** (AC #3). Backlog (`isBacklog` true) → `opacity-[0.88]` on the row root (AC #6; `.88` isn't a spacing value, so the arbitrary-value exception from Story 1.2's `h-[7px]`/`w-[7px]` precedent applies here too).

- [x] Task 2: Wire `TaskRow` into `DraggableTaskList`, replacing `TaskCard` (AC: #7, #8)
  - [x] In `components/tasks/DraggableTaskList.tsx`, import `TaskRow` instead of `TaskCard` and render it in place of `TaskCard`. Drop the `index` prop threading (no longer consumed).
  - [x] Preserve the existing `@dnd-kit` wiring exactly as-is: `DndContext`, sensors (`PointerSensor` distance-4, `KeyboardSensor`), `SortableContext`, `useSortable`, `arrayMove`, `handleDragEnd` calling `setSortMode("manual")` + `reorderTasks(...)`. This story is a rendered-component swap only — do not change any drag logic.
  - [x] `app/page.tsx`'s usage of `DraggableTaskList` (including its `onEdit` callback wiring) needs no changes.

- [x] Task 3: Manual verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.
  - [x] `npm run dev` and visually confirm on the home page's "Your queue" list: default row, hover (`--surface-2`, no shift), dragging (mouse-drag a row — elevation/shadow, no colored ring), a completed task's title fade+strikethrough (temporarily flip one task to `"completed"` via React/Redux devtools or a throwaway render — do not leave `app/page.tsx` changed), an overdue meta tag (set a past due date on a task via the existing `TaskDrawer`/`TaskForm` edit flow — the quick-capture form on `/` has no due-date field), and the `isBacklog` `.88`-opacity variant via a temporary render + full revert (nothing in the app passes `isBacklog` yet; that wiring arrives in Story 1.6, same pattern Story 1.2 used for its own isolated manual check).
  - [x] Confirm `components/tasks/TaskCard.tsx` and `app/completed/page.tsx` show **zero diff** in `git status`/`git diff`, and manually click through `/completed` to confirm it still renders using the untouched `TaskCard`.

- [x] Task 4: Add a Playwright E2E regression test for drag-and-drop reordering (AC #8; test ID `1.3-E2E-003`, the epic's sole P0 gate for this story)
  - [x] New file `tests/e2e/task-reorder.spec.ts`, using `test`/`expect` from `../support/merged-fixtures` (same pattern as `tests/e2e/tasks.spec.ts`).
  - [x] This app has no seed/API layer (pure localStorage) — create at least 2 tasks through the real UI (the quick-capture title input + submit button on `/`), then drag one to reorder it.
  - [x] **Do not use `locator.dragTo()`** — it fires HTML5 drag events, which `@dnd-kit`'s `PointerSensor` doesn't listen for. Simulate a real pointer drag: `page.mouse.move()` to the handle, `page.mouse.down()`, one or more intermediate `page.mouse.move()` calls past the 4px `activationConstraint` (see `DraggableTaskList.tsx`), then move to the target row and `page.mouse.up()`.
  - [x] Target the handle via `page.getByLabel('Reorder task')` (the aria-label added in Task 1) — no new `data-testid` needed.
  - [x] Assert the rendered task-title order changed to match the drag, confirming `reorderTasks`/`setSortMode("manual")` still fire through the swapped component.
  - [x] Ignore `tests/support/factories/task-factory.ts` for seeding — it models an unrelated `Task` shape (`status: 'todo'|'in-progress'|'completed'`, `priority: 'low'|'medium'|'high'`) that doesn't match this app's real `@/types` `Task` and isn't wired to app state. It's pre-existing unused scaffolding; not in scope to fix here.
  - [x] Run `npm run test:e2e` and confirm this new spec plus the existing `tests/e2e/tasks.spec.ts` and `api-tasks.spec.ts` all still pass.

## Dev Notes

### Critical regression guardrail: `TaskCard.tsx` has TWO call sites — only one is in scope

`TaskCard` is currently imported by both `components/tasks/DraggableTaskList.tsx` (the home-page queue, in scope) **and** `app/completed/page.tsx:10,44` (`<TaskCard key={task.id} task={task} index={index} showDragHandle={false} onEdit={...} />`, restyling the Completed archive is explicitly Epic 2 scope per `epics.md`'s FR11 coverage map — "Epic 2 - Completed archive uses restyled TaskRow/EmptyState"). Deleting or breaking `TaskCard.tsx`'s exported interface would break `/completed` with no story assigning its fix. **Do not delete, rename, or modify `TaskCard.tsx`.** Build `TaskRow.tsx` as a new, separate file; only `DraggableTaskList.tsx` switches to it. `app/completed/page.tsx` keeps using the old `TaskCard` (old amber/emerald visuals) until its own Epic 2 story restyles it — this inconsistency between `/` and `/completed` is expected and correct for this story.

### Judgment calls made in this story (flag if product/UX disagrees)

- **Blocked-task indicator**: the Epic 1 test design (`test-design-epic-1.md`, Assumption #3) flags this as an open question — no Story 1.3 AC addresses it, but none contradicts current behavior (FR9 blocked-flagging) either. This story folds the existing "Blocked" signal into the row's single mono meta-tag slot (quiet text, `--text-dim`, no colored pill/lock icon), rather than dropping it or inventing new colored chrome. Revisit if a future story says otherwise.
- **Overdue meta-tag styling**: the Graphite Violet token set has no dedicated danger/warning color, and `--accent` is reserved for priority/focus signal only (per the Visual Foundation's "the accent hue is the only saturated color in the system"). Do not invent a new red/amber hex value for "overdue." Differentiate the overdue tag by its **text** (e.g. `"Overdue · Mar 3"`), still in `--text-dim` — satisfies AC #5 ("only its meta tag reflects overdue state") without a new color token.
- **"Tap row to open TaskDrawer for edit"** (mentioned only in the UX spec's Component Strategy, not in any epics.md AC) is **not** implemented here — the existing explicit edit-icon-button behavior (`onEdit`) is kept unchanged to avoid introducing an untested interaction change beyond what any AC requires.
- **Delete icon**: interaction is unchanged (`window.confirm()` → `deleteTask`) — Epic 2 Story 2.1 owns replacing this with the in-place confirm pattern. Only its *color* changes here, from rose/red to a quiet ghost treatment, because UX-DR12 ("danger reserved only for the confirmed-delete state, never a first-tap button") applies epic-wide and this story is retokenizing every color in the file anyway.

### Token replacement map (old `TaskCard.tsx` → new `TaskRow.tsx`)

| Old (banned) | New |
| --- | --- |
| `border border-white/[0.08] bg-[#17191c]` | `border border-[var(--border)] bg-[var(--surface)]` |
| `hover:border-white/[0.16] hover:bg-[#1a1c20]` | `hover:bg-[var(--surface-2)]` |
| `ring-2 ring-amber-400/70` (dragging) | drop entirely; use `shadow-2xl` (or similar) only, no ring |
| `text-zinc-100` / `text-zinc-500` / `text-zinc-600` | `text-[var(--text)]` / `text-[var(--text-dim)]` |
| `PRIORITY_THEMES` map + colored label pill | `<PriorityDot priority={task.priority} />` (Story 1.2) |
| `bg-rose-400/10 text-rose-300` (delete hover) | `hover:bg-[var(--surface-2)]`, icon `text-[var(--text-dim)]` |
| `text-emerald-400` / `hover:bg-emerald-400/10` (complete button) | `text-[var(--text-dim)]` default; `hover:bg-[var(--surface-2)]` |
| `bg-amber-400/10 text-amber-300` (due-today tag) | `text-[var(--text-dim)]` mono tag, no background color |

### `@dnd-kit` wiring — do not touch drag logic

`DraggableTaskList.tsx`'s `DndContext`/sensors/`handleDragEnd` are correct and unrelated to this story's scope — Story 1.3 only swaps which component `SortableTaskCard` (rename to `SortableTaskRow` if you like — cosmetic) renders inside its `useSortable` wrapper. The wrapper's own `transform`/`transition`/`zIndex` styling stays on the outer `<div>` in `DraggableTaskList.tsx`, not inside `TaskRow` — `TaskRow`'s `isDragging` prop only controls its own shadow/elevation classes.

### Previous story intelligence (1.1, 1.2)

- Tokens from Story 1.1 (`--pri-high/med/low`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, etc.) and `PriorityDot` from Story 1.2 are complete and additive but **uncommitted** per `git status` (working tree has `app/globals.css`, `app/layout.tsx` modified and `components/ui/PriorityDot.tsx` untracked) — build directly on top, do not redefine or duplicate. [Source: app/globals.css:51-63]
- No unit/component test framework exists (`vitest` absent, `EPIC1-R03` still open) — that's why Task 4 above uses Playwright E2E (already fully configured, unlike 1.1/1.2's stories which had nothing to test against). Component-level scenarios (`1.3-COMPONENT-*`: rendering, aria-labels, hover/dragging visual states) remain blocked on an undecided component-testing approach — out of scope here; Task 3's manual verification substitutes, same as Stories 1.1/1.2.
- Both prior stories fully reverted every temporary manual-verification render before finishing, and stopped the dev server afterward — do the same.
- No `components/ui/index.ts` or `components/tasks/index.ts` barrel exists — import `TaskRow` and `PriorityDot` by direct path.

### Project Structure Notes

- Files to touch: `components/tasks/TaskRow.tsx` (new), `components/tasks/DraggableTaskList.tsx` (modified), `tests/e2e/task-reorder.spec.ts` (new).
- Explicitly out of scope (do not modify): `components/tasks/TaskCard.tsx`, `app/completed/page.tsx`, `app/page.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `components/ui/Badge.tsx`, `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/EmptyState.tsx`, `stores/task-store.ts`, `lib/prioritization/score.ts`, `lib/prioritization/sort.ts`, `app/globals.css`, `app/layout.tsx`.
- Conforms to `project-context.md`: `@/*` path alias for all imports, strict TypeScript (`Task`/`TaskPriority` from `@/types`, never `any`), no direct `localStorage` access (this component doesn't need any — all persistence goes through `useTaskStore`).

### Testing Requirements

- `1.3-E2E-003` (P0, drag-and-drop regression) is in scope this story — Task 4. This is the epic's only P0 gate for Story 1.3 and the only reason automated testing appears here where 1.1/1.2 had none: Playwright is already fully configured (`playwright.config.ts`, `tests/e2e/`), unlike `vitest`.
- `1.3-COMPONENT-001/002/003` (core rendering, completed fade/strikethrough, aria-labels) and the P2 visual-state checks (hover/dragging/overdue/backlog-opacity) remain blocked on the project's undecided component-testing approach (`EPIC1-R03`-adjacent dependency) — covered by Task 3's manual verification instead, consistent with how Stories 1.1/1.2 handled the same gap.
- The P3 "priority inferable from list position, not color alone" check (AC #3 of Story 1.2, reused here since `TaskRow` is the actual consumer) is manual/exploratory QA, not automated — no action needed beyond keeping `PriorityDot` as the only color signal on the row.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Task Row Component (replaces TaskCard)] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TaskRow (replaces the current TaskCard)] — anatomy, states, accessibility rule
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Implementation Strategy] — "TaskCard is renamed/replaced by TaskRow; DraggableTaskList is updated... keeping the existing @dnd-kit wiring intact"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Button Hierarchy] — danger reserved only for confirmed-delete state
- [Source: _bmad-output/project-context.md#Critical Don'ts / Anti-Patterns] — no inline styling, no hardcoded colors, `@/*` aliases
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md] — `1.3-E2E-003`/`1.3-UNIT-*`/`1.3-COMPONENT-*` test IDs, EPIC1-R03/R04 risk links, Assumption #3 (blocked-task treatment), "Interworking & Regression" table confirming `DraggableTaskList`'s `@dnd-kit` wiring is the only regression surface
- [Source: components/tasks/TaskCard.tsx] — current implementation being replaced (for `DraggableTaskList`'s usage only — file itself stays, see Dev Notes)
- [Source: components/tasks/DraggableTaskList.tsx] — existing `@dnd-kit` wiring to preserve unchanged
- [Source: app/completed/page.tsx:10,44] — second `TaskCard` call site that must remain unbroken and unmodified
- [Source: components/ui/PriorityDot.tsx] — Story 1.2's component, consumed as-is
- [Source: app/globals.css:51-63] — Story 1.1's `:root` token block
- [Source: tests/e2e/tasks.spec.ts, tests/support/merged-fixtures.ts, tests/support/factories/task-factory.ts, playwright.config.ts] — existing Playwright setup and its factory/type mismatch
- [Source: _bmad-output/implementation-artifacts/1-1-establish-graphite-violet-design-tokens-and-type-scale.md] — token availability and out-of-scope file list precedent
- [Source: _bmad-output/implementation-artifacts/1-2-priority-dot-component.md] — `PriorityDot` API, temporary-render-and-revert manual verification pattern, direct-import convention

## Change Log

- 2026-09-21: Story created via create-story workflow.
- 2026-09-21: Implemented Story 1.3 — built `TaskRow`, wired it into `DraggableTaskList` replacing `TaskCard`, and added a Playwright drag-and-drop regression test. Verified via `tsc`, `eslint`, an isolated temporary render of all 6 states (fully reverted), a live end-to-end drag check, and the full Playwright suite (12/12 passing across chromium/firefox/webkit). Status moved to review.
- 2026-09-21: Addressed `code-review` findings — 4 resolved: `PriorityDot` now falls back to `medium` for an unrecognized priority value; `TaskRow`'s title/meta-tag now use the `text-body`/`text-meta` type-scale tokens instead of hardcoded `text-[15px]`/`text-[12px]`; `app/layout.tsx` moved the Manrope/JetBrains Mono `.variable` classes from `<body>` to `<html>` so `--font-sans`'s `var(--font-manrope)` reference resolves at the element that declares it (previously guaranteed-invalid, though consequence-free, on `<html>` itself); the E2E drag test now drops onto the target row's own bounding-box center instead of a fixed +20px offset from the handle. 1 finding (deduplicating `formatDue` between `TaskCard`/`TaskRow`) was deliberately not actioned — the two implementations already return different shapes for different reasons (TaskCard needs `isOverdue`/`isToday` for color; TaskRow dropped color-coding by design), and unifying them would require editing the explicitly out-of-scope `TaskCard.tsx`. Re-verified: `tsc`, `eslint`, and the full Playwright suite (12/12) all pass.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors (both before and after reverting the temporary verification block)
- `npm run lint` → no ESLint warnings or errors
- Temporary render of 6 `TaskRow` states (`default`, `completed`, `overdue`, `backlog-opacity`, `dragging`) in `app/page.tsx` + `curl` of the SSR'd HTML confirmed: drag handle correctly hidden on the completed row; `aria-label="Reorder task"` and `aria-label="Mark complete"`/`"Restore task"` render exactly as specified; `Overdue · Jan 1` meta tag renders with no color (only `--text-dim`); `opacity-[0.88]` class present on the backlog row; `shadow-2xl` present with **no** `ring-*` class on the dragging row; zero `amber-*`/`rose-*`/`emerald-*`/`zinc-*` classes anywhere in the new markup. Compiled CSS (`.next/static/css/app/layout.css`) cross-checked to confirm `opacity: 0.88`, `--surface-2` hover rules, `shadow-2xl`, and `--pri-med`/`--pri-low` all actually generated. Temporary render fully reverted — `git diff` on `app/page.tsx` shows zero changes.
- Ad-hoc Playwright script (not committed) drove a real pointer drag against the live dev server and confirmed two added tasks ("Task A", "Task B") swap order — validated the exact drag simulation approach before authoring the permanent spec.
- `npx playwright test --workers=1` (all 3 browser projects) → 12/12 passed, including the new `tests/e2e/task-reorder.spec.ts`. (A single webkit run under 4 parallel workers showed one flaky "element is not enabled" failure on the add-task button click, reproduced as a resource-contention timing issue — it passed in isolation and passed again under `--workers=1`; not a functional regression.)
- Confirmed via `git status`/`git diff` that `components/tasks/TaskCard.tsx` and `app/completed/page.tsx` have zero changes; `curl`'d `/completed` to confirm it still renders correctly (empty state) using the untouched `TaskCard`.
- Dev server process stopped after verification (confirmed port 3000 released).

### Completion Notes List

- Created `components/tasks/TaskRow.tsx`: drag handle (`aria-label="Reorder task"`, hidden when completed) → `PriorityDot` (Story 1.2, reused as-is) → title (truncated; `--text-dim` + strikethrough when completed) → at most one optional mono meta tag (blocked text takes precedence over the due-date tag; overdue rendered as `"Overdue · {date}"` text with no new color, since the token set has no danger/warning color) → complete/restore button (`aria-label="Mark complete"`/`"Restore task"`) → edit button → delete button. Every color resolves to a `--surface`/`--surface-2`/`--border`/`--text`/`--text-dim`/`--pri-*` token; no hardcoded hex or `amber-*`/`rose-*`/`emerald-*`/`zinc-*` utilities remain.
- Removed from the old `TaskCard` anatomy (per UX-DR4's defined content list): the priority label pill, the 3px colored left border, the numeric index badge, the description preview/expand toggle, the per-tag hashtag chips, and the estimated-minutes chip.
- Delete button keeps its exact `window.confirm()` → `deleteTask` interaction (Epic 2 Story 2.1 owns replacing this); only its color changed to a quiet ghost treatment per UX-DR12.
- Updated `components/tasks/DraggableTaskList.tsx` to import and render `TaskRow` instead of `TaskCard` (renamed the internal `SortableTaskCard` wrapper to `SortableTaskRow`, dropped the now-unused `index` prop). All `@dnd-kit` wiring (`DndContext`, sensors, `SortableContext`, `useSortable`, `handleDragEnd`) is untouched.
- Did **not** touch `components/tasks/TaskCard.tsx` or `app/completed/page.tsx` — `TaskCard` still has a second, out-of-scope call site there (Epic 2 territory) and remains fully functional and unmodified.
- Added `tests/e2e/task-reorder.spec.ts` (test ID `1.3-E2E-003`): creates two tasks via the real UI, simulates a pointer-based drag (not `locator.dragTo()`, which is incompatible with `@dnd-kit`'s `PointerSensor`) via the row's `aria-label="Reorder task"` handle, and asserts the rendered order changes — the epic's sole P0 regression gate for this story, now automated since Playwright (unlike vitest) is already fully configured in this project.
- No component-test framework work was added — `1.3-COMPONENT-*` scenarios remain blocked on the project's undecided component-testing approach, unchanged from Stories 1.1/1.2; covered here by the manual temporary-render verification instead.
- Cleaned up all temporary/generated artifacts from this session: the `app/page.tsx` verification block (fully reverted), the ad-hoc drag-verification script, and Playwright's local `test-results/`/report output.

### File List

- `components/tasks/TaskRow.tsx` (new)
- `components/tasks/DraggableTaskList.tsx` (modified)
- `tests/e2e/task-reorder.spec.ts` (new)
