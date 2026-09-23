# Story 2.1: In-Place Delete Confirm

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want deleting a task to use a quiet in-place confirm instead of a browser popup,
so that removing something never jars me out of flow.

## Acceptance Criteria

1. **Given** the delete icon on a task row (active list `TaskRow` or Completed archive `TaskCard`), **when** tapped once, **then** it transitions to a brief "confirm?" state for ~2-3 seconds, **and** no modal or native `confirm()` dialog is used. [Source: epics.md#Story 2.1]
2. **Given** the row in "confirm?" state, **when** tapped again within the window, **then** the task is permanently deleted. [Source: epics.md#Story 2.1]
3. **Given** the row in "confirm?" state, **when** the user taps elsewhere or the window elapses, **then** the delete cancels and the icon returns to normal. [Source: epics.md#Story 2.1]
4. **Given** the "Clear archive" action on the Completed page, **when** triggered, **then** it uses the same in-place confirm pattern instead of native `confirm()`. [Source: epics.md#Story 2.1]
5. **Given** the `window.confirm()` calls currently in `TaskRow`/`TaskCard` (delete) and `CompletedPage` (clear all), **when** this story is complete, **then** no `window.confirm()` calls remain for these actions. [Source: epics.md#Story 2.1]

## Tasks / Subtasks

- [x] Task 1: Build the shared in-place confirm-delete mechanism (AC: #1, #2, #3)
  - [x] Create `hooks/useConfirmDelete.ts` exporting a hook with signature roughly `useConfirmDelete(onConfirm: () => void, timeoutMs = 2500)` returning `{ confirming, triggerRef, handleTrigger }`:
    - `handleTrigger()`: first call sets `confirming = true` and starts a `setTimeout` (via `useRef<ReturnType<typeof setTimeout>>`) that resets `confirming = false` after `timeoutMs`. A second call while `confirming === true` clears the timeout, calls `onConfirm()`, and resets `confirming = false`.
    - Attach a `document`-level `pointerdown` (or `mousedown`, matching the existing `keydown` pattern in `components/ui/Drawer.tsx:16-23`) listener only while `confirming === true`; if the event target is outside the element referenced by `triggerRef`, cancel (clear timeout, `confirming = false`).
    - **Timing pitfall to avoid:** attach this listener from a `useEffect` keyed on `confirming` (not synchronously inside `handleTrigger`). Because effects run after the render caused by `setConfirming(true)`, the listener is registered strictly after the very `pointerdown` that triggered the confirm state — so the same click that opens the "confirm?" state cannot immediately self-cancel it. Wiring the listener synchronously inside the click handler risks it firing on that same event (or a trailing `pointerup`/synthetic bubble) and cancelling instantly.
    - Clean up the timeout and the document listener on unmount and whenever `confirming` flips back to `false` (mirror the cleanup-on-unmount pattern already used for `completeTimeout` in `components/tasks/TaskRow.tsx:53-57`).
    - This is a genuinely shared concern (3 independent call sites need the exact same 2-3s timing + tap-elsewhere-cancels behavior) — extracting it avoids tripling the timer/listener logic, so build it once rather than copy-pasting per component.
  - [x] Decide the "confirm?" visual treatment before wiring components: the Graphite Violet token table (`app/globals.css:52-62`) defines **no danger/red token** — only `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high/med/low`. NFR1/UX-DR1 forbid hardcoded Tailwind color utilities in redesigned components. Do NOT introduce a new ad hoc red (e.g. `rose-400`) for this state.
    - Recommended default (confirm during dev-story if a stronger preference emerges): swap the `Trash2` icon for a short mono text label ("Confirm?") styled with `--text` (or `--accent` for the outline/border), keeping the icon-button's existing ghost/`--text-dim` sizing — signal is the label change + icon swap, not a new color.

- [x] Task 2: Apply the confirm-delete pattern to `TaskRow.tsx` (active Today/Backlog lists) (AC: #1, #2, #3, #5)
  - [x] In `components/tasks/TaskRow.tsx:123-133`, replace the delete button's `onClick={() => { if (confirm("Delete this task?")) deleteTask(task.id); }}` with `useConfirmDelete(() => deleteTask(task.id))` wired to `onClick={handleTrigger}`.
  - [x] Swap `aria-label="Delete task"` to something state-aware, e.g. `aria-label={confirming ? "Confirm delete task" : "Delete task"}`, consistent with the existing state-dependent `aria-label` pattern already used on the same file's complete/restore button (`aria-label={isCompleted ? "Restore task" : "Mark complete"}` at line 108).
  - [x] Render the confirming-state icon/label per Task 1's decision in place of the resting `<Trash2 size={14} />`.
  - [x] Do not change any other button (checkbox/edit/drag handle) or the row's outer markup.

- [x] Task 3: Apply the same pattern to `TaskCard.tsx` (Completed archive) (AC: #1, #2, #3, #5)
  - [x] In `components/tasks/TaskCard.tsx:71`, replace `onClick={() => { if (confirm("Delete this task?")) deleteTask(task.id); }}` with the same `useConfirmDelete` hook wired the same way.
  - [x] `TaskCard.tsx` currently has no `aria-label` on its icon buttons (it uses `title` attributes instead, e.g. `title="Delete task"` at line 71) — keep that existing convention for this file rather than introducing `aria-label` here; just add a state-aware `title` (e.g. `title={confirming ? "Tap again to confirm" : "Delete task"}`) so the pattern is consistent with `TaskCard`'s established idiom, not `TaskRow`'s.
  - [x] Do not touch this file's colored priority theme, borders, or any other button — `TaskCard.tsx` is legacy-styled (old amber/rose/emerald palette) and out of scope for retokenizing in this story (that's Epic 2/3's broader restyle work, not Story 2.1).

- [x] Task 4: Apply the pattern to the "Clear archive" action (AC: #4, #5)
  - [x] In `app/completed/page.tsx:26-27,39`, replace `handleClearAll`'s `if (confirm(...)) completedTasks.forEach((task) => deleteTask(task.id));` with the same `useConfirmDelete` hook, passing `() => completedTasks.forEach((task) => deleteTask(task.id))` as the confirm callback.
  - [x] While confirming, swap the button's visible label from "Clear archive" to a short confirm prompt (e.g. "Tap to confirm") — do not change the button's existing rose-tinted styling/classes in this story (that styling is pre-existing and out of scope; only the interaction changes).
  - [x] Keep the button's existing conditional render (`completedTasks.length > 0 && ...`) unchanged.

- [x] Task 5: Manual verification (all ACs)
  - [x] Run `npx tsc --noEmit` and `npm run lint` — both must pass with zero errors and zero warnings. **Both passed cleanly.**
  - [ ] Using the running dev server on `http://localhost:3000`: **NOT performed this session** — an interactive/browser-driven click-through was explicitly skipped per user direction after an unrelated pre-existing issue (a stale process holding port 3000, and a separate pre-existing `QuickAddBar` aria-label regression — see Completion Notes and `deferred-work.md`) turned server-based verification into a rabbit hole. Implementation correctness was instead confirmed via code review against every AC plus `tsc`/`lint`.
  - [x] Grep the codebase for `window.confirm(` / bare `confirm(` calls in `components/tasks/TaskRow.tsx`, `components/tasks/TaskCard.tsx`, and `app/completed/page.tsx` — confirm zero matches remain (AC #5). **Confirmed zero matches** (`grep -rn "confirm(" --include=*.tsx`).

- [x] Task 6: Author automated Playwright E2E coverage in `tests/e2e/delete-confirm.spec.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Create `tests/e2e/delete-confirm.spec.ts` using `test`/`expect` from `../support/merged-fixtures` (the established import, per every existing spec in `tests/e2e/`).
  - [x] No `test-design-epic-2.md` exists yet (only `_bmad-output/test-artifacts/test-design-epic-1.md` does) — assigned test IDs under the `2.1-E2E-*` prefix directly, following the ID/priority convention modeled in Epic 1's specs (e.g. `1.8-E2E-001`).
  - [x] Register a `page.on('dialog', ...)` handler (auto-dismiss + fail the test) at the top of each test, or assert no dialog fires, so a regression to native `confirm()` fails loudly rather than silently auto-accepting via Playwright's default dialog handling.
  - [x] Implement scenarios:
    - **`2.1-E2E-001` (P0): Tap-tap deletes a task from the active list.** Quick-add a task, click its delete button (`getByLabel('Delete task')`) once, assert it does NOT disappear yet, click again, assert it disappears and no `dialog` event fired.
    - **`2.1-E2E-002` (P1): Tap-elsewhere cancels.** Quick-add a task, click delete once, click an unrelated element, assert the task is still visible.
    - **`2.1-E2E-003` (P1): Timeout cancels.** Quick-add a task, click delete once, `page.waitForTimeout(3000)`, assert the task is still visible and the icon has reverted.
    - **`2.1-E2E-004` (P1): Completed archive delete uses the same pattern.** Complete a task via the UI, navigate to `/completed`, tap-tap its delete control, assert removal and no dialog.
    - **`2.1-E2E-005` (P2): Clear archive uses in-place confirm.** Seed 2+ completed tasks, navigate to `/completed`, click "Clear archive" once, assert tasks remain and no dialog fired, click again, assert all completed tasks are removed and the empty state appears.
  - [x] Follow the established wait discipline: `await expect(...).toBeVisible()`/`.not.toBeVisible()` after actions rather than fixed sleeps, except where the test deliberately exercises the ~2-3s timeout window (Test 003).
  - [ ] Re-run the full Playwright suite and confirm `delete-confirm.spec.ts` passes on all three browser projects — **NOT completed this session, see Completion Notes and `deferred-work.md`.** A pre-existing, unrelated regression (`QuickAddBar.tsx` missing its documented `aria-label="Add a task"`) was discovered and confirmed to independently break the existing `quick-add-bar.spec.ts` on the unmodified app; the new spec was adjusted to route around it via `getByPlaceholder`, but a full green run (this spec plus the existing suite) was not achieved/confirmed this session. **Follow-up required before this story is fully verified.**

## Dev Notes

### Architecture & Current-State Deep Dive

Three independent call sites currently use the native `window.confirm()` dialog, and all three must be replaced in this story:

1. **`components/tasks/TaskRow.tsx:123-133`** — the delete button used by every row in the active Today/Backlog Single Stream list (rendered via `components/tasks/DraggableTaskList.tsx:42-48`). This is the highest-traffic path — every task deletion from the main list goes through here.
   ```tsx
   <button
     type="button"
     onClick={() => {
       if (confirm("Delete this task?")) deleteTask(task.id);
     }}
     aria-label="Delete task"
     ...
   >
     <Trash2 size={14} />
   </button>
   ```
2. **`components/tasks/TaskCard.tsx:71`** — a *separate, legacy-styled* component still used exclusively by the Completed archive (`app/completed/page.tsx:44`). `TaskCard` was NOT replaced by `TaskRow` in Story 1.3 for the Completed page — only the active-list `DraggableTaskList` was migrated. `TaskCard` still uses the old amber/rose/emerald palette and `title` attributes (not `aria-label`) for its icon buttons. This story only changes its delete *interaction*, not its visual styling.
   ```tsx
   <button type="button" onClick={() => { if (confirm("Delete this task?")) deleteTask(task.id); }} className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-rose-400/10 hover:text-rose-300" title="Delete task"><Trash2 size={15} /></button>
   ```
3. **`app/completed/page.tsx:26-27,39`** — the "Clear archive" button, which deletes every completed task in one action.
   ```tsx
   function handleClearAll() {
     if (confirm("Are you sure you want to delete all completed tasks? This cannot be undone.")) completedTasks.forEach((task) => deleteTask(task.id));
   }
   ...
   {completedTasks.length > 0 && <button type="button" onClick={handleClearAll} ...>...Clear archive</button>}
   ```

**`deleteTask(id)` itself (`stores/task-store.ts:97-109`) needs no changes** — it already correctly removes the task and strips the deleted id from other tasks' `dependencies` arrays (FR3), then runs `recalcScores()` and persists via `saveTasks()`. This story is purely about the confirm *interaction*, not the deletion logic.

### Critical Design Constraint: No Danger Token Exists Yet

The Graphite Violet token set defined in Story 1.1 (`app/globals.css:52-62`) intentionally has no red/danger/critical token — the UX spec's color table (`ux-design-specification.md` → Visual Design Foundation → Color System) lists only `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high/med/low`. The spec is explicit that "the accent hue is the *only* saturated color in the system." `Button.tsx`'s `danger` variant (which does reference a red-ish `--color-critical` token) belongs to the **old**, pre-redesign token namespace and is not restyled until Story 2.3 — do not borrow from it or introduce a new hardcoded red utility (e.g. Tailwind `rose-*`) for the `TaskRow`/`TaskCard` confirm state, since that would violate NFR1/UX-DR1 (no hardcoded Tailwind color utilities in redesigned components) for the two components this story touches directly. `CompletedPage.tsx`'s "Clear archive" button, by contrast, is legacy-styled outside this story's scope (Story 2.3 restyles buttons) — its existing `rose-400` classes may stay as-is; only its *click behavior* changes here.

Use a text/icon swap (not a new color) to signal the confirm state, per Task 1.

### Previous Story Intelligence

- **From Story 1.3 (`1-3-task-row-component.md`):** explicitly deferred this exact work — "Delete icon: interaction is unchanged (`window.confirm()` → `deleteTask`) — Epic 2 Story 2.1 owns replacing this with the in-place confirm pattern." Confirms `TaskRow.tsx` is the correct, and only intentionally-deferred, active-list target.
- **From Story 1.8 (`1-8-...md`):** noted `app/completed/page.tsx` is explicitly reserved for Epic 2 (Story 2.1/2.4) restyling — "Epic 2 will restyle this page (Story 2.1 / 2.4). Do not refactor `CompletedPage` in this story" (written from Story 1.8's perspective). This story is the first to actually touch `CompletedPage.tsx`; keep the change scoped to the `handleClearAll` interaction only, not a broader refactor.
- **Established local-timer pattern:** `TaskRow.tsx` already implements a `useRef<ReturnType<typeof setTimeout>>` + cleanup-on-unmount pattern for its own completion delay (`completeTimeout` at lines 50-57). Mirror this exact pattern in `useConfirmDelete` for consistency rather than inventing a different timer idiom.
- **Established state-dependent `aria-label` pattern:** `TaskRow.tsx`'s checkbox already swaps `aria-label` based on state (`isCompleted ? "Restore task" : "Mark complete"`, line 108) — reuse this idiom for the delete button's confirming state rather than adding a separate visually-hidden text node.
- **No git history to mine:** this repository has a single squashed "Initial commit" plus one lockfile commit — no per-story commit trail exists to extract prior patterns from beyond the story files themselves and the current code.

### Scope Boundaries: What NOT to Touch

- **Do NOT** migrate `CompletedPage.tsx` from `TaskCard` to `TaskRow`. No epic-2 story ACs request this component swap (Story 2.2 covers `TaskDrawer`/`TaskForm`, Story 2.4 covers `EmptyState`); doing so here would be unrequested scope creep and a needless regression risk. Apply the confirm-delete pattern to `TaskCard.tsx` in place.
- **Do NOT** restyle `TaskCard.tsx`'s colors/borders/theme, or `CompletedPage.tsx`'s "Clear archive" button colors — those are legacy-palette and out of this story's scope (later Epic 2/3 restyle work).
- **Do NOT** modify `Button.tsx` or its `danger` variant — Story 2.3 owns restyling `Button.tsx`; the delete/clear-archive controls here are bare `<button>` elements, not the shared `Button` component, and should stay that way.
- **Do NOT** modify `deleteTask`, `recalcScores`, or any other `stores/task-store.ts` action.
- **Do NOT** add a toast, banner, or modal at any point in this flow — the in-place icon/label state change is the *entire* feedback surface, consistent with NFR7 (no toast/banner/modal feedback for routine actions) applied here to the delete-confirm micro-interaction itself, not just success paths.
- **Do NOT** touch `TaskRow.tsx`'s checkbox, edit button, drag handle, or priority dot — isolate changes to the delete button only.

### Project Structure Notes

- **New file:** `hooks/useConfirmDelete.ts` — this is the project's second file under `hooks/` (alongside the existing `hooks/useTasks.ts`); follow the same `"use client"`-free, plain-hook export style (no default export) already used in `useTasks.ts`.
- **New test file:** `tests/e2e/delete-confirm.spec.ts`.
- **Modified files:** `components/tasks/TaskRow.tsx`, `components/tasks/TaskCard.tsx`, `app/completed/page.tsx`.
- **Imports:** always use `@/*` path aliases (e.g. `@/hooks/useConfirmDelete`), never relative paths.
- **Code standards:** strict TypeScript (no `any`); no inline `style` props (this story doesn't need any — the confirm-state treatment should be expressible via existing Tailwind utilities/tokens already present in the touched files).

### Testing Requirements Matrix

| Test ID | Priority | Description | Target Component / Area | Verification Type |
| --- | --- | --- | --- | --- |
| `2.1-E2E-001` | P0 | Tap-tap deletes a task from the active list; no native dialog fires | `TaskRow`, `useConfirmDelete`, `task-store` | Playwright E2E |
| `2.1-E2E-002` | P1 | Tapping elsewhere while confirming cancels the delete | `TaskRow`, `useConfirmDelete` | Playwright E2E |
| `2.1-E2E-003` | P1 | Confirm window elapsing (~2-3s) cancels the delete and reverts the icon | `TaskRow`, `useConfirmDelete` | Playwright E2E |
| `2.1-E2E-004` | P1 | Completed archive (`TaskCard`) delete uses the identical confirm pattern | `TaskCard`, `useConfirmDelete` | Playwright E2E |
| `2.1-E2E-005` | P2 | "Clear archive" uses in-place confirm instead of `window.confirm()` | `CompletedPage`, `useConfirmDelete` | Playwright E2E |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: In-Place Delete Confirm] — Story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Additional Patterns] — "Destructive actions (delete)" in-place confirm behavior description (~2-3s window, tap-elsewhere/wait to cancel)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation / Color System] — Full Graphite Violet token table; confirms no danger/red token is defined
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Button Hierarchy] — "Danger... reserved only for the confirmed-delete action itself... never for a first-tap button" (applies to `Button.tsx`'s variant, restyled in Story 2.3, not this story's bare `<button>` elements)
- [Source: components/tasks/TaskRow.tsx:36-136] — Current `TaskRow` implementation, delete button at lines 123-133, existing timer/cleanup pattern at lines 50-57, state-dependent `aria-label` pattern at line 108
- [Source: components/tasks/TaskCard.tsx:37-83] — Current legacy `TaskCard` implementation, delete button at line 71
- [Source: app/completed/page.tsx:1-51] — `CompletedPage`, `handleClearAll` at lines 26-27, "Clear archive" button at line 39, `TaskCard` usage at line 44
- [Source: stores/task-store.ts:97-109] — `deleteTask(id)` implementation (unchanged by this story)
- [Source: components/ui/Drawer.tsx:16-23] — Existing `document`-level event-listener + cleanup pattern to mirror for the tap-elsewhere-cancels behavior
- [Source: components/tasks/DraggableTaskList.tsx:42-48] — Confirms `TaskRow` is the sole renderer for active-list rows (no other call site to update there)
- [Source: tests/e2e/complete-from-backlog.spec.ts:1-31,63-68] — Established `quickAdd` helper pattern and `localStorage['task-manager:tasks']` read pattern to reuse in the new spec
- [Source: _bmad-output/implementation-artifacts/1-3-task-row-component.md] — Confirms Story 1.3 deliberately deferred the delete-confirm interaction to this story
- [Source: _bmad-output/implementation-artifacts/1-8-complete-a-task-directly-from-the-backlog-section.md] — Confirms `CompletedPage.tsx` was deliberately left untouched pending this story
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — Known pre-existing webkit-only Playwright flakiness pattern, for triage context if new test runs show intermittent webkit failures unrelated to this story

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Implemented the in-place delete-confirm pattern via a shared `useConfirmDelete` hook, wired into `TaskRow.tsx`, `TaskCard.tsx`, and `CompletedPage.tsx`'s "Clear archive" action, replacing all three `window.confirm()` call sites. Authored `tests/e2e/delete-confirm.spec.ts` covering all five ACs. Verified via `tsc --noEmit`, `npm run lint`, and a grep confirming zero remaining `confirm()` calls. Full Playwright suite execution was not completed this session (see Completion Notes) — status held at review pending that follow-up rather than marked done.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` — passed, zero errors.
- `npm run lint` — passed, zero warnings/errors ("No ESLint warnings or errors").
- `grep -rn "confirm(" --include=*.tsx` — zero matches in `components/tasks/TaskRow.tsx`, `components/tasks/TaskCard.tsx`, `app/completed/page.tsx` (AC #5 satisfied).
- `npx playwright install` was required (browsers were not present in this environment) and completed successfully.
- Attempted `npx playwright test tests/e2e/delete-confirm.spec.ts` (all projects, then chromium only): all tests failed at the `quickAdd` helper's `page.getByLabel('Add a task')` call. Root-caused to a **pre-existing, out-of-scope regression**: `components/tasks/QuickAddBar.tsx`'s input has no `aria-label` (only `placeholder="Add a task..."`), despite Story 1.4's dev record claiming otherwise. Confirmed this is unrelated to Story 2.1 by running the pre-existing `tests/e2e/quick-add-bar.spec.ts` in isolation — it fails identically on the unmodified app. Logged in `deferred-work.md`.
- Fixed the spec's own `quickAdd` helper to use `getByPlaceholder('Add a task...')` instead, to route around the unrelated regression.
- A separate stale process was also found holding port 3000 during investigation, causing Next.js's own dev server to fall back to port 3002 while Playwright's browsers still targeted the configured baseURL (3000). Per explicit user direction, further investigation/re-verification of the full suite (including a clean run of `delete-confirm.spec.ts`) was stopped and deferred rather than continued this session — see `deferred-work.md`.

### Completion Notes List

- Built `hooks/useConfirmDelete.ts`: a shared hook (`{ confirming, triggerRef, handleTrigger }`) implementing the ~2.5s tap-tap-confirm / tap-elsewhere-cancels / timeout-cancels pattern, mirroring `TaskRow.tsx`'s existing `useRef`+`setTimeout`+cleanup idiom. The tap-elsewhere listener is attached via a `useEffect` keyed on `confirming` (not synchronously in the click handler) specifically so the triggering click cannot self-cancel the state it just opened.
- Wired the hook into `TaskRow.tsx` (active Today/Backlog lists), `TaskCard.tsx` (Completed archive), and `CompletedPage.tsx`'s "Clear archive" button — replacing all three `window.confirm()` call sites (AC #1–#5). No danger/red token was introduced; the confirm state is signaled via an icon→text swap ("Confirm?"/"Tap to confirm") using only existing Graphite Violet tokens, per the story's explicit constraint that no such token exists yet.
- Left `TaskCard.tsx`'s legacy color palette, `CompletedPage.tsx`'s "Clear archive" button styling, and `Button.tsx` untouched, per the story's scope boundaries.
- Authored `tests/e2e/delete-confirm.spec.ts` (5 tests, `2.1-E2E-001` through `-005`) covering tap-tap delete, tap-elsewhere cancel, timeout cancel, Completed-archive delete, and Clear-archive confirm — each with a `page.on('dialog')` guard that fails the test if a native dialog ever appears.
- **Not completed this session**: a confirmed, fully green Playwright run of the new spec (and the wider suite). Investigation surfaced two issues unrelated to this story's own code — (1) a pre-existing `QuickAddBar` aria-label regression that already breaks the existing Epic 1 suite independent of this story, and (2) a stale process occupying port 3000 during local investigation. Per explicit user instruction, further server/test investigation was stopped to close out the story; both issues and the outstanding verification are logged in `deferred-work.md` for follow-up (ideally before or during code review).

### File List

- `hooks/useConfirmDelete.ts` (new)
- `components/tasks/TaskRow.tsx` (modified — delete button now uses `useConfirmDelete`)
- `components/tasks/TaskCard.tsx` (modified — delete button now uses `useConfirmDelete`)
- `app/completed/page.tsx` (modified — "Clear archive" now uses `useConfirmDelete`)
- `tests/e2e/delete-confirm.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified — logged the pre-existing `QuickAddBar` regression and the outstanding suite verification)
