# Story 1.9: Quiet Motion for Add, Reprioritize, and Complete

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want every routine action to give calm, wordless feedback,
so that the app never interrupts my focus with toasts or celebration.

## Acceptance Criteria

1. **Given** a new task is added, **when** it appears, **then** it uses a subtle non-celebratory entry transition — no toast confirms it. [Source: epics.md#Story 1.9]
2. **Given** a drag ends, **when** the row settles, **then** a quiet, quick settle animation plays — no modal/banner confirms it. [Source: epics.md#Story 1.9]
3. **Given** a task completes, **when** its state updates, **then** the row fades and strikes through with no confetti, popup, or success banner. [Source: epics.md#Story 1.9]
4. **Given** any of these actions, **when** they occur, **then** the UI updates optimistically with no spinner. [Source: epics.md#Story 1.9]

## Tasks / Subtasks

- [x] Task 1: Add a subtle entry transition for newly-mounted task rows (AC: #1, #2 partial)
  - [x] Added `@keyframes task-enter` in `app/globals.css` (after the `:root` token block).
  - [x] Applied via Tailwind arbitrary-value utility `animate-[task-enter_180ms_ease-out]`, unconditionally, on `TaskRow`'s own root `<div>` (`components/tasks/TaskRow.tsx`).
  - [x] Confirmed NOT applied to the `SortableTaskRow` wrapper div in `DraggableTaskList.tsx` (left untouched) — avoids fighting @dnd-kit's inline `transform` style.
  - [x] No extra logic added for the cross-divider promote/demote case — it's covered for free by the new-DOM-node mount, as designed.

- [x] Task 2: Verify the existing same-section drag-settle transition satisfies AC #2 (no code change expected)
  - [x] Confirmed `SortableTaskRow`'s existing `useSortable()` `transition` (inline style) is untouched and still drives same-section reorder settling.
  - [x] Confirmed `handleDragEnd` in `app/page.tsx` was not modified — no modal/toast/banner added anywhere in the drag-end path.

- [x] Task 3: Make task completion visibly fade + strike through before the row is removed (AC: #3) — **the critical fix in this story**
  - [x] Added local `isCompleting` state + a `completeTimeout` ref (cleaned up on unmount) in `components/tasks/TaskRow.tsx`.
  - [x] `handleToggleComplete()`: when marking complete (`!isCompleted`), sets `isCompleting = true` immediately, ignores repeat clicks while completing, then calls `setStatus(task.id, "completed")` after `COMPLETE_TRANSITION_MS` (200ms — within the 150–250ms guidance range, matching @dnd-kit's own default settle duration). Restoring (`isCompleted === true`) still calls `setStatus` immediately with no delay.
  - [x] Title `<p>` now drives its faded/struck-through style off `showCompletedStyle = isCompleted || isCompleting` (was `isCompleted` only) and has `transition-colors duration-200` so the color change animates.
  - [x] Checkbox button is `disabled={isCompleting}` to prevent double-fires during the delay window.
  - [x] No spinner, loading state, or any other indicator added during the delay window.
  - [x] `app/completed/page.tsx` confirmed untouched (still renders `TaskCard`, not `TaskRow` — Epic 2 scope).

- [x] Task 4: Confirm no spinners exist anywhere in the add/reprioritize/complete paths (AC: #4)
  - [x] Confirmed `addTask`, `reorderTasks`, `moveTask`, `setStatus` in `stores/task-store.ts` remain fully synchronous (unmodified) — the new `setTimeout` in `TaskRow` is a local UI-only delay, not a store-level async operation.
  - [x] Grepped the repo for spinner-like elements (`role="status"`, `Loader`/`Spinner` imports) in touched files — none introduced.

- [x] Task 5: Author Playwright E2E coverage in `tests/e2e/quiet-motion.spec.ts` (AC: #1, #2, #3, #4)
  - [x] Created `tests/e2e/quiet-motion.spec.ts` reusing the `realDrag`/`quickAdd` helper patterns from `complete-from-backlog.spec.ts`/`drag-across-divider.spec.ts`.
  - [x] Implemented `1.9-E2E-001` through `1.9-E2E-004` per the test design's P2 "quiet motion negative assertions" row.
  - [x] **Correction made during authoring:** the original plan to assert a blanket `getByRole('status')).toHaveCount(0)` for "no toast/banner" was wrong — `@dnd-kit` renders its own permanent, visually-hidden a11y live region (`#DndLiveRegion-*`, `role="status"`) whenever `DndContext` mounts (i.e. on every page load), and Next dev mode's route-announcer uses `role="alert"`. Neither is a toast/banner/spinner. `expectNoFeedbackChrome()` now only checks `dialog`/`alertdialog`; the dedicated `1.9-E2E-004` spinner check uses a `spinnerLocator()` helper that excludes `[id^="DndLiveRegion"]`.
  - [x] Did not modify `tests/e2e/complete-from-backlog.spec.ts` — confirmed its existing assertions continue to pass unchanged (see Task 6).

- [x] Task 6: Manual verification and full regression run (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint` — both passed with zero errors/warnings.
  - [x] `npx playwright test tests/e2e/quiet-motion.spec.ts --workers=1` — 12/12 passed (chromium, firefox, webkit), confirmed twice.
  - [x] Full suite run per browser project (`--project=chromium|firefox|webkit --workers=1`): chromium 25/25 passed, firefox 25/25 passed, webkit 24/25 passed. The one webkit failure (`1.7-E2E-002` in `drag-across-divider.spec.ts`) is a **pre-existing issue unrelated to this story** — see Completion Notes for the isolation steps that confirmed it.

## Dev Notes

### Architecture & Motion Mechanism Deep Dive

Story 1.9 is a polish pass on top of mechanisms Stories 1.1–1.8 already built — it does not introduce new store actions, new components, or new routes. The work is concentrated in `components/tasks/TaskRow.tsx` and `app/globals.css`, plus one new test file.

**Key insight — completion currently has no visible transition at all.** `setStatus(id, "completed")` ([stores/task-store.ts:135-150](stores/task-store.ts#L135-L150)) is synchronous, and the section-filtering hooks ([hooks/useTasks.ts:13-21,53-61](hooks/useTasks.ts#L13-L21)) exclude completed tasks immediately. Without Task 3's local `isCompleting` delay, a completed row would unmount before any CSS transition could ever paint — AC #3 is literally unobservable without this change. This is the one piece of this story that is a genuine behavior change, not just an additive animation.

**Key insight — entry animation vs. `@dnd-kit`'s inline `transform`.** `@dnd-kit/sortable`'s `useSortable()` sets `transform`/`transition` via **inline style** on the `SortableTaskRow` wrapper div ([components/tasks/DraggableTaskList.tsx:34-41](components/tasks/DraggableTaskList.tsx#L34-L41)) every render. A CSS `animation` on that same element competes for the `transform` property (CSS animations override inline styles for the properties they animate) and will visibly jitter. Apply the new entry animation to `TaskRow`'s own root div instead — a sibling node dnd-kit never sets inline styles on.

**Key insight — cross-section drag already "solves" its own settle animation for free.** Today and Backlog are rendered as two separate `DraggableTaskList`/`SortableContext` instances ([app/page.tsx:116-136](app/page.tsx#L116-L136)), so a promoted/demoted task is a brand-new DOM node in its destination section (no incoming transform to animate from). The Task 1 entry animation covers this case automatically — no bespoke cross-list animation logic is needed or expected.

### Previous Story Intelligence & Learnings

- **From Story 1.8** ([Source: _bmad-output/implementation-artifacts/1-8-complete-a-task-directly-from-the-backlog-section.md]):
  - `setStatus`, section filtering, and Sidebar/BottomNav count derivation were audited and confirmed correct with no code changes needed — this story is the first to actually change `TaskRow`'s completion click-handling behavior (adding the delay).
  - Playwright's `expect(...).not.toBeVisible()`/`toContainText()` assertions auto-retry/poll by default — this is why Task 3's added delay does not break Story 1.8's existing tests, and why new tests in this story should use the same pattern rather than fixed `waitForTimeout`s for state-dependent checks.
  - The full Playwright regression suite was **not** confirmed passing at the end of Story 1.8 (stopped mid-run twice at explicit user request) — Task 6 of this story should run the full suite cleanly, which will also give first confirmation that 1.8's suite passes.
- **From Story 1.7** ([Source: _bmad-output/implementation-artifacts/1-7-drag-across-the-divider-to-promote-or-demote-a-task.md]):
  - Cross-divider drag is unified under a single shared `DndContext` in `app/page.tsx`.
  - When authoring Playwright drags, use the `realDrag` pointer-sequence helper (steps past the 4px `activationConstraint`) and allow `@dnd-kit`'s reflow/transform transitions to settle (e.g. `page.waitForTimeout(350)`) before the next interaction — reuse this existing helper rather than writing a new one.
- **From Story 1.4** ([Source: _bmad-output/implementation-artifacts/1-4-quick-add-bar-and-silent-no-op-capture.md]):
  - Pre-existing, unrelated `TaskForm` bug: editing via `TaskDrawer` silently fails to save if "Est. Minutes" is empty. Not relevant to this story's scope but noted so it isn't mistaken for a regression this story caused.
- **Stale/unused test fixture:** `tests/support/factories/task-factory.ts` defines a `Task` interface (`status: 'todo'|'in-progress'|'completed'`, `priority: 'low'|'medium'|'high'`) that does **not** match the real `@/types` `Task`/`TaskStatus` (`"backlog"|"next"|"in-progress"|"completed"`, four priority tiers including `"critical"`). None of the existing Epic 1 spec files use this factory (they all use local `quickAdd`/`realDrag` helpers + direct `localStorage` inspection instead) — do the same in the new spec; do not use or "fix" this stale factory, it's out of scope.

### Scope Boundaries: What NOT to Touch

- **`stores/task-store.ts`:** Do not modify `addTask`, `reorderTasks`, `moveTask`, or `setStatus` themselves — they are already correct and synchronous. All new logic (the completion delay) belongs in `TaskRow.tsx` as local component state, calling the existing `setStatus` unchanged, just later.
- **`app/page.tsx`:** Do not alter `handleDragEnd`, `handleQuickAdd`, sensors, or the two-`DraggableTaskList` structure.
- **`components/tasks/DraggableTaskList.tsx`:** Do not add the entry animation to `SortableTaskRow`'s wrapper div (see Dev Notes above for why) and do not otherwise alter `SortableTaskRow`/`SectionDropZone`.
- **`app/completed/page.tsx`:** Still Epic 2 scope ([Source: epics.md#Story 2.4]); it renders `TaskCard`, not `TaskRow`, so it is unaffected by this story either way. Do not touch it.
- **No toasts, banners, modals, or confetti/celebration libraries:** None exist today; this story must not introduce any (NFR7, NFR8) — the whole point is that the CSS transitions themselves are the only feedback.
- **No numeric NFR6 threshold exists to hit or test against** — same documented gap as `EPIC1-R05` in the Epic 1 test design; pick a reasonable duration (150–250ms) rather than treating any specific number as a hard requirement.

### Project Structure Notes

- **Modified files:** `components/tasks/TaskRow.tsx`, `app/globals.css`.
- **New test file:** `tests/e2e/quiet-motion.spec.ts`.
- **Imports:** Always use `@/*` path aliases; no relative imports.
- **Code standards:** Strict TypeScript (no `any`); no inline `style` for anything expressible via Tailwind utilities/CSS variables — the one exception already in `TaskRow.tsx` (`style={{ touchAction: "none" }}` on the drag handle, [components/tasks/TaskRow.tsx:49](components/tasks/TaskRow.tsx#L49)) is pre-existing and out of this story's scope.
- **Test artifacts:** Reports write to `_bmad-output/test-artifacts/`; no hardcoded base URLs (`process.env.BASE_URL || 'http://localhost:3000'`).

### Testing Requirements Matrix

| Test ID | Priority | Description | Target Component / Area | Verification Type |
| --- | --- | --- | --- | --- |
| `1.9-E2E-001` | P2 | New task entry transition, no toast/banner | `TaskRow`, `QuickAddBar` | Playwright E2E |
| `1.9-E2E-002` | P2 | Drag settle shows no modal/banner (same-section reorder) | `DraggableTaskList`, `app/page.tsx` | Playwright E2E |
| `1.9-E2E-003` | P2 | Completion fades/strikes through, no confetti/popup/banner, eventual removal + `localStorage` state | `TaskRow`, `task-store` | Playwright E2E |
| `1.9-E2E-004` | P2 | No spinner during add/reorder/complete | `TaskRow`, `QuickAddBar`, `DraggableTaskList` | Playwright E2E |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.9: Quiet Motion for Add, Reprioritize, and Complete] — Story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#NFR7, NFR8] — No toast/banner/modal feedback for routine actions; minimal, non-celebratory motion
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows / Add a Task, Reprioritize a Task, Review & Complete Backlog] — "subtle (not celebratory) entry transition," "quiet, quick animation confirming the new position," "row fades, strikethrough applied"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Feedback Patterns] — No toasts/banners/modals for routine actions; visual state change is the feedback
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md#P2 (Medium), #EPIC1-R05] — "quiet motion negative assertions" test row; NFR6 duration-ambiguity precedent
- [Source: components/tasks/TaskRow.tsx] — Existing row markup, checkbox handler, completed-state styling
- [Source: components/tasks/DraggableTaskList.tsx:23-41] — `useSortable()` inline `transform`/`transition`, `isDragging`
- [Source: hooks/useTasks.ts:13-21,53-61] — Section filtering that excludes completed tasks synchronously
- [Source: stores/task-store.ts:135-150] — `setStatus(id, status)` synchronous store transition
- [Source: app/page.tsx:47-82,107-142] — `handleDragEnd`, two-section `DraggableTaskList` structure
- [Source: tests/e2e/complete-from-backlog.spec.ts] — `realDrag`/`quickAdd` helper patterns and auto-retrying assertion style to reuse
- [Source: _bmad-output/implementation-artifacts/1-8-complete-a-task-directly-from-the-backlog-section.md] — Previous story dev record; completion mechanism baseline this story adds motion on top of
- [Source: _bmad-output/project-context.md#Technology Stack & Versions] — `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 8.0.0, Tailwind CSS v4, no inline styling rule

## Change Log

- 2026-09-22: Story implemented via dev-story workflow. Added `@keyframes task-enter` entry animation (globals.css) applied to `TaskRow`'s own root div — deliberately not to the `@dnd-kit` sortable wrapper, to avoid fighting its inline `transform` style. Added a local `isCompleting` delay (200ms) in `TaskRow.tsx` so the completion fade/strikethrough is actually visible before the row is filtered out of its section (the real fix needed for AC #3, since `setStatus` previously removed the row on the very next render with zero visible transition). Authored `tests/e2e/quiet-motion.spec.ts` (4 new tests, all ACs). Corrected an incorrect test assumption during authoring (see Completion Notes). Full regression run: chromium 25/25, firefox 25/25, webkit 24/25 — the one webkit failure is a pre-existing, out-of-scope issue (see Completion Notes), not a regression from this story.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` — passed, zero errors.
- `npm run lint` — passed, zero warnings/errors ("No ESLint warnings or errors").
- `npx playwright test tests/e2e/quiet-motion.spec.ts --workers=1` — 12/12 passed (chromium, firefox, webkit), run twice for confirmation.
- `npx playwright test --project=chromium --workers=1` (full suite) — 25/25 passed.
- `npx playwright test --project=firefox --workers=1` (full suite) — 25/25 passed.
- `npx playwright test --project=webkit --workers=1` (full suite) — 24/25 passed; `1.7-E2E-002` (`drag-across-divider.spec.ts`) failed with the added task never appearing after `input.press('Enter')` (accessibility snapshot at failure time showed the empty-state copy and all-zero counts — the add never took effect).
- Isolation of the webkit failure: re-ran `drag-across-divider.spec.ts` alone on webkit — same failure, consistently reproducible (not flaky). Temporarily removed the `animate-[task-enter_180ms_ease-out]` class from `TaskRow.tsx` (this story's only change that affects a freshly-added row's initial render) and re-ran — **failure persisted identically**, ruling out this story's entry-animation change as the cause. The failing test (`1.7-E2E-002`) never interacts with the checkbox/`isCompleting` logic either (it only quick-adds and drags), so none of this story's code changes are implicated. Restored the animation class afterward and reconfirmed `npx tsc --noEmit`, `npm run lint`, and `quiet-motion.spec.ts` (12/12) all still pass.

### Completion Notes List

- Implemented Tasks 1–4 as specified: `@keyframes task-enter` in `app/globals.css`; `animate-[task-enter_180ms_ease-out]` on `TaskRow`'s own root div (not the `@dnd-kit` sortable wrapper); local `isCompleting` state + 200ms delay in `TaskRow.tsx` so `setStatus(id, "completed")` fires after the fade/strikethrough is visible instead of immediately; `transition-colors duration-200` added to the title `<p>`; checkbox `disabled={isCompleting}` to prevent double-fires. `stores/task-store.ts` was not modified — confirmed still fully synchronous, no spinner needed or added anywhere.
- Authored `tests/e2e/quiet-motion.spec.ts` with `1.9-E2E-001` through `1.9-E2E-004`. **Correction made during authoring:** the plan's original assumption that `getByRole('status')` should always resolve to 0 elements was wrong — `@dnd-kit` renders its own permanent, visually-hidden accessibility live region (`#DndLiveRegion-*`, `role="status"`) whenever `DndContext` mounts (i.e., on every page load, confirmed by inspecting the live DOM), and this is unrelated to toasts/spinners. Fixed by removing the blanket `role="status"` check from the toast/banner assertions and adding a scoped `spinnerLocator()` helper that excludes `[id^="DndLiveRegion"]` for the dedicated "no spinner" test. All 12 tests (4 tests × 3 browsers) pass.
- **Pre-existing, out-of-scope issue found during the full regression run — not caused by this story:** `1.7-E2E-002` in `tests/e2e/drag-across-divider.spec.ts` (Story 1.7's own test, already in `review` status) fails consistently on webkit — a quick-added task never appears after `input.press('Enter')` on the second test in that file's `describe` block (the first test, with an identical add pattern, passes). Isolated via a temporary revert of this story's only render-affecting change (the entry animation) — the failure persisted unchanged, and the failing test never touches the checkbox/completion logic this story added either. Most likely related to the store's `hydrate()` timing race flagged as `EPIC1-R08`/NFR9 in the Epic 1 test design, which Story 1.10 ("Quiet Initial Hydration State," still `backlog`) is scoped to address — surfacing here as a webkit-specific timing sensitivity. Did not modify `drag-across-divider.spec.ts` or any Story 1.7 code, per this story's scope boundaries. Flagging for the team's attention; recommend re-checking this specific test once Story 1.10 lands.
- A stray diagnostic script (`check-status-role.js`) used to inspect live DOM roles was created and deleted within this session — not part of the final change set.

### File List

- `app/globals.css` (modified — added `@keyframes task-enter`)
- `components/tasks/TaskRow.tsx` (modified — entry animation, completion delay, transition-colors, disabled state during completion)
- `tests/e2e/quiet-motion.spec.ts` (new — `1.9-E2E-001` through `1.9-E2E-004`)
