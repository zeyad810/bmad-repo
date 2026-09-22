# Story 1.6: Single Stream Home Layout — Today & Backlog Sections

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want one continuous list with a Today section and a Backlog section instead of separate capture/stats/queue panels,
so that the app matches how I actually think about my tasks — one ranked stack.

## Acceptance Criteria

1. **Given** the home page, **when** it renders, **then** it shows (top to bottom): `QuickAddBar`, Today section (tasks with status `next`/`in-progress`, or due today/overdue), `SectionDivider`, Backlog section (remaining active tasks with status `backlog`), **and** this replaces the current quick-capture panel, stats grid, and flat queue. [Source: epics.md#Story 1.6]
2. **Given** Today tasks, **when** displayed, **then** they follow the existing "recommended" sort (pinned first, then `priorityScore` descending). [Source: epics.md#Story 1.6]
3. **Given** Backlog tasks, **when** displayed, **then** they use the same `TaskRow` and ordering logic, at `.88` opacity. [Source: epics.md#Story 1.6]
4. **Given** zero Today tasks, **when** displayed, **then** the Today `EmptyState` shows instead of an empty gap. [Source: epics.md#Story 1.6]
5. **Given** a task is added via `QuickAddBar`, **when** created, **then** its status defaults to `"next"` (Today) rather than `"backlog"`, matching the UX spec's Add flow. [Source: epics.md#Story 1.6]

## Tasks / Subtasks

- [x] Task 1: Add Today/Backlog section hooks to `hooks/useTasks.ts` (AC: #2, #3)
  - [x] **Extract, don't duplicate:** `useTodayTasks()` already contains the exact Today-membership predicate AC #1 needs (`status === "in-progress" | "next"`, or a valid `dueDate` that `isToday`/`isPast`) — pull its inline filter callback out into a standalone exported function `export function isTodayTask(task: Task): boolean { ... }` (identical logic, zero behavior change), then have `useTodayTasks()` call `tasks.filter(isTodayTask)`. Verify `useTodayTasks()`'s existing behavior is unchanged after this refactor (it stays unused-elsewhere, that's fine — same as `useRecommendedTasks`/`useSortedTasks` were unused before Story 1.4).
  - [x] Add two new exported hooks, **both built on top of the existing `useSortedTasks()`** (not on raw `tasks`, and not by calling `sortTasks` again):
    ```ts
    export function useTodaySectionTasks() {
      const activeTasks = useSortedTasks();
      return useMemo(() => activeTasks.filter(isTodayTask), [activeTasks]);
    }
    export function useBacklogSectionTasks() {
      const activeTasks = useSortedTasks();
      return useMemo(() => activeTasks.filter((t) => !isTodayTask(t)), [activeTasks]);
    }
    ```
  - [x] **Why split-after-sort, not sort-after-split (read fully — this is the load-bearing design decision for AC #2/#3):** `useSortedTasks()` already sorts *all* active tasks once by `settings.sortMode` ("recommended" by default = pinned first + `priorityScore` descending; "manual" after any drag anywhere in the app = raw `position` ascending, matching `reorderTasks`). Splitting that single already-correctly-ordered array into Today/Backlog by `isTodayTask` preserves each subset's *relative* order exactly — a Today task's position relative to other Today tasks, and a Backlog task's position relative to other Backlog tasks, are both untouched by the split, regardless of any `position`-value overlap *between* the two subsets (harmless, since they render in separate lists and no AC requires cross-section order coherence — that's explicitly Story 1.7 territory). Do **not** call `sortTasks()` a second time per section — that would duplicate logic that's already correctly applied, and calling it with each section's own subset (rather than all active tasks together) is unnecessary since the split-after-sort already yields the right per-section order.

- [x] Task 2: Add Backlog-opacity pass-through and a stable `DndContext` id to `DraggableTaskList` (AC: #3)
  - [x] `TaskRow.tsx` already has an `isBacklog?: boolean` prop (built in Story 1.3, never wired to a caller) — do **not** modify `TaskRow.tsx`. Instead, add `isBacklog?: boolean` to `DraggableTaskListProps` and thread it through `SortableTaskRow` down to `<TaskRow isBacklog={isBacklog} ... />`.
  - [x] This story renders **two separate `<DraggableTaskList>` instances** on the same page (Today's and Backlog's), each with its own independent `@dnd-kit` `DndContext`/`SortableContext` — cross-section dragging (promote/demote across the divider) is explicitly **not** in scope here (that's Story 1.7; `EPIC1-R01`'s atomic status+position store action doesn't exist yet and isn't needed until then). Within-section dragging in each list must keep working exactly as today.
  - [x] Add a required `id: string` prop to `DraggableTaskListProps` and pass it to `<DndContext id={id} ...>`. `@dnd-kit`'s `DndContext` auto-generates internal ARIA-descriptor IDs; with two instances rendered simultaneously on one page and no app-level `DndContext` ID provider configured, un-differentiated auto-IDs risk an SSR/client hydration mismatch warning. Passing explicit, stable, distinct IDs per instance (e.g. `"today-tasks"` / `"backlog-tasks"` from the caller in `app/page.tsx`) avoids this — a small addition with no behavioral change to drag logic itself.

- [x] Task 3: Rebuild `app/page.tsx` as the Single Stream layout (AC: #1, #4, #5)
  - [x] **This story fully replaces `app/page.tsx`'s current top-level structure** — not just the 3 panels AC #1 names by example. Confirmed by `_bmad-output/test-artifacts/test-design-epic-1.md:351`: *"`app/page.tsx` (current pre-redesign home page) — Fully replaced by the Story 1.6 Single Stream layout."* This includes removing the "Good morning" / "Make room for focused work" hero header block and its active-task-count badge — AC #1's own "top to bottom" listing (`QuickAddBar`, Today section, `SectionDivider`, Backlog section) is exhaustive and starts directly with `QuickAddBar`, with no hero/greeting section anywhere in it, and the UX spec's Core Experience section describes the exact same 4-part structure with nothing preceding `QuickAddBar`. See Dev Notes' judgment-call section if this needs revisiting.
  - [x] New `HomePage` body, top to bottom, all direct children of one `<div className="space-y-6">` wrapper (24px gaps — an 8pt-grid step, NFR2 — a deliberate choice for major structural boundaries, larger than `DraggableTaskList`'s internal 16px row gap):
    1. `<QuickAddBar onAdd={handleQuickAdd} />` — unwrapped, no `surface-panel` card around it (it already has its own `border`/`bg`/`rounded-lg` treatment from Story 1.4).
    2. Today section: `useTodaySectionTasks()`'s result. If empty, render `<EmptyState title="Nothing here yet" />` (exact UX-spec-suggested copy — copy text itself isn't a "visual restyle," so it's fine to use ahead of Epic 2's `EmptyState.tsx` visual restyle, same "expected temporary inconsistency" precedent as Stories 1.3–1.5). Otherwise `<DraggableTaskList id="today-tasks" tasks={todayTasks} onEdit={handleEdit} />` (no `isBacklog`).
    3. `<SectionDivider label="BACKLOG" />` (always rendered, regardless of Backlog's emptiness — per Story 1.5's own AC #2, already built and verified).
    4. Backlog section: `useBacklogSectionTasks()`'s result. If empty, render `<EmptyState title="Backlog is clear" />` (also exact UX-spec copy; satisfies Story 1.5's AC #2 "renders above the Backlog EmptyState" for the first time in a real page). Otherwise `<DraggableTaskList id="backlog-tasks" tasks={backlogTasks} isBacklog onEdit={handleEdit} />`.
  - [x] `handleQuickAdd`: identical to Story 1.4's version **except** `status: "next"` instead of `status: "backlog"` (AC #5 — this is the one line that changes; everything else — `settings.defaultPriority`, the importance/urgency scoring fallback, `tags: []`, `dependencies: []`, `isPinned: false` — stays exactly as Story 1.4 left it).
  - [x] Remove now-unused code: the entire "Good morning" hero `<section>`, the "Quick capture"-panel wrapper `<div>` (its header content, not just its old form — the form itself was already replaced in Story 1.4), the "At a glance" stats-grid `<section>` and its `Stat` helper component, the old "Your queue" `<section>` wrapper and its hand-rolled empty-state markup. Remove now-unused imports as a result: `useStats`, `AlertTriangle`, `ArrowUpDown`, `CheckCircle2`, `Clock3`, `ListTodo`, `Sparkles`, `Timer` (verify each against the new file — some may still be needed if you choose to keep an icon in an `EmptyState`, which is optional and not required by any AC). Add new imports: `useTodaySectionTasks`, `useBacklogSectionTasks` (from `@/hooks/useTasks`), `SectionDivider` (from `@/components/ui/SectionDivider`), `EmptyState` (from `@/components/ui/EmptyState`).
  - [x] `useTaskStore()` destructure only needs `addTask` and `settings` now (no more raw `tasks` — the stats grid was its only consumer; `activeTasks`/`useSortedTasks()` is no longer called directly in `page.tsx` either, since `useTodaySectionTasks`/`useBacklogSectionTasks` now own that).

- [x] Task 4: Manual verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.
  - [x] `npm run dev` and confirm on a **fresh/empty task list**: both `EmptyState`s show ("Nothing here yet" above "BACKLOG" above "Backlog is clear"), `SectionDivider` renders between them even with nothing in either section. Verified via a fresh (localStorage-cleared) page load: all 4 elements visible, bounding-box `y`-positions confirmed strictly ascending (`QuickAddBar` → Today empty state → divider → Backlog empty state).
  - [x] Add a task via `QuickAddBar` — confirm it appears in the **Today** section (above the divider), not Backlog (AC #5). Confirm the Today `EmptyState` disappears once it has a task. Verified: task's row `y`-position above the divider's; Backlog empty state still showing; `localStorage` confirms `status: "next"` on the created task.
  - [x] Manually move a task to Backlog via the existing edit-icon → `TaskDrawer` → Status select (remember the pre-existing, unrelated `TaskForm` bug documented in Story 1.4's Dev Agent Record: fill "Est. Minutes" before saving, or the save silently no-ops) — confirm it renders in the Backlog section at visibly reduced (`.88`) opacity relative to Today rows. Verified: row gained `opacity-[0.88]` class, computed `opacity: 0.88`.
  - [x] Confirm drag-and-drop reorder still works **independently within each section** (drag within Today; separately, drag within Backlog) — both should settle and persist. Cross-section dragging (dragging a row across the divider) is expected to **not** change its section yet — that's Story 1.7; confirm it doesn't crash or corrupt state, but don't expect a status change. Verified: a real pointer drag within Today correctly reordered two rows, no console errors/warnings.
  - [x] Confirm the Today "recommended" sort: with 2+ Today tasks of differing priority (again via the edit-drawer priority workaround), confirm the higher-scoring one renders first, same technique/verification as Story 1.4's `1.4-E2E-001`. Verified: demoted one task to Low priority, added a second default-priority task — second task rendered first.
  - [x] **Additional check (not explicitly listed above but verified given this story's `DndContext` id change):** with both Today and Backlog sections simultaneously populated (2 live `DndContext` instances on one page), confirmed zero console warnings/errors on load or after reload — the `id` prop fix works as intended.

- [x] Task 5: Playwright E2E coverage (AC #1–#5) + full regression re-run
  - [x] New file `tests/e2e/single-stream-layout.spec.ts` (5 tests: `1.6-E2E-001` P0 through `1.6-E2E-005` P2), using `test`/`expect` from `../support/merged-fixtures`, matching the manually-verified technique from Task 4 exactly (bounding-box `y`-position order assertions for structural order; the edit-drawer + Est.-Minutes workaround for priority/status changes).
  - [x] Ran the full suite (`npx playwright test --workers=1`, all 3 browser projects) — **42/42 passed**, including this new file (5 tests × 3 browsers), the pre-existing `tests/e2e/task-reorder.spec.ts` (`1.3-E2E-003`), all 5 tests in `tests/e2e/quick-add-bar.spec.ts`, and `tasks.spec.ts`/`api-tasks.spec.ts` — all unmodified and all still passing against the restructured page, confirming no regression.

### Review Findings

- [x] [Review][Decision] Working tree combines Story 1.6 with Story 1.7 drag-and-drop architecture — accepted merged implementation by user decision
- [x] [Review][Patch] Add defensive trim/non-empty check to handleQuickAdd [app/page.tsx:111]
- [x] [Review][Patch] Assert non-null bounding boxes in E2E layout tests [tests/e2e/single-stream-layout.spec.ts:15-18]
- [x] [Review][Defer] Overdue Backlog tasks qualify as Today tasks via isTodayTask, creating drag status ambiguity [hooks/useTasks.ts:33-46] — deferred, pre-existing (EPIC1-R02)
- [x] [Review][Defer] Hardcoded priority score fallbacks in handleQuickAdd [app/page.tsx:113] — deferred, pre-existing

## Dev Notes

### Judgment call: removing the hero/greeting header (flag if product/UX disagrees)

AC #1 explicitly names only 3 things as replaced ("quick-capture panel, stats grid, and flat queue"), not the hero "Good morning" header. This story removes it anyway, because: (1) AC #1's own "top to bottom" listing is written as an exhaustive sequence — `QuickAddBar`, Today, `SectionDivider`, Backlog — with nothing preceding `QuickAddBar`; (2) the UX spec's Core Experience section describes the Single Stream main content area as starting directly with the persistent quick-add bar, no greeting mentioned; (3) `test-design-epic-1.md:351` states plainly that the *entire* current `app/page.tsx` is "fully replaced by the Story 1.6 Single Stream layout," not just the 3 named panels. If this reads as too aggressive a removal, it's a one-section revert, not a structural problem.

### Why `EPIC1-R02` (Today/Backlog membership ambiguity) is not a blocker for this story

The risk is specifically about *drag* behavior for a backlog-status-but-overdue task ("dragging such a row across the divider... has undefined behavior") — its own verification test is `1.7-E2E-005`, and its timeline note ("before Story 1.6/1.7 are marked done") tracks the *drag* resolution, not this story's *display* logic. AC #1's Today-membership predicate (status `next`/`in-progress`, **or** due today/overdue, regardless of stored status) is unambiguous for rendering purposes — it's exactly what `isTodayTask` (Task 1) already implements, unchanged. Story 1.6 does not drag anything across the divider (no cross-section `DndContext`), so the ambiguous scenario the risk describes cannot occur here. Do not attempt to "resolve" the ambiguity in this story — that's Story 1.7's job once the atomic status+position store action (`EPIC1-R01`) exists.

### Scope boundary: what NOT to touch

- `components/tasks/TaskRow.tsx` — its `isBacklog` prop already exists (Story 1.3); this story only needs to *pass* it through `DraggableTaskList`, never modify `TaskRow` itself.
- `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `app/completed/page.tsx` — unrelated, untouched.
- `stores/task-store.ts` — no store method changes. `addTask`'s signature and internal logic are unchanged; only the *caller's* payload in `app/page.tsx` changes one field value (`status: "next"` instead of `"backlog"`). `reorderTasks`/`setStatus` are called exactly as before, just from two independent `DraggableTaskList` instances instead of one.
- `lib/prioritization/score.ts`, `lib/prioritization/sort.ts` — unchanged; `sortTasks` is still called exactly once per render cycle (inside `useSortedTasks()`), not duplicated per section (see Task 1).
- `components/ui/EmptyState.tsx`, `components/ui/SectionDivider.tsx` — consumed as-is, not modified (their visual restyle, if any is even needed, is Epic 2/already-Story-1.5 territory respectively).
- `app/globals.css`, `app/layout.tsx` — no new tokens needed.

### Previous story intelligence (1.1–1.5)

- `useSortedTasks()` (Story 1.4) and `SectionDivider`/`EmptyState` pairing intent (Story 1.5) are the two load-bearing pieces this story assembles — both already built and verified in isolation; this story is primarily *wiring*, not new component design, apart from the two small `hooks/useTasks.ts` additions and `DraggableTaskList`'s `isBacklog`/`id` props.
- **Pre-existing, unrelated `TaskForm` bug (discovered in Story 1.4, still unfixed, still out of scope):** editing a task via `TaskDrawer` silently fails to save whenever "Est. Minutes" is empty (`valueAsNumber` → `NaN`, rejected by zod's `.optional()`, no visible error). Any manual or automated verification in this story that uses the edit-drawer flow (moving a task to Backlog, demoting a task's priority) must fill "Est. Minutes" first, exactly as Story 1.4's tests do. Do not fix this bug here either — still `TaskForm.tsx`, still out of scope.
- No `components/ui/index.ts`/`components/tasks/index.ts` barrel exists — import everything by direct path.
- Every prior story fully reverted temporary manual-verification renders and stopped ad-hoc scripts/dev servers it started before finishing — same discipline applies here, though this story's changes to `app/page.tsx` are permanent/committed (not a temporary render).

### Project Structure Notes

- Files to touch: `hooks/useTasks.ts` (modified), `components/tasks/DraggableTaskList.tsx` (modified), `app/page.tsx` (modified — substantial rewrite), `tests/e2e/single-stream-layout.spec.ts` (new).
- Explicitly out of scope: `components/tasks/TaskRow.tsx`, `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `components/ui/EmptyState.tsx`, `components/ui/SectionDivider.tsx`, `components/ui/PriorityDot.tsx`, `stores/task-store.ts`, `lib/prioritization/*`, `app/completed/page.tsx`, `app/globals.css`, `app/layout.tsx`.
- Conforms to `project-context.md`: `@/*` path alias for all imports, strict TypeScript (no `any`), `"use client"` stays on `app/page.tsx` (state/hooks) and `DraggableTaskList.tsx` (unchanged, already has it).

### Testing Requirements

- `1.6-E2E-001` (P0) — structural order: `QuickAddBar` → Today (or its empty state) → `SectionDivider` → Backlog (or its empty state). The epic's sole P0 gate for this story (FR15, "structural backbone of the whole redesign").
- `1.6-E2E-002`/`1.6-E2E-003` (P1) — quick-added task defaults to Today (`"next"` status); Today "recommended" sort order.
- `1.6-E2E-004`/`1.6-E2E-005` (P2) — Backlog `.88` opacity; Today empty-state visibility.
- The pre-existing `1.3-E2E-003` (`task-reorder.spec.ts`) and all 5 tests in `quick-add-bar.spec.ts` must keep passing unmodified — confirm by actually re-running the full suite, not by inspection alone.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6: Single Stream Home Layout — Today & Backlog Sections] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision / Implementation Approach] — "Main content area: persistent quick-add bar pinned at the top... then a 'Today'-equivalent priority section, then a quiet mono-label divider, then the Backlog section"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Empty states] — exact suggested copy: "Nothing here yet" / "Backlog is clear"
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md:58,131,151-158,175,276-282,351] — P0/P1/P2 test items for Story 1.6; `EPIC1-R02` risk detail and timeline; explicit note that `app/page.tsx` is "fully replaced" by this story
- [Source: hooks/useTasks.ts] — `useSortedTasks`, `useTodayTasks` (predicate to extract), both pre-built
- [Source: components/tasks/DraggableTaskList.tsx] — existing `@dnd-kit` wiring (`DndContext`, sensors, `handleDragEnd`) to extend with `isBacklog`/`id` props, not rewrite
- [Source: components/tasks/TaskRow.tsx] — `isBacklog` prop, already built (Story 1.3), unwired until now
- [Source: components/ui/SectionDivider.tsx] — Story 1.5's component, consumed as-is with `label="BACKLOG"`
- [Source: components/ui/EmptyState.tsx] — existing, unused-until-now component, consumed as-is
- [Source: app/page.tsx] — current structure being replaced
- [Source: stores/task-store.ts:73-85] — `addTask`'s unchanged signature/behavior; only the caller's `status` field value changes
- [Source: _bmad-output/implementation-artifacts/1-4-quick-add-bar-and-silent-no-op-capture.md] — `useSortedTasks()` design rationale, the pre-existing `TaskForm` Est.-Minutes bug and its workaround, the `1.4-E2E-001` position-proving test technique reused here
- [Source: _bmad-output/implementation-artifacts/1-5-section-divider-component.md] — `SectionDivider`'s `label`-prop API and its AC #2 (divider renders above empty Backlog), completed in situ by this story

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Implemented Story 1.6 — extended `hooks/useTasks.ts` with `isTodayTask`/`useTodaySectionTasks`/`useBacklogSectionTasks`, extended `DraggableTaskList` with `id`/`isBacklog` props, and fully rebuilt `app/page.tsx` as the Single Stream layout (QuickAddBar → Today → SectionDivider → Backlog), including the AC #5 status-defaults-to-`"next"` change. Added `tests/e2e/single-stream-layout.spec.ts`. Verified via `tsc`, `eslint`, extensive manual browser verification, and the full Playwright suite (42/42 passing across chromium/firefox/webkit, including zero regressions in Stories 1.3/1.4's pre-existing tests). Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors (checked after Tasks 1–3 and again as the final gate).
- `npm run lint` → no ESLint warnings or errors.
- Manual verification used ad-hoc Playwright scripts (not committed) against the pre-existing dev server on port 3000, each starting from a `localStorage.clear()` + reload for a genuinely fresh state:
  - Fresh-load structural order: all 4 elements (`QuickAddBar`, Today empty state, divider, Backlog empty state) visible with strictly ascending bounding-box `y`-positions.
  - Quick-add-to-Today: added a task, confirmed it rendered above the divider and `localStorage` showed `status: "next"` on the created task.
  - Backlog `.88` opacity: moved a task to Backlog via the edit-drawer Status select (using the Story 1.4-documented "fill Est. Minutes first" workaround for the still-unfixed, still out-of-scope `TaskForm` bug), confirmed `opacity-[0.88]` class and `getComputedStyle(...).opacity === "0.88"`.
  - Today recommended sort: demoted one task to Low priority, added a second default-priority task, confirmed the second rendered first.
  - Drag-and-drop regression: a real pointer drag within Today correctly reordered two rows with zero console errors.
  - `DndContext` id fix: with both Today and Backlog populated simultaneously (2 live `DndContext` instances on one page) and after a full reload, captured zero console warnings/errors — confirms the `id` prop addition (Task 2) prevents the SSR/hydration-mismatch risk it was meant to address.
- All temporary verification scripts deleted from the project root before finishing.
- `npx playwright test --workers=1` (all 3 browser projects) → **42/42 passed**: the new `tests/e2e/single-stream-layout.spec.ts` (5 tests × 3 browsers) plus every pre-existing spec (`task-reorder.spec.ts`, `quick-add-bar.spec.ts`'s 5 tests, `tasks.spec.ts`, `api-tasks.spec.ts`) — all unmodified, all still passing against the restructured page, confirming zero regression from Stories 1.3/1.4.
- Reused the same pre-existing, already-running dev server (port 3000) noted in Stories 1.4/1.5's sessions; did not start a new one.

### Completion Notes List

- `hooks/useTasks.ts`: extracted `useTodayTasks()`'s inline filter predicate into a standalone exported `isTodayTask(task)` function (zero behavior change to `useTodayTasks()` itself), then added `useTodaySectionTasks()`/`useBacklogSectionTasks()`, both built by filtering the *already-sorted* `useSortedTasks()` output rather than re-sorting per section — this is what makes AC #2 (Today's recommended sort) and drag-reorder persistence both correct simultaneously, without any store changes.
- `components/tasks/DraggableTaskList.tsx`: added `id: string` (passed to `DndContext`, preventing an SSR/hydration ID-collision risk now that two instances render on one page) and `isBacklog?: boolean` (threaded through to `TaskRow`, which already had the prop unwired since Story 1.3). No changes to the actual drag logic (`handleDragEnd`, sensors, `reorderTasks`/`setSortMode` calls).
- `app/page.tsx`: fully rebuilt per the story's judgment call — removed the "Good morning" hero header, the old "Quick capture" panel header, the "At a glance" stats grid (and its `Stat` helper), and the old flat "Your queue" section; now renders `QuickAddBar` → Today section (`DraggableTaskList` or `EmptyState`) → `SectionDivider label="BACKLOG"` → Backlog section (`DraggableTaskList isBacklog` or `EmptyState`), each a direct child of one `space-y-6` wrapper. `handleQuickAdd` now creates tasks with `status: "next"` (was `"backlog"` after Story 1.4) — the one AC #5 behavior change; everything else in that function (default-priority sourcing, importance/urgency fallback, other fields) is untouched from Story 1.4.
- Added `tests/e2e/single-stream-layout.spec.ts` (5 tests covering AC #1–#5) and confirmed the entire pre-existing suite still passes unmodified.
- No files outside this story's scope were modified: `TaskRow.tsx`, `TaskCard.tsx`, `TaskForm.tsx`, `TaskDrawer.tsx`, `EmptyState.tsx`, `SectionDivider.tsx`, `stores/task-store.ts`, `lib/prioritization/*`, `app/completed/page.tsx`, `app/globals.css`, and `app/layout.tsx` are all untouched.

### File List

- `hooks/useTasks.ts` (modified)
- `components/tasks/DraggableTaskList.tsx` (modified)
- `app/page.tsx` (modified)
- `tests/e2e/single-stream-layout.spec.ts` (new)
