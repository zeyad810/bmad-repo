# Story 2.3: Restyle Buttons & Enforce Hierarchy

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want buttons across the app to follow one calm, restrained hierarchy,
so that the interface never has more than one loud action competing for my attention.

## Acceptance Criteria

1. **Given** `Button.tsx`'s existing primary/secondary/ghost/danger variants, **when** restyled, **then** their token values change to Graphite Violet (`--accent` fill for primary, `--surface-2`+border for secondary, transparent+`--text-dim` for ghost), **and** the variant structure/API stays unchanged. [Source: epics.md#Story 2.3; ux-design-specification.md#Button Hierarchy]
2. **Given** `Button.tsx`'s current inline-style implementation, **when** this story is complete, **then** it migrates to Tailwind utilities/`globals.css` tokens. [Source: epics.md#Story 2.3; project-context.md §5]
3. **Given** any screen, **when** rendered, **then** at most one `primary` button is visible at a time in a given context. [Source: epics.md#Story 2.3]
4. **Given** the `danger` variant, **when** used, **then** it appears only for the confirmed-delete state from Story 2.1, never as a first-tap button. [Source: epics.md#Story 2.3; ux-design-specification.md#Button Hierarchy]

## Tasks / Subtasks

- [x] Task 1: Rewrite `components/ui/Button.tsx` with class constants (AC: #1, #2)
  - [x] Delete `VARIANT_STYLES` / `SIZE_STYLES` (`React.CSSProperties` maps), the inline `style={{...}}` object, and the `onMouseOver`/`onMouseOut` handlers that write `style.opacity`. Replace with module-level class-string maps, following the `PRIORITY_DOT_CLASS` idiom (`components/ui/PriorityDot.tsx`) and the `*_CLASS` constants from Story 2.2 (`components/tasks/TaskForm.tsx`).
  - [x] **Keep the public API byte-identical:** `ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`, `variant?: "primary" | "secondary" | "ghost" | "danger"` (default `"secondary"`), `size?: "sm" | "md" | "lg"` (default `"md"`), `forwardRef<HTMLButtonElement, ButtonProps>`, `Button.displayName = "Button"`, named export only. `forwardRef` is required: Task 4 passes `useConfirmDelete`'s `triggerRef` through it.
  - [x] Type the maps as `Record<NonNullable<ButtonProps["variant"]>, string>` / `Record<NonNullable<ButtonProps["size"]>, string>` (not `Record<string, …>`), so a missing variant is a compile error.
  - [x] Suggested classes:
    ```ts
    const BASE_CLASS =
      "inline-flex items-center justify-center gap-2 border font-medium transition-opacity enabled:hover:opacity-85 " +
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] " +
      "disabled:cursor-not-allowed disabled:opacity-50";

    const VARIANT_CLASS = {
      primary: "border-transparent bg-[var(--accent)] text-[var(--bg)]",
      secondary: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
      ghost: "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)]",
      danger: "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]",
    };

    const SIZE_CLASS = {
      sm: "rounded-sm px-3 py-1 text-meta",
      md: "rounded-sm px-4 py-2 text-secondary",
      lg: "rounded-sm px-6 py-3 text-body",
    };
    ```
    - **Primary text is `--bg`, not white.** White on `#7c8aff` is about 3.1:1 and fails WCAG AA for 12–15px text. `#0b0c10` on `#7c8aff` is about 6.3:1.
    - **Every variant carries a `border`** (transparent where invisible), so all four variants render at the same height. Today only secondary/danger have a 1px border, which makes them 2px taller than primary/ghost.
    - **Danger = inverted `--text` fill.** See Dev Notes → "Danger without a red token". No new token, no `rose-*`/`red-*` utilities.
    - Spacing is on the 8pt grid (`1/2/3/4/6` → 4/8/12/16/24px). Type uses the scale utilities (`text-meta` 12, `text-secondary` 13, `text-body` 15). The old 14px `md` font isn't on the scale; 13px is. The old ad hoc paddings (`5px 12px`, `11px 22px`) and 6px gap go away.
    - `rounded-sm` is **8px in this project** (see Dev Notes → "Radius gotcha"). Don't use `rounded-lg` expecting 8px.
    - The focus ring gives every button the visible `--accent` focus outline (UX spec: "visible `--accent` outline on all interactive elements"). Use `focus-visible`, not `focus`, so mouse clicks don't leave a ring.
  - [x] Compose `className` so consumer classes still apply: `className={[BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(" ")}`. Destructure `className` from props. Don't add a `clsx`/`tailwind-merge` dependency; the codebase joins strings by hand (see `TaskRow.tsx`).
  - [x] Add `data-variant={variant}` to the `<button>`. It's the stable hook the new E2E spec counts primaries and danger buttons with. It has no visual effect.
  - [x] Stop consuming `style` in the component. Let it fall through `...props` like any other attribute, so a caller *could* still pass one, but the component itself sets none. No current caller passes `style` (verified by grep).
  - [x] No `"use client"` needed: once the mouse handlers are gone, `Button` has no state or effects. Every current caller is already a client component.
  - [x] Result: `Button.tsx` has zero `style=` and zero `--color-` references.

- [x] Task 2: `TaskForm` actions row: fix the Cancel variant (AC: #1, #3)
  - [x] `components/tasks/TaskForm.tsx` (actions row near the end of the file): keep Save/Create as `variant="primary"`, and change Cancel from `variant="ghost"` to `variant="secondary"`. The UX spec lists Cancel as a secondary action ("Secondary … default action button — Cancel, Edit, filter toggles"); ghost is reserved for icon-only row actions.
  - [x] Keep `className="flex-1"` on Save, `disabled={isSubmitting}`, and the button text `Save Changes` / `Create Task` / `Cancel`. Four E2E specs locate `getByRole('button', { name: /save changes/i })`.
  - [x] No other change to `TaskForm.tsx`. Story 2.2 owns it and is in review.

- [x] Task 3: `QuickAddBar` Add button → shared `Button` (AC: #1, #2, #3)
  - [x] `components/tasks/QuickAddBar.tsx`: replace the bare `<button type="submit" className="primary-button px-4 py-3">` with `<Button type="submit" variant="primary" size="md">`. Keep the children `<Plus size={18} />` + `Add`. Import from `@/components/ui/Button`.
  - [x] This is the one primary on the home screen. The `.primary-button` class is hardcoded amber (`#fbbf24`); it is the last amber *button* in the main flow.
  - [x] The form is `flex gap-2` with the default `align-items: stretch`, so the button will still match the input's height despite `md`'s `py-2`. Don't add a height override.
  - [x] **Leave the input alone:** its `field-control` class, its placeholder, and the missing `aria-label` (a pre-existing regression tracked in `deferred-work.md`). Don't add the UX spec's `↵ add` hint or remove the Add button either. That anatomy change is not this story.

- [x] Task 4: Completed page "Clear archive" → `Button`, danger only when armed (AC: #1, #3, #4)
  - [x] `app/completed/page.tsx`: the Clear archive control is a bare `<button>` styled `border-rose-400/15 bg-rose-400/[0.07] … text-rose-300`. That's a red button on first tap, which is exactly what AC #4 forbids. Replace it with:
    ```tsx
    <Button
      ref={clearAllRef}
      type="button"
      variant={confirmingClearAll ? "danger" : "secondary"}
      size="sm"
      onClick={handleClearAll}
      className="w-fit"
    >
      <Trash2 size={14} /> {confirmingClearAll ? "Tap to confirm" : "Clear archive"}
    </Button>
    ```
  - [x] Keep `w-fit`. The parent `<section>` is `flex flex-col` on mobile, and without it the button would stretch full width.
  - [x] Keep the exact labels `Clear archive` / `Tap to confirm`. `delete-confirm.spec.ts` (2.1-E2E-005) finds them by role and name.
  - [x] Keep the `completedTasks.length > 0 &&` guard and the `useConfirmDelete` wiring unchanged. Don't touch the rest of the page (headings, emerald accents, empty state). Story 2.4 and later restyles own those.

- [x] Task 5: Remove red-before-intent on the Completed archive row delete (AC: #4)
  - [x] `components/tasks/TaskCard.tsx` delete button: `hover:bg-rose-400/10 hover:text-rose-300` → `hover:bg-white/[0.07] hover:text-zinc-200`. That's the same neutral hover its sibling Edit button already uses. Hovering the *first-tap* delete must not preview red.
  - [x] Change nothing else in `TaskCard.tsx`: keep the `title` attributes (`Delete task` / `Tap again to confirm`, used by 2.1-E2E-004) and the legacy palette elsewhere. `TaskCard` isn't migrated to tokens in this story.

- [x] Task 6: Retire the legacy `.primary-button` class (AC: #2)
  - [x] After Task 3, grep `primary-button` across `app/` and `components/`. There should be zero consumers. Then delete the three `.primary-button` rules from `app/globals.css`.
  - [x] **Do NOT delete** `.field-control` (QuickAddBar's input still uses it), the `--color-*` tokens (Card/Badge/EmptyState/Sidebar still use them), or the `--radius-*` tokens (they drive `rounded-sm/md/lg` app-wide).
  - [x] Update the Graphite Violet comment block in `globals.css` that lists which components still use `--color-*`, so it no longer mentions `Button` or `TaskForm`.

- [x] Task 7: Hierarchy audit (AC: #3, #4)
  - [x] Confirm the per-context primary count after Tasks 2–4: home `/` = 1 (QuickAddBar Add); TaskDrawer = 1 (Save/Create); `/completed` = 0. With the drawer open over home, the backdrop separates the two contexts. That's acceptable: the drawer's form is the active context.
  - [x] Confirm `danger` is rendered in exactly one place: the armed Clear archive state. `TaskRow`'s own "Confirm?" delete state is a bare icon button and stays as is (see Scope boundaries).
  - [x] Record the audit result in Completion Notes.

- [ ] Task 8: Verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint`: zero errors, zero warnings.
  - [x] Greps: `style=` in `components/ui/Button.tsx` → 0; `--color-` in `Button.tsx` → 0; `primary-button` in `app/`, `components/` → 0; `rose-` in `app/completed/page.tsx` → 0; `variant="danger"` / `"danger"` usages outside `Button.tsx` → only the Clear archive conditional.
  - [ ] Author `tests/e2e/button-hierarchy.spec.ts` (see Testing Requirements) and run `npx playwright test tests/e2e/button-hierarchy.spec.ts --project=chromium`. Then re-run `tests/e2e/delete-confirm.spec.ts` and `tests/e2e/task-form-restyle.spec.ts`, since both drive buttons changed here. **Spec authored (5 tests), not run to green:** the red-phase chromium run failed in all 5 at the quick-add step, against the same stale server on :3000 (PID 4072) that blocked 2.1/2.2. Deferred per standing guidance.
  - [x] **Standing team guidance:** if a dev-server/port problem blocks the run (it has blocked 2.1 and 2.2 via a stale server on :3000), don't chase it live. Record the gap in Completion Notes and `deferred-work.md` and close out.

### Review Findings

- [ ] [Review][Decision] Unlayered global reset silently overrides Tailwind utilities — `app/globals.css:79-83` puts `* { margin: 0; padding: 0 }`, `button, input, textarea, select { font: inherit }` and `button { cursor: pointer }` outside any cascade layer. In the compiled CSS they come after `@layer utilities`, and unlayered rules beat layered ones. The Button's inline styles used to win over the reset, so after this story every `Button` renders with 0 padding and inherited font size and weight, and `disabled:cursor-not-allowed` never applies. The same reset already zeroes padding and margin utilities app-wide (the red-phase screenshot shows the sidebar flush to its edges). Fixing it properly (wrapping the reset in `@layer base`) changes the look of every component at once.
- [ ] [Review][Patch] E2E-003 navigates to /completed before the delayed completion commits (the `COMPLETE_TRANSITION_MS` timer), which makes it flaky. Wait for the row to disappear first, as `delete-confirm.spec.ts` does [tests/e2e/button-hierarchy.spec.ts:62]
- [ ] [Review][Patch] `failOnNativeDialog` throws inside a `page.on` listener, so a stray native dialog may not fail the test. Collect dialogs and assert the list is empty instead [tests/e2e/button-hierarchy.spec.ts:28]
- [ ] [Review][Patch] Ghost `hover:text-[var(--text)]` isn't gated on `enabled:`, so a disabled ghost button still brightens on hover [components/ui/Button.tsx:20]
- [ ] [Review][Patch] `globals.css` comment lists Sidebar as a `--color-*` consumer. It isn't: only Card, Badge and EmptyState are [app/globals.css:43]
- [ ] [Review][Patch] A caller's `data-variant` prop can override the computed attribute, because `{...props}` is spread after it [components/ui/Button.tsx:36]
- [ ] [Review][Patch] The Clear archive tap target shrank from `py-2.5` to `size="sm"` `py-1` (about 20px tall). Use `size="md"` [app/completed/page.tsx:41]
- [x] [Review][Defer] TaskCard row delete's armed "Confirm?" state has no emphasis, and `zinc-600` fails AA contrast [components/tasks/TaskCard.tsx:75] — deferred, pre-existing (legacy TaskCard; the 3.4 accessibility pass)
- [x] [Review][Defer] The armed/disarmed label swap isn't announced to screen readers, and "Tap" is the wrong verb for keyboard users [app/completed/page.tsx:41, hooks/useConfirmDelete.ts] — deferred, pre-existing (Story 2.1 pattern)
- [x] [Review][Defer] `delete-confirm.spec.ts` uses the same throw-in-listener `failOnNativeDialog` [tests/e2e/delete-confirm.spec.ts:23] — deferred, pre-existing (Story 2.1)
- [x] [Review][Defer] Main content stays stuck on the hydration skeleton in E2E runs (red-phase screenshot), so the "stale server" blamed for blocking 2.1–2.3 may actually be hydration never completing [components/layout/HydrationProvider.tsx] — deferred, pre-existing, unverified

## Dev Notes

### Current state (read before touching anything)

**`components/ui/Button.tsx` (66 lines).** It's a `forwardRef` wrapper around `<button>`. It builds an inline `style` object from `VARIANT_STYLES[variant]` + `SIZE_STYLES[size]` + the caller's `style`, and fakes hover by mutating `style.opacity` in `onMouseOver`/`onMouseOut`. Every color comes from the **old** `--color-*` namespace:
- primary: `--color-accent`, which is **amber `#fbbf24`**, with white text
- secondary: `--color-surface-2` with a `--color-border-2` border
- ghost: `--color-text-muted`
- danger: `--color-critical-subtle` / `--color-critical` (rose) plus a hardcoded `rgba(239,68,68,0.2)` border

`className` currently reaches the DOM only by accident, through `...props`. The new implementation must merge it explicitly (Task 1).

**Consumers (verified by grep):** `Button` is imported **only** by `components/tasks/TaskForm.tsx` (Save = primary, Cancel = ghost). Every other button in the app is a bare `<button>`:

| Location | Current look | This story |
|---|---|---|
| `QuickAddBar.tsx` Add | `.primary-button` (amber fill) | → `Button` primary (Task 3) |
| `app/completed/page.tsx` Clear archive | rose tint, red on first tap | → `Button` secondary → danger when armed (Task 4) |
| `TaskCard.tsx` delete | rose hover | neutral hover (Task 5) |
| `TaskRow.tsx` complete/edit/delete | icon buttons, already token-styled as ghost | untouched |
| `TaskCard.tsx` complete/edit/expand | legacy zinc/emerald icon buttons | untouched |
| `Drawer.tsx` close | token-styled icon button (Story 2.2) | untouched |
| `Sidebar`/`BottomNav` | nav links, not buttons | Story 3.1 |

### Danger without a red token

The Graphite Violet palette (`app/globals.css`, `:root` block) deliberately has **no** red, danger, or critical token. The UX spec says "the accent hue is the *only* saturated color in the system". Stories 2.1 and 2.2 both refused to add one. The UX spec still wants `danger` to look unmistakably different ("a red button should never appear before…"). Resolve that without a new hue:
- `danger` = **inverted fill**: `bg-[var(--text)] text-[var(--bg)]`. It's the only light-filled control in a dark UI, so it reads as "armed" instantly. It doesn't compete with `--accent` (which means priority/focus/primary), and it has very high contrast.
- Don't use `--accent` for danger: that would make "about to destroy" look like "the main action".
- If Zeyad later wants a true red, that's a token decision for the UX spec, not something to slip in here. See Questions.

### Radius gotcha: `rounded-lg` is 16px here

`app/globals.css`'s `@theme` block overrides Tailwind v4's radius scale: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 22px`. In v4 those theme variables *are* the `rounded-*` utilities, so in this project `rounded-sm` = 8px, `rounded-md` = 12px, and `rounded-lg` = **16px**. (Story 2.2's notes assumed `rounded-lg` = 8px. That's inaccurate, but it isn't this story's to fix; see Questions.) The UX spec wants ~8–10px, so buttons use **`rounded-sm`**. Don't delete the `--radius-*` tokens.

### Tailwind v4 specifics

- `enabled:hover:opacity-85`: v4 accepts any integer opacity step, so this reproduces today's 0.85 hover without JS. The `enabled:` prefix keeps it from fighting `disabled:opacity-50` on a disabled Save button, since Tailwind doesn't guarantee which of two same-property utilities wins.
- `outline-[var(--accent)]` + `focus-visible:outline-2` + `outline-offset-2` gives a solid 2px accent ring.
- Type-scale utilities `text-meta`/`text-secondary`/`text-body` are generated from `--text-*` in `@theme` (and `text-body`/`text-meta` are reinforced in `@layer utilities`). If `text-secondary` unexpectedly doesn't apply, fall back to `text-[13px]` rather than adding a utility block (same fallback Story 2.2 documented).
- Token colors use the codebase's arbitrary-value idiom, `bg-[var(--surface-2)]`. Don't use the v4 `bg-(--surface-2)` shorthand; match the codebase.
- No new dependencies.

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| `getByRole('button', { name: /save changes/i })` | `quick-add-bar.spec.ts`, `single-stream-layout.spec.ts` ×3, `task-form-restyle.spec.ts` ×2 |
| `getByRole('button', { name: /clear archive/i })` / `/tap to confirm/i` | `delete-confirm.spec.ts` 2.1-E2E-005 |
| `TaskCard` delete `title="Delete task"` / `"Tap again to confirm"` | `delete-confirm.spec.ts` 2.1-E2E-004 |
| `ref` forwarding to the DOM `<button>` | `useConfirmDelete`'s outside-tap detection (`triggerRef.current.contains(...)`). If the ref doesn't reach the element, **every tap would cancel the confirm**. |
| `2.2-E2E-004` asserts `form [style]:not(button)` = 0 | still passes, and now buttons carry no `style` either |

**Already broken before this story (not a regression signal):** `task-reorder.spec.ts` looks up `getByLabel('Add a task')` and `getByRole('button', { name: /add task/i })`. The input has no aria-label, and the button's name is "Add". Don't rename the Add button to satisfy it. That fix belongs to the QuickAddBar regression item in `deferred-work.md`.

### Scope boundaries: what NOT to touch

- `components/ui/Card.tsx`, `Badge.tsx`, `EmptyState.tsx` (inline styles, old tokens): Story 2.4 and later.
- `Sidebar.tsx`, `BottomNav.tsx`, `app/layout.tsx` amber chrome: Story 3.1.
- `TaskRow.tsx`: its icon buttons already match the ghost treatment. Don't convert them to `Button`, because its padding/size scale doesn't fit 1.5-step icon buttons, and 3.2 owns touch-target sizing. Don't restyle its "Confirm?" state with danger either.
- `TaskCard.tsx`: only the one hover class in Task 5.
- `QuickAddBar` input, aria-label, and `↵ add` hint (see Task 3).
- `stores/`, `hooks/useConfirmDelete.ts`, `TaskForm` schema/logic: no logic changes anywhere.
- Don't add `clsx`, `tailwind-merge`, or `cva`.

### Previous story intelligence (2.1, 2.2)

- **2.1** built `hooks/useConfirmDelete.ts`, which returns `{ confirming, triggerRef, handleTrigger }`. `triggerRef` is a `RefObject<HTMLButtonElement>`, which is type-compatible with `Button`'s `forwardRef<HTMLButtonElement>`. 2.1 explicitly left the rose Clear archive button and `Button.tsx` "for Story 2.3". This story closes that.
- **2.2** told the dev not to touch `Button.tsx`, so the Save button still renders **amber** in the drawer. This story should turn it violet. It also added `2.2-E2E-004`, which excludes buttons from the no-inline-style check "until 2.3". Optionally tighten that selector to `form [style]` now; it's a nice follow-through but not required.
- **2.2** split base/variant class constants so no element carries two conflicting utilities for one property. Tailwind doesn't guarantee which of two conflicting utilities wins. Apply the same discipline: e.g. don't put `border-transparent` in `BASE_CLASS` and `border-[var(--border)]` in a variant. Keep the border *color* only in the variant maps.
- **2.1/2.2** E2E runs were blocked by a stale server on port 3000 (`reuseExistingServer`). Add tasks with `getByPlaceholder('Add a task...')`, not `getByLabel('Add a task')`.
- Webkit-only timeouts after quick-add are pre-existing flakiness (`deferred-work.md`, Story 1.8), not regressions.

### Git intelligence

The history is only `b2d374d Initial commit` and `29cf79a chore: update package-lock.json`. There's no per-story commit trail. The working tree holds uncommitted 2.1/2.2 changes to `TaskCard.tsx`, `TaskForm.tsx`, `TaskRow.tsx`, `Drawer.tsx`, `app/completed/page.tsx`, and `hooks/useConfirmDelete.ts`. This story edits three of those files (`TaskForm.tsx`, `TaskCard.tsx`, `app/completed/page.tsx`), so build on the working-tree versions and don't revert them.

### Project structure notes

- **Modified:** `components/ui/Button.tsx`, `components/tasks/TaskForm.tsx` (Cancel variant only), `components/tasks/QuickAddBar.tsx`, `app/completed/page.tsx`, `components/tasks/TaskCard.tsx` (one class), `app/globals.css` (remove `.primary-button`, update comment).
- **New:** `tests/e2e/button-hierarchy.spec.ts`.
- `@/*` imports only. Strict TS, no `any`. Named exports.

### Testing requirements

New spec `tests/e2e/button-hierarchy.spec.ts`. Import `test`/`expect` from `../support/merged-fixtures`. Reuse the `quickAdd` helper shape from `tests/e2e/delete-confirm.spec.ts` (placeholder locator). Scope rows with `page.locator('div.group', { has: page.getByLabel('Reorder task') })`. Scope the drawer with `page.locator('form', { has: page.getByRole('button', { name: /save changes/i }) })`; `Drawer` has no `role="dialog"`.

| Test ID | Priority | Scenario |
|---|---|---|
| `2.3-E2E-001` | P1 | Home has exactly one primary: on `/` (with one task added), `page.locator('[data-variant="primary"]:visible')` has count 1, and it's the Add button. |
| `2.3-E2E-002` | P1 | Drawer has exactly one primary: open a row's `getByLabel('Edit task')`. Within the drawer form, `[data-variant="primary"]` count is 1 (Save Changes) and Cancel has `data-variant="secondary"`. |
| `2.3-E2E-003` | P0 | Danger only when armed: complete a task, go to `/completed`. There are 0 `[data-variant="danger"]` on the page and Clear archive has `data-variant="secondary"`. Click it: the button (now "Tap to confirm") has `data-variant="danger"` and the task is still visible. Wait about 3s: it reverts to `secondary` / "Clear archive", with no native dialog (reuse `failOnNativeDialog`). |
| `2.3-E2E-004` | P2 | No inline styles on shared buttons: on `/` and in the open drawer, `button[data-variant][style]` count is 0. |
| `2.3-E2E-005` | P2 | Graphite Violet primary: the Add button's computed `background-color` is `rgb(124, 138, 255)` (`--accent`), not amber `rgb(251, 191, 36)`. |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] for the story and ACs
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] for UX-DR12 (Button restyle and hierarchy) and UX-DR1/2/3 (tokens, 8pt grid, type scale)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy] for the variant meanings, one primary per context, and danger only after intent
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] for the single saturated hue and the missing danger token; [#Spacing & Layout Foundation] for ~8–10px radii and the accent focus outline
- [Source: _bmad-output/project-context.md §5] for no inline styling
- [Source: components/ui/Button.tsx:1-66], [components/tasks/TaskForm.tsx actions row], [components/tasks/QuickAddBar.tsx:1-37], [app/completed/page.tsx:27-40], [components/tasks/TaskCard.tsx:75], [app/globals.css @theme + .primary-button], [hooks/useConfirmDelete.ts]
- [Source: tests/e2e/delete-confirm.spec.ts] for the `quickAdd`/`failOnNativeDialog` helpers and Clear archive locators
- [Source: _bmad-output/implementation-artifacts/2-1-in-place-delete-confirm.md], [2-2-restyle-task-editing-taskdrawer-and-taskform.md], [deferred-work.md]

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Danger look:** Is the default (inverted `--text` fill) okay, or do you want a restrained red token added to the UX spec's palette?
2. **Radius drift:** `TaskRow`/`TaskForm` use `rounded-lg`, which is 16px in this theme, not the 8px Story 2.2 assumed. Should that be fixed in the 3.4 polish pass?

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `npx tsc --noEmit`: exit 0.
- `npm run lint`: "No ESLint warnings or errors".
- Greps: `style=`/`--color-` in `Button.tsx` → 0; `primary-button` in `app/`, `components/` → 0; `rose-` in `app/completed/page.tsx` → 0; `danger` outside `Button.tsx` → only the Clear archive conditional (`app/completed/page.tsx:41`).
- `npx playwright test tests/e2e/button-hierarchy.spec.ts --project=chromium` (red phase, before implementation): 5/5 failed at `quickAdd`, because `getByText(<title>)` never appeared. Port 3000 is held by PID 4072 (the same process as in 2.2), and Playwright reuses it via `reuseExistingServer`. Not investigated or killed (it may be the user's own dev server). The post-implementation run was skipped for the same reason.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- `Button.tsx` is rewritten with `BASE_CLASS` / `VARIANT_CLASS` / `SIZE_CLASS` constants, typed as `Record<NonNullable<…>>`. The inline `style` object and the JS hover handlers are gone. Hover is now `enabled:hover:opacity-85`, and there's an `--accent` `focus-visible` outline plus `disabled:` styling. The public API is unchanged: same props, defaults, `forwardRef`, and `displayName`. `className` is now merged explicitly. `data-variant` was added as a test hook.
- Token mapping:
  - primary: `--accent` fill with `--bg` text (dark text for AA contrast; white would be about 3.1:1)
  - secondary: `--surface-2` with a `--border` border
  - ghost: transparent with `--text-dim`
  - danger: inverted `--text` fill, with no new red token

  Every variant has a 1px border, so all four render at the same height. Sizes are on the 8pt grid and the type scale, with `rounded-sm` (8px in this theme).
- Hierarchy audit (Task 7):
  - Home `/` has 1 primary: QuickAddBar Add. `TaskForm` isn't mounted while the drawer is closed.
  - The drawer has 1 primary: Save/Create. Cancel is now `secondary`, per the UX spec.
  - `/completed` has 0 primaries.
  - `danger` is rendered only for the armed Clear archive state. Its first tap is `secondary`, and the rose styling is gone.
  - `TaskCard`'s delete icon no longer previews red on hover.
- The legacy `.primary-button` CSS was removed (no consumers left). `.field-control`, `--color-*`, and `--radius-*` were kept. The `globals.css` comment was updated.
- **Not verified in a browser / E2E:** `tests/e2e/button-hierarchy.spec.ts` (2.3-E2E-001…005) is authored but hasn't been run to green. `delete-confirm.spec.ts` and `task-form-restyle.spec.ts` weren't re-run either. The blocker is the stale server on :3000. It's logged in `deferred-work.md`. Visual check still pending: the Save/Add buttons should now be violet instead of amber.

### File List

- `components/ui/Button.tsx` (modified)
- `components/tasks/TaskForm.tsx` (modified: Cancel variant only)
- `components/tasks/QuickAddBar.tsx` (modified)
- `app/completed/page.tsx` (modified)
- `components/tasks/TaskCard.tsx` (modified: delete hover class only)
- `app/globals.css` (modified: removed `.primary-button`, updated comment)
- `tests/e2e/button-hierarchy.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Migrated `Button` to Graphite Violet Tailwind classes (no inline styles). Moved QuickAddBar Add and Clear archive onto `Button`. Enforced one primary per context and danger-only-when-armed. Removed `.primary-button`. Authored `button-hierarchy.spec.ts`. `tsc`/lint are clean; E2E is not run (environment blocker, deferred).
