# Story 3.3: Keyboard-Accessible Reorder Fallback

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to reprioritize a task using only the keyboard,
so that priority-setting isn't locked to mouse or touch.

## Acceptance Criteria

1. **Given** a `TaskRow` focused via keyboard, **when** the user triggers the arrow-key reorder shortcut (consistent with `@dnd-kit`'s `KeyboardSensor`), **then** the task moves up/down within its section, **and** `reorderTasks()` (with `setSortMode("manual")`) runs the same as a pointer drag. [Source: epics.md#Story 3.3; FR21; UX-DR14]
2. **Given** a focused task at the top/bottom edge of its section, **when** moved further via keyboard, **then** it crosses the Today/Backlog divider and its status updates (promote → `next`, demote → `backlog`) via `moveTask()`, consistent with Story 1.7. [Source: epics.md#Story 3.3; FR17]
3. **Given** a keyboard reorder, **when** performed, **then** the same quiet settle feedback from Story 1.9 applies, with no distinct style for keyboard vs. pointer. [Source: epics.md#Story 3.3; NFR7; NFR8]
4. **Given** a screen reader user, **when** a keyboard reorder occurs, **then** the new position/section is announced via an ARIA live region. [Source: epics.md#Story 3.3; NFR5; UX-DR13]

### How the ACs are interpreted (so review can check them)

- **"TaskRow focused" → its drag handle.** The row `div` isn't focusable. Its keyboard entry point is the handle (`aria-label="Reorder task"`), which already gets `tabIndex=0`, `role="button"`, `aria-roledescription="sortable"`, and `aria-describedby` from `useSortable().attributes`. Tab order per row: handle → complete → edit → delete.
- **"Arrow-key reorder shortcut consistent with KeyboardSensor"** is dnd-kit's built-in flow, **Space/Enter to pick up → ↑/↓ to move → Space/Enter to drop, Esc to cancel**. Don't invent a second shortcut (such as Alt+↑); two keyboard models for one action is worse for a11y and isn't what the AC says. (Tab also drops: it's in dnd-kit's default `end` codes.)
- **"Announced"** means the live region carries a human sentence with the **task title**, the **1-based position**, the **section total**, and the **section name**. Example: "Buy milk moved to position 2 of 3 in Today." The dnd-kit default ("Draggable item k3f9… was dropped over droppable area x7…") reads raw IDs and does **not** satisfy the AC.

## Tasks / Subtasks

- [x] Task 1: Extract the drop resolution into a pure helper (AC: #1, #2, #4)
  - [x] New `lib/reorder/resolve-drop.ts` exports `resolveDrop(input): DropResult | null`, a pure function with no React or store imports. It gets the logic now inline in `app/page.tsx` `handleDragEnd`, lines 48-83:
    ```ts
    export type Section = "today" | "backlog";
    export interface ResolveDropInput {
      activeId: string;
      overId: string;
      today: string[];      // current Today ids, in rendered order
      backlog: string[];    // current Backlog ids, in rendered order
      isKeyboard: boolean;
    }
    export type DropResult =
      | { kind: "reorder"; section: Section; orderedIds: string[] }
      | { kind: "move"; section: Section; status: "next" | "backlog"; orderedIds: string[] };
    ```
    - `overId` `"today-dropzone"`/`"backlog-dropzone"` maps to that section (unchanged).
    - Return `null` when `activeId === overId`, when the source or destination is unknown, or when an index is < 0 (all unchanged).
    - Same section: `arrayMove(list, oldIndex, newIndex)` (import `arrayMove` from `@dnd-kit/sortable`, as page.tsx does now) → `kind: "reorder"`.
    - Cross section: the destination ids with `activeId` inserted at `indexOf(overId)`, or pushed if `overId` is the dropzone → `kind: "move"`, `status: section === "today" ? "next" : "backlog"`.
    - **The one behavior change (keyboard only):** when `isKeyboard && destination === "today" && source === "backlog"` and `overId` is a Today task, insert **after** it (`index + 1`), not before. The reason is below, under "Why keyboard promote needs index + 1". **Pointer drops keep insert-before exactly as they are**, because `drag-across-divider.spec.ts` 1.7-E2E-001 depends on it.
  - [x] Export a second pure helper from the same file: `describePosition(result, activeId, section)` → `{ position: number; total: number; sectionLabel: "Today" | "Backlog" }`, where position is `orderedIds.indexOf(activeId) + 1` and total is `orderedIds.length`.
  - [x] Use `@/*` imports only, strict types, no `any`.

- [x] Task 2: Wire the helper into `app/page.tsx` (AC: #1, #2, #3)
  - [x] Add `onDragStart` to `DndContext`. It records `isKeyboardDragRef.current = event.activatorEvent instanceof KeyboardEvent` (a `useRef<boolean>(false)`). `DragStartEvent` and `DragEndEvent` both carry `activatorEvent`. Using the ref keeps one source of truth for `handleDragEnd` and the announcements (Task 3).
  - [x] Rewrite `handleDragEnd` so it calls `resolveDrop({ activeId, overId, today: todayTasks.map(t => t.id), backlog: backlogTasks.map(t => t.id), isKeyboard: isKeyboardDragRef.current })`. On `null` → return. Otherwise `setSortMode("manual")`, then `reorderTasks(orderedIds)` for `"reorder"` or `moveTask(activeId, status, orderedIds)` for `"move"`. **Keep the ordering of the calls as it is now** (`setSortMode` first). Delete the now-unused `sectionOf`.
  - [x] **Don't change** the sensors (`PointerSensor` `distance: 4`, `KeyboardSensor` + `sortableKeyboardCoordinates`) or `collisionDetection={closestCenter}`. They're already right for keyboard.
  - [x] AC #3 needs **no styling work**. Keyboard drags use the same `useSortable` `transform`/`transition` (the settle) and the same `isDragging` → `shadow-2xl` as pointer drags, and a cross-section move re-mounts the row, so the 1.9 `task-enter` animation plays. **Don't add** any keyboard-specific class, ring, or `data-*` style. The existing `focus-visible` ring on the handle (added in 3.2) is focus, not a drag style, and stays.

- [x] Task 3: Human announcements through dnd-kit's live region (AC: #4)
  - [x] Pass `accessibility={{ announcements, screenReaderInstructions }}` to `DndContext`. **Don't** build a separate `aria-live` element. DndContext already renders one (`role="status" aria-live="assertive" aria-atomic="true"`, visually hidden, `id="DndLiveRegion-N"`) and speaks whatever the `announcements` callbacks return.
  - [x] Build `announcements: Announcements` (type from `@dnd-kit/core`) inside `HomePage`, so it closes over the current `todayTasks`/`backlogTasks` (they don't change during a drag). Look up titles by id. For the `onDragOver`/`onDragEnd` positions, call `resolveDrop` with `isKeyboardDragRef.current`, so **what is spoken is exactly what is committed**:
    - `onDragStart`: "Picked up {title}. Position {p} of {n} in {Section}."
    - `onDragOver`: over a task or dropzone → "{title} will move to position {p} of {n} in {Section}." If `resolveDrop` returns null (over itself) → "{title} is at its original position." If there's no `over` → "{title} is not over a list."
    - `onDragEnd`: → "{title} moved to position {p} of {n} in {Section}." Null → "{title} dropped at its original position."
    - `onDragCancel`: "Reorder cancelled. {title} returned to position {p} of {n} in {Section}."
    - If the title lookup fails (the task was deleted mid-drag), use "Task" and never the raw id.
  - [x] `screenReaderInstructions.draggable`: "To reorder, press Space or Enter to pick up the task. Use the up and down arrow keys to move it, including across the Today and Backlog divider. Press Space or Enter to drop, or Escape to cancel." This is what the handle's `aria-describedby` points to.
  - [x] The copy is plain and has no exclamation marks, in the product's quiet voice (NFR7).

- [x] Task 4: Explicit activator node in `components/tasks/DraggableTaskList.tsx` (AC: #1, #2)
  - [x] Take `setActivatorNodeRef` from `useSortable` and pass it down: add an optional `dragHandleRef?: (el: HTMLElement | null) => void` prop to `TaskRow`, applied as `ref={dragHandleRef}` on the handle `div`. Then dnd-kit's `RestoreFocus` returns focus to the **handle** after a keyboard drop. It needs this most after a cross-section move, because the row unmounts from one `SortableContext` and mounts in the other (same id), and focus would otherwise fall to `<body>`.
  - [x] The TaskRow change is **only** the new prop and the `ref`. Leave the 3.2 classes, `div.group`, the aria-labels, and `touch-none` alone.
  - [x] Keep `DraggableTaskList`'s inline `style={{ transform, transition, zIndex }}`. It's @dnd-kit's documented transform channel (the 1.9 comment in `globals.css` says so) and is an accepted exception to the no-inline-style rule.

- [x] Task 5: E2E coverage in the new `tests/e2e/keyboard-reorder.spec.ts` (AC: #1–#4)
  - [x] Import `test`/`expect` from `../support/merged-fixtures`, and use `page.goto('/')`. Add tasks with `getByPlaceholder('Add a task...')` + Enter, then wait for `getByText(title)`, the same as `responsive-layout.spec.ts`. Use default desktop viewports (no viewport override).
  - [x] Write the tests in Dev Notes → Testing Requirements.
  - [ ] Run: `npx playwright test tests/e2e/keyboard-reorder.spec.ts tests/e2e/drag-across-divider.spec.ts tests/e2e/task-reorder.spec.ts --project=chromium`. **If it's blocked by the known hydration/dev-server hang** (every task-dependent spec since 2.1 is), don't debug the server. Record it in the Debug Log, add a `deferred-work.md` entry, leave this subtask unchecked, and close out. This is standing guidance from Zeyad. Report exactly which tests passed.

- [x] Task 6: Static verification
  - [x] `npx tsc --noEmit` → exit 0. `npm run lint` → clean.
  - [x] `grep -n "sectionOf" app/page.tsx` → nothing, and `grep -rn "resolveDrop" app lib` → the definition and the page usages only.

## Dev Notes

### Current state (read before touching anything)

- **`app/page.tsx`** (147 lines, `"use client"`) already registers **both** sensors. The `PointerSensor` has an `activationConstraint: { distance: 4 }`, and the `KeyboardSensor` has `coordinateGetter: sortableKeyboardCoordinates`. So **Space → ↑/↓ → Space already physically works** on the handle today. Nobody has verified it, it has no tests, and it has two defects (below). `handleDragEnd` holds the same-section/cross-section resolution inline, with `sectionOf(id)`. It renders `<DndContext sensors collisionDetection={closestCenter} onDragEnd>` wrapping the Today `<section>`, the `SectionDivider`, and the Backlog `<section>`, with **no `accessibility` prop**. That means the default announcements with raw ids are spoken today.
- **`components/tasks/DraggableTaskList.tsx`** (82 lines): `SortableTaskRow` uses `useSortable({ id })` and spreads `{...attributes, ...listeners}` into `TaskRow`'s `dragHandleProps`. It doesn't use `setActivatorNodeRef`. Each section has its own `SortableContext` (`verticalListSortingStrategy`). `SectionDropZone` (`useDroppable`) exists only when a section is empty (`today-dropzone`/`backlog-dropzone`).
- **`components/tasks/TaskRow.tsx`** (after 3.2): the handle `div` spreads `dragHandleProps` and then sets `aria-label="Reorder task"` (which overrides nothing, since dnd-kit sets no label) with `HANDLE_CLASS` (`touch-none`, 44/32px, `focus-visible` accent ring). Completed rows render no handle.
- **`stores/task-store.ts`**: `reorderTasks(orderedIds)` rewrites `position` for the listed ids and saves. `moveTask(id, status, orderedIds)` sets the status and destination positions, renumbers the source section, runs `recalcScores()`, and saves. **Don't change the store.** Both are already the "same as a pointer drag" path the AC requires.
- **`hooks/useTasks.ts`**: `useTodaySectionTasks`/`useBacklogSectionTasks` split `useSortedTasks()` by `isTodayTask`. Those are the rendered orders that `resolveDrop` must receive.

### How dnd-kit 6.3.1 / sortable 8.0.0 keyboard dragging actually behaves (verified in `node_modules`)

- `defaultKeyboardCodes`: `start: [Space, Enter]`, `cancel: [Esc]`, `end: [Space, Enter, Tab]`.
- `sortableKeyboardCoordinates` on ↑/↓ collects **all enabled droppables in the DndContext** above or below the active rect, **across both `SortableContext`s**, picks the closest with `closestCorners`, and moves the active rect onto that droppable's rect (with a zero offset when it's a different container). So pressing ↓ on the **last Today** row targets the **first Backlog** row (or `backlog-dropzone` if Backlog is empty), and pressing ↑ on the **first Backlog** row targets the **last Today** row. **AC #2's divider crossing comes for free.** The `SectionDivider` isn't a droppable, so it's skipped.
- On drop, `over` comes from `closestCenter`, which picks the droppable the active rect was just placed on.
- `RestoreFocus` (core, on by default): after a **keyboard** drag ends, if focus has left the activator, it focuses the first focusable element in `activatorNode ?? node` for that id, one frame later. `draggableNodes` cleanup is keyed, so the re-mounted row in the other section is the one it finds. Task 4 makes the target explicit.
- DndContext always renders its own visually hidden live region and `DndDescribedBy-N` instructions node. `accessibility.announcements` / `screenReaderInstructions` override the text. `accessibility.restoreFocus` defaults to true; don't pass `false`.

### Why keyboard promote needs index + 1 (the one logic change)

The resolution is "insert the active task **before** `over`". That's fine for pointer drops (the user aims at a slot) and for keyboard demote: ↓ from the last Today row → `over` = the first Backlog row → insert at 0, so it becomes the **first** in Backlog, right under the divider. But for keyboard promote, ↑ from the first Backlog row → `over` = the **last** Today row → insert-before makes it **second-to-last** in Today. The task jumps over the row it was never next to, and the only way to put it last is a second, same-section move. With `index + 1` for keyboard promote:
- ↑×1 → last in Today, ↑×2 → second-to-last, and so on. Each press moves exactly one slot.
- It mirrors demote (↓×1 → first in Backlog, ↓×2 → second, …).

Same-section keyboard moves go through `arrayMove(old, new)`, which is already one slot per press.

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| Pointer cross-section insert-**before**-over; pointer same-section `arrayMove`; `setSortMode("manual")` before the store call | `drag-across-divider.spec.ts` 1.7-E2E-001/002/003, `task-reorder.spec.ts`, `complete-from-backlog.spec.ts` |
| `div.group` row root, the `aria-label="Reorder task"` handle, `touch-none` on the handle | all row specs, `responsive-layout.spec.ts` 3.2-E2E-004/006 |
| `today-dropzone`/`backlog-dropzone` ids and `EmptyState` inside them | `drag-across-divider`, `empty-states` |
| `DraggableTaskList`'s inline transform/transition style (the settle) and `isDragging` shadow | Story 1.9 `quiet-motion.spec.ts` |
| No toast, modal, or banner on reorder. The live region is visually hidden. | NFR7, `quiet-motion.spec.ts` |

### Scope boundaries: what NOT to touch

- **Story 3.4:** focus-ring audit, contrast, `<ul>/<li>` list semantics, the task title in the handle's accessible name ("Reorder task" is kept, since seven specs depend on it; the live region carries the title), and the QuickAddBar `aria-label`.
- **Story 3.5:** axe, and core-journey specs at both breakpoints.
- The store, `useTasks.ts`, the sensors, the collision detection, and `recalcScores`.
- The pre-existing `isTodayTask` quirk (deferred `EPIC1-R02`): an **overdue** task demoted to `backlog` still renders in Today, because its due date qualifies it. A keyboard demote of an overdue task will look like a no-op. That's the same as pointer behavior today, and out of scope; see Question 2.
- No new dependencies. There's no unit runner (Jest/Vitest) in `package.json`, and adding one would need Zeyad's approval (a dev-story HALT condition). Cover `resolveDrop` through E2E.

### Previous story intelligence (3.2 / 3.1 / Epic 2)

- **3.2** made the handle 44px (mobile) / 32px (md+), added `touch-none` and an accent `focus-visible` ring, and turned the TaskRow class strings into `*_CLASS` constants. Build on that, don't redo it.
- **3.2 gotcha:** in TSX, a `{/* … */}` comment containing `p-*/m-*` ends early at `*/` and breaks the parse. Avoid `*/` inside comments.
- **E2E reality:** every task-dependent spec since 2.1 has timed out on the quick-add input because `<main>` stays on `HydrationSkeleton` against the :3000 dev server (PID 4072). 3.2's shell-only tests passed. **All of this story's tests need tasks, so expect them to be blocked.** Write them fully anyway, and don't investigate the server (memory: `feedback_no_local_server_debugging`).
- **2.4 lesson:** assert positive values (the exact announcement text, and `document.activeElement` having `aria-label="Reorder task"` inside the right row), not "is not X".
- **Git:** only `b2d374d` + `29cf79a`. All Epic 1–3.2 work is uncommitted in the working tree. Build on it and revert nothing.

### Latest tech notes

The versions are pinned per `project-context.md`, and no upgrades are needed.
- **@dnd-kit/core 6.3.1:** `DndContext` props `accessibility?: { announcements?: Announcements; screenReaderInstructions?: ScreenReaderInstructions; restoreFocus?: boolean; container?: Element }`. The `Announcements` callbacks `onDragStart({active})`, `onDragMove?`, `onDragOver({active, over})`, `onDragEnd({active, over})`, and `onDragCancel({active, over})` return `string | undefined`. `DragStartEvent.activatorEvent` / `DragEndEvent.activatorEvent` is the original `Event`.
- **@dnd-kit/sortable 8.0.0:** `useSortable` returns `setActivatorNodeRef`, `attributes` (`role`, `tabIndex`, `aria-disabled`, `aria-pressed`, `aria-roledescription`, `aria-describedby`), and `listeners` (`onPointerDown`, `onKeyDown`). `arrayMove` and `sortableKeyboardCoordinates` are exported.
- **Playwright 1.63:** use `locator.focus()` then `page.keyboard.press('Space')` / `'ArrowUp'` / `'ArrowDown'`. Wait about 50–100ms between key presses, because the KeyboardSensor moves on `keydown` and the next measurement follows a frame. `expect.poll` works for `document.activeElement` checks.

### Project Structure Notes

- **New:** `lib/reorder/resolve-drop.ts` (a pure helper; it follows `lib/prioritization/*` naming), and `tests/e2e/keyboard-reorder.spec.ts`.
- **Modified:** `app/page.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskRow.tsx` (the `dragHandleRef` prop only).
- Use `@/*` imports only (`@/lib/reorder/resolve-drop`), strict TS, and named exports. Keep `"use client"` on page and components. The lib file has no directive (it's pure).

### Testing Requirements

New spec: `tests/e2e/keyboard-reorder.spec.ts`. Test IDs use the `3.3-E2E-*` prefix.

```ts
const rows = (page: Page) => page.locator('div.group', { has: page.getByLabel('Reorder task') });
const handleOf = (page: Page, title: string) => rows(page).filter({ hasText: title }).getByLabel('Reorder task');
const liveRegion = (page: Page) => page.locator('[id^="DndLiveRegion"]');
async function key(page: Page, k: string) { await page.keyboard.press(k); await page.waitForTimeout(80); }
// Sections: Today rows are above the "BACKLOG" SectionDivider, Backlog rows below it at opacity .88.
```

To get a task into Backlog, use the keyboard itself (focus the handle → Space → ArrowDown until past the divider → Space). That's dogfooding, like 1.7's specs do with drags.

| Test ID | Priority | Scenario |
|---|---|---|
| `3.3-E2E-001` | P0 | Same-section reorder: add A, B, C (all go into Today). Focus A's handle, press Space, ArrowDown ×2, Space. The Today order is B, C, A. Reload the page, and the order is still B, C, A (persisted through `reorderTasks`, with sort mode manual). |
| `3.3-E2E-002` | P0 | Demote across the divider: with Today A, B and an empty Backlog, focus B's handle, press Space, ArrowDown, Space. B is below the `BACKLOG` divider, with `opacity-[0.88]`. `localStorage['task-manager:tasks']` has B with `status === "backlog"`. |
| `3.3-E2E-003` | P0 | Promote lands last in Today (the index+1 rule): with Today A, B and Backlog C (moved there via keyboard first), focus C's handle, press Space, ArrowUp, Space. The Today order is **A, B, C**, and C has `status === "next"`. |
| `3.3-E2E-004` | P1 | Focus survives a cross-section move: after the drop in 002, `document.activeElement` is the `Reorder task` handle inside B's row (poll for about 1s). |
| `3.3-E2E-005` | P0 | Announcements: during 002, after Space the live region contains "Picked up B" and "in Today". After Space again, it reads "B moved to position 1 of 1 in Backlog." At no point does its text contain B's raw id (read the id from localStorage and assert `not.toContainText(id)`). |
| `3.3-E2E-006` | P1 | Cancel: focus A, press Space, ArrowDown, Escape. The order is unchanged and the live region contains "Reorder cancelled". |
| `3.3-E2E-007` | P2 | No keyboard-specific style or feedback: during a keyboard drag, the dragging row has the same `shadow-2xl` class as for a pointer drag. After the drop, there's no `[role="alert"]`, no `[role="dialog"]`, and no element with the text "moved" that's visible (the live region is sr-only, so check `isVisible()` is false or that it has a 1px clip). |
| regression | P0 | `drag-across-divider.spec.ts` and `task-reorder.spec.ts`, whose pointer semantics are unchanged. Note: both still use `getByLabel('Add a task')` (the deferred aria-label regression), so they fail at quick-add regardless. Report that honestly. |

Run chromium first, and report cross-browser results honestly. If the environment blocks the run, apply the Task 5 guidance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] for the story and ACs. See also [#Requirements Inventory]: FR21 (keyboard reorder fallback), UX-DR14 (arrow-key reorder alongside dnd-kit), NFR5 (keyboard operability of Reprioritize), and FR17 (the divider crossing changes status).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy (lines 485-495)]: "drag-to-reorder needs a keyboard-accessible fallback (e.g. arrow-key reorder while a row is focused)". See also [#Feedback Patterns]: no toasts for routine actions.
- [Source: _bmad-output/project-context.md §2, §3, §5]: `"use client"`, dnd-kit in dedicated client components, `SortableContext` with string ids, no inline styling (dnd-kit transform excepted), and `@/*` imports.
- [Source: app/page.tsx:31-83 sensors + handleDragEnd, 116-142 DndContext], [components/tasks/DraggableTaskList.tsx:14-51], [components/tasks/TaskRow.tsx handle], [stores/task-store.ts:111-150 reorderTasks/moveTask], [hooks/useTasks.ts:33-62]
- [Source: node_modules/@dnd-kit/core/dist/core.esm.js:40-75 default announcements/instructions, 1098-1102 keyboard codes, 2689-2745 RestoreFocus], [node_modules/@dnd-kit/sortable/dist/sortable.esm.js:~670-760 sortableKeyboardCoordinates]
- [Source: _bmad-output/implementation-artifacts/3-2-responsive-breakpoint-and-touch-target-compliance.md]: the handle classes and the E2E blocker. [1-7-drag-across-the-divider-to-promote-or-demote-a-task.md]: the cross-section semantics. [deferred-work.md]: the hydration hang, the QuickAddBar aria-label, and `EPIC1-R02`.
- [Source: tests/e2e/drag-across-divider.spec.ts:1-125]: the pointer semantics that must not change.

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Keyboard promote position:** I chose "↑ from the top of Backlog lands **last** in Today" (index + 1, keyboard only). Pointer drops keep "insert before the row you drop on". Would you rather pointer promote also land after the target row when dropped from below? That would change 1.7's tested behavior, so it's not done here.
2. **Overdue tasks can't be demoted** (keyboard or pointer). `isTodayTask` pulls any overdue task back into Today whatever its status (`EPIC1-R02`, deferred since 1.6). Now that keyboard users will hit it too, and the announcement will say "moved to Backlog" while it visibly stays put, should it be fixed (e.g. a section should follow `status` only)?
3. **Handle accessible name:** it's "Reorder task" on every row, so a screen reader hears the same name repeatedly. "Reorder {title}" would be better, but seven specs locate rows by the exact label. Should 3.4 update the specs to `getByRole('button', { name: /^Reorder/ })` and add the title?

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- Red phase (`npx playwright test tests/e2e/keyboard-reorder.spec.ts --project=chromium`): 5/5 failed with `TimeoutError: locator.fill` on the quick-add input. They fail before any keyboard step, so the red phase **couldn't confirm the tests are correct against real behavior**. This is the known hydration hang.
- `npx tsc --noEmit`: exit 0. `npm run lint`: "No ESLint warnings or errors". `grep sectionOf app/page.tsx` matches only the helper's internal function, and `page.tsx` no longer has it. `resolveDrop` is referenced only by its definition and the page.
- Logic check (throwaway, in the scratchpad, not committed): I compiled `lib/reorder/resolve-drop.ts` with `tsc --module commonjs` and ran 10 `assert` cases in Node. Result: **10/10 passed**. They cover same-section `arrayMove`, keyboard demote → index 0, keyboard promote ↑×1 → last and ↑×2 → second-to-last, pointer promote insert-before (unchanged), the empty-dropzone push, `describePosition` (1 of 3, Backlog), and the null paths (over self, unknown active, unknown over). My first attempt hit a recursive require hook; I switched to `NODE_PATH`.
- Green-phase run (`keyboard-reorder` + `drag-across-divider` + `task-reorder`, chromium): 10/10 failed, all at `locator.fill` on the quick-add input. Per standing guidance, I didn't debug the server. I logged it in `deferred-work.md`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **`lib/reorder/resolve-drop.ts` (new):** a pure `resolveDrop()` that holds the drop resolution formerly inline in `handleDragEnd`. It's the same same-section and cross-section logic, plus one keyboard-only change: a keyboard promote inserts **after** the target Today row, so ↑ from the top of Backlog lands last in Today. Pointer drops still insert before the target. `describePosition()` gives the 1-based position and section. Deviation from the spec: it takes `(result, activeId)` rather than `(result, activeId, section)`, because the section is already in `result`.
- **`app/page.tsx`:** `onDragStart` records whether the drag is keyboard-driven, in a ref. `handleDragEnd` calls `resolveDrop` → `setSortMode("manual")` → `reorderTasks`/`moveTask`, in the same order as before. `sectionOf` is removed. `DndContext` gets `accessibility={{ announcements, screenReaderInstructions }}`. The announcements use the task title plus "position P of N in Today/Backlog", computed by the same `resolveDrop`, so the spoken result is the committed one. The title falls back to "Task" and never uses the raw id. The instructions describe Space/Enter, the arrows, the divider crossing, and Escape. The sensors and collision detection are unchanged, and there's no keyboard-specific styling (AC #3).
- **`DraggableTaskList.tsx` / `TaskRow.tsx`:** `setActivatorNodeRef` is passed down as the new `dragHandleRef` prop onto the handle, so dnd-kit's `RestoreFocus` targets the handle after a keyboard drop, including after the row re-mounts in the other section. Nothing else in TaskRow changed.
- **Verified:** tsc, lint, and the 10 pure-logic assertions. **Not verified in a browser:** all 5 keyboard E2E tests (the live-region text, focus restore, Escape cancel, and persistence) and the pointer regressions. They're blocked by the pre-existing hydration hang, so the Task 5 run subtask is left unchecked on purpose.

### File List

- `lib/reorder/resolve-drop.ts` (new)
- `app/page.tsx` (modified)
- `components/tasks/DraggableTaskList.tsx` (modified)
- `components/tasks/TaskRow.tsx` (modified: `dragHandleRef` prop only)
- `tests/e2e/keyboard-reorder.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-23: Story created via create-story workflow.
- 2026-09-23: Added keyboard reorder support. Moved the drop logic into the pure `resolveDrop` (a keyboard promote now lands last in Today), added title/position/section announcements through dnd-kit's live region, and made the handle the explicit activator so focus is restored. Added `keyboard-reorder.spec.ts`, which is blocked by the pre-existing hydration hang (deferred). The pure logic passes 10/10 Node assertions.
