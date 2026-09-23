# Story 2.2: Restyle Task Editing (TaskDrawer & TaskForm)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the full task-editing drawer to match the calm Graphite Violet visual language,
so that editing details feels consistent with the rest of the app.

## Acceptance Criteria

1. **Given** `TaskForm`'s current inline `style` objects, **when** this story is complete, **then** all are replaced with Tailwind utility classes/token-based classes, **and** no inline `style` props remain for color, spacing, or typography. [Source: epics.md#Story 2.2]
2. **Given** `TaskForm`/`TaskDrawer`'s references to the old `--color-*` tokens, **when** restyled, **then** they reference the new Graphite Violet tokens from Story 1.1 instead. [Source: epics.md#Story 2.2]
3. **Given** a validation error (e.g. empty title), **when** shown, **then** it appears directly under the field in a small, quiet `--text-dim` style, **and** a restrained error tone is reserved only for actual failures. [Source: epics.md#Story 2.2; ux-design-specification.md#Form Patterns]
4. **Given** the existing react-hook-form + zod validation logic, **when** this story is complete, **then** validation behavior is unchanged — only visual styling changes. [Source: epics.md#Story 2.2]
5. **Given** the priority/status selects, **when** rendered, **then** the emoji-prefixed priority labels are replaced with plain text + `PriorityDot` (Story 1.2), consistent with the no-emoji rule. [Source: epics.md#Story 2.2]

## Tasks / Subtasks

- [x] Task 1: Replace `TaskForm`'s style objects with Tailwind class constants (AC: #1, #2)
  - [x] Delete `inputStyle`, `labelStyle`, `fieldStyle` (`components/tasks/TaskForm.tsx:48-73`). Replace them with module-level class-string constants, following the `PRIORITY_DOT_CLASS` idiom in `components/ui/PriorityDot.tsx:3-8`. Suggested values:
    - `FIELD_CLASS = "flex flex-col"`
    - `LABEL_CLASS = "mb-2 block font-mono text-meta uppercase tracking-[0.08em] text-[var(--text-dim)]"` (uppercase mono label with 0.08em letter-spacing, per UX-DR3)
    - `INPUT_CLASS = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-secondary text-[var(--text)] placeholder:text-[var(--text-dim)] transition-colors focus:border-[var(--accent)] focus:outline-none"`
  - [x] Convert every remaining inline `style={{...}}` in the file to classes (form root, live-score box, slider rows, slider captions, dependency list, dependency labels, checkboxes, pin row, actions row). The only `style` left in the file may be none — see Task 4 for the `Button` case.
  - [x] Stick to the 8pt spacing steps (`1/2/3/4/6/8/12` → 4/8/12/16/24/32/48px). Map current ad hoc values: form `gap: 20` → `gap-6`; `padding: "9px 12px"` → `px-3 py-2`; `marginBottom: 6` → `mb-2`; grid `gap: 12` → `gap-3`; `padding: "12px 16px"` → `px-4 py-3`; dependency list `gap: 6` → `gap-2`, `maxHeight: 140` → `max-h-36`; pin row `gap: 10` → `gap-3`; actions `gap: 10, paddingTop: 8` → `gap-3 pt-4`. No arbitrary spacing like `p-[10px]`.
  - [x] Stick to the type scale utilities from `app/globals.css:7-13` (`text-meta` 12, `text-secondary` 13, `text-body` 15, `text-subhead` 17, `text-section` 22, `text-title` 30). Current `fontSize: 14` and `fontSize: 11` values are not on the scale: use `text-secondary` for inputs and body copy, and `text-meta` for slider captions. Title input uses `text-body` (15px, matching task text).
  - [x] Replace every `--color-*` reference with Graphite Violet tokens:
    | Old | New |
    |---|---|
    | `--color-surface-2` | `--surface-2` |
    | `--color-border-2`, `--color-border` | `--border` |
    | `--color-text` | `--text` |
    | `--color-text-muted`, `--color-text-subtle` | `--text-dim` |
    | `--color-accent`, `--color-accent-subtle` | `--accent`, `--accent-soft` |
    | `--color-high` (urgency value + slider) | `--accent` (the accent is the only saturated hue; do not keep orange) |
    | `--color-critical` (error text) | `--text-dim` (see Task 3) |
    | `--radius-sm` / `--radius-md` | `rounded-lg` (8px, within the spec's ~8–10px radius) |
    | hardcoded `rgba(124,109,250,0.2)` border | `border-[var(--border)]` |
  - [x] Sliders and checkboxes: `accentColor` inline → Tailwind `accent-[var(--accent)]`. Keep `cursor-pointer`. Pin checkbox `width/height: 16` → `h-4 w-4`.

- [x] Task 2: Restyle the live Priority Score box (AC: #1, #2)
  - [x] Container: `flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3`.
  - [x] Label "Priority Score": `text-secondary text-[var(--text-dim)]`.
  - [x] Value: `font-mono text-section font-semibold tabular-nums text-[var(--accent)]`. JetBrains Mono + tabular-nums for numeric data (NFR3).
  - [x] Importance/urgency `{n}/10` read-outs: `font-mono text-secondary tabular-nums text-[var(--accent)]` (both use `--accent`; urgency stops using `--color-high`).
  - [x] Keep the text "Priority Score" and `liveScore` computation (`TaskForm.tsx:111-128`) unchanged.

- [x] Task 3: Quiet inline validation error (AC: #3, #4)
  - [x] Title error (`TaskForm.tsx:188-192`): render as `<p id="title-error" className="mt-1 text-meta text-[var(--text-dim)]">{errors.title.message}</p>`, directly under the input. Do not use red or `--color-critical`.
  - [x] On the title input, add `aria-invalid={errors.title ? "true" : undefined}` and `aria-describedby={errors.title ? "title-error" : undefined}`. This lets screen readers announce the quiet error, which carries no color signal.
  - [x] "Restrained error tone reserved only for actual failures": the Graphite Violet palette has **no** danger/red token and must not get one here (same constraint Story 2.1 honored). The error signal is the message text plus a field border change to `--text-dim` (`border-[var(--text-dim)]` when `errors.title` is set). No new color tokens and no Tailwind `rose-*`/`red-*` utilities.
  - [x] Do **not** change `taskSchema` (`TaskForm.tsx:12-25`), `defaultValues`, `register` options, or `onSubmit`. Validation behavior must be byte-for-byte identical (AC #4). This explicitly includes the known Est. Minutes `NaN` bug (see Dev Notes → Known Pre-existing Bug); do not fix it in this story.

- [x] Task 4: Actions row and `Button` (AC: #1)
  - [x] `<Button ... style={{ flex: 1 }}>` → `<Button ... className="flex-1">`. `Button` spreads `...props` onto `<button>`, so `className` passes through (`components/ui/Button.tsx:38,60`).
  - [x] Actions container: `flex gap-3 border-t border-[var(--border)] pt-4`.
  - [x] Keep `variant="primary"` on Save/Create and `variant="ghost"` on Cancel. This is already the correct hierarchy: one primary per context (UX Button Hierarchy).
  - [x] **Do NOT modify `components/ui/Button.tsx`.** It still uses inline styles and the old amber `--color-accent` internally. Story 2.3 owns that migration. So the Save button will still render amber until 2.3 lands. That is expected and out of scope; note it in Completion Notes.
  - [x] Keep button text exactly `Save Changes` / `Create Task` and `Cancel`. Existing E2E specs locate `getByRole('button', { name: /save changes/i })`.

- [x] Task 5: Priority select → plain text + `PriorityDot` (AC: #5)
  - [x] Change `PRIORITY_OPTIONS` (`TaskForm.tsx:34-39`) to `{ value: TaskPriority; label: string }[]` with labels `Critical`, `High`, `Medium`, `Low`. Remove the emoji and the now-unused `color` field.
  - [x] **Keep the native `<select>`.** Browsers can't render custom elements (a `PriorityDot`) inside `<option>`. Existing E2E specs also drive this control with `page.locator('select').first().selectOption('low')`. Replacing it with a custom listbox would break 6 existing tests and is not asked for.
  - [x] Show the dot next to the select, driven by the already-watched `priority` value (`TaskForm.tsx:108`): wrap the select in `relative`, render `<PriorityDot priority={priority} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />`, and give the select `pl-6` (24px) so text clears the dot. Import from `@/components/ui/PriorityDot`. `PriorityDot` is already `aria-hidden`, and the select's text still conveys priority, so it is never color-only.
  - [x] Status select: labels are already plain text. Only swap it to `INPUT_CLASS`.
  - [x] **Preserve DOM order:** Priority `<select>` must remain the first `select` in the form and Status the second. `single-stream-layout.spec.ts` and `quick-add-bar.spec.ts` rely on `.first()`/`.nth(1)`.
  - [x] Pin row: remove the `📌` emoji from "📌 Pin this task to the top" (no-emoji rule). Use plain text "Pin this task to the top", optionally preceded by lucide `<Pin size={14} />` in `--text-dim` (lucide is the project's icon set).

- [x] Task 6: Label/field association (AC: #1, supports existing tests)
  - [x] While rewriting labels, add `htmlFor`/`id` pairs (`task-title`, `task-description`, `task-priority`, `task-status`, `task-importance`, `task-urgency`, `task-due`, `task-estimate`, `task-category`, `task-tags`). This is a zero-risk semantics fix (currently every `<label>` is orphaned) and makes `getByLabel('Priority')` usable in the new spec. It does not change any placeholder, so `getByPlaceholder('e.g. 45')` keeps working.
  - [x] Change the label text `Title *` to `Title`. Title stays required by zod; the asterisk is chrome the calm design avoids. Optional, but recommended.

- [x] Task 7: Restyle the drawer chrome in `components/ui/Drawer.tsx` (AC: #2)
  - [x] `TaskDrawer.tsx` itself has no styling. The visible drawer surface is `Drawer.tsx`, which uses hardcoded zinc utilities (`bg-zinc-900`, `border-zinc-800`, `bg-zinc-700`, `text-zinc-100/400`, `hover:bg-zinc-800`). These are exactly the "ad hoc Tailwind color utilities" UX-DR1 replaces. `TaskDrawer` is the only consumer of `Drawer` (verified by grep), so restyling it here is safe and required for the drawer to look Graphite Violet.
  - [x] Sheet: `bg-zinc-900 border-zinc-800` → `bg-[var(--surface)] border-[var(--border)]`. Replace `shadow-2xl` with `shadow-xl` or keep it; no heavy glow. `rounded-t-3xl` → `rounded-t-xl` (the spec wants small radii; ~12px is acceptable for a bottom sheet top edge).
  - [x] Mobile grab bar: `bg-zinc-700` → `bg-[var(--border)]`. Keep `mt-3 mb-1` and `w-12 h-1.5` as they are; the margins are already on the 8pt grid.
  - [x] Header: `px-5 py-3.5` → `px-4 py-3` (8pt grid); `border-zinc-800` → `border-[var(--border)]`; title `text-base font-bold text-zinc-100` → `text-subhead font-semibold text-[var(--text)]`. **Keep it an `<h2>` with the same text.** E2E specs assert `getByRole('heading', { name: 'Edit Task' })`.
  - [x] Close button: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800` → `text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]`; `p-1.5` → `p-2`. Add `aria-label="Close"` (currently icon-only with no accessible name).
  - [x] Body: `p-5` → `p-4 md:p-6`.
  - [x] Backdrop `bg-black/60 backdrop-blur-xs` may stay (neutral scrim, not a palette color).
  - [x] **Leave `document.body.style.overflow` in `Drawer.tsx:22,26` alone.** That is imperative scroll-lock DOM manipulation, not a JSX inline `style` prop, and is out of AC #1's scope.
  - [x] Do not change `Drawer`'s props, Escape handling, backdrop-click-to-close, or the `md:` breakpoint behavior (bottom sheet on mobile, right slide-over at ≥768px).

- [ ] Task 8: Verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint`: zero errors, zero warnings.
  - [x] Grep `components/tasks/TaskForm.tsx` for `style=` → zero matches. Grep `TaskForm.tsx`, `TaskDrawer.tsx`, and `Drawer.tsx` for `--color-` and `zinc-` → zero matches. Grep `TaskForm.tsx` for emoji (`🔴|🟠|🟡|🟢|📌`) → zero matches.
  - [ ] Author `tests/e2e/task-form-restyle.spec.ts` (see Testing Requirements) and run it: `npx playwright test tests/e2e/task-form-restyle.spec.ts --project=chromium`. Per the team's standing guidance, if a dev-server/port problem blocks the run, do not chase it live. Record the gap in Completion Notes + `deferred-work.md` and close out. **Spec authored (5 tests). Not run to green:** the red-phase run failed in all 5 tests before reaching the drawer, because the server reused on port 3000 renders only the sidebar and no main content. Deferred per standing guidance; see Completion Notes.
  - [ ] Re-run the existing specs that drive the drawer (`single-stream-layout.spec.ts` 1.6-E2E-003/004/005 and `quick-add-bar.spec.ts` 1.4-E2E-001) if the environment allows. Note: these currently fail upstream because of the pre-existing `QuickAddBar` `aria-label` regression (`deferred-work.md`). They are not a signal for this story unless they fail *after* the quick-add step. **Not run:** same environment blocker.

## Dev Notes

### Current State (read before touching anything)

**`components/tasks/TaskForm.tsx` (357 lines):** a `"use client"` react-hook-form + zod form used for both create and edit.
- Lines 12-25: `taskSchema` (zod). **Unchanged.**
- Lines 34-39: `PRIORITY_OPTIONS` with emoji labels + unused `color` field pointing at old `--color-critical/high/medium/low`.
- Lines 48-73: three `React.CSSProperties` objects (`inputStyle`, `labelStyle`, `fieldStyle`) spread across every field.
- Lines 106-128: `watch()` of importance/urgency/priority/dueDate driving a memoized `liveScore` via `calculatePriorityScore`. **Unchanged.** `priority` is already watched, so the `PriorityDot` next to the select costs nothing.
- Lines 130-157: `onSubmit` builds the payload and calls `updateTask`/`addTask` (which run `recalcScores()` in the store), then `onClose()`. **Unchanged.**
- Lines 159-356: JSX with roughly 30 inline `style` props, old `--color-*` tokens, emoji in priority options and the pin label, and a red (`--color-critical`) error message.

**`components/tasks/TaskDrawer.tsx` (23 lines):** thin wrapper that renders `<Drawer title={task ? "Edit Task" : "New Task"}>` and mounts `<TaskForm>` only while `open`. It has no styling of its own. **No changes needed here**, unless you tidy its relative import `./TaskForm` → `@/components/tasks/TaskForm` (project rule: `@/*` aliases only; that is a one-line, safe fix, so do it).

**`components/ui/Drawer.tsx` (67 lines):** the actual drawer chrome, styled with hardcoded `zinc-*` utilities. It is used only by `TaskDrawer`. See Task 7.

**Consumers:** `app/page.tsx:144` (edit from Today/Backlog rows) and `app/completed/page.tsx:48` (edit from the Completed archive). Neither needs changes.

### What must be preserved (regression guard)

Existing E2E specs drive this exact form. Every one of these hooks must still work after the restyle:

| Hook | Used by |
|---|---|
| `page.locator('select').first()` = Priority, `.nth(1)` = Status | `single-stream-layout.spec.ts:58,87,107`, `quick-add-bar.spec.ts:20` |
| Option values `critical/high/medium/low`, `backlog/next/in-progress/completed` | same |
| `getByPlaceholder('e.g. 45')` on Est. Minutes | `single-stream-layout.spec.ts:61,88,108`, `quick-add-bar.spec.ts:24` |
| Button name matches `/save changes/i` | same |
| `getByRole('heading', { name: 'Edit Task' })` (drawer `<h2>`) | same |

Also preserve: `autoFocus` on the title input, `rows={3}` + vertical resize on the description, the conditional dependencies block (`availableDependencies.length > 0`), and the Escape/backdrop-close behavior.

### Known pre-existing bug: do NOT fix here

An empty **Est. Minutes** field is registered with `valueAsNumber: true`, so it becomes `NaN`. zod's `z.number().min(0).optional()` rejects `NaN`, which silently blocks every save that leaves the field empty. No error is shown because only `errors.title` is rendered. This is documented in Story 1.4's dev record, and the E2E specs work around it by filling `'30'`. AC #4 requires validation behavior to stay unchanged, so **leave it**. If you want, render nothing new for it. Rendering `errors.estimatedMinutes` would be a behavior change (a newly visible error) and is out of scope. It's flagged below as an open question for Zeyad.

### Design constraints

- **Tokens** (`app/globals.css:51-63`): `--bg #0b0c10`, `--surface #13141a`, `--surface-2 #191b22`, `--border #24262f`, `--text #e7e8ec`, `--text-dim #8b8d98`, `--accent #7c8aff`, `--accent-soft`, `--pri-high/med/low`. Reference them as Tailwind arbitrary values `bg-[var(--surface)]`. This is the established codebase idiom (see `TaskRow.tsx:79-135`). Don't use the v4 `bg-(--surface)` shorthand; match the codebase.
- **Do NOT delete the old `--color-*` tokens from the `@theme` block** (`globals.css:15-37`). `Button`, `Card`, `Badge`, and `EmptyState` still use them until Stories 2.3/2.4/3.1. Also leave the legacy `.field-control` / `.primary-button` classes in `globals.css` alone: `QuickAddBar.tsx` still uses them.
- **No emoji anywhere in the form** (UX anti-pattern; UX-DR5/AC #5).
- **Accent is the only saturated hue.** It encodes priority, focus, and active state. The urgency slider's orange must go (→ `--accent`).
- **No inline styles** (project-context §5). The only `style` left in the drawer path after this story is inside `Button.tsx` (Story 2.3's scope).
- **Focus:** text inputs/selects get `focus:border-[var(--accent)] focus:outline-none`. The accent border *is* the visible focus indicator, matching the QuickAddBar spec ("focused: accent-colored border"). Don't remove focus visibility without replacing it.
- **Radius:** `rounded-lg` (8px) for fields and the score box, within the spec's "~8–10px, no oversized corners".

### Scope boundaries: what NOT to touch

- `components/ui/Button.tsx`: Story 2.3.
- `components/ui/EmptyState.tsx`, `Card.tsx`, `Badge.tsx`: Stories 2.3/2.4.
- `taskSchema`, `onSubmit`, store actions (`stores/task-store.ts`): no logic changes.
- `QuickAddBar.tsx` (including its missing `aria-label` regression): tracked separately in `deferred-work.md`.
- `TaskCard.tsx` / `app/completed/page.tsx`: not part of this story.
- Do not replace native `<select>`s with a custom listbox component.

### Previous Story Intelligence (2.1 and Epic 1)

- **2.1** established "no danger token; signal state via text/icon, not a new red". Apply the same rule to validation errors here.
- **2.1** hit a pre-existing `QuickAddBar` `aria-label` regression, so `getByLabel('Add a task')` fails on the current app. In the new spec, add tasks with `page.getByPlaceholder('Add a task...')` exactly as `tests/e2e/delete-confirm.spec.ts` does.
- **2.1**'s Playwright run was blocked by a stale process on port 3000. Standing team guidance: don't debug dev-server/port issues live. Document the gap and close out.
- **1.3 / `TaskRow.tsx`** is the reference for token usage, type utilities (`text-body`, `text-meta`, `font-mono tabular-nums`), and state-aware `aria-*`.
- **1.2 / `PriorityDot.tsx`** already exists. Reuse it; don't build a second dot. Note that `critical` and `high` both map to `--pri-high` by design.
- Deferred webkit flakiness (`deferred-work.md`, Story 1.8) is pre-existing. Don't treat webkit-only timeouts after quick-add as regressions from this story.

### Git Intelligence

The repo has only `b2d374d Initial commit` and `29cf79a chore: update package-lock.json`. There is no per-story commit trail, so patterns come from the story files and current code above. The working tree has uncommitted Story 2.1 changes (`hooks/useConfirmDelete.ts`, `TaskRow.tsx`, `TaskCard.tsx`, `app/completed/page.tsx`). None of them overlap with this story's files.

### Latest Tech Notes

No new dependencies. Everything needed is in the pinned stack (Tailwind v4, lucide-react 0.468, react-hook-form 7.56, zod 3.25).
- Tailwind v4 generates `text-meta` / `text-secondary` / `text-body` / `text-subhead` / `text-section` / `text-title` font-size utilities from the `--text-*` vars in `@theme` (`globals.css:8-13`). `text-body`/`text-meta` also have explicit overrides in `@layer utilities`. `text-secondary` is theme-generated. If it unexpectedly doesn't apply, fall back to `text-[13px]` rather than adding a new utility block.
- Tailwind v4 `accent-[var(--accent)]` sets CSS `accent-color` for range and checkbox inputs.
- Don't style `<option>` elements. Most browsers ignore it, and dark `<select>` popups follow the OS. That's acceptable.

### Project Structure Notes

- **Modified:** `components/tasks/TaskForm.tsx`, `components/ui/Drawer.tsx`, `components/tasks/TaskDrawer.tsx` (import alias only).
- **New:** `tests/e2e/task-form-restyle.spec.ts`.
- Imports use `@/*` aliases only. Strict TS, no `any`. `"use client"` stays at the top of `TaskForm.tsx`/`TaskDrawer.tsx`/`Drawer.tsx`.

### Testing Requirements

New spec `tests/e2e/task-form-restyle.spec.ts`. Import `test`/`expect` from `../support/merged-fixtures`, and add tasks via `getByPlaceholder('Add a task...')`. Open the drawer via the row's `getByLabel('Edit task')`, scoping rows the same way the existing specs do: `page.locator('div.group', { has: page.getByLabel('Reorder task') })`.

| Test ID | Priority | Scenario |
|---|---|---|
| `2.2-E2E-001` | P0 | Edit round-trip still works: open drawer, change Priority (`getByLabel('Priority')` or `select` first) to `low` and fill Est. Minutes `30`, click Save Changes, drawer heading disappears, and `localStorage['task-manager:tasks']` shows `priority: "low"` for that task. |
| `2.2-E2E-002` | P1 | Empty title shows the quiet inline error: clear the title, Save → text "Title is required" is visible, the drawer stays open, and the title input has `aria-invalid="true"`. |
| `2.2-E2E-003` | P1 | No emoji: the priority `<option>` texts equal exactly `['Critical','High','Medium','Low']`, and the drawer's text content contains none of `🔴🟠🟡🟢📌`. |
| `2.2-E2E-004` | P2 | No inline styles on form content: `form [style]:not(button)` inside the drawer has count 0. Buttons are excluded because `Button.tsx` is still inline-styled until 2.3. |
| `2.2-E2E-005` | P2 | Priority dot reflects the selection: the `PriorityDot` next to the select has class `bg-[var(--pri-low)]` after selecting `low` and `bg-[var(--pri-high)]` after `high`. |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — story and ACs
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] — UX-DR9 (restyle TaskDrawer/TaskForm, keep RHF+zod, quiet inline errors), UX-DR1/2/3 (tokens, 8pt grid, type scale)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — quiet inline errors, `--text-dim` hints, restrained error tone
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System / Typography System / Spacing & Layout Foundation] — tokens, type scale, 8pt grid, radii
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy] — one primary per context ("Save" in TaskDrawer)
- [Source: _bmad-output/project-context.md] — no inline styles, `@/*` imports, RHF+zod rules, test location/fixtures
- [Source: components/tasks/TaskForm.tsx:12-356], [components/tasks/TaskDrawer.tsx:1-23], [components/ui/Drawer.tsx:1-67], [components/ui/PriorityDot.tsx:1-22], [components/ui/Button.tsx:37-65], [app/globals.css:1-113]
- [Source: tests/e2e/single-stream-layout.spec.ts:48-114], [tests/e2e/quick-add-bar.spec.ts:6-26] — existing drawer-dependent selectors
- [Source: _bmad-output/implementation-artifacts/2-1-in-place-delete-confirm.md] — no-danger-token rule, QuickAddBar regression workaround
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — QuickAddBar aria-label regression, webkit flakiness

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `npx tsc --noEmit`: exit 0.
- `npm run lint`: "No ESLint warnings or errors".
- Greps: zero `style=` in `TaskForm.tsx`; zero `--color-` / `zinc-` in `TaskForm.tsx`, `TaskDrawer.tsx`, `Drawer.tsx`; zero emoji in `TaskForm.tsx`.
- `npx playwright test tests/e2e/task-form-restyle.spec.ts --project=chromium` (red phase, before implementation): 5/5 failed at the quick-add step. `getByPlaceholder('Add a task...')` never appeared. The page snapshot showed the sidebar (`StickyTasks`, "My tasks 0") and no main content. Playwright reused an existing node process on port 3000 (PID 4072, started 2026-09-22 22:04) via `reuseExistingServer`. It's the same class of stale-server problem as Story 2.1. It was not investigated further and not killed, since it may be the user's own dev server.

### Completion Notes List

- Rewrote `TaskForm.tsx` styling only: every inline `style` prop was replaced with Tailwind classes built from module-level constants (`FIELD_CLASS`, `LABEL_TEXT_CLASS`/`LABEL_CLASS`, `INPUT_BASE_CLASS`/`INPUT_CLASS`, range constants). All colors now use Graphite Violet tokens (`--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`). The urgency orange is now `--accent`. Spacing uses 8pt steps only; type uses `text-meta`/`text-secondary`/`text-body`/`text-section`.
- The label and input constants are split into a base plus variants, so no element carries two conflicting utilities for the same property (e.g. `mb-2` vs `mb-0`, `px-3` vs `pl-6`, or two border colors). Tailwind doesn't guarantee which of two conflicting utilities wins.
- Validation error: shown under the title as `text-meta` in `--text-dim`, with the field border switching to `--text-dim`, and `aria-invalid`/`aria-describedby` set. No red and no new token. `taskSchema`, `defaultValues`, `register` options, and `onSubmit` are unchanged (AC #4). The known Est. Minutes `NaN` bug is left untouched on purpose.
- Priority: the emoji labels became plain `Critical/High/Medium/Low`. A `PriorityDot` bound to the watched `priority` sits inside the native `<select>`'s wrapper (`data-testid="priority-field"`). Select DOM order (Priority first, Status second) is preserved. The pin label lost its 📌 and uses a lucide `Pin` icon instead.
- Added `htmlFor`/`id` pairs to all ten labelled fields and dropped the `*` from "Title". **Small deviation:** the dependencies group's orphaned `<label>` became a `<fieldset>`/`<legend>`, because a checkbox group has no single control to label. Same Task 6 intent; no visual or behavior change.
- `Drawer.tsx` chrome moved from `zinc-*` to tokens: surface/border/grab bar, 8pt header/body padding, `text-subhead` `<h2>` (same text), and `aria-label="Close"` on the close button. Behavior, props, and the `body.style.overflow` scroll lock are unchanged. `TaskDrawer.tsx` now imports via the `@/` alias.
- `Button.tsx` is untouched (Story 2.3), so the Save button still renders the old amber until 2.3 lands. The only inline style left in the drawer comes from `Button`.
- **Not verified in a browser / E2E:** `tests/e2e/task-form-restyle.spec.ts` (2.2-E2E-001…005) is authored but has not been run to green, and the existing drawer-dependent specs were not re-run. Blocker: the stale server on port 3000 (see Debug Log). Logged in `deferred-work.md`. Recommend running `npx playwright test tests/e2e/task-form-restyle.spec.ts --project=chromium` against a fresh `npm run dev` before code review.

### File List

- `components/tasks/TaskForm.tsx` (modified)
- `components/tasks/TaskDrawer.tsx` (modified — import alias only)
- `components/ui/Drawer.tsx` (modified)
- `tests/e2e/task-form-restyle.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Restyled `TaskForm`/`Drawer` to Graphite Violet tokens with no inline styles, added the quiet inline title error, replaced emoji priority labels with plain text + `PriorityDot`, and added label associations. Authored `task-form-restyle.spec.ts`. `tsc`/lint are clean; E2E is not run (environment blocker, deferred).
