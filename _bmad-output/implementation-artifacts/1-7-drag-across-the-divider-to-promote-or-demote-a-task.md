# Story 1.7: Drag Across the Divider to Promote or Demote a Task

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want dragging a task across the Today/Backlog divider to change its status,
so that reordering and promoting/demoting use one familiar gesture.

## Acceptance Criteria

1. **Given** a Backlog task, **when** dragged above the divider into Today and dropped, **then** its status becomes `"next"` and `recalcScores()` runs. [Source: epics.md#Story 1.7]
2. **Given** a Today task, **when** dragged below the divider into Backlog and dropped, **then** its status becomes `"backlog"` and `recalcScores()` runs. [Source: epics.md#Story 1.7]
3. **Given** a drag that starts and ends in the same section, **when** dropped, **then** only position changes — no status change. [Source: epics.md#Story 1.7]
4. **Given** a promote/demote drag completes, **when** the drop settles, **then** no confirmation dialog or toast appears. [Source: epics.md#Story 1.7]

## Tasks / Subtasks

- [x] Task 1: Add atomic `moveTask` store action to `stores/task-store.ts` (AC: #1, #2) — resolves `EPIC1-R01`
  - [x] **Why this is required, not optional:** `stores/task-store.ts` currently has `reorderTasks` (position-only, all-or-nothing over an `orderedIds` array) and `setStatus` (status-only, single task) as two separate calls, each its own `set()`/`saveTasks()`. Calling both back-to-back for a cross-divider drag would leave a moment where the store has updated status but not position (or vice versa), causing an incorrect intermediate render (`useTodaySectionTasks`/`useBacklogSectionTasks` re-derive section membership from `status`, independent of `position`) — this is exactly the risk documented as `EPIC1-R01` in `_bmad-output/test-artifacts/test-design-epic-1.md` (score 9, the highest-scored risk in the epic), whose mitigation is "design a single atomic store action... before Story 1.7 implementation begins."
  - [x] Add to the `TaskStore` interface (after `reorderTasks`): `moveTask: (id: string, newStatus: TaskStatus, orderedIds: string[]) => void;`
  - [x] Implement it as one `set()`/`saveTasks()` call, mirroring `reorderTasks`'s position-mapping pattern but also updating `status` for the single moved task:
    ```ts
    moveTask(id, newStatus, orderedIds) {
      const { tasks } = get();
      const positionMap = new Map(orderedIds.map((tid, i) => [tid, i]));
      const updated = recalcScores(
        tasks.map((t) => {
          const position = positionMap.has(t.id) ? positionMap.get(t.id)! : t.position;
          return t.id === id ? { ...t, status: newStatus, position } : { ...t, position };
        })
      );
      set({ tasks: updated });
      saveTasks(updated);
    },
    ```
  - [x] `orderedIds` is the caller-supplied **full ordered id list for the destination section only** (mirroring exactly what `reorderTasks` already receives for a same-section drag — see Task 3), including the moved task's id at its new index. This keeps the action's contract identical in shape to `reorderTasks`, just with an added status write for one task — do not attempt to reconcile cross-section position values globally; per Story 1.6's Dev Notes, `position` overlap between the Today/Backlog subsets is harmless since each section is rendered from its own filtered+sorted list.
  - [x] `newStatus` is always literally `"next"` (promote) or `"backlog"` (demote) when called from Task 3 — do not special-case other `TaskStatus` values here, this action is scoped to the Today/Backlog boundary only (not `"in-progress"`/`"completed"`).
  - [x] Do not touch `reorderTasks` or `setStatus` — both stay exactly as-is; `moveTask` is additive, not a replacement (`setStatus` is still used by `TaskRow`'s checkbox for complete/restore, unrelated to this story).

- [x] Task 2: Merge the two independent per-section drag contexts into one shared `DndContext` (AC: #1, #2, #3) — required architecture change, no AC states this directly but the feature is impossible without it
  - [x] **Why:** Since Story 1.6, `app/page.tsx` renders **two separate `<DraggableTaskList>` instances**, each owning its **own** `DndContext` (`id="today-tasks"` / `id="backlog-tasks"`) — see `components/tasks/DraggableTaskList.tsx:100-105` and `app/page.tsx:48,58`. `@dnd-kit` cannot detect or resolve a drop (`over`) across two separate `DndContext` trees — a drag started in one `DndContext` has no way to land on anything in a different `DndContext`. Cross-divider dragging is architecturally impossible under the current two-context structure; it must become **one** `DndContext` spanning both sections, each section as its own `SortableContext` within it. This is the standard `@dnd-kit` "multiple containers" pattern, scoped down (no `onDragOver` live-reparenting needed — see Task 3's rationale for why `onDragEnd`-only suffices here).
  - [x] **Refactor `components/tasks/DraggableTaskList.tsx`** — it stops owning the `DndContext`/sensors/`handleDragEnd`/`reorderTasks`/`setSortMode` (all of that moves to `app/page.tsx`, which already owns the two sections' data and is the natural place for drag orchestration spanning both). It becomes a **presentational-only** section renderer:
    - Remove imports: `DndContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`, `useSensor`, `useSensors`, `DragEndEvent`, `arrayMove`, `useTaskStore`.
    - Add import: `useDroppable` from `@dnd-kit/core`.
    - Remove the `id` prop from `DraggableTaskListProps` (it existed solely to give each old per-section `DndContext` a stable, distinct id, per Story 1.6 Task 2 — that SSR/hydration-mismatch risk no longer applies once there is exactly one `DndContext` app-wide).
    - `DraggableTaskList` becomes:
      ```tsx
      interface DraggableTaskListProps {
        tasks: Task[];
        isBacklog?: boolean;
        onEdit: (task: Task) => void;
      }

      export function DraggableTaskList({ tasks, isBacklog, onEdit }: DraggableTaskListProps) {
        return (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 py-1">
              {tasks.map((task) => (
                <SortableTaskRow key={task.id} task={task} isBacklog={isBacklog} onEdit={onEdit} />
              ))}
            </div>
          </SortableContext>
        );
      }
      ```
    - `SortableTaskRow` (the inner component using `useSortable`) is **unchanged** — it only needs to be inside *some* `DndContext` ancestor, which `app/page.tsx` now provides; it has no dependency on which component owns that context.
    - Add a new exported helper in this same file (it belongs next to the other drag primitives, not in `page.tsx`):
      ```tsx
      export function SectionDropZone({ id, children }: { id: string; children: ReactNode }) {
        const { setNodeRef } = useDroppable({ id });
        return <div ref={setNodeRef}>{children}</div>;
      }
      ```
      Add `import { ReactNode } from "react";` for its prop type. **Why this is needed:** when a section is empty, `app/page.tsx` renders `EmptyState` instead of `DraggableTaskList` — with no `SortableContext`/rows present, there is nothing registered as a drop target for that section, so a task dragged toward an empty section would have nowhere to land. `SectionDropZone` wraps the `EmptyState` in a minimal `useDroppable` region (id `"today-dropzone"` / `"backlog-dropzone"`) purely as a drop-target fallback — it renders no visible chrome of its own, `EmptyState`'s existing appearance is unchanged. Non-empty sections need no such wrapper: their rows are already valid drop targets via `useSortable` (which is itself droppable).

- [x] Task 3: Rebuild `app/page.tsx`'s drag orchestration to own the shared `DndContext` and implement cross-section `handleDragEnd` (AC: #1, #2, #3, #4)
  - [x] Move the sensors setup (`PointerSensor` with `activationConstraint: { distance: 4 }`, `KeyboardSensor` with `sortableKeyboardCoordinates`) from the old `DraggableTaskList.tsx` into `HomePage`, unchanged — same config, just relocated.
  - [x] Destructure `reorderTasks`, `setSortMode`, `moveTask` from `useTaskStore()` alongside the existing `addTask`, `settings` (5 total).
  - [x] Add a `sectionOf(id: string): "today" | "backlog" | null` helper that checks membership in the current `todayTasks`/`backlogTasks` arrays (already available via `useTodaySectionTasks()`/`useBacklogSectionTasks()`) — this is how source/destination section is determined, **not** by inspecting `@dnd-kit`'s internal container metadata (which is not reliably available for this multi-`SortableContext` shape). These arrays are stable for the duration of a single drag gesture (nothing else re-renders them mid-drag), so deriving everything inside `handleDragEnd` from their pre-drop snapshot is correct and needs no `onDragOver` handler — a deliberate simplification versus the canonical `@dnd-kit` multi-container example (which uses `onDragOver` to live-reparent the dragged item for a mid-drag visual preview across containers). No AC requires that live cross-container preview; within-section reflow (already required by NFR6) is untouched and still works exactly as before since same-section drags keep using `reorderTasks`/`arrayMove` unchanged.
  - [x] Implement `handleDragEnd`:
    ```tsx
    function handleDragEnd(event: DragEndEvent) {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      const sourceSection = sectionOf(activeId);
      if (!sourceSection) return;

      const destSection =
        overId === "today-dropzone" ? "today" :
        overId === "backlog-dropzone" ? "backlog" :
        sectionOf(overId);
      if (!destSection) return;

      setSortMode("manual");

      if (destSection === sourceSection) {
        // AC #3: same-section drag — position only, no status change (existing behavior, unchanged)
        const list = sourceSection === "today" ? todayTasks : backlogTasks;
        const oldIndex = list.findIndex((t) => t.id === activeId);
        const newIndex = list.findIndex((t) => t.id === overId);
        if (oldIndex < 0 || newIndex < 0) return;
        reorderTasks(arrayMove(list, oldIndex, newIndex).map((t) => t.id));
      } else {
        // AC #1/#2: cross-section drag — atomic status+position via moveTask
        const destList = destSection === "today" ? todayTasks : backlogTasks;
        const destIds = destList.map((t) => t.id);
        const insertAt = destIds.indexOf(overId);
        if (insertAt >= 0) destIds.splice(insertAt, 0, activeId);
        else destIds.push(activeId); // dropped on the empty-section dropzone
        moveTask(activeId, destSection === "today" ? "next" : "backlog", destIds);
      }
    }
    ```
  - [x] Wrap the existing Today `<section>`, `<SectionDivider>`, and Backlog `<section>` (all three — the divider must stay inside so `closestCenter` can still resolve rows on both sides of it as candidates) in one `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>`. Remove the two `id="today-tasks"`/`id="backlog-tasks"` props from the `<DraggableTaskList>` call sites (prop no longer exists per Task 2).
  - [x] Wrap each section's `EmptyState` branch in `<SectionDropZone id="today-dropzone">…</SectionDropZone>` / `<SectionDropZone id="backlog-dropzone">…</SectionDropZone>` respectively — only the empty-state branch, not the `DraggableTaskList` branch (which needs no wrapper, per Task 2).
  - [x] Import `DndContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`, `useSensor`, `useSensors`, `DragEndEvent` from `@dnd-kit/core`; `arrayMove`, `sortableKeyboardCoordinates` from `@dnd-kit/sortable`; `DraggableTaskList`, `SectionDropZone` from `@/components/tasks/DraggableTaskList`.
  - [x] AC #4 (no confirm dialog/toast) requires **no new code** — it's satisfied by not adding one; keep it that way (consistent with NFR7 and the existing quiet-feedback pattern already established in Stories 1.4/1.6). Do not add any transition/animation/confirmation here — quiet settle motion is explicitly Story 1.9's scope, not this one.

### Judgment call: scope boundary for `EPIC1-R02` (Today/Backlog membership ambiguity) — flag if this needs revisiting

`_bmad-output/test-artifacts/test-design-epic-1.md` flags `EPIC1-R02` (score 6, unresolved) and lists its verification test `1.7-E2E-005` as **"Blocked on clarification — documented, not yet executable."** The ambiguity: `isTodayTask()` (in `hooks/useTasks.ts`, built in Story 1.6, out of scope here) places a task in Today by **status** (`next`/`in-progress`) **or by date** (due today/overdue) regardless of stored status. A task with status `"backlog"` that's also due today is therefore rendered in Today. If a user drags that specific task down into Backlog, `moveTask` runs and correctly sets `status: "backlog"` (a no-op, since it already was) and updates `position` — but on the next render `isTodayTask()` will still return `true` for it (unchanged date-based OR clause), so it snaps straight back into the Today section, ignoring the drag.

This story does **not** attempt to resolve that ambiguity — doing so would mean changing `isTodayTask()`'s membership predicate, which no AC here authorizes and which is Story 1.6-owned logic. The four ACs above are unambiguous and fully covered by this design for the **normal** case: a task whose Today/Backlog section membership is driven by `status` alone (no qualifying due date) is exactly what `sectionOf()`/`moveTask()` handle correctly. The edge case above is a pre-existing, already-flagged limitation, not a regression introduced by this story — `1.7-E2E-005` stays **not required** for this story's Definition of Done, consistent with the test-design doc's own "blocked on clarification" status. If product/UX later resolves `EPIC1-R02`, revisit `isTodayTask()` in a follow-up, not here.

- [x] Task 4: Manual verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.
  - [x] `npm run dev`, fresh/empty task list. Add 2 tasks via `QuickAddBar` (both land in Today per Story 1.6's default). Drag one **into the empty Backlog section** (onto its `EmptyState`/dropzone) — confirm: it now renders in the Backlog section at `.88` opacity, Today's `EmptyState` does **not** appear (one task remains), `localStorage` shows `status: "backlog"` on the moved task. Confirm no dialog/toast appeared (AC #4).
  - [x] Drag the now-Backlog task back up **into Today** (onto the remaining Today row, or its empty state if Today is empty) — confirm `status: "next"` in `localStorage`, row renders above the divider at full opacity.
  - [x] Add a 3rd task, drag one Backlog task above another **within Backlog only** (both already in Backlog) — confirm only their relative order changes; `localStorage` shows both `status` values unchanged (AC #3).
  - [x] Repeat the same-section check within **Today only** with 2+ Today tasks — confirm status unchanged, matching existing `1.3-E2E-003` regression coverage.
  - [x] Confirm `recalcScores()` ran after a cross-section move: check that `priorityScore` values in `localStorage` are still internally consistent (non-zero, matching `calculatePriorityScore`'s expected output) immediately after the drop — not stale from before the move.
  - [x] Confirm zero console errors/warnings throughout (drag, drop, re-render) — the single shared `DndContext` replacing two is a meaningful structural change from Story 1.6 and must not reintroduce any hydration/duplicate-id warning.

- [x] Task 5: Playwright E2E coverage (AC #1–#4) + full regression re-run
  - [x] New file `tests/e2e/drag-across-divider.spec.ts`, using `test`/`expect` from `../support/merged-fixtures`, reusing the **real pointer-sequence drag technique** from `tests/e2e/task-reorder.spec.ts` (`page.mouse.move` → `down` → intermediate `move` with `steps` past the 4px `activationConstraint` → final `move` to the target row's bounding-box center → `up`; `locator.dragTo()` does not work, `@dnd-kit`'s `PointerSensor` doesn't listen for HTML5 drag events). Target tests, matching the epic's test-design IDs:
    - `1.7-E2E-001` (P0): drag a Backlog task's handle to a Today row (or Today's empty-state region) → task renders above the divider; confirm via `localStorage`/`page.evaluate` or an equivalent DOM check that its status is `"next"`.
    - `1.7-E2E-002` (P0): drag a Today task's handle to a Backlog row (or Backlog's empty-state region) → task renders below the divider at `.88` opacity; status `"backlog"`.
    - `1.7-E2E-003` (P1): same-section drag (two tasks both in Backlog, or both in Today) reorders position only — assert both tasks' section membership (opacity class) is unchanged before/after.
    - `1.7-E2E-004` (P2): after a promote/demote drag settles, assert no toast/dialog/banner element is present in the DOM (e.g. no `role="alertdialog"`, no new visible text beyond the row itself).
    - To get a task into Backlog for these tests, **use this story's own new drag-to-Backlog feature** (drag a Today-defaulted quick-added task down) rather than the `TaskDrawer` Status-select + Est.-Minutes-bug workaround from Stories 1.4/1.6 — it's simpler and doubles as dogfood coverage of AC #2.
  - [x] Re-run the full suite (`npx playwright test --workers=1`, all 3 browser projects) — confirm 100% pass, **especially** `tests/e2e/task-reorder.spec.ts` (`1.3-E2E-003`) and all of `tests/e2e/single-stream-layout.spec.ts` (`1.6-E2E-001`–`005`), since this story restructures the exact `DndContext`/`DraggableTaskList` wiring those tests exercise. Any regression here means the refactor broke existing drag/layout behavior, not just failed to add new behavior.

## Dev Notes

### Why this story is a real architecture change, not just new drag-end logic

Stories 1.3–1.6 treated `DraggableTaskList` as an atomic, self-contained "one list, one `DndContext`" unit — correct for those stories since Today/Backlog were never meant to interact yet (Story 1.6's Dev Notes explicitly say cross-section dragging is "not in scope here (that's Story 1.7)"). This story is where that boundary is crossed, and `@dnd-kit` requires a single shared `DndContext` for any cross-container drag to be detectable at all — there is no way to achieve AC #1/#2 by only editing `handleDragEnd`'s logic while leaving two separate `DndContext`s in place. Read `components/tasks/DraggableTaskList.tsx` and `app/page.tsx` in full before starting (both already listed as files to touch below) — Task 2/3 above describe the exact target shape.

### Previous story intelligence (1.6)

- `useTodaySectionTasks()`/`useBacklogSectionTasks()` (both in `hooks/useTasks.ts`, Story 1.6) already return each section's tasks pre-sorted via the "split-after-sort" design (filter `isTodayTask` over the single already-sorted `useSortedTasks()` output) — this story consumes them as-is, unchanged. Do not re-sort per section or call `sortTasks()` directly here.
- Pre-existing, unrelated `TaskForm` bug (Story 1.4, still unfixed, still out of scope): editing a task via `TaskDrawer` silently fails to save whenever "Est. Minutes" is empty. Not relevant to this story's own new tests (Task 5 avoids the edit-drawer flow entirely by dogfooding the new drag feature), but keep in mind if any manual check does use the drawer.
- No `components/ui/index.ts`/`components/tasks/index.ts` barrel exists — import everything by direct path, as shown above.
- Revert any temporary manual-verification scripts/renders before finishing; this story's changes to `stores/task-store.ts`, `components/tasks/DraggableTaskList.tsx`, and `app/page.tsx` are permanent/committed.

### Scope boundary: what NOT to touch

- `components/tasks/TaskRow.tsx` — no changes; its `isBacklog` opacity/checkbox/drag-handle rendering is already correct and unrelated to where the `DndContext` lives.
- `hooks/useTasks.ts` — no changes; `isTodayTask()`/`useTodaySectionTasks()`/`useBacklogSectionTasks()` are consumed as-is (see the `EPIC1-R02` judgment call above for why its predicate is deliberately left untouched).
- `stores/task-store.ts` — only the additive `moveTask` action (Task 1); `addTask`, `updateTask`, `deleteTask`, `reorderTasks`, `setStatus`, `togglePin`, `setSortMode`, `setPriority`, `addCategory` are all unchanged.
- `lib/prioritization/score.ts`, `lib/prioritization/sort.ts` — unchanged; `moveTask` reuses the existing exported `recalcScores`-equivalent pattern already used by every other store method (calls the store's internal `recalcScores` helper, not `sortTasks`).
- `components/ui/EmptyState.tsx`, `components/ui/SectionDivider.tsx` — consumed as-is, not modified; `SectionDropZone` (Task 2) wraps `EmptyState` without altering it.
- `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `app/completed/page.tsx`, `app/globals.css`, `app/layout.tsx` — unrelated, untouched.
- Story 1.9 (quiet motion) and Story 3.3 (keyboard-accessible reorder fallback across the divider) are explicitly later stories — this story's `handleDragEnd` already works identically for pointer and keyboard sensors (same `DragEndEvent` shape), so Story 3.3 builds on top of this story's structure rather than needing to redo it; do not add any Story-1.9-style settle-animation polish here, and do not add any keyboard-specific divider-crossing behavior beyond what the shared `KeyboardSensor` already provides for free.

### Project Structure Notes

- Files to touch: `stores/task-store.ts` (modified — new `moveTask` action), `components/tasks/DraggableTaskList.tsx` (modified — removes its own `DndContext`/sensors/`handleDragEnd`, becomes presentational, adds `SectionDropZone`), `app/page.tsx` (modified — gains the shared `DndContext`, sensors, `handleDragEnd`), `tests/e2e/drag-across-divider.spec.ts` (new).
- Conforms to `project-context.md`: `@/*` path alias for all imports, strict TypeScript (no `any`), `"use client"` stays on both `app/page.tsx` and `DraggableTaskList.tsx` (both use hooks/state/`@dnd-kit`). Any task addition/update/status-change **must** run through `recalcScores()` — `moveTask` follows this via the store's existing `recalcScores` helper, exactly like every other mutating store method.
- No unit-test framework exists yet (`EPIC1-R03`, tracked separately, not this story's concern) — `moveTask`'s correctness is verified via the E2E tests in Task 5 and the manual `localStorage` checks in Task 4, not a unit test.

### Testing Requirements

- `1.7-E2E-001`/`1.7-E2E-002` (P0) — the epic's sole P0 gate for this story: cross-divider drag sets the correct status in both directions. Per the test-design doc, these were previously "cannot be meaningfully executed until `EPIC1-R01`'s atomic action exists" — Task 1 resolves that dependency.
- `1.7-E2E-003` (P1) — same-section drag changes position only, the regression boundary for the new atomic action (confirms `moveTask` is never invoked when source/destination section match).
- `1.7-E2E-004` (P2) — promote/demote settles with no confirm/toast (NFR7).
- `1.7-E2E-005` — **not required** for this story; see the `EPIC1-R02` judgment call above.
- Full regression: `tests/e2e/task-reorder.spec.ts` and all 5 tests in `tests/e2e/single-stream-layout.spec.ts` must keep passing unmodified — confirm by actually re-running the full suite (`npx playwright test --workers=1`), not by inspection, since this story restructures the exact wiring those tests depend on.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7: Drag Across the Divider to Promote or Demote a Task] — story statement and all 4 acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows / Reprioritize a Task] — "Crossing the Today/Backlog divider during a drag is treated as a deliberate status change, not an error... This reuses the same gesture for two related actions (reorder + promote/demote) rather than requiring a separate control."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Feedback Patterns] — no toasts/banners/modals for routine actions (AC #4 / NFR7)
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md#EPIC1-R01] (score 9) — no atomic status+position store action exists; mitigation is exactly Task 1's `moveTask` design; "Before Story 1.7 implementation starts"
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md#EPIC1-R02] (score 6) — Today/Backlog membership ambiguity for date-driven-but-backlog-status tasks; `1.7-E2E-005` blocked on clarification — basis for this story's judgment call
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md] lines 132-133, 156-157 — P0/P1 test items `1.7-E2E-001`–`003` and their dependency on `EPIC1-R01`
- [Source: stores/task-store.ts:39,42,110-136] — existing `reorderTasks` (position-only) and `setStatus` (status-only) patterns `moveTask` is modeled on; neither is modified
- [Source: components/tasks/DraggableTaskList.tsx] — existing per-section `DndContext`/`handleDragEnd`/sensors (Story 1.3, extended by Story 1.6) being relocated/merged, not rewritten from scratch
- [Source: hooks/useTasks.ts:33-46,53-61] — `isTodayTask`, `useTodaySectionTasks`, `useBacklogSectionTasks` (Story 1.6), consumed as-is
- [Source: app/page.tsx] — current two-`DraggableTaskList`-instance structure (Story 1.6) being merged into one shared `DndContext`
- [Source: tests/e2e/task-reorder.spec.ts] — the real-pointer-sequence drag technique (`mouse.move`/`down`/`move` with `steps`/`up`) this story's new E2E tests reuse; `locator.dragTo()` does not work with `@dnd-kit`'s `PointerSensor`
- [Source: tests/e2e/single-stream-layout.spec.ts] — existing structural/opacity assertions this story's refactor must not break
- [Source: _bmad-output/implementation-artifacts/1-6-single-stream-home-layout-today-and-backlog-sections.md] — `isTodayTask`/section-hook design rationale, the two-`DraggableTaskList`-instance decision this story now merges, and the pre-existing `TaskForm` Est.-Minutes bug

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Implemented Story 1.7 — added atomic `moveTask(id, newStatus, orderedIds)` store action (resolves `EPIC1-R01`), merged the two independent per-section `DndContext`s into one shared `DndContext` in `app/page.tsx` with `DraggableTaskList` refactored to a presentational-only `SortableContext` renderer plus a new `SectionDropZone` helper for empty-section drop targets, and implemented cross-section `handleDragEnd` logic covering promote/demote (AC #1/#2) and same-section reorder (AC #3) with no added confirmation UI (AC #4). Added `tests/e2e/drag-across-divider.spec.ts` (4 tests). Verified via `tsc`, `eslint`, extensive manual browser verification (ad-hoc Playwright scripts, not committed), and the full Playwright suite (54/54 passing across chromium/firefox/webkit, zero regressions in Stories 1.3/1.4/1.6's pre-existing tests). Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors (checked after Tasks 1–3 and again as the final gate).
- `npm run lint` → no ESLint warnings or errors.
- Manual verification used ad-hoc Playwright scripts (not committed, deleted before finishing) against the pre-existing dev server on port 3000 (reused, not restarted), each starting from a `localStorage.clear()` + reload:
  - Backlog→Today drag: `status` became `"next"`, `.88` opacity removed, row rendered above the divider.
  - Today→Backlog drag: `status` became `"backlog"`, `.88` opacity applied (both `class` and computed `getComputedStyle().opacity === "0.88"`), row rendered below the divider.
  - Same-section drag within Today (3 tasks) and within Backlog (2 tasks, separate script): confirmed only `position`/render order changed, `status` values unchanged for all tasks in both cases.
  - Confirmed `recalcScores()` ran after a cross-section move (non-zero, updated `priorityScore` in `localStorage`, not stale).
  - Zero console errors/warnings across all manual runs — the single shared `DndContext` (replacing Story 1.6's two separate ones) did not reintroduce any hydration/duplicate-id warning.
  - All temporary verification scripts (`verify-1-7-tmp.js`, `verify-1-7-backlog.js`) deleted from the project root before finishing.
- **Test-authoring finding (not an app bug):** the first version of `tests/e2e/drag-across-divider.spec.ts` had 2 tests fail deterministically on repeated runs (`1.7-E2E-001`, `1.7-E2E-003`) — root cause was measuring/grabbing a drag target's `boundingBox()` immediately after a prior drag's DOM mutation, before `@dnd-kit`'s sibling-reflow `transform` transition (the live-reflow motion NFR6 requires) had settled, occasionally causing `over` to resolve to `null` (a correct no-op per `handleDragEnd`'s own guard, not a wrong move) and leaving the task exactly where it started. Fixed by adding a ~350ms `page.waitForTimeout` after any drag whose result feeds the next drag's position measurement — the same settle-time discipline the manual verification scripts already used via their own `waitForTimeout(300)` calls, and consistent with why prior stories' single-drag tests (`task-reorder.spec.ts`) never hit this (no follow-up measurement after their one drag).
- **Separate, pre-existing environment flake identified (not introduced by this story):** initial full-suite runs also intermittently failed a shifting subset of *unmodified* tests in `quick-add-bar.spec.ts`/`single-stream-layout.spec.ts` (neither touched by this story) on the `webkit` project only — root cause is `input.press('Enter')` occasionally not registering in this environment's WebKit driver before the next action runs, confirmed by reproducing it in isolation against those untouched files with zero drag-related code in the failure path. Hardened this story's own new test file by adding an explicit `await expect(...).toBeVisible()` after every quick-add before proceeding (matching the pattern already used elsewhere), which resolved it for this story's tests; the same flake in the two pre-existing files is out of this story's scope to fix and was not modified.
- `npx playwright test --workers=1` (all 3 browser projects) → **54/54 passed** on the final run: the new `tests/e2e/drag-across-divider.spec.ts` (4 tests × 3 browsers) plus every pre-existing spec (`task-reorder.spec.ts`, `quick-add-bar.spec.ts`, `single-stream-layout.spec.ts`, `tasks.spec.ts`, `api-tasks.spec.ts`) — all unmodified in behavior, all passing against the restructured shared-`DndContext` wiring, confirming zero regression from Stories 1.3/1.4/1.6.
- Generated test artifacts (`test-results/`, `_bmad-output/test-artifacts/playwright-report/`, `_bmad-output/test-artifacts/junit-results.xml`) deleted after the final run — not committed.
- Reused the same pre-existing, already-running dev server (port 3000) noted in Stories 1.4/1.5/1.6's sessions; did not start a new one.

### Completion Notes List

- `stores/task-store.ts`: added `moveTask(id, newStatus, orderedIds)` — one atomic `set()`/`saveTasks()` call updating both `status` (for the moved task only) and `position` (for every id in `orderedIds`, mirroring `reorderTasks`'s mapping pattern) through `recalcScores()`. Resolves `EPIC1-R01`; `reorderTasks`/`setStatus` and every other store method are unchanged.
- `components/tasks/DraggableTaskList.tsx`: removed its own `DndContext`/sensors/`handleDragEnd`/`reorderTasks`/`setSortMode` (relocated to `app/page.tsx`); now a presentational `SortableContext` + row-list renderer with no `id` prop (no longer needed once there's exactly one `DndContext` app-wide). Added and exported `SectionDropZone` (a thin `useDroppable` wrapper) as the empty-section drop-target fallback. `SortableTaskRow` itself is unchanged.
- `app/page.tsx`: now owns one shared `DndContext` (sensors relocated unchanged from the old `DraggableTaskList`) wrapping both the Today and Backlog sections plus the divider; added `sectionOf()` and `handleDragEnd()`, which route same-section drops through the existing `reorderTasks`/`arrayMove` path (AC #3, unchanged from Story 1.6/1.3 behavior) and cross-section drops through the new `moveTask` (AC #1/#2), with empty sections wrapped in `SectionDropZone` so a task can always be dropped even when the destination section is currently empty. No confirmation/toast UI was added (AC #4 — satisfied by omission, per NFR7).
- Added `tests/e2e/drag-across-divider.spec.ts` (4 tests: `1.7-E2E-001`–`004`, P0/P0/P1/P2) using the same real-pointer-drag technique as `task-reorder.spec.ts`; the new tests dogfood this story's own cross-section drag to get tasks into Backlog rather than the pre-existing `TaskForm` Est.-Minutes-bug workaround used by Stories 1.4/1.6's tests.
- `1.7-E2E-005` was not implemented, per the story's documented `EPIC1-R02` judgment call (Today/Backlog membership ambiguity for date-driven-but-backlog-status tasks remains an unresolved, pre-existing, out-of-scope limitation — see Dev Notes).
- No files outside this story's scope were modified: `components/tasks/TaskRow.tsx`, `hooks/useTasks.ts`, `lib/prioritization/*`, `components/ui/EmptyState.tsx`, `components/ui/SectionDivider.tsx`, `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `app/completed/page.tsx`, `app/globals.css`, and `app/layout.tsx` are all untouched.

### File List

- `stores/task-store.ts` (modified)
- `components/tasks/DraggableTaskList.tsx` (modified)
- `app/page.tsx` (modified)
- `tests/e2e/drag-across-divider.spec.ts` (new)
