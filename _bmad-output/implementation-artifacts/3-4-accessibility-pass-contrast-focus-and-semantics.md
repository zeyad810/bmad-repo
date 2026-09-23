# Story 3.4: Accessibility Pass — Contrast, Focus, and Semantics

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want every interactive element to have a visible focus state and proper semantic markup,
so that the app is fully operable and legible without a mouse or perfect vision.

## Acceptance Criteria

1. **Given** any interactive element (row, quick-add, drag handle, checkbox, buttons, nav items), **when** focused via keyboard, **then** a visible `--accent` outline appears. [Source: epics.md#Story 3.4; NFR5; UX-DR13]
2. **Given** all text/background pairs introduced across Epics 1–2, **when** checked, **then** they meet WCAG AA contrast at their defined sizes. [Source: epics.md#Story 3.4; NFR5; ux-design-specification.md#Accessibility Considerations]
3. **Given** task list markup, **when** inspected, **then** it uses semantic HTML (list semantics, real `<button>`/`<input>` elements) rather than div-soup. [Source: epics.md#Story 3.4; UX-DR13; ux-design-specification.md#Implementation Guidelines]
4. **Given** the three core journeys (Add, Reprioritize, Review & Complete), **when** performed using only a keyboard, **then** each can be completed start to finish without a mouse. [Source: epics.md#Story 3.4; NFR5; ux-design-specification.md#User Journey Flows]

### How the ACs are interpreted (so review can check them)

- **"Row" in AC #1:** a `TaskRow` isn't itself interactive. Its interactive parts are the handle, complete, edit, and delete controls, and each gets the outline. We **don't** make the row focusable just to show a ring; an extra tab stop per row is worse for keyboard users.
- **"Visible `--accent` outline"** is `outline: 2px solid var(--accent); outline-offset: 2px` on `:focus-visible`. It's delivered by **one base-layer rule**, so nothing can be missed (including legacy elements and future ones). Per-component rings added in 3.1–3.2 use the same values, so they stay.
- **AC #2's scope** is the pairs introduced in Epics 1–2 (the Graphite Violet tokens). I **measured** them (table in Dev Notes), and they all pass. The work is therefore (a) fixing the two **failing legacy pairs that sit inside Epic 1–2 surfaces**, which are the QuickAddBar placeholder and the app header text, and (b) making sure nothing new drops below AA. The legacy Completed-archive header and `TaskCard` are out of scope (Question 1).
- **AC #4's journeys** are all on the home page (UX spec, User Journey Flows): **Add** (quick-add), **Reprioritize** (the 3.3 keyboard drag), and **Review & Complete Backlog** (complete a Backlog row with its checkbox). Completing *from start to finish* requires that **focus doesn't fall to `<body>`** when the completed row disappears.

## Tasks / Subtasks

- [x] Task 1: A global accent focus outline (AC: #1)
  - [x] In `app/globals.css`, add a **base-layer** rule, **not** an unlayered one:
    ```css
    @layer base {
      :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    }
    ```
    It must be `@layer base`, so any component utility (`focus-visible:outline-*`) can still refine it. An unlayered rule would override every utility, which is the same trap as the `*` reset.
  - [x] `.field-control:focus` (`globals.css:89`) is **unlayered**, still uses **amber** (`rgba(251,191,36,…)`), and `.field-control` sets `outline: none`, so it beats the base rule. Change `.field-control:focus` to `border-color: var(--accent); box-shadow: none;`, and add `.field-control:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`. That removes the last amber focus ring (one of 3.1's leftover items).
  - [x] `components/tasks/TaskForm.tsx` `INPUT_BASE_CLASS`: replace `focus:outline-none` with `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`, and keep `focus:border-[var(--accent)]`. `RANGE_CLASS` and the checkboxes inherit the base rule; don't add anything to them.
  - [x] Result: `grep -rnE "outline-none|outline: none" app components` returns only `.field-control`'s base declaration, which is paired with its `:focus-visible` rule.

- [x] Task 2: Fix the failing contrast pairs (AC: #2)
  - [x] `globals.css:88` `.field-control::placeholder { color: #52525b }` is **2.32:1**, and it's the QuickAddBar's placeholder "Add a task...". Change it to `var(--text-dim)` (5.2–5.6:1).
  - [x] `app/layout.tsx` header: "Workspace synced locally", "Your focus board", and the "Private" pill use `text-zinc-500`/`text-zinc-400` at 11–12px. `zinc-500` on `#0b0c0e` is **4.05:1**, which fails AA for normal text. Change them to `text-[var(--text-dim)]` and the pill to `border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)]`. Swap `text-[11px]` for `text-meta` (12px, the type-scale floor). Leave the emerald dot, the body background, and `selection:bg-amber-400` alone (3.1 Question 1).
  - [x] **Don't lower any existing token or opacity.** Backlog `--text-dim` meta at `.88` opacity measures **4.59:1**, just 0.09 above the floor. Don't reduce the `.88`, and don't darken `--text-dim` or `--surface`.

- [x] Task 3: List and landmark semantics (AC: #3)
  - [x] `components/tasks/DraggableTaskList.tsx`: the list container `div` → **`<ul role="list">`** (`role="list"` keeps list semantics in Safari/VoiceOver when list styling is removed), and `SortableTaskRow`'s wrapper `div` → **`<li>`**. Keep `ref={setNodeRef}`, the inline transform/transition/zIndex style, and `className="w-full relative"` on the `li`, plus `flex flex-col gap-4` on the `ul`. **Remove `py-1`** (it's a no-op under the reset). **`TaskRow`'s root stays `div.group`** inside the `li`, because every row spec locates `div.group`.
  - [x] `app/page.tsx`: give each section an accessible name. Today → `<section aria-labelledby="today-heading">` with `<h2 id="today-heading" className="sr-only">Today</h2>` as its first child. Backlog → `<section aria-labelledby="backlog-heading">`. Add one `<h1 className="sr-only">My tasks</h1>` at the top of the page's root `div`. **No visible change.**
  - [x] `components/ui/SectionDivider.tsx`: the label `span` → **`h2`**, with an `id` prop (`id="backlog-heading"` from page.tsx) and the **same classes**. `drag-across-divider.spec.ts` uses `getByText('BACKLOG', { exact: true })`, which still works. Its `border-t` rules stay as `div`s with `aria-hidden="true"`.
  - [x] **Drag handle → a real `<button type="button">`** (`components/tasks/TaskRow.tsx`). Change `dragHandleProps` to `React.ButtonHTMLAttributes<HTMLButtonElement>` and `dragHandleRef` to `(el: HTMLElement | null) => void` (unchanged). Keep `HANDLE_CLASS`, `touch-none`, the spread order (`ref`, then `{...dragHandleProps}`, then `aria-label`), and `GripVertical`. dnd-kit's `role="button"`/`tabIndex=0` attributes become redundant but harmless. The KeyboardSensor still activates on Space/Enter, and the button has no `onClick`, so nothing else fires.
  - [x] **Priority is exposed as text, not only color:** in `TaskRow`, next to `<PriorityDot>`, add `<span className="sr-only">{PRIORITY_LABEL[task.priority]} priority</span>`, with `PRIORITY_LABEL: Record<TaskPriority, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" }` as a module constant. `PriorityDot` stays `aria-hidden`.
  - [x] **Row controls get the task title in their names** (WCAG 2.4.6; today a screen reader hears "Mark complete" N times). The names become `Reorder task: {title}`, `Mark complete: {title}` / `Restore task: {title}`, `Edit task: {title}`, and `Delete task: {title}` / `Confirm delete task: {title}`. **Every existing spec keeps working**, because Playwright's `getByLabel('Mark complete')` is a case-insensitive **substring** match. The one exact comparison is `tests/e2e/keyboard-reorder.spec.ts:96` (`=== 'Reorder task'`); change it to `.startsWith('Reorder task')`.
  - [x] `components/ui/Drawer.tsx` → a real modal dialog: the panel gets `role="dialog" aria-modal="true" aria-labelledby={titleId}` (a `useId()` on the `h2`). On open, remember `document.activeElement`. On close (unmount), return focus to it if it's still connected. **Trap Tab/Shift+Tab** inside the panel with a `keydown` handler that cycles between the first and last focusable elements (`a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])`). TaskForm's `autoFocus` title already takes the initial focus; don't add another. Keep the existing Escape → `onClose`, and `body.style.overflow`.

- [x] Task 4: The keyboard journeys work end to end (AC: #4)
  - [x] **Add**, in `components/tasks/QuickAddBar.tsx`:
    - Add `aria-label="Add a task"` on the input. This fixes the regression deferred since 2.1, and it's what `quick-add-bar.spec.ts`, `single-stream-layout`, `drag-across-divider`, `complete-from-backlog`, and `task-reorder` locate.
    - **Escape clears without losing focus** (UX-DR6): `onKeyDown` → if `Escape` and the input isn't empty, `setInput("")` and `preventDefault()`.
    - Give the submit `Button` `aria-label="Add task"`. Its visible text "Add" stays; the name contains the visible label (2.5.3), and it satisfies `task-reorder.spec.ts`'s `getByRole('button', { name: /add task/i })` as well as 3.2's `{ name: 'Add' }`, which is a substring match.
    - Leave `placeholder="Add a task..."`, since newer specs use it.
  - [x] **Reprioritize:** already delivered by 3.3 (Space → ↑/↓ → Space on the handle). There's no new work beyond the handle becoming a `<button>` (Task 3). Its `aria-describedby` instructions are preserved.
  - [x] **Review & Complete: focus must survive the row disappearing.** In `TaskRow`, when the row is about to be removed by **complete** (after the 200ms `COMPLETE_TRANSITION_MS`) or by **confirmed delete**, move focus **before** the store update:
    - Add a module helper `focusAfterRemoval(rowEl: HTMLElement)`. It finds the row's `li`, then the next sibling `li`'s `[data-row-complete]` button, else the previous sibling's, else `document.querySelector<HTMLInputElement>('input[aria-label="Add a task"]')`. Then it calls `.focus()`.
    - Give the complete/restore button `data-row-complete=""`, and use a `rowRef` (`useRef<HTMLDivElement>`) on the root `div.group`.
    - Call it in the `setTimeout` just before `setStatus(task.id, "completed")`. For delete, pass a wrapper to `useConfirmDelete(() => { focusAfterRemoval(...); deleteTask(task.id); })`, and only when `document.activeElement` is inside this row. **Pointer users must not have focus moved.** The `useConfirmDelete` hook itself doesn't change.
    - **Don't** move focus on restore (`isCompleted`), or when the row is completed via pointer, i.e. when focus isn't inside the row.

- [x] Task 5: Remove the pinch-zoom block (AC: #2 / WCAG 1.4.4)
  - [x] `app/layout.tsx` `viewport`: remove `maximumScale: 1` and `userScalable: false`, and keep `width`/`initialScale`. `user-scalable=no` fails WCAG 1.4.4 (Resize Text, AA), and axe's `meta-viewport` rule is **critical**, so 3.5's axe run would fail on it. There's a trade-off (Question 3): iOS Safari zooms in when focusing inputs under 16px (TaskForm's 13px fields). QuickAddBar is 16px and isn't affected.

- [x] Task 6: E2E coverage in the new `tests/e2e/a11y-pass.spec.ts` (AC: #1–#4)
  - [x] Import `test`/`expect` from `../support/merged-fixtures`. Add tasks via `getByLabel('Add a task')`, which is now fixed (keep a note that `getByPlaceholder` also works).
  - [x] Write the tests in Dev Notes → Testing Requirements.
  - [ ] Run: `npx playwright test tests/e2e/a11y-pass.spec.ts tests/e2e/quick-add-bar.spec.ts tests/e2e/nav-restyle.spec.ts tests/e2e/responsive-layout.spec.ts tests/e2e/keyboard-reorder.spec.ts --project=chromium`. **If it's blocked by the hydration hang**, don't debug the server. Record it, add a `deferred-work.md` entry, leave this subtask unchecked, and close out. This is standing guidance from Zeyad. The shell-only tests (focus ring on nav links, the header contrast, the viewport meta) don't need hydration, so expect them to pass. Report exactly which ones did.

- [x] Task 7: Static verification
  - [x] `npx tsc --noEmit` → exit 0. `npm run lint` → clean.
  - [x] Run the Task 1 grep. `grep -n "zinc\|#52525b" app/layout.tsx app/globals.css` should have **no** matches in the header text or `.field-control` rules (the body/selection/scrollbar leftovers are allowed).
  - [x] Update `deferred-work.md`: mark the 2.1 **QuickAddBar `aria-label`** item as resolved by 3.4, and note that 2.3's "in-place confirm isn't announced" item is **still open** (see Question 2).

## Dev Notes

### Current state (read before touching anything)

- **Focus today:** `focus-visible` accent rings exist only on `Button.tsx` (`BASE_CLASS`), the Sidebar/BottomNav links (3.1), the TaskRow controls (3.2), and the Completed page's "View active tasks" link. **There are none on** the QuickAddBar input (it's `.field-control`, with `outline: none` and an **amber** box-shadow on `:focus`), the TaskForm fields (`focus:outline-none` + an accent border only), the Drawer close button, the Sidebar brand link (it has one), the Completed "Back to my tasks" link, the TaskCard buttons, or the checkboxes/range inputs. Everything else falls back to the browser's default ring, not the accent.
- **`app/globals.css`:** there's an unlayered `* { margin:0; padding:0 }` reset at line 78 (it doesn't touch outline). `.field-control` is at lines 87–89: unlayered, `outline: none`, amber `:focus`, and a `#52525b` placeholder. There's a single `@layer utilities` block at lines 96–105. There's no `@layer base` block yet; Tailwind's preflight lives in its own base layer, and adding `@layer base { … }` appends to it.
- **`components/tasks/DraggableTaskList.tsx`:** it's `div` → `div` (sortable wrapper) → `TaskRow` `div.group`. There's no list semantics.
- **`app/page.tsx`:** there are two bare `<section>` elements with no names, no headings, and no `h1`. `SectionDivider` renders the "BACKLOG" text in a `span`.
- **`components/tasks/TaskRow.tsx`** (after 3.2/3.3): the handle is a `div` given `role="button"` and `tabIndex=0` by dnd-kit. The row buttons are real `<button>`s with generic labels. `PriorityDot` is `aria-hidden`, so **priority isn't exposed to assistive tech at all**. Completing a row unmounts it after 200ms, and focus drops to `<body>`.
- **`components/tasks/QuickAddBar.tsx`:** a `form` → `input` (no `aria-label`, no Escape) + a `Button` named "Add".
- **`components/ui/Drawer.tsx`:** a backdrop `div` + a panel `div`. There's no `role="dialog"`, no `aria-modal`, no label link, no focus trap, and no focus return. Escape closes it. TaskForm's title input has `autoFocus`.
- **`components/tasks/TaskForm.tsx`:** it's well built already. Every field has `<label htmlFor>`, the title has `aria-invalid`/`aria-describedby` → `title-error`, the dependencies are in a `fieldset`, and the icons are `aria-hidden`. Only its focus style changes.
- **`app/layout.tsx`:** `viewport` has `maximumScale: 1, userScalable: false`. The header has legacy `zinc-500`/`zinc-400` text at 11–12px.

### Measured contrast (WCAG 2.x relative luminance; computed during story creation)

| Pair | Ratio | AA need | Result |
|---|---|---|---|
| `--text` on `--bg` / `--surface` / `--surface-2` | 15.97 / 15.01 / 14.04 | 4.5 | pass |
| `--text-dim` on `--bg` / `--surface` / `--surface-2` | 5.92 / 5.57 / 5.21 | 4.5 | pass |
| `--text-dim` on `--surface`, whole row at `.88` opacity (Backlog meta) | **4.59** | 4.5 | pass, barely; don't reduce |
| `--text` on `--surface` at `.88` (Backlog title) | 11.79 | 4.5 | pass |
| `--accent` text on `--bg`/`--surface`; `--bg` text on `--accent` (primary) | 6.46 / 6.07 / 6.46 | 4.5 | pass |
| `--text` on `--accent-soft` (active sidebar item) | 13.43 | 4.5 | pass |
| `--bg` on `--text` (armed danger) | 15.97 | 4.5 | pass |
| `--accent` outline vs `--bg` / `--surface` (non-text, 1.4.11) | 6.46 / 6.07 | 3.0 | pass |
| `.field-control` placeholder `#52525b` (QuickAddBar) | **2.32** | 4.5 | **fail → Task 2** |
| Header `zinc-500` `#71717a` on `#0b0c0e`, 11–12px | **4.05** | 4.5 | **fail → Task 2** |
| `--pri-low` `#4c4f5c` dot on `--surface` (non-text) | **2.26** | 3.0 | fail; **not changed** (Question 4) |
| `--border` `#24262f` on `--surface` (input/row edge) | 1.22 | 3.0* | *only needed if the border is the sole identifier; see Question 4 |
| Legacy Completed/`TaskCard` `zinc-600`/`zinc-700` | 2.28 / 1.69 | 4.5 | fail; **out of scope** (Question 1) |

### Why these choices

- **One `@layer base` `:focus-visible` rule** instead of adding classes to about 30 elements: it can't miss an element, it covers legacy markup (TaskCard, the Completed links), and a component that needs a different offset can still override it with a utility. It targets `:focus-visible`, not `:focus`, so mouse clicks don't flash rings. Chromium, Firefox, and WebKit all apply `:focus-visible` to text inputs on any focus, which is what we want.
- **`ul`/`li` with the row `div.group` kept inside:** this gives screen readers "list, N items" for free, without renaming the element every spec depends on. dnd-kit doesn't care which tag its node is.
- **Focus-after-removal only when focus is inside the row:** this keeps keyboard users in place without ever grabbing focus from mouse or touch users (which would scroll the page unexpectedly).
- **Titles in accessible names, not visible text:** there's no visual change, and every locator keeps working (Playwright substring matching). This answers 3.3's Question 3.

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| `div.group` row root; `getByLabel('Reorder task' / 'Mark complete' / 'Restore task' / 'Edit task' / 'Delete task' / 'Confirm delete task')`, all substring matches | every row spec (7+) |
| The handle is still the dnd-kit activator (`setActivatorNodeRef`), with `touch-none`, 44/32px, no inline style | `responsive-layout` 3.2-E2E-004/006, `keyboard-reorder`, drag specs |
| `placeholder="Add a task..."`; the quick-add submit is reachable as `{ name: 'Add' }` and `{ name: /add task/i }` | 3.2/3.3 specs, `task-reorder` |
| `getByText('BACKLOG', { exact: true })`; `today-dropzone`/`backlog-dropzone` | `drag-across-divider`, `empty-states` |
| Drawer: Escape closes it, TaskForm title autofocus, the "Save changes"/"Cancel" buttons | `task-form-restyle`, `button-hierarchy`, `single-stream-layout` |
| No toast, modal, or visible feedback on add/complete/reorder; the live region stays sr-only | NFR7, `quiet-motion`, 3.3-E2E-007 |
| `li` still carries the dnd-kit inline transform (the settle) | 1.9 `quiet-motion` |

### Scope boundaries: what NOT to touch

- **Story 3.5:** axe integration and full journey specs at both breakpoints. Write this story's checks as plain Playwright assertions, without adding `@axe-core/playwright`, which is a new dependency and belongs to 3.5.
- The Completed archive's legacy header, `TaskCard`, and its zinc/emerald colors (Question 1). They still get the accent ring from the base rule, for free.
- `--pri-*`, `--border`, and other token values (Question 4). The body gradient, the `selection:` color, and the emerald "synced" dot (3.1 Question 1).
- Announcing the in-place delete confirm (2.3 deferred), and the `isTodayTask` overdue quirk (`EPIC1-R02`, 3.3 Question 2).
- No new dependencies. Don't use `focus-trap-react` or anything similar; the trap is about 15 lines.

### Previous story intelligence (3.1–3.3)

- **3.3:** the handle got `ref={dragHandleRef}` (`setActivatorNodeRef`), so dnd-kit's RestoreFocus returns focus after keyboard drops. There are announcements with titles in the DndContext live region, and `keyboard-reorder.spec.ts` line 96 compares the label exactly (update it, Task 3). The pure `resolveDrop` is in `lib/reorder/`.
- **3.2:** all row targets are 44px on mobile, with `*_CLASS` constants in TaskRow. The layout uses calc widths and spacers because the `*` reset still zeroes padding and margin (the 2.3 decision is **still open**, so check `globals.css` first). Watch out for `*/` inside TSX `{/* */}` comments: it ends the comment early.
- **3.1:** `aria-current="page"` and `nav aria-label="Primary"` are already on both navs. Leave them.
- **2.4 lesson:** assert positive computed values (`outline-color` = `rgb(124, 138, 255)`, `outline-style` = `solid`, `outline-width` = `2px`).
- **E2E reality:** every task-dependent spec since 2.1 has been blocked by `<main>` staying on `HydrationSkeleton` against the :3000 dev server. Shell-only tests (the nav and header) do pass. Don't investigate the server (memory: `feedback_no_local_server_debugging`).
- **Git:** only `b2d374d` + `29cf79a`. Epic 1–3.3 is uncommitted in the working tree. Build on it and revert nothing.

### Latest tech notes

The versions are pinned per `project-context.md`.
- **Tailwind v4:** `@layer base { … }` in the CSS entry merges into Tailwind's base layer, which comes before `components`/`utilities`, so utilities win over it. The `sr-only` and `focus-visible:` variants exist.
- **React 19:** `useId()` is fine for `aria-labelledby` ids. The `autoFocus` prop is honored on mount.
- **Next.js 15 `Viewport`:** omitting `maximumScale`/`userScalable` emits `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- **Playwright 1.63:** `page.keyboard.press('Tab')` + `expect(locator).toBeFocused()`. Read `getComputedStyle(el).outlineColor/outlineStyle/outlineWidth` while the element is focused via the keyboard. `:focus-visible` applies after keyboard navigation, but a programmatic `.focus()` after a mouse click may not match, so **reach elements with Tab**. `getByRole('list')` / `getByRole('listitem')` for semantics.

### Project Structure Notes

- **Modified:** `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskRow.tsx`, `components/tasks/QuickAddBar.tsx`, `components/tasks/TaskForm.tsx` (one class constant), `components/ui/Drawer.tsx`, `components/ui/SectionDivider.tsx`, `tests/e2e/keyboard-reorder.spec.ts` (one line), `_bmad-output/implementation-artifacts/deferred-work.md`.
- **New:** `tests/e2e/a11y-pass.spec.ts`.
- Use `@/*` imports only, strict TS, no `any`, and named exports. Keep `"use client"` where present. `SectionDivider` stays a server-safe component.

### Testing Requirements

New spec: `tests/e2e/a11y-pass.spec.ts`. Test IDs use the `3.4-E2E-*` prefix.

```ts
const ACCENT = 'rgb(124, 138, 255)';
async function outline(page: Page) {
  return page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element);
    return { color: s.outlineColor, style: s.outlineStyle, width: s.outlineWidth };
  });
}
async function tabTo(page: Page, locator: Locator, max = 40) {
  for (let i = 0; i < max; i++) { await page.keyboard.press('Tab'); if (await locator.evaluate((el) => el === document.activeElement)) return; }
  throw new Error('never reached by Tab');
}
```

| Test ID | Priority | Scenario |
|---|---|---|
| `3.4-E2E-001` | P0 | Shell only (no tasks), 1280×720: Tab to the Sidebar "Completed" link, the brand link, and (at 390×844) the BottomNav "Tasks" link. Each has `outline` `{ ACCENT, solid, 2px }`. |
| `3.4-E2E-002` | P0 | With one task: Tab to the quick-add input, the Add button, and the row's Reorder, Mark complete, Edit, and Delete controls. Every one has the accent outline. Open the drawer with Enter on Edit: the title input is focused and outlined, and Tab to a `select` and the "Pinned" checkbox shows the accent outline too. |
| `3.4-E2E-003` | P1 | Contrast fixes: the quick-add input's `::placeholder` color computes to `rgb(139, 141, 152)` (read with `getComputedStyle(el, '::placeholder').color`). The header "Private" pill and "Your focus board" (1280px) compute `color` `rgb(139, 141, 152)`. |
| `3.4-E2E-004` | P0 | Semantics: with 2 Today + 1 Backlog tasks, `getByRole('region', { name: 'Today' })` has `getByRole('list')` → 2 `listitem`s, and the `Backlog` region has 1. There's one `h1` ("My tasks"). The handle is a `button` (`getByRole('button', { name: /^Reorder task: /i })`). Each row exposes its priority text (`getByText('Medium priority')` in the row, sr-only). |
| `3.4-E2E-005` | P0 | **Add journey (keyboard only):** Tab to `getByLabel('Add a task')`, type, press Enter → the row appears and the input is still focused and empty. Type "draft", press Escape → the value is `''` and the input is still focused. |
| `3.4-E2E-006` | P0 | **Review & Complete journey (keyboard only):** with Today A, B, C, Tab to B's "Mark complete: B", press Enter → B is gone and **focus is on "Mark complete: C"**. Enter again on the last row → focus goes to "Mark complete: A" (the previous). Complete the only remaining row → focus goes to the quick-add input. Never `document.body`. |
| `3.4-E2E-007` | P1 | **Reprioritize journey (keyboard only):** Tab to A's handle, then Space, ArrowDown, Space → the order changes (thin; 3.3 owns depth). |
| `3.4-E2E-008` | P1 | **Drawer dialog:** Enter on "Edit task: A" → `getByRole('dialog', { name: 'Edit Task' })` is visible with `aria-modal="true"`. Tab ×30 never leaves the dialog. Escape closes it and focus returns to "Edit task: A". |
| `3.4-E2E-009` | P2 | The viewport meta content contains no `user-scalable=no` and no `maximum-scale=1`. |
| regression | P0 | `quick-add-bar.spec.ts` (it now has its `aria-label`, so it may go green for the first time since 2.1), `nav-restyle`, `responsive-layout`, `keyboard-reorder`, and `delete-confirm` on chromium. |

Run chromium first. Report honestly per test. If the environment blocks the run, follow the Task 6 guidance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] for the story and ACs. See also [#Requirements Inventory]: NFR5 (WCAG 2.1 AA: contrast, accent focus, semantics, keyboard journeys), UX-DR13 (focus, 44px, aria-labels, semantic HTML), and UX-DR6 (quick-add `aria-label`, Escape clears).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Considerations (lines 253-258), #Accessibility Strategy (485-495), #User Journey Flows (Add; Reprioritize, line 310; Review & Complete Backlog, line 329), #Color System (line 237: `--text-dim` for non-critical meta)]
- [Source: _bmad-output/project-context.md §2, §5]: `"use client"`, no inline styling (the dnd-kit transform is excepted), and `@/*` imports.
- [Source: app/globals.css:78-89, 96-105], [app/layout.tsx:21-26 viewport, 44-58 header], [app/page.tsx sections], [components/tasks/DraggableTaskList.tsx], [components/tasks/TaskRow.tsx], [components/tasks/QuickAddBar.tsx], [components/ui/Drawer.tsx], [components/ui/SectionDivider.tsx], [components/tasks/TaskForm.tsx:54-57, 157-170]
- [Source: _bmad-output/implementation-artifacts/3-3-keyboard-accessible-reorder-fallback.md]: the activator ref, the announcements, and the exact-label test line. [3-2-…md]: the target sizes and the reset workaround. [deferred-work.md]: the QuickAddBar aria-label (2.1), confirm announcements (2.3), TaskCard contrast (2.3), and the hydration hang.

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Completed archive:** its header and the legacy `TaskCard` still fail contrast (`zinc-600`/`700`, about 1.7–2.3:1). They're out of this story's "Epics 1–2" scope, but they're the last AA failures users will see. Should a small story migrate `/completed` to `TaskRow` and tokens? That would also close 2.3's and 3.2's Completed-page items.
2. **Announce the in-place delete confirm** (deferred since 2.3): the "Confirm?" state and its silent 2.5s revert aren't spoken. The fix is small (a polite live region in `useConfirmDelete`). Do you want it added here, or kept separate?
3. **Pinch-zoom:** removing `userScalable: false` is required for AA. The side effect is that iOS zooms in when you focus 13px TaskForm fields. If that bothers you on your phone, the clean fix is making form fields 16px on mobile (`text-body md:text-secondary`). Should I include that?
4. **Non-text contrast (1.4.11):** the Low-priority dot (2.26:1) and the input/row borders (1.22:1) are under 3:1. Raising `--pri-low` to 3:1 (about `#62657a`) makes it nearly indistinguishable from `--pri-med` (1.24:1 between them). This is a palette decision, not a code one, so it's left as is. Priority is now also exposed as sr-only text. Do you want a palette revision?

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- Before starting: `globals.css` still has the unlayered `*` reset (the 2.3 decision is still open), so I used no padding utilities in new markup.
- Red phase (`a11y-pass.spec.ts`, chromium): 1 passed and 8 failed. 3.4-E2E-009 failed on the real defect (`user-scalable=no`). 001 was already green (the nav rings came in 3.1), but it later proved timing-dependent (see below). The rest failed at the quick-add step (the hydration hang). I reordered 003 so its header assertions, which need no hydration, run before the quick-add placeholder read.
- **Bug found and fixed during implementation:** the Drawer's first focus-return captured `document.activeElement` in an effect. That's too late, because TaskForm's `autoFocus` has already moved focus into the dialog by then, so focus would never return to the Edit button. It now captures during the render in which `open` flips to true.
- **Test flake found and fixed:** after the change, 3.4-E2E-001 read the outline color as `rgb(139, 141, 155)`, part-way through a transition. Tailwind v4's `transition-colors` also animates `outline-color`. The helper now uses `expect.poll`. 001 + 009 with `--repeat-each=3`: **6/6 passed**.
- `npx tsc --noEmit`: exit 0. `npm run lint`: "No ESLint warnings or errors".
- Greps: `outline-none|outline: none` matches only `.field-control`'s base declaration, which is now paired with a `:focus-visible` accent rule. `zinc|#52525b|maximumScale` in layout/globals matches only the allowed body `text-zinc-100`/`selection:` line.
- Green run (`a11y-pass` + `nav-restyle` + `responsive-layout`, chromium): **8 passed** (3.4-E2E-009, 3.1-E2E-001…005, 3.2-E2E-001/002) and 13 failed, all at the quick-add step or on `<main>` content. After the poll fix, 3.4-E2E-001 also passes. `quick-add-bar.spec.ts` 5/5 fail (the form never renders; 003 also expects an `↵ add` hint that was never built). Per standing guidance, I didn't debug the server. It's logged in `deferred-work.md`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **Focus (AC #1):** one `@layer base` `:focus-visible` rule gives every element a 2px `--accent` outline with a 2px offset. `.field-control` loses its amber focus and gets an accent `:focus-visible` outline. TaskForm fields replace `focus:outline-none` with accent `focus-visible` utilities. Rows aren't made focusable, by design (their controls are).
- **Contrast (AC #2):** the QuickAddBar placeholder goes from `#52525b` (2.32:1) to `--text-dim` (5.2:1+). The header's "Workspace synced locally", "Your focus board", and "Private" go from zinc at 11–12px (4.05:1) to `--text-dim` at `text-meta`, and the pill uses tokens. No token or opacity was lowered.
- **Semantics (AC #3):** the lists are `ul role="list"` → `li` (the dnd-kit node and the inline transform stay on the `li`). `div.group` is kept inside. The page has an sr-only `h1` "My tasks", the Today section is named by an sr-only `h2`, and the Backlog section is named by the `SectionDivider` label, which is now an `h2`. The drag handle is a `<button>`. There's sr-only "{Priority} priority" text per row. Row controls are named with the title ("Mark complete: X", and so on). The Drawer is `role="dialog" aria-modal aria-labelledby`, with a Tab/Shift+Tab trap and focus returned on close.
- **Journeys (AC #4):** QuickAddBar has `aria-label="Add a task"` (resolving the 2.1 deferred item), Escape clears without losing focus, and the submit is named "Add task". Reprioritize is unchanged from 3.3. For complete and confirmed delete, focus moves to the next row's complete button, else the previous row's, else the quick-add input, **only when focus was inside the row**, so pointer users are unaffected. Restore doesn't move focus.
- **Pinch-zoom:** `maximumScale`/`userScalable` are removed from `viewport` (WCAG 1.4.4). Trade-off: iOS will zoom when focusing the 13px TaskForm fields (Question 3).
- `keyboard-reorder.spec.ts:96`'s exact label check is now `startsWith('Reorder task')`.
- **Verified:** tsc, lint, 3.4-E2E-001 (3/3), 3.4-E2E-009, 003's header half, and the shell regressions. **Not verified in a browser:** 002 and 004–008 and the placeholder color, which are blocked by the hydration hang. The Task 6 run subtask is left unchecked on purpose.

### File List

- `app/globals.css` (modified)
- `app/layout.tsx` (modified)
- `app/page.tsx` (modified)
- `components/tasks/DraggableTaskList.tsx` (modified)
- `components/tasks/TaskRow.tsx` (modified)
- `components/tasks/QuickAddBar.tsx` (modified)
- `components/tasks/TaskForm.tsx` (modified: one class constant)
- `components/ui/Drawer.tsx` (modified)
- `components/ui/SectionDivider.tsx` (modified)
- `tests/e2e/a11y-pass.spec.ts` (new)
- `tests/e2e/keyboard-reorder.spec.ts` (modified: one line)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-23: Story created via create-story workflow.
- 2026-09-23: Accessibility pass. Global accent focus outline; placeholder and header contrast fixed; list/landmark/heading/button semantics; titled row-control names and sr-only priority; the Drawer is now a modal dialog with a focus trap and focus return; QuickAddBar `aria-label` and Escape; focus is kept after complete/delete; pinch-zoom is re-enabled. Added `a11y-pass.spec.ts`: the shell tests pass, and the task-dependent tests are blocked by the pre-existing hydration hang (deferred).
