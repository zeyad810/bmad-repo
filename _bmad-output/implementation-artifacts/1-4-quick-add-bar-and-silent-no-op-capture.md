# Story 1.4: Quick Add Bar & Silent-No-Op Capture

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistently visible input to capture a task in one action from anywhere,
so that adding a task never interrupts my train of thought.

## Acceptance Criteria

1. **Given** the `QuickAddBar` pinned at the top, **when** the user types text and presses Enter/taps Add, **then** a task is created with that title and default priority, inserted at the position matching its priority score. [Source: epics.md#Story 1.4]
2. **Given** empty text, **when** Enter/Add is triggered, **then** no task is created, no error is shown, and the input is left as-is (silent no-op). [Source: epics.md#Story 1.4]
3. **Given** a task was just added, **when** the input clears, **then** it stays focused for immediate next entry. [Source: epics.md#Story 1.4]
4. **Given** the bar is focused, **when** displayed, **then** its border shows `--accent`; unfocused, it shows the default treatment. [Source: epics.md#Story 1.4]
5. **Given** the bar, **when** inspected, **then** it has `aria-label="Add a task"`, Enter submits, Escape clears text without losing focus, and it shows a mono `↵ add` hint. [Source: epics.md#Story 1.4]

## Tasks / Subtasks

- [x] Task 1: Build the `QuickAddBar` component (AC: #2, #3, #4, #5)
  - [x] Create `components/tasks/QuickAddBar.tsx` (`"use client"`). Props: `{ onAdd: (title: string) => void }` — the component owns only its own input state and calls `onAdd` with the trimmed title; the caller decides how to build the rest of the `Task` payload (mirrors `TaskRow`'s callback-prop pattern from Story 1.3, e.g. `onEdit`).
  - [x] Anatomy, single row, per UX-DR6: `<form>` wrapping a submit button (Plus icon, `aria-label="Add task"`) → `<input type="text">` (`aria-label="Add a task"`, controlled, `placeholder="Add a task..."`) → a mono hint `<span>` with the literal text `↵ add`. Use `React.useRef<HTMLInputElement>` for refocus.
  - [x] Submit (form `onSubmit`, fires on both Enter-in-input and tapping the Plus button natively — no separate keydown handler needed for Enter): `e.preventDefault()`; trim the value; **if empty, return with no side effects** — no store call, no error state, no visual feedback (AC #2, mitigates risk `EPIC1-R06`). If non-empty: call `onAdd(trimmed)`, clear the input, then `inputRef.current?.focus()` (AC #3).
  - [x] Input `onKeyDown`: if `e.key === "Escape"`, clear the input value only — do not blur, do not call `onAdd`, do not preventDefault beyond what's needed (AC #5).
  - [x] Focused-border state (AC #4): use `focus-within:border-[var(--accent)]` on the `<form>` wrapper — no local focus-tracking state needed. Default/unfocused border is `border-[var(--border)]`.
  - [x] Colors/spacing: same rules as `TaskRow.tsx` (Story 1.3) — every color resolves to a `--bg`/`--surface`/`--border`/`--text`/`--text-dim`/`--accent` token, **zero** hardcoded hex and **zero** `amber-*`/`rose-*`/`emerald-*`/`zinc-*` Tailwind utilities (NFR1/UX-DR1). Container uses `px-4 py-3` and `gap-3` (8pt-grid steps, NFR2). Mono hint uses `font-mono text-meta text-[var(--text-dim)]` (matches `TaskRow`'s meta-tag styling precedent).
  - [x] Do **not** add a `disabled` prop or offline/error state — no AC in this story requires it, and the UX spec's "disabled (offline/error only)" state has no trigger anywhere in this app yet. Do not invent one.

- [x] Task 2: Wire `QuickAddBar` into `app/page.tsx`, replacing the old quick-capture form's input (AC: #1)
  - [x] **Scope boundary (read before editing):** replace only the `<form onSubmit={handleCreate}>...</form>` block (title input, priority swatch grid, "Add details" toggle + description textarea) with `<QuickAddBar onAdd={handleQuickAdd} />`. **Leave the surrounding "Quick capture" panel header unchanged** (the `Sparkles`-icon eyebrow, "What needs your attention?" heading, "New task" badge, and the `surface-panel` wrapper) — removing/restructuring that panel is explicitly Story 1.6's job ("replaces the current quick-capture panel, stats grid, and flat queue"). This story only swaps the capture control itself, same scoping precedent as Story 1.3 (component swap, not layout rewrite).
  - [x] Remove now-unused state/logic from `HomePage`: `title`, `description`, `priority`, `showDetails` state; the local `PRIORITY_OPTIONS` array; the `handleCreate` function. Remove the now-unused `ChevronDown`/`ChevronUp`/`Plus` imports from `lucide-react` (verify `Plus` isn't used elsewhere in the file before removing it — it currently is only used in the old submit button).
  - [x] Add a new `handleQuickAdd(title: string)` function that builds the `addTask` payload using `settings.defaultPriority` (from `useTaskStore`) instead of a user-picked priority — reuse the *exact same* importance/urgency scoring fallback the old `handleCreate` used (`critical→9, high→7, medium→5, low→3`, mapped from the priority value) so `importance`/`urgency` stay populated exactly as before; `status: "backlog"`, `tags: []`, `dependencies: []`, `isPinned: false` unchanged. Destructure `settings` from `useTaskStore()` alongside the existing `tasks`, `addTask`.
  - [x] **Position-matches-score (AC #1) — critical design decision, read fully:** `stores/task-store.ts#addTask` must **not** be modified — `_bmad-output/test-artifacts/test-design-epic-1.md:353` explicitly states all existing store methods including `addTask` "must continue functioning unchanged — not modified by Epic 1." `addTask` still appends every new task at `position: tasks.length` (last), unchanged. To satisfy AC #1 without touching the store, switch `app/page.tsx`'s active-task list from its current ad hoc `tasks.filter(t => t.status !== "completed").sort((a,b) => a.position - b.position)` to the **already-built, currently-unused** `useSortedTasks()` hook from `@/hooks/useTasks` (import it; it filters non-completed and calls `sortTasks(active, settings.sortMode)`). With the default `settings.sortMode === "recommended"`, the list renders sorted by `priorityScore` descending (pinned first, stable tie-break) — so a newly added task automatically renders at the position matching its score, purely through display-time sorting. This is a **drop-in replacement**: `useSortedTasks()` returns `Task[]` with the identical filter as today's `activeTasks`, so no other code needs to change. Do not attempt to make `addTask` insert at a score-based position — that would violate the "no store changes" constraint and duplicate `sortTasks`'s job.
  - [x] **Why this doesn't break Story 1.3's drag-reorder regression test:** `DraggableTaskList`'s `handleDragEnd` already calls `setSortMode("manual")` before `reorderTasks(...)`. Once a user drags anything, `settings.sortMode` flips to `"manual"`, and `sortTasks("manual", ...)` sorts by raw `position` — i.e. exactly what `reorderTasks` just set. So pre-drag the list is score-sorted (satisfying this story's AC #1), and post-drag it's position-sorted (preserving Story 1.3's manual-drag behavior and `tests/e2e/task-reorder.spec.ts`'s assertions unchanged). This was verified by hand-tracing both hooks/functions — no code in `lib/prioritization/sort.ts` or `stores/task-store.ts` needs to change.
  - [x] Keep the `tasks` variable (still needed for the "Stat" panel's `tasks.filter(...)` counts) — add `const activeTasks = useSortedTasks();` as a separate hook call alongside the existing `useTaskStore()` destructure (same multi-hook pattern already used elsewhere in this codebase, e.g. `DraggableTaskList`).

- [x] Task 3: Manual verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.
  - [x] `npm run dev` and manually confirm: typing text + Enter creates a task and the input stays focused with an empty value; typing text + tapping the Plus button does the same; pressing Enter/tapping Add with an empty input does nothing (no task, no error UI); focusing the input shows an `--accent` border, blurring reverts it; typing text then pressing Escape clears the text without moving focus away from the input; the `↵ add` mono hint is visible; the "Quick capture" panel header above it still renders (untouched, old amber styling — expected).
  - [x] Manually verify the position/score behavior: add a task via `QuickAddBar` (default priority), edit it via the existing edit-icon → `TaskDrawer` flow to set its priority to "Low" and save, then add a second task via `QuickAddBar`. Confirm the second (higher-score, default-priority) task renders **above** the first (now low-priority) task in "Your queue" — confirming score-based ordering is live via `useSortedTasks()`. **Discovered pre-existing bug (unrelated to this story, not fixed — see Dev Agent Record → Completion Notes):** `TaskForm`'s "Save Changes" silently fails validation whenever `estimatedMinutes` is empty. Worked around during verification by filling "Est. Minutes" before saving; confirmed score-based positioning works correctly once the save actually goes through.
  - [x] Confirm drag-and-drop reorder (Story 1.3's core loop) still works after this change: drag a row to a new position, confirm it settles there and stays there (this is the "manual" sort-mode takeover described in Task 2). Verified via a real pointer drag plus a page reload confirming the manual order persists.

- [x] Task 4: Playwright E2E coverage (AC #1, #2, #3, #4, #5) + fix the now-stale Story 1.3 test
  - [x] **Update `tests/e2e/task-reorder.spec.ts`** — replaced the stale `page.getByPlaceholder('e.g. Prepare the project brief')` locator with `page.getByLabel('Add a task')`. `page.getByRole('button', { name: /add task/i })` needed no change — it still resolves via the new submit button's `aria-label="Add task"`.
  - [x] New file `tests/e2e/quick-add-bar.spec.ts` with 5 tests (`1.4-E2E-001` through `-005`) covering AC #1–#5. `1.4-E2E-001` uses the real edit-drawer flow to genuinely prove score-based positioning (demote one task to Low priority, add a second default-priority task, assert it renders above). `1.4-E2E-002`'s alert-check excludes Next.js's own empty/hidden `#__next-route-announcer__` element (present on every page regardless of this feature — confirmed a false positive during manual verification). `1.4-E2E-005` uses `toHaveCSS` (auto-retrying) rather than an immediate `getComputedStyle` read, since the border has a CSS transition and an immediate read can catch a mid-transition value (confirmed via manual reproduction).
  - [x] Ran `npm run test:e2e` (`npx playwright test --workers=1`, all 3 browser projects) — **27/27 passed**, including this new file, the updated `task-reorder.spec.ts`, and the pre-existing `tasks.spec.ts`/`api-tasks.spec.ts`.

## Dev Notes

### Critical design decision: how AC #1 is satisfied without touching `addTask`

See Task 2 above for the full reasoning — summarized: `stores/task-store.ts#addTask` is explicitly protected from Epic 1 changes per `_bmad-output/test-artifacts/test-design-epic-1.md:353`. AC #1 ("inserted at the position matching its priority score") is achieved entirely by switching `app/page.tsx`'s active-task source from its own ad hoc position-sort to the pre-built, currently-unused `useSortedTasks()` hook (`hooks/useTasks.ts`), which already respects `settings.sortMode` ("recommended" by default = score-sorted; "manual" after any drag = position-sorted, matching `reorderTasks`). This hook — along with `useRecommendedTasks`/`useTodayTasks` — was scaffolded in the initial commit ahead of the redesign specifically for this kind of wiring; use it as-is, do not reimplement its logic inline.

### Scope boundary: what NOT to touch

- `stores/task-store.ts` — **do not modify `addTask` or any other store method** (explicit constraint, see above).
- `lib/prioritization/score.ts` / `lib/prioritization/sort.ts` — unchanged, already correct, already covered by the Task 2 design.
- `components/tasks/TaskRow.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskCard.tsx` — no changes needed; this story only touches the capture control.
- `app/page.tsx`'s "Quick capture" panel header (eyebrow/heading/badge), the "At a glance" stats panel, and the overall page section structure — all Story 1.6 scope (Single Stream layout assembly). Leave them exactly as they are, old amber styling included. This mirrors Story 1.3's precedent of tolerating temporary visual inconsistency between a restyled component and its not-yet-restyled surroundings.
- `components/tasks/TaskForm.tsx` / `TaskDrawer.tsx` — unchanged. They already support task creation (`isEdit` false path calls `addTask`), which is why dropping the priority-picker/description field from the quick-add flow is safe: full-detail creation remains available through the existing form (per epics.md's FR1 coverage note: "Quick capture via QuickAddBar; full-detail create also via Epic 2's TaskForm"), even though nothing currently triggers `TaskDrawer` in "create" mode from the home page — that wiring, if needed, is not this story's concern.

### Judgment calls made in this story (flag if product/UX disagrees)

- **Priority selection removed from quick-add entirely**: the old form let users pick one of 4 priorities inline; `QuickAddBar` per UX-DR6 has no priority control, and epics.md's AC #1 says "default priority" explicitly. New tasks use `settings.defaultPriority` (an existing, previously-unused `AppSettings` field — the correct source, not a hardcoded literal).
- **`aria-label="Add a task"` placed on the `<input>`**, not a wrapping container — this is what Playwright's `getByLabel` can actually resolve to, and it's the element Enter/Escape behavior naturally attaches to. The submit button gets its own `aria-label="Add task"` (distinct text) so both remain independently targetable and so the pre-existing `tests/e2e/task-reorder.spec.ts` button locator (`name: /add task/i`) keeps resolving without changes.
- **Mono hint (`↵ add`) always visible**, not conditionally shown on focus/value — the AC states the bar "shows a mono `↵ add` hint" with no conditional language; keeping it static avoids inventing an undocumented interaction.

### Token/style conventions (consistent with `TaskRow`, Story 1.3)

- Every color must resolve to a `--bg`/`--surface`/`--surface-2`/`--border`/`--text`/`--text-dim`/`--accent` CSS custom property. Zero hardcoded hex, zero `amber-*`/`rose-*`/`emerald-*`/`zinc-*` Tailwind utilities in `QuickAddBar.tsx` (NFR1/UX-DR1 — binding on every Epic-1-touched file).
- Spacing: `px-4 py-3` container padding, `gap-3` internal gap — all 8pt-grid steps (NFR2).
- Do **not** reuse the old `.field-control`/`.primary-button` CSS classes from `app/globals.css` — those resolve to the old amber `--color-*` `@theme` tokens (see `app/globals.css:74-79`), the exact thing Story 1.1 banned for Epic-1-touched components. Build `QuickAddBar` with direct `bg-[var(--surface)]`/`border-[var(--border)]`-style classes, same as `TaskRow.tsx`.
- `--accent` is `#7c8aff` (`rgb(124, 138, 255)`), `--border` is `#24262f` (`rgb(36, 38, 47)`) — needed for the CSS-assertion test (`1.4-E2E-005`). [Source: app/globals.css:52-58]

### Previous story intelligence (1.1–1.3)

- Tokens (Story 1.1), `PriorityDot` (Story 1.2), and `TaskRow`/`DraggableTaskList` (Story 1.3) are complete and committed to the working tree (per `git status`: `app/globals.css`, `app/layout.tsx`, `components/tasks/DraggableTaskList.tsx` modified; `components/tasks/TaskRow.tsx`, `components/ui/PriorityDot.tsx`, `tests/e2e/task-reorder.spec.ts` added) — build directly on top.
- No component-test framework exists yet (`vitest` absent, `EPIC1-R03` open) — same gap Stories 1.1–1.3 hit. This story's test plan stays entirely within Playwright E2E (full-page interaction), which needs no component-test harness — every AC here is reachable through real page interactions, so there's no coverage gap to substitute for with manual-only verification this time.
- No `components/ui/index.ts`/`components/tasks/index.ts` barrel exists — import `QuickAddBar` by direct path, same as `TaskRow`/`PriorityDot`.
- Story 1.3 fully reverted every temporary manual-verification change and stopped the dev server afterward before finishing — do the same here (the priority-edit-then-add manual check in Task 3 uses real, permanent UI flows, so there's nothing to revert there, but don't leave the dev server running).

### Project Structure Notes

- Files to touch: `components/tasks/QuickAddBar.tsx` (new), `app/page.tsx` (modified), `tests/e2e/quick-add-bar.spec.ts` (new), `tests/e2e/task-reorder.spec.ts` (modified — one locator line).
- Explicitly out of scope: `stores/task-store.ts`, `lib/prioritization/score.ts`, `lib/prioritization/sort.ts`, `components/tasks/TaskRow.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `app/completed/page.tsx`, `app/globals.css`, `app/layout.tsx`, `components/ui/*`.
- Conforms to `project-context.md`: `@/*` path alias for all imports, strict TypeScript (no `any`), `"use client"` on `QuickAddBar.tsx` (uses state/refs), no direct `localStorage` access (goes through `useTaskStore`/`addTask` as before).

### Testing Requirements

- `1.4-E2E-001` (P0) — valid text + Enter/tap creates a task at the position matching its priority score. The epic's sole P0 gate for this story.
- `1.4-E2E-002` (P1, risk `EPIC1-R06`) — empty submit is a silent no-op.
- `1.4-E2E-003` (P1) — `aria-label`, Escape-clears-without-blur, mono hint. Test-design classified this "Component/a11y," but since it's fully reachable via a real page (no isolated-rendering need), it's covered here as E2E instead of being blocked on the still-missing component-test framework.
- `1.4-E2E-004`/`1.4-E2E-005` (P2) — refocus after add; focused-border state.
- The pre-existing `1.3-E2E-003` (`tests/e2e/task-reorder.spec.ts`) must keep passing after its one locator update (Task 4).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: Quick Add Bar & Silent-No-Op Capture] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#QuickAddBar] — anatomy, states, accessibility rule
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows / Add a Task] — silent no-op, refocus-for-rapid-capture flow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns / Form Patterns] — "the quick-add bar is intentionally not a form in the traditional sense — no validation chrome"
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md:130,152-153,173,353] — P0/P1/P2 test items for Story 1.4; explicit "`addTask`... not modified by Epic 1" constraint; `EPIC1-R06` risk/mitigation
- [Source: _bmad-output/project-context.md#Critical Don'ts / Anti-Patterns] — no inline styling, no hardcoded colors, `@/*` aliases
- [Source: app/page.tsx] — current quick-capture form being replaced (priority swatches, description toggle, `handleCreate`)
- [Source: hooks/useTasks.ts] — `useSortedTasks`/`useRecommendedTasks`/`useTodayTasks`, pre-built and unused until this story
- [Source: stores/task-store.ts:73-85] — `addTask`'s append-only `position: tasks.length` behavior, left unmodified
- [Source: components/tasks/TaskForm.tsx:75-157] — existing create-mode support (`isEdit` false → `addTask`), confirms full-detail creation stays available elsewhere
- [Source: app/globals.css:52-63] — Graphite Violet `:root` token values
- [Source: tests/e2e/task-reorder.spec.ts] — the stale placeholder locator this story must fix
- [Source: _bmad-output/implementation-artifacts/1-3-task-row-component.md] — token/aria-label conventions, temporary-render-and-revert precedent, scope-boundary documentation pattern

## Change Log

- 2026-09-21: Story created via create-story workflow.
- 2026-09-22: Implemented Story 1.4 — built `QuickAddBar`, wired it into `app/page.tsx` (switching the active-task list to the pre-built `useSortedTasks()` hook to satisfy AC #1 without modifying `addTask`), added `tests/e2e/quick-add-bar.spec.ts`, and fixed a stale locator in `tests/e2e/task-reorder.spec.ts`. Verified via `tsc`, `eslint`, extensive manual browser verification (including root-causing and working around a discovered pre-existing, out-of-scope `TaskForm` bug), and the full Playwright suite (27/27 passing across chromium/firefox/webkit). Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors.
- `npm run lint` → no ESLint warnings or errors.
- Ad-hoc Playwright scripts (not committed) drove real browser interactions against the dev server to verify every AC before authoring the permanent spec, mirroring Story 1.3's approach: Enter-to-add, tap-to-add, empty-submit no-op, focused/unfocused border color (`getComputedStyle`), Escape-to-clear, mono hint visibility, and the score-based positioning scenario.
- During that manual pass, discovered a **pre-existing, unrelated bug** in `TaskForm.tsx`: its "Save Changes" button silently fails to submit whenever the "Est. Minutes" field is empty. Root-caused via a temporary `console.log` at the top of `TaskForm`'s `onSubmit` (added, verified, then fully reverted — confirmed zero diff via `git diff components/tasks/TaskForm.tsx` afterward) plus direct DOM inspection: an empty `type="number"` input's `valueAsNumber` evaluates to `NaN`, and zod's `z.number().min(0).optional()` rejects `NaN` (it only accepts `undefined`), so `handleSubmit(onSubmit)` never calls `onSubmit` and no error is shown anywhere in the UI (no field-level error display exists for that field). This blocked my planned `1.4-E2E-001` test approach (edit a task's priority to prove score-based ordering) until I added a workaround (filling "Est. Minutes" before saving) in both the manual check and the permanent test. `TaskForm.tsx`/`TaskDrawer.tsx`/`Button.tsx` are explicitly out of scope for Story 1.4 (see Dev Notes' scope boundary), so this was **not fixed** — flagging it here for separate triage (likely an Epic 2 `TaskForm`-restyle-adjacent fix, or its own bug ticket).
- `npx playwright test --workers=1` (all 3 browser projects: chromium, firefox, webkit) → **27/27 passed**, including the new `tests/e2e/quick-add-bar.spec.ts` (5 tests × 3 browsers), the updated `tests/e2e/task-reorder.spec.ts`, and the pre-existing `tasks.spec.ts`/`api-tasks.spec.ts`.
- Two dev server instances were found running on ports 3000/3001 at the start of this session (a pre-existing process on 3000 of unknown origin, already serving up-to-date content via hot-reload, plus one I started on 3001). Stopped the one I started (3001) and used the pre-existing 3000 instance (Playwright's default `baseURL`) for all verification; did not touch the unfamiliar port-3000 process since it predated this session and wasn't mine to manage.
- All temporary ad-hoc verification scripts (`check-*.mjs`, `manual-verify-1-4.mjs`) were deleted from the project root before finishing; `test-results/` (local Playwright run artifacts) was also cleaned up.

### Completion Notes List

- Created `components/tasks/QuickAddBar.tsx`: a `<form>` (Plus-icon submit button, `aria-label="Add task"`) wrapping a controlled `<input>` (`aria-label="Add a task"`, `placeholder="Add a task..."`) and a static mono `↵ add` hint. Submit trims and no-ops silently on empty input (AC #2); on success calls `onAdd(trimmed)`, clears, and refocuses via a ref (AC #3). `Escape` clears the input without blurring (AC #5). Focused border uses `focus-within:border-[var(--accent)]` on the form wrapper — no local focus-tracking state needed (AC #4). No hardcoded colors; every color resolves to a Graphite Violet `--*` token, consistent with `TaskRow.tsx`'s conventions.
- Wired `QuickAddBar` into `app/page.tsx`, replacing only the old `<form onSubmit={handleCreate}>` block (title input, 4-option priority swatch grid, "Add details" description toggle) — the surrounding "Quick capture" panel header/badge and the "At a glance" stats panel were deliberately left untouched (Story 1.6 scope). Removed the now-unused `title`/`description`/`priority`/`showDetails` state, `PRIORITY_OPTIONS` array, and `handleCreate` function; removed the now-unused `ChevronDown`/`ChevronUp`/`Plus` imports.
- New `handleQuickAdd(title)` builds the `addTask` payload from `settings.defaultPriority` (previously-unused `AppSettings` field) instead of a user-picked priority, reusing the exact same importance/urgency scoring fallback the old form used.
- **AC #1 (position matches priority score) implemented without touching `stores/task-store.ts#addTask`**, per the explicit constraint in `test-design-epic-1.md:353` that all existing store methods must stay unmodified. Instead, swapped `app/page.tsx`'s ad hoc `tasks.filter(...).sort((a,b) => a.position - b.position)` for the pre-built, previously-unused `useSortedTasks()` hook from `@/hooks/useTasks`, which sorts by `settings.sortMode` ("recommended" by default = score descending, pinned first; "manual" after any drag = raw position, matching `reorderTasks`). Verified end-to-end: a newly added default-priority task renders above a task previously demoted to Low priority (score-based), and drag-and-drop reorder (Story 1.3's protected regression) still works and persists across reload (position-based, once `sortMode` flips to `"manual"`).
- Added `tests/e2e/quick-add-bar.spec.ts` (5 tests: `1.4-E2E-001` P0 through `1.4-E2E-005` P2) and fixed the now-stale locator in `tests/e2e/task-reorder.spec.ts` (old form's placeholder text no longer exists; replaced with `page.getByLabel('Add a task')`).
- Discovered and documented (but did not fix, per explicit out-of-scope boundary) a pre-existing `TaskForm.tsx` bug — see Debug Log References.

### File List

- `components/tasks/QuickAddBar.tsx` (new)
- `app/page.tsx` (modified)
- `tests/e2e/quick-add-bar.spec.ts` (new)
- `tests/e2e/task-reorder.spec.ts` (modified)
