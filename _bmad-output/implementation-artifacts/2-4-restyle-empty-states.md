# Story 2.4: Restyle Empty States

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want empty Today/Backlog/Completed views to feel calm and plain,
so that an empty list doesn't feel like a broken screen.

## Acceptance Criteria

1. **Given** `EmptyState.tsx`'s current inline styles and old tokens, **when** restyled, **then** it uses Tailwind utilities and the new Graphite Violet tokens. [Source: epics.md#Story 2.4; UX-DR10; project-context.md §5]
2. **Given** the Today section with zero tasks, **when** displayed, **then** it shows short plain copy ("Nothing here yet") with no illustration or emoji. [Source: epics.md#Story 2.4]
3. **Given** the Backlog section with zero tasks, **when** displayed, **then** it shows short plain copy ("Backlog is clear") with no illustration or emoji. [Source: epics.md#Story 2.4]
4. **Given** the Completed page with zero completed tasks, **when** displayed, **then** its existing empty-state copy and link ("View active tasks") are kept but restyled to the new tokens. [Source: epics.md#Story 2.4]

## Tasks / Subtasks

- [x] Task 1: Rewrite `components/ui/EmptyState.tsx` with token classes (AC: #1, #2, #3)
  - [x] Delete every `style={{...}}` object and every `var(--color-*)` reference. Use module-level class constants, the same `*_CLASS` idiom as `Button.tsx` (`BASE_CLASS`/`VARIANT_CLASS`) and `TaskForm.tsx`.
  - [x] **Remove the `icon` prop.** No caller passes it (verified by grep: only `app/page.tsx` ×2, both title-only). Dropping it enforces the "no illustration" rule in the component API. Keep `title: string`, `description?: string`, `action?: React.ReactNode`. Named export `EmptyState` stays. Import `ReactNode` from `react` rather than relying on the global `React` namespace.
  - [x] Add `data-testid="empty-state"` to the root. It's the stable hook the new E2E spec scopes to. `data-testid` has precedent in `TaskForm.tsx` (`priority-field`).
  - [x] Suggested markup and classes. Spacing is **gap- and min-height-based only**; see Dev Notes → "The global reset zeroes padding/margin utilities":
    ```tsx
    const ROOT_CLASS = "flex min-h-32 flex-col items-center justify-center gap-4 text-center";
    const TEXT_GROUP_CLASS = "flex flex-col items-center gap-1";
    const TITLE_CLASS = "text-body font-medium text-[var(--text-dim)]";
    const DESCRIPTION_CLASS = "max-w-xs text-secondary text-[var(--text-dim)]";

    <div data-testid="empty-state" className={ROOT_CLASS}>
      <div className={TEXT_GROUP_CLASS}>
        <p className={TITLE_CLASS}>{title}</p>
        {description && <p className={DESCRIPTION_CLASS}>{description}</p>}
      </div>
      {action}
    </div>
    ```
    - `min-h-32` = 128px, which is on the 8pt grid and close to today's rendered height (60px + 60px padding + one text line ≈ 140px). **Don't shrink the box much.** The home-page empty states sit inside `SectionDropZone` droppables, and four Epic 1 specs drag onto `getByText('Backlog is clear').boundingBox()`. A tiny box makes cross-section drops onto an empty section harder to hit.
    - The title uses `--text-dim`, not `--text`. An empty state is non-critical meta information and should read quieter than task titles (which use `--text`). `#8b8d98` on `#0b0c10` is about 6:1, which passes WCAG AA.
    - Type scale utilities only: `text-body` (15px), `text-secondary` (13px). No `text-sm`/`text-xs`/`text-[Npx]`.
    - No icon, no background fill, no border, no rounded box. Plain text on the page ground.
  - [x] No `"use client"`. The component has no state or effects.
  - [x] Result: `EmptyState.tsx` has zero `style=` and zero `--color-` references.

- [x] Task 2: Home page: no functional change (AC: #2, #3)
  - [x] `app/page.tsx:124` and `:136` already pass `title="Nothing here yet"` and `title="Backlog is clear"` inside `SectionDropZone`. **Leave the copy byte-identical.** Six specs locate these strings with `getByText` (see the regression table). Don't add a `description` here: the UX spec wants the copy short, and a second line containing a similar phrase risks strict-mode `getByText` collisions.
  - [x] Don't touch `SectionDropZone`, `DndContext`, or the section structure.

- [x] Task 3: Completed page empty state → shared `EmptyState` (AC: #1, #4)
  - [x] `app/completed/page.tsx:46`: replace the hand-rolled `<div className="empty-state py-12">…</div>` branch with:
    ```tsx
    <EmptyState
      title="Nothing here yet"
      description="Finished tasks will collect here as you make progress."
      action={
        <Link href="/" className={VIEW_ACTIVE_LINK_CLASS}>
          View active tasks <span aria-hidden="true">→</span>
        </Link>
      }
    />
    ```
    with a module-level constant along these lines:
    `const VIEW_ACTIVE_LINK_CLASS = "rounded-sm text-secondary font-medium text-[var(--accent)] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";`
  - [x] **Keep the copy exact:** "Nothing here yet", "Finished tasks will collect here as you make progress.", "View active tasks" plus the `aria-hidden` arrow. `delete-confirm.spec.ts` (2.1-E2E-005) asserts `getByText('Nothing here yet')` on `/completed` after clearing the archive.
  - [x] Remove the emerald `ListTodo` icon tile. It's an illustration, which UX-DR10 forbids, and emerald is off-palette. Then remove `ListTodo` from the `lucide-react` import on line 5. Keep `ArrowLeft`, `CheckCircle2`, and `Trash2`, which are still used.
  - [x] Why `--accent` for the link: the UX spec reserves the accent hue for "interactive/focus state", and this is the only interactive element in the empty state. It replaces the amber `text-amber-300`. `rounded-sm` (8px) is there so the focus outline has matching corners.
  - [x] **Keep this branch as a single expression.** The file is written in dense one-line JSX. Reformatting the whole of line 46 is fine for readability, but the non-empty branch (the date groups and `TaskCard` list) must be preserved **exactly**: no class changes, no logic changes.
  - [x] Don't restyle the rest of the Completed page: the header, the emerald "Archive" eyebrow, `surface-panel`, the "All completed" heading and count pill, the date-group labels, and `TaskCard`. None of that is in this story's scope (see Scope boundaries). The empty state will render inside the legacy `surface-panel`, which is expected.

- [x] Task 4: Retire the orphaned `.empty-state` class and fix the stale comment in `globals.css` (AC: #1)
  - [x] After Task 3, grep `empty-state` across `app/` and `components/`. The only hit should be the new `data-testid="empty-state"` attribute, and no `className` should use it. Then delete the `.empty-state { … }` rule (`app/globals.css:91`).
  - [x] Update the Graphite Violet comment block (`app/globals.css:40-46`). It currently says the `--color-*` tokens "still power Card/Badge/EmptyState/Sidebar until their own restyle stories (2.4, 3.1)". After this story, only **Card and Badge** use them. Sidebar never did (see 2.3's review finding). Reword it, for example: "…still power Card/Badge until those are migrated…".
  - [x] **Do NOT delete** the `--color-*` tokens (Card/Badge still use them, and `@theme` turns them into utilities), the `--radius-*` tokens, `.field-control`, or `.surface-panel` (the Completed page still uses it).
  - [x] **Do NOT** move the global reset (`* { margin: 0; padding: 0 }`) into `@layer base` in this story. That's the open `[Review][Decision]` from Story 2.3, and it changes the look of every component at once. This story is designed to be correct either way.

- [ ] Task 5: Verification (all ACs)
  - [x] `npx tsc --noEmit` and `npm run lint`: zero errors, zero warnings.
  - [x] Greps:
    - `style=` in `components/ui/EmptyState.tsx` → 0
    - `--color-` in `EmptyState.tsx` → 0
    - `emerald-`, `amber-`, and `ListTodo` inside the Completed empty-state branch → 0. Emerald is still expected elsewhere on that page.
    - `className="empty-state` or `.empty-state` in `app/` and `components/` → 0
    - `icon=` passed to `EmptyState` anywhere → 0
  - [ ] Author `tests/e2e/empty-states.spec.ts` (see Testing Requirements) and run `npx playwright test tests/e2e/empty-states.spec.ts --project=chromium`. Then re-run the specs that depend on empty-state copy or geometry: `single-stream-layout.spec.ts`, `hydration-skeleton.spec.ts`, `drag-across-divider.spec.ts`, `complete-from-backlog.spec.ts`, and `delete-confirm.spec.ts`. **Spec authored (4 tests), not run to green:** the red phase failed as expected. Two post-implementation chromium runs failed because the browser stayed on the home `HydrationSkeleton`, even on `/completed`, while `curl` shows the server rendering the new markup. That's an environment/hydration blocker, deferred per standing guidance.
  - [x] **Standing team guidance:** if a dev-server, port, or hydration problem blocks the E2E run (it blocked 2.1, 2.2, and 2.3), don't chase it live. Record the gap in Completion Notes and `deferred-work.md` and close out. Before blaming a "stale server", glance at the failure screenshot once. 2.3's review suspects hydration never completing (see `deferred-work.md`).

## Dev Notes

### Current state (read before touching anything)

**`components/ui/EmptyState.tsx` (29 lines)** is a presentational function with no `"use client"`. It has props `icon?`, `title`, `description?`, and `action?`. Everything is inline `style`:
- the root is a flex column with `padding: "60px 24px"`, `gap: 12`, and `color: var(--color-text-muted)`
- the icon wrapper is 40px with 0.5 opacity
- the title is 15px/600 in `var(--color-text)`
- the description is 13px with `maxWidth: 320`
- the action wrapper has `marginTop: 8`

Both color vars come from the **old** `@theme` namespace (`#a1a1aa`/`#f4f4f5`), not Graphite Violet.

**Consumers (verified by grep):**

| Location | Today | This story |
|---|---|---|
| `app/page.tsx:124` Today empty (inside `SectionDropZone id="today-dropzone"`) | `<EmptyState title="Nothing here yet" />` | unchanged call; restyled via the component |
| `app/page.tsx:136` Backlog empty (inside `SectionDropZone id="backlog-dropzone"`) | `<EmptyState title="Backlog is clear" />` | unchanged call; restyled via the component |
| `app/completed/page.tsx:46` Completed empty | **Doesn't use `EmptyState`.** It's hand-rolled markup: `.empty-state py-12`, an emerald `ListTodo` icon tile, `text-zinc-200`/`zinc-600` text, and an amber "View active tasks" link | → `EmptyState` with description + link action (Task 3) |

`.empty-state` in `globals.css` (`min-height: 220px`, flex centering) is used **only** by that Completed markup.

### The global reset zeroes padding/margin utilities (critical)

`app/globals.css:79` has `* { box-sizing: border-box; margin: 0; padding: 0; … }` **outside any cascade layer**. Tailwind v4 emits utilities inside `@layer utilities`, and unlayered rules beat layered ones regardless of specificity. So in this project, **every `p-*`/`px-*`/`py-*`/`m-*`/`mt-*`/`mb-*` utility is silently overridden to 0**. Story 2.3's review found this (the Button lost its padding once its inline styles were removed). It's an open `[Review][Decision]` there, not something to fix here.

Consequences for this story:
- EmptyState's current `padding: 60px 24px` only works because inline styles beat the reset. If you port it to `py-16 px-6`, the box collapses to one text line, and the home-page drop zones shrink with it.
- The old Completed markup's `mb-4`/`mt-1`/`mt-5`/`py-12` are **already** having no effect today. Don't treat them as the design reference.
- **Solution:** lay out using properties the reset doesn't touch: `min-h-*` for the box and `gap-*` for rhythm (Task 1's classes do this). The result looks the same whether or not 2.3's decision later moves the reset into `@layer base`.
- Don't "fix" it with an unlayered `.empty-state { padding: … }` rule or with inline styles. Both work around the problem in a way the no-inline-style rule and the pending decision don't allow.

### Tokens and type scale to use

- Colors: `--text-dim` (title, description) and `--accent` (the link only). Use the codebase's arbitrary-value idiom, `text-[var(--text-dim)]`, not the v4 `text-(--text-dim)` shorthand.
- Type: `text-body` (15px) and `text-secondary` (13px) come from the `@theme` `--text-*` scale. If `text-secondary` unexpectedly doesn't apply, fall back to `text-[13px]` (same fallback 2.2 and 2.3 documented).
- Radius: `rounded-sm` is **8px** in this theme (`--radius-*` overrides). `rounded-lg` is 16px. See 2.3's "Radius gotcha".
- Spacing steps: `gap-1` = 4px and `gap-4` = 16px (8pt grid). `min-h-32` = 128px. No arbitrary spacing values.

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| `getByText('Nothing here yet')` on `/` (visible when Today is empty; hidden once a task is added) | `single-stream-layout.spec.ts` 1.6-E2E-001/002/005, `hydration-skeleton.spec.ts` 1.10-E2E-002 |
| `getByText('Backlog is clear')` on `/`, plus its `boundingBox()` used as a **drag drop target** | `drag-across-divider.spec.ts` (×5), `complete-from-backlog.spec.ts` (×3), `single-stream-layout.spec.ts`, `hydration-skeleton.spec.ts` |
| `getByText('Nothing here yet')` on `/completed` after clearing the archive | `delete-confirm.spec.ts` 2.1-E2E-005 |
| The empty-state text renders **inside** `SectionDropZone`'s droppable `div` | cross-section drops onto an empty section (`app/page.tsx` `today-dropzone`/`backlog-dropzone` → `moveTask`) |
| `button-hierarchy.spec.ts` 2.3-E2E-003: `/completed` has 0 `[data-variant="primary"]`/`"danger"` before arming | the new link is a plain `<Link>`, not a `Button`, so it adds no variant |

`getByText` does substring, case-insensitive matching and fails in strict mode if two elements match. So don't add any other visible text containing "nothing here yet" or "backlog is clear" to those pages.

### Scope boundaries: what NOT to touch

- The rest of `app/completed/page.tsx`: header, emerald eyebrow and heading, count pill, date groups, `TaskCard` list, Clear archive `Button`. The page is restyled elsewhere or later. Epic 2's FR11 row notes it will eventually use `TaskRow`/`EmptyState`, but only the empty state is in scope here.
- `components/ui/Card.tsx`, `Badge.tsx`: still on `--color-*`, not this story.
- `Sidebar.tsx`, `BottomNav.tsx` (amber chrome): Story 3.1.
- `SectionDropZone` / `DraggableTaskList.tsx`, `HydrationSkeleton.tsx`, `SectionDivider.tsx`: untouched.
- The global reset / cascade-layer question: 2.3's open decision.
- `QuickAddBar` aria-label regression, Est. Minutes `NaN` bug: tracked in `deferred-work.md`, out of scope.
- No new dependencies (`clsx`, `tailwind-merge`, `cva`). Join class strings by hand if needed.

### Previous story intelligence (2.1–2.3)

- **2.3** is the direct template: move inline styles to `*_CLASS` constants, use Graphite Violet tokens, add a `data-*` test hook, retire the orphaned global CSS class (`.primary-button` there, `.empty-state` here), and update the `globals.css` comment. It also left the comment inaccurate (it still lists EmptyState/Sidebar), which Task 4 fixes.
- **2.3 review** found the unlayered-reset problem above. That's the most important thing to carry forward.
- **2.2** put each property's utility in exactly one constant, because Tailwind doesn't guarantee which of two conflicting same-property utilities wins. Keep that discipline (e.g. don't set a text color in both `ROOT_CLASS` and `TITLE_CLASS`; the classes above give the root none).
- **2.1–2.3 E2E** runs never reached green. Add tasks with `getByPlaceholder('Add a task...')`, not `getByLabel('Add a task')` (the input has no aria-label; see `deferred-work.md`). Collect native dialogs into an array and assert it's empty rather than throwing in a `page.on` listener (2.3 review).
- Webkit-only timeouts after quick-add are pre-existing flakiness (Story 1.8), not regressions.

### Git intelligence

The history is only `b2d374d Initial commit` and `29cf79a chore: update package-lock.json`, so there's no per-story commit trail. The working tree holds uncommitted 2.1–2.3 changes, including `app/completed/page.tsx` and `app/globals.css`, which this story edits too. Build on the working-tree versions and don't revert them.

### Project Structure Notes

- **Modified:** `components/ui/EmptyState.tsx`, `app/completed/page.tsx` (empty branch + import only), `app/globals.css` (remove `.empty-state`, fix the comment).
- **New:** `tests/e2e/empty-states.spec.ts`.
- **Unchanged but exercised:** `app/page.tsx`.
- `@/*` imports only, strict TS, no `any`, named exports.

### Testing Requirements

New spec `tests/e2e/empty-states.spec.ts`. Import `test`/`expect` from `../support/merged-fixtures`. Reuse the `quickAdd` helper shape from `tests/e2e/delete-confirm.spec.ts` (the placeholder locator). Scope rows with `page.locator('div.group', { has: page.getByLabel('Reorder task') })`. Locate empty states with `page.getByTestId('empty-state')`, filtered by `hasText`.

| Test ID | Priority | Scenario |
|---|---|---|
| `2.4-E2E-001` | P1 | Fresh `/`: two `empty-state`s are visible, with the texts "Nothing here yet" and "Backlog is clear". Neither contains `svg`, `img`, or `[style]`, and neither's `innerText` matches `/\p{Extended_Pictographic}/u` (no emoji). |
| `2.4-E2E-002` | P1 | Graphite Violet tokens applied: the Today empty-state title's computed `color` is `rgb(139, 141, 152)` (`--text-dim`), not the old `rgb(244, 244, 245)`/`rgb(161, 161, 170)`. The root's bounding-box height is ≥ 120 (the drop target hasn't collapsed). |
| `2.4-E2E-003` | P1 | Completed empty: on `/completed` with no completed tasks, one `empty-state` shows "Nothing here yet", "Finished tasks will collect here as you make progress.", and a `getByRole('link', { name: /view active tasks/i })`. It has no `svg`. The link's computed `color` is `rgb(124, 138, 255)` (`--accent`). Assert that positive value only: Tailwind v4 palette colors like `amber-300` compute to `oklch(...)`, so a "not amber rgb" check would pass vacuously. Clicking it navigates to `/`. |
| `2.4-E2E-004` | P2 | Empty states come and go with data: quick-add a task → the Today empty state is hidden and Backlog's is still visible. Mark it complete and wait for the row to disappear (the delayed commit, `COMPLETE_TRANSITION_MS`) → Today's empty state returns. Go to `/completed` → no `empty-state` there. |

Run it on chromium first. Report cross-browser results honestly. If the environment blocks the run, apply the standing guidance in Task 5.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] for the story and ACs
- [Source: _bmad-output/planning-artifacts/epics.md#UX Design Requirements] for UX-DR10 (EmptyState restyle, plain copy, no illustrations or emoji) and UX-DR1/2/3 (tokens, 8pt grid, type scale)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Additional Patterns → Empty states], [#Color System] (`--text-dim` for meta, accent only for interactive/focus), [#Typography System], [#Spacing & Layout Foundation]
- [Source: _bmad-output/project-context.md §5] for no inline styling
- [Source: components/ui/EmptyState.tsx:1-29], [app/page.tsx:121-141], [app/completed/page.tsx:5,44-46], [app/globals.css:40-46,79,91], [components/tasks/DraggableTaskList.tsx:79-82 SectionDropZone]
- [Source: _bmad-output/implementation-artifacts/2-3-restyle-buttons-and-enforce-hierarchy.md] (class-constant pattern, radius gotcha, review finding on the unlayered reset), [deferred-work.md]
- [Source: tests/e2e/delete-confirm.spec.ts, single-stream-layout.spec.ts, drag-across-divider.spec.ts, complete-from-backlog.spec.ts, hydration-skeleton.spec.ts] for the regression hooks

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Empty-state title tone:** the default is quiet `--text-dim` for the title. Would you rather have `--text` for the title, with only the description dimmed?
2. **Completed page:** the empty state now looks Graphite Violet, but it sits inside a page that's still emerald/zinc. Should the rest of `/completed` (header, count pill, `TaskCard` → `TaskRow`) get its own story? No story in Epics 2–3 currently owns it.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- `npx tsc --noEmit`: exit 0. `npm run lint`: "No ESLint warnings or errors".
- Greps: `style=`/`--color-` in `EmptyState.tsx` → 0; `empty-state` in `app/`, `components/` → only the `data-testid`; `ListTodo`/`amber-` in `app/completed/page.tsx` → 0; no `icon=` passed to `EmptyState`.
- Red phase (`npx playwright test tests/e2e/empty-states.spec.ts --project=chromium`): 4/4 failed on the missing `empty-state` test hook. `/completed` rendered normally in the snapshot.
- Green attempts (×2, second after warming the server): 4/4 failed. The failure snapshot shows an empty `<main>`, and the screenshot for the `/completed` test shows the **home** `HydrationSkeleton`. `curl http://localhost:3000/completed` returns the new markup (`data-testid="empty-state"`, `min-h-32 … gap-4`, `text-[var(--text-dim)]`), so the served code is current and the client is stuck before hydration or routing. Port 3000 is held by PID 4072 (`next start-server.js`, this repo). Not killed or investigated further, per standing guidance.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- `EmptyState.tsx` is rewritten with `ROOT_CLASS`/`TEXT_GROUP_CLASS`/`TITLE_CLASS`/`DESCRIPTION_CLASS` constants. It has no inline styles and no `--color-*`: the title and description use `--text-dim`, with the `text-body`/`text-secondary` scale. The `icon` prop is removed (it had no callers), which enforces "no illustration". `data-testid="empty-state"` is added.
- Layout uses only `min-h-32` + `gap-*`, so the unlayered global reset (open 2.3 decision) can't collapse it, and the home drop zones keep about 128px of height.
- Home page: no changes. The copy "Nothing here yet" / "Backlog is clear" is unchanged, so the 6 dependent specs keep their locators.
- The Completed page empty state now uses the shared `EmptyState`. It keeps the exact copy plus the "View active tasks →" link, which is now `--accent` with an accent `focus-visible` outline. The emerald `ListTodo` tile and amber link are removed. The non-empty branch is byte-identical.
- `globals.css`: the orphaned `.empty-state` rule is removed. The token comment now lists only Card/Badge as `--color-*` consumers.
- **Not verified in a browser / E2E:** `tests/e2e/empty-states.spec.ts` (2.4-E2E-001…004) is authored but not green, and the dependent specs weren't re-run. See the Debug Log and `deferred-work.md`. Task 5's E2E subtask is left unchecked on purpose.

### File List

- `components/ui/EmptyState.tsx` (modified)
- `app/completed/page.tsx` (modified: empty branch, imports, link class constant)
- `app/globals.css` (modified: removed `.empty-state`, updated comment)
- `tests/e2e/empty-states.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Restyled `EmptyState` to Graphite Violet Tailwind classes (no inline styles, no icon). Moved the Completed empty state onto it. Removed `.empty-state`. Authored `empty-states.spec.ts`. `tsc`/lint are clean; E2E is blocked by the dev-server hydration issue (deferred).
