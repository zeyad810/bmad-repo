# Story 3.2: Responsive Breakpoint & Touch Target Compliance

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the same calm interface to work equally well on my phone and my desktop,
so that switching devices never feels like switching apps.

## Acceptance Criteria

1. **Given** a viewport ≤767px, **when** the app renders, **then** `BottomNav` shows, `Sidebar` hides, and the layout is single-column. [Source: epics.md#Story 3.2; NFR4; UX-DR15; ux-design-specification.md#Breakpoint Strategy]
2. **Given** a viewport ≥768px, **when** the app renders, **then** `Sidebar` shows and `BottomNav` hides, with no distinct tablet-only layout. [Source: epics.md#Story 3.2; ux-design-specification.md#Responsive Strategy "Tablet: inherits the desktop layout"]
3. **Given** the drag handle, the checkbox, and the row tap area on mobile, **when** measured, **then** each is at least 44×44px. [Source: epics.md#Story 3.2; UX-DR13; ux-design-specification.md#Accessibility Strategy]
4. **Given** the CSS approach, **when** implemented, **then** it uses mobile-first Tailwind media queries and no fixed-pixel layout widths. [Source: epics.md#Story 3.2; ux-design-specification.md#Implementation Guidelines]

### How the ACs are interpreted (so review can check them)

- **"≤767px / ≥768px"** is exactly Tailwind v4's default `md` breakpoint (`--breakpoint-md: 48rem` = 768px). Mobile is the unprefixed style; desktop is `md:`. The current `lg:` (1024px) split is wrong: from 768 to 1023px it shows the BottomNav **and** the mobile header brand chip.
- **"Mobile-first, no distinct tablet-only layout"** means the only responsive prefix in `app/` and `components/` is `md:`. Every `sm:`, `lg:`, `xl:`, and `2xl:` gets removed or turned into `md:`. That's the testable form of "two effective breakpoints, not three".
- **"No fixed-pixel layout widths"** means no arbitrary `w-[Npx]`, `max-w-[Npx]`, or `min-w-[Npx]` on layout containers (the shell, sidebar, main, header, and drawer). Content columns are fluid (`flex-1`, `min-w-0`, `w-full`, or a `calc(100% - …)`). A fixed-width **rail** (the sidebar) is allowed if it's expressed on the rem spacing scale (`w-63`), not in px. Small fixed sizes for *components* (the 7px `PriorityDot`, icon boxes, 44px targets) are not layout widths and aren't affected.
- **"Row tap area ≥44×44"** means the `TaskRow` root is at least 44px tall on mobile (its width is the full column). Every tappable control inside the row (drag handle, complete/restore checkbox, edit, delete) is also at least 44×44 on mobile, so a thumb can't land on a smaller neighbor by accident. Making the whole row tap-to-edit is **not** part of this story (see Question 2).

## Tasks / Subtasks

- [x] Task 1: Move the nav/shell breakpoint from `lg` to `md` (AC: #1, #2, #4)
  - [x] `components/layout/Sidebar.tsx` `ASIDE_CLASS`: `lg:flex` → `md:flex`, and `w-[252px]` → `w-63` (15.75rem = 252px; the visual width doesn't change). Keep `hidden`, `shrink-0`, and everything else. **The `CONTENT_CLASS` `w-55` stays.**
  - [x] `components/layout/BottomNav.tsx` `NAV_CLASS`: `lg:hidden` → `md:hidden`. Nothing else changes (Story 3.1 already made its tabs `min-h-12`).
  - [x] `app/layout.tsx` header: the mobile brand chip wrapper `lg:hidden` → `md:hidden`, and the "Workspace synced locally" wrapper `hidden … lg:flex` → `hidden … md:flex`. **These must flip at the same width as the Sidebar.** Otherwise 768–1023px shows two brand marks, or none.
  - [x] Add `data-testid="mobile-brand-mark"` to that header brand chip wrapper, so 3.2-E2E-001/002 can assert visibility. The Sidebar chip already has `data-testid="brand-mark"`.
  - [x] `app/layout.tsx` "Your focus board" `hidden sm:inline` → `hidden md:inline`.
  - [x] Result: `grep -rnE "\b(sm|lg|xl|2xl):" app components` returns nothing (see the Task 4 note about `TaskCard.tsx`).

- [x] Task 2: Make the main column fluid and keep content clear of the fixed BottomNav on mobile (AC: #1, #4)
  - [x] **Read "The global reset" in Dev Notes first.** Today `main`'s `mx-auto px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10` are **all no-ops**. So on a phone, the rows touch the screen edges, and the **last Backlog row sits underneath the fixed BottomNav**, which is about 60px (48px tabs + the `pb-safe` ≥12px). These two are the real mobile layout bugs this story fixes.
  - [x] Content-column wrapper (`<div className="min-w-0 flex-1">` in `layout.tsx`): make it `flex min-w-0 flex-1 flex-col items-center`, so children can be centered without `mx-auto`.
  - [x] `main`: replace its class string with a fluid, reset-proof one: `flex w-[calc(100%-2rem)] max-w-[92.5rem] flex-col md:w-[calc(100%-5rem)]`. That gives a 16px side gutter on mobile and 40px on desktop (matching the old intent of `px-4`/`lg:px-10`, on the 8pt scale), with the same 1480px cap now in rem. Top breathing room: a leading spacer `<div aria-hidden="true" className="h-6 shrink-0 md:h-10" />` as the first child *inside* `main`, before `{children}`. Or use `gap-*` on the column. Don't use `pt-*`.
  - [x] Bottom clearance for the BottomNav: after `{children}` inside `main`, add `<div aria-hidden="true" className="h-24 shrink-0 md:h-10" />`. `h-24` (96px) is more than the nav's height plus the iOS safe area, and matches the old `pb-28` intent. On desktop it's just 40px of end-of-page room.
  - [x] Header inner row (`mx-auto flex max-w-[1480px] …`): the same treatment. `flex w-[calc(100%-2rem)] max-w-[92.5rem] items-center justify-between md:w-[calc(100%-5rem)]`, with the header itself `flex w-full justify-center` (**`w-full` is required**: under the new `items-center` parent the sticky header would otherwise shrink to its content and lose its full-width border and backdrop) and a `min-h-16` (64px) instead of the zeroed `py-4`. Remove the now-dead `px-4 py-4 sm:px-6 lg:px-10` from the `header`.
  - [x] Keep the `sticky top-0 z-30` header, the `z-40` BottomNav, and the `z-50` Drawer stacking exactly as they are.
  - [x] **Don't restyle anything else in the header or body** (the emerald dot, the `zinc` text, the "Private" pill, the body `bg-[#0b0c0e]`, and `selection:bg-amber-400` are still Story 3.1's open Question 1). Only change the layout and breakpoint classes named here.
  - [x] Single column check: at 390×844 and 320×568, `document.documentElement.scrollWidth <= window.innerWidth` on `/` with tasks present (no horizontal scroll).

- [x] Task 3: 44×44 touch targets in `components/tasks/TaskRow.tsx` (AC: #3, #4)
  - [x] **Keep the root a `div` with the `group` class.** Seven specs locate rows with `page.locator('div.group', { has: page.getByLabel('Reorder task') })`. Semantic `<li>` markup is Story 3.4's job, not this story's.
  - [x] Pull the class strings out into module-level `*_CLASS` constants (the Epic 2/3.1 idiom), one utility per CSS property per element.
  - [x] **Row root:** add `min-h-11` (44px) and `md:min-h-12`. Replace the zeroed `px-4 py-3` with nothing. The 44px handle and button boxes now supply the visual inset on each side. Gap: `gap-2 md:gap-3`. Keep `rounded-lg`, the border/surface/hover tokens, `transition-colors`, `animate-[task-enter_180ms_ease-out]`, and the `isDragging` `shadow-2xl` and `isBacklog` `opacity-[0.88]` toggles **exactly** (Stories 1.3, 1.9, and 1.6 depend on them).
  - [x] **Drag handle** (`aria-label="Reorder task"`, spreads `dragHandleProps`): use `flex h-11 w-11 shrink-0 items-center justify-center md:h-8 md:w-8` + `rounded-sm` + the existing `cursor-grab`/`active:cursor-grabbing`/color/hover classes. Remove `-ml-1` and `p-1.5` (the margin/padding are zeroed anyway).
    - **Replace the inline `style={{ touchAction: "none" }}` with Tailwind's `touch-none`.** It's the same CSS (`touch-action: none`) and satisfies project-context §5. **Don't drop it.** @dnd-kit's `PointerSensor` needs it on the handle, or a touch drag scrolls the page instead of dragging.
  - [x] **Complete/restore button** (`aria-label` "Mark complete"/"Restore task"): `flex h-11 w-11 items-center justify-center rounded-sm md:h-8 md:w-8` plus the existing color, hover, and disabled classes. Remove `p-1.5`.
  - [x] **Edit and delete buttons:** the same `h-11 w-11 … md:h-8 md:w-8` box. The delete button's armed state shows the text "Confirm?", which is wider than 44px, so for that button use `min-w-11 md:min-w-8` instead of a fixed `w-*`. The label must never clip. Keep `ref={deleteRef}`, `onClick={handleDeleteTrigger}`, and both `aria-label`s unchanged (Story 2.1).
  - [x] Action cluster: `flex shrink-0 items-center gap-0 md:gap-1`. Adjacent 44px boxes need no gap on mobile, and this saves width.
  - [x] **Title + meta on mobile:** with four 44px controls, a 390px screen leaves roughly 30px of title when a long meta tag like "Overdue · Sep 3" is also on the line. Wrap the title `<p>` and the meta `<span>` in `div` `flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3`, so on mobile the meta tag sits under the title and on desktop the layout is the same as today. The title keeps `min-w-0 truncate` (and `md:flex-1`). The meta keeps `shrink-0`, mono, and `tabular-nums`. The row anatomy (handle, dot, title, meta, actions) is unchanged, as the UX spec requires.
  - [x] Result: `grep -nE "style=|p-1\.5|-ml-1|px-4 py-3" components/tasks/TaskRow.tsx` returns nothing.

- [x] Task 4: Other mobile tap targets on the core loop (AC: #3, #4)
  - [x] `components/tasks/QuickAddBar.tsx`: the input's `px-4 py-3` is zeroed, so it's currently only about 22px tall. Add `min-h-11` (it keeps `field-control flex-1`; remove the dead `px-4 py-3`). Give the submit `Button` `className="min-h-11"`. Don't change `placeholder="Add a task..."` (every Epic 2/3 spec locates the input by it). **Don't** add the missing `aria-label` here. That's the known deferred regression, and it belongs to Story 3.4 (see Question 3).
  - [x] `components/ui/Drawer.tsx`: make the close button (`aria-label="Close"`) `flex h-11 w-11 items-center justify-center md:h-9 md:w-9` and drop the zeroed `p-2`. **`md:w-[480px]` → `md:w-120 md:max-w-full`** (30rem = 480px; same width, and no fixed-px layout width). Nothing else changes in Drawer.
  - [x] `components/tasks/TaskCard.tsx` (legacy, now only used by `/completed`): change `sm:p-5` → `md:p-5`. It's a no-op under the reset, and changing it only keeps the Task 1 grep clean. **Don't restyle or resize TaskCard.** Its 44px targets are deferred with the Completed-archive migration (see Question 1).
  - [x] `app/completed/page.tsx`: turn the breakpoint prefixes `sm:flex-row sm:items-end`, `sm:text-4xl`, `sm:p-6`, and `lg:space-y-9` into `md:` equivalents. Change nothing else on that page.

- [x] Task 5: E2E coverage in the new `tests/e2e/responsive-layout.spec.ts` (AC: #1–#4)
  - [x] Import `test`/`expect` from `../support/merged-fixtures`. Use `page.goto('/')` with no base URL. Add tasks with `page.getByPlaceholder('Add a task...')` + `press('Enter')`, then wait for `getByText(title)`, the same as `button-hierarchy.spec.ts`.
  - [x] Write the tests in Dev Notes → Testing Requirements. Use `page.setViewportSize()` per test; don't add new Playwright projects.
  - [ ] Run: `npx playwright test tests/e2e/responsive-layout.spec.ts tests/e2e/nav-restyle.spec.ts --project=chromium`, then `drag-across-divider.spec.ts` and `delete-confirm.spec.ts` as regressions, because the handle and button boxes changed size. **If the run is blocked by the known hydration/dev-server hang** (see `deferred-work.md`, 2.1–3.1), don't debug the server. Record it in the Debug Log, add a `deferred-work.md` entry, leave this subtask unchecked, and close out. This is standing guidance from Zeyad. The breakpoint tests (001/002/003) don't need `<main>` to hydrate, so expect those to pass even if the task-dependent ones are blocked. Report which ones actually passed.

- [x] Task 6: Static verification
  - [x] `npx tsc --noEmit` → exit 0. `npm run lint` → clean.
  - [x] Run the greps from Tasks 1 and 3. Also run `grep -rnE "(w|max-w|min-w)-\[[0-9]+px\]" app components`. The only allowed hit is `PriorityDot`'s `h-[7px] w-[7px]` (a component dot, not a layout width).

## Dev Notes

### Current state (read before touching anything)

- **`app/layout.tsx`** (67 lines, server component): the shell is `div.app-shell.flex.min-h-screen` → `<Sidebar />`, then a content column `div.min-w-0.flex-1` (sticky `header` + `main`), then `<BottomNav />`. The header has an `lg:hidden` brand chip (restyled in 3.1), an `lg:flex` "Workspace synced locally" with an emerald dot, and a `sm:inline` "Your focus board" plus a "Private" pill. `main` is `mx-auto w-full max-w-[1480px] px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10`, and **all of its padding and margin is zeroed** (see below). Also: `viewport` sets `maximumScale: 1, userScalable: false`. That blocks pinch-zoom, which is a WCAG 1.4.4 concern, but it's **Story 3.4's call**. Leave it.
- **`components/layout/Sidebar.tsx`** (105 lines, restyled in 3.1): `ASIDE_CLASS = "hidden w-[252px] shrink-0 flex-col items-center … lg:flex"`. It lays out with `gap`/`w-55`/`min-h` only (the 3.1 reset workaround).
- **`components/layout/BottomNav.tsx`** (54 lines, restyled in 3.1): `fixed bottom-0 left-0 right-0 z-40 … lg:hidden`. The inner row is `flex w-full items-center pb-safe`, and the tabs are already `min-h-12` (48px).
- **`components/tasks/TaskRow.tsx`** (143 lines): root `div.group.flex.items-center.gap-3 … px-4 py-3` (padding zeroed). Drag handle `div` with `p-1.5` (zeroed) plus an **inline `style={{ touchAction: "none" }}`** around a 16px `GripVertical`, so it's a **16×16 target today**. The checkbox, edit, and delete buttons are all `p-1.5` (zeroed) around 14–16px icons, so they're **about 16×16 today**. The row is about 26px tall (a 15px `leading-snug` title plus a 2px border). **AC #3 fails on every control today.**
- **`components/tasks/QuickAddBar.tsx`**: the input has the `field-control` class plus `px-4 py-3` (zeroed), so it's about 22px tall. The Add button is `Button size="md"` (`px-4 py-2`, also zeroed).
- **`components/ui/Drawer.tsx`**: it's already mobile-first on `md` (a bottom sheet under 768px, a right slide-over from 768px) with a fixed `md:w-[480px]`. Close button `p-2` (zeroed) around an 18px icon.
- **Breakpoint audit** (`grep -rnoE "\b(sm|md|lg):…" app components`): `lg:` is in `Sidebar.tsx:15`, `BottomNav.tsx:8`, `layout.tsx:43,47,57`, and `completed/page.tsx:38`. `sm:` is in `layout.tsx:41,51,57`, `completed/page.tsx:39,43,49`, and `TaskCard.tsx:57`. `md:` is only in `Drawer.tsx` (already correct).

### The global reset zeroes padding/margin utilities (critical, 4th story in a row)

`app/globals.css:78` has `* { box-sizing: border-box; margin: 0; padding: 0; … }` **outside any cascade layer**. Tailwind v4 utilities live in `@layer utilities`, and unlayered rules win over any layer regardless of specificity. So **every `p-*`/`px-*`/`py-*`/`m-*`/`mx-auto`/`space-y-*` in the app is silently 0**. Moving the reset into `@layer base` is still an **open `[Review][Decision]` from Story 2.3** and is **not** decided here (see Question 4).

For this story, use only properties the reset doesn't touch. These all work: `h-*`, `w-*`, `min-h-*`, `min-w-*`, `max-w-*`, `gap-*`, `inset`/`top`/`right`, `flex`/`grid` alignment, `calc()` widths, and spacer `div`s. **Don't** work around it with inline styles or new unlayered CSS rules.

**Check `globals.css` before you start.** If Zeyad has resolved the 2.3 decision (the `*` reset now sits inside `@layer base`), ignore this section. Use normal 8pt `px-4 md:px-10` / `pb-24 md:pb-10` on `main`, and `p-*` inside the row. The Task 2 `calc` widths and spacer divs are then unnecessary. The 44px `h-11 w-11` target boxes stay either way.

### Tokens, sizes, and Tailwind v4 facts

- `md` = 48rem = **768px** (Tailwind v4 default; `@theme` doesn't override `--breakpoint-*`). `md:` applies at `min-width: 768px`, so the unprefixed style covers ≤767px. That's exactly the AC split.
- Spacing is `--spacing: 0.25rem` → `h-11` = 44px, `h-12` = 48px, `w-63` = 252px, `w-120` = 480px, `h-24` = 96px. Numeric steps work without config. `touch-none` → `touch-action: none`.
- 44px isn't on the 8pt spacing list (4/8/12/16/24/32/48). It's a **hit-target size** set by the spec's accessibility rule, not spacing, so `h-11`/`w-11` is correct and is explicitly allowed. Keep the gaps and insets on the 8pt steps.
- `rounded-sm` = 8px and `rounded-lg` = 16px in this theme (the `@theme --radius-*` overrides).
- Colors: only the `:root` Graphite Violet `var(--…)` tokens. Never Tailwind's `bg-accent`/`text-accent` etc., which resolve to the **legacy amber** `@theme --color-*` set. (The IDE will suggest them; ignore it, as 3.1 did.)

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| `div.group` row root, with a descendant that has `aria-label="Reorder task"` | `button-hierarchy`, `complete-from-backlog`, `delete-confirm`, `drag-across-divider` specs |
| `getByLabel('Mark complete')` / `'Restore task'` / `'Delete task'` / `'Confirm delete task'` / `'Edit task'` on row buttons | same, plus `task-form-restyle` |
| The drag handle is still a `PointerSensor` activator with `touch-action: none`. Drag tests `mouse.move` to the handle's `boundingBox()` center, so a bigger box is fine. | `drag-across-divider`, `complete-from-backlog`, `task-reorder` |
| The default Desktop Chrome/Firefox/Safari projects run at 1280×720 → Sidebar visible, BottomNav hidden | every existing spec |
| `aside` hidden and `bottom-nav` visible at 390×844; bottom-nav links ≥44px tall | `nav-restyle.spec.ts` 3.1-E2E-003/004/005 |
| `placeholder="Add a task..."` on the quick-add input | every Epic 2/3 spec |
| `data-testid="empty-state"` sections/dropzones; `SectionDivider` text `BACKLOG` | `empty-states`, `drag-across-divider` |
| Backlog `opacity-[0.88]`, `isDragging` shadow, and the `task-enter` animation on the TaskRow root | Stories 1.6/1.9 specs |

### Scope boundaries: what NOT to touch

- **Story 3.3:** the keyboard reorder and the ARIA live region. Don't change `app/page.tsx`'s sensors or `DraggableTaskList.tsx`.
- **Story 3.4:** focus rings on TaskRow controls (you may copy `Button.tsx`'s `focus-visible:outline-*` classes into the new TaskRow constants since you're rewriting them, but don't audit other files), contrast, `<ul>/<li>` semantics, the QuickAddBar `aria-label`, and the `userScalable: false` viewport.
- **Story 3.5:** axe integration and full core-journey specs at both breakpoints.
- Colors in `layout.tsx`/`globals.css` and the Completed page's legacy styling (3.1 Question 1).
- `TaskCard` and the Completed archive rows, beyond the one prefix change.
- No new dependencies (`clsx`, `tailwind-merge`, `cva`). Join class strings by hand.

### Previous story intelligence (3.1 and Epic 2)

- **3.1** restyled the nav, left `lg:`/`w-[252px]` **on purpose** for this story, and added `aria-current`, `nav aria-label="Primary"`, `data-testid="bottom-nav"`, and `data-testid="brand-mark"`. Its `nav-restyle.spec.ts` went **5/5 green on chromium**, because the nav is server-rendered and doesn't need `<main>` to hydrate. The same will be true of this story's pure breakpoint tests.
- **3.1 BottomNav change:** its inner row became `w-full` (it had been `mx-auto max-w-sm`, and `mx-auto` was dead). Don't reintroduce `mx-auto` anywhere; it doesn't work under the reset.
- **2.2:** one utility per property per element. Tailwind doesn't guarantee which of two conflicting utilities wins. `h-11 md:h-8` is fine (different media conditions); `h-11 h-8` is not.
- **2.4 testing lesson:** assert positive computed values (px sizes via `boundingBox()`, `touch-action` via `getComputedStyle`), not "is not X".
- **The E2E blocker:** the 2.1–3.1 task-dependent runs never reached green. `<main>` stays stuck on `HydrationSkeleton` against the dev server on :3000. Don't investigate it (memory: `feedback_no_local_server_debugging`). If a native dialog could appear, collect dialogs into an array and assert it's empty. Webkit quick-add timeouts are pre-existing flakiness.
- **Git:** the history is only `b2d374d Initial commit` + `29cf79a chore: update package-lock.json`. All of Epic 1–3.1 is uncommitted in the working tree (including `layout.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `TaskRow.tsx`, and `globals.css`). Build on the working tree and revert nothing.

### Latest tech notes

The versions are pinned per `project-context.md`, and no upgrades are needed.
- **Tailwind v4.x:** default breakpoints `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem. Variants are mobile-first `min-width`. `max-md:` exists but isn't needed here, since unprefixed means mobile. `touch-none`, `min-w-11`, `w-63`, and `w-120` are all generated from the spacing scale. Arbitrary `w-[calc(100%-2rem)]` needs no spaces inside the brackets (use `-`, not ` - `).
- **@dnd-kit/core 6.3:** `PointerSensor` requires `touch-action: none` on the activator element for touch drags. The `distance: 4` activation constraint in `app/page.tsx` keeps taps on the bigger handle from being treated as drags. Don't change it.
- **Playwright 1.63:** `page.setViewportSize()` inside a test is enough. Tailwind media queries respond to the viewport width, and `hasTouch` isn't needed for layout or size checks.

### Project Structure Notes

- **Modified:** `app/layout.tsx`, `components/layout/Sidebar.tsx`, `components/layout/BottomNav.tsx`, `components/tasks/TaskRow.tsx`, `components/tasks/QuickAddBar.tsx`, `components/ui/Drawer.tsx`, `components/tasks/TaskCard.tsx` (one prefix), `app/completed/page.tsx` (prefixes only).
- **New:** `tests/e2e/responsive-layout.spec.ts`.
- Use `@/*` imports only, strict TS with no `any`, and named exports. Keep `"use client"` where it's already present. `layout.tsx` stays a server component.

### Testing Requirements

New spec: `tests/e2e/responsive-layout.spec.ts`. Test IDs use the `3.2-E2E-*` prefix.

```ts
const MOBILE = { width: 390, height: 844 };
const MOBILE_EDGE = { width: 767, height: 900 };
const DESKTOP_EDGE = { width: 768, height: 900 };
const TABLET = { width: 1024, height: 768 };

async function expectMinTarget(locator: Locator, min = 44) {
  const box = await locator.boundingBox();
  expect(box, 'element must be rendered').not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(min);
  expect(box!.height).toBeGreaterThanOrEqual(min);
}
```

| Test ID | Priority | Scenario |
|---|---|---|
| `3.2-E2E-001` | P0 | At **767×900**, `/`: `getByTestId('bottom-nav')` is visible, `aside` is hidden, and the header's mobile brand chip is visible. At **768×900**: `aside` is visible, `bottom-nav` is hidden, and the header brand chip is hidden (exactly one brand mark on screen at each width). |
| `3.2-E2E-002` | P1 | No tablet layout: at **768×900** and **1024×768**, record which of `aside`, `bottom-nav`, and the header brand chip are visible, plus `aside`'s `boundingBox().width`. The results are identical to each other, and to the default 1280×720 (width 252). |
| `3.2-E2E-003` | P1 | Single column + no horizontal scroll: at 390×844 and 320×568, add two tasks (one with a long 80-character title). `document.documentElement.scrollWidth` ≤ `window.innerWidth`. Both rows' `boundingBox().x` values are equal (stacked, not side by side). Each row's left edge is ≥16px and its right edge is ≤ viewport − 16px (the gutter). |
| `3.2-E2E-004` | P0 | Touch targets at 390×844: add a task. On its row, `expectMinTarget` for `getByLabel('Reorder task')`, `getByLabel('Mark complete')`, `getByLabel('Edit task')`, `getByLabel('Delete task')`, and the row root itself (`div.group`, height ≥44). Click Delete → `getByLabel('Confirm delete task')` is ≥44×44 and its text "Confirm?" isn't clipped (`scrollWidth <= clientWidth`). |
| `3.2-E2E-005` | P1 | Content clears the BottomNav at 390×844: add 8 tasks, then scroll to the bottom. The last row's `boundingBox()` bottom is ≤ `bottom-nav`'s `boundingBox().y`, so the last row isn't covered. |
| `3.2-E2E-006` | P2 | The drag handle keeps `touch-action: none` (computed), and `TaskRow` has no inline `style` attribute (`page.locator('div.group [style], div.group[style]')` count 0 inside the row, excluding the @dnd-kit sortable wrapper, which is the row's *parent*). The quick-add input and Add button are ≥44px tall at 390×844. |
| regression | P1 | `nav-restyle.spec.ts` (all 5), `drag-across-divider.spec.ts`, and `delete-confirm.spec.ts` on chromium. |

Run chromium first. Report cross-browser results honestly. If the environment blocks the task-dependent tests (004/005/006, and the task part of 003), follow the Task 5 guidance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] for the story and ACs. See also [#Requirements Inventory]: NFR4 (mobile ≤767 / desktop ≥768, no tablet layout, 44px) and UX-DR15 (mobile-first, no fixed-px widths), plus UX-DR13 (44×44 on the handle, checkbox, and row).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility (lines 466-510)]: the two breakpoints, "tablet inherits desktop", 44×44, and "no fixed-pixel layout widths". See also [#Spacing & Layout Foundation (lines 245-251)]: "layout width changes, the list/row rhythm does not". And [#TaskRow component spec]: the row anatomy stays identical across devices.
- [Source: _bmad-output/project-context.md §2, §3, §5]: `"use client"`, dnd-kit in `components/tasks/`, no inline styling, and `@/*` imports.
- [Source: app/layout.tsx:36-61], [components/layout/Sidebar.tsx:15], [components/layout/BottomNav.tsx:8], [components/tasks/TaskRow.tsx:78-140], [components/tasks/QuickAddBar.tsx:21-33], [components/ui/Drawer.tsx:44-58], [app/globals.css:78 unlayered reset, 94 .pb-safe], [app/page.tsx:31-40 sensors]
- [Source: _bmad-output/implementation-artifacts/3-1-restyle-sidebar-and-bottomnav.md]: the reset workarounds, 3.1's hand-off of `lg:`/`w-[252px]` to this story, and its test helpers. [2-3-restyle-buttons-and-enforce-hierarchy.md]: the open reset decision. [deferred-work.md]: the hydration E2E blocker, the QuickAddBar aria-label, and the TaskCard delete contrast.
- [Source: tests/e2e/nav-restyle.spec.ts]: the `MOBILE` viewport, `css()` helper, and bottom-nav locators to reuse. [tests/e2e/drag-across-divider.spec.ts:28-110]: the handle `boundingBox()` drag pattern.

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Completed archive touch targets:** `/completed` still renders the legacy `TaskCard`, and its restore/edit/delete buttons are about 16px (the reset zeroes their `p-2`). By default this story leaves it alone, because the AC names the drag handle and row, which are TaskRow concerns. Should a small story migrate `/completed` to `TaskRow`? That would also fix 2.3's deferred "Confirm?" contrast issue. Or should 3.4 own it?
2. **Row tap area = tap to edit?** The UX spec's TaskRow section says "tap row to open TaskDrawer for edit". Today only the pencil button opens it. By default this story sizes the row (≥44px tall) and all its buttons, and doesn't add row-tap-to-edit. If you want it, it would free up 44px on mobile by removing the pencil. It fits 3.4 better, since it touches row semantics.
3. **QuickAddBar `aria-label="Add a task"`** is still missing (deferred since 2.1), and it's the reason several Epic 1 specs fail at `getByLabel('Add a task')`. It's a one-line fix. By default it's left for 3.4. Say so if you'd rather it land here.
4. **Global reset (2.3 decision), 4th time:** this story adds `calc()` widths and spacer divs purely to work around the unlayered `*` reset. Moving that one line into `@layer base` would let every story use normal `p-*`/`m-*`. The catch: it would suddenly "turn on" every dead padding class app-wide, so it needs one visual pass. It's worth deciding before 3.4.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- Before starting: `app/globals.css:78` still has the unlayered `*` reset (the 2.3 decision is still open), so I used the story's workaround path (calc widths, spacer divs, h/w-sized targets).
- Red phase (`npx playwright test tests/e2e/responsive-layout.spec.ts --project=chromium`): 7/7 failed. 001/002 failed on the real defect (`aside` still `hidden … lg:flex` at 768/1024px). The others failed at quick-add.
- The first green attempt hit a TSX parse error. The JSX comment in `layout.tsx` contained `p-*/m-*`, and the `*/` closed the comment early. I reworded it. After that, `npx tsc --noEmit` exits 0 and `npm run lint` reports "No ESLint warnings or errors".
- Green run (`responsive-layout.spec.ts` + `nav-restyle.spec.ts`, chromium): **7 passed** (3.2-E2E-001, 3.2-E2E-002, and 3.1-E2E-001…005). **5 failed** (3.2-E2E-003 ×2, 004, 005, 006), all with `TimeoutError: locator.fill` on the quick-add input. The screenshot shows `<main>` stuck on `HydrationSkeleton`, which is the known 2.3–3.1 dev-server/hydration hang. It also shows the new mobile shell rendering correctly. Per standing guidance, I didn't debug it. I logged it in `deferred-work.md`.
- Greps: `(sm|lg|xl|2xl):` in `app components` only matches `--radius-sm/lg/xl` tokens and the `Button` `SIZE_CLASS` object keys (`sm:`/`lg:`), none of which are responsive prefixes. `style=|p-1\.5|-ml-1|px-4 py-3` in TaskRow returns nothing. `(w|max-w|min-w)-[Npx]` only matches the allowed `PriorityDot` 7px dot.
- The IDE suggested `bg-bg`/`text-(--x)` canonical forms. I ignored them on purpose (`bg-bg` resolves to the legacy `@theme` token). The `cursor-grab`/`active:cursor-grabbing` "conflict" warning is a false positive (different states), and the pattern already existed.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **Breakpoint:** Sidebar is `md:flex` and BottomNav is `md:hidden`. The header's mobile brand mark and "synced" text flip at `md` as well, so exactly one brand mark shows at every width (verified at 767/768/1024/1280 by 3.2-E2E-001/002). Every `sm:`/`lg:` prefix in `layout.tsx`, `completed/page.tsx`, and `TaskCard.tsx` is now `md:`.
- **Fluid layout:** the content column is `flex-col items-center`. `main` and the header's inner row are `w-[calc(100%-2rem)] md:w-[calc(100%-5rem)] max-w-370`, giving 16px/40px gutters and the same 1480px cap in rem. There are top and bottom spacer divs; the bottom one is `h-24` on mobile, so the fixed BottomNav no longer covers the last row. The header is `w-full min-h-16`. The sidebar is `w-63` and the drawer is `md:w-120 md:max-w-full`, so no px layout widths remain.
- **TaskRow:** class strings are now module constants. The handle, check/restore, edit, and delete controls are `h-11 w-11` (44px) on mobile and 32px from `md`. Delete uses `min-w` so "Confirm?" doesn't clip. The row is `min-h-11`/`md:min-h-12`. The inline `touchAction` style became `touch-none`. On mobile the title and meta stack, and on desktop they're side by side as before. The row controls also got the accent `focus-visible` ring (allowed by the story's scope note). The `div.group` root, all aria-labels, the backlog opacity, the drag shadow, and the enter animation are all unchanged.
- **Other targets:** the quick-add input and Add button are `min-h-11`, and the Drawer close button is 44px on mobile and 36px from `md`.
- **Verified:** tsc, lint, 3.2-E2E-001/002, and nav-restyle 5/5 on chromium. **Not verified:** the task-dependent tests 3.2-E2E-003–006 and the `drag-across-divider`/`delete-confirm` regressions. They're blocked by the pre-existing hydration hang, so the Task 5 run subtask is left unchecked on purpose. Firefox and webkit weren't run.
- The quick-add input text now has no inner inset, because `field-control`'s padding is zeroed by the reset, as before. This is unchanged from before this story, and out of scope; it goes away if the reset decision (Question 4) lands.

### File List

- `app/layout.tsx` (modified)
- `app/completed/page.tsx` (modified: breakpoint prefixes only)
- `components/layout/Sidebar.tsx` (modified)
- `components/layout/BottomNav.tsx` (modified)
- `components/tasks/TaskRow.tsx` (modified)
- `components/tasks/QuickAddBar.tsx` (modified)
- `components/tasks/TaskCard.tsx` (modified: one prefix)
- `components/ui/Drawer.tsx` (modified)
- `tests/e2e/responsive-layout.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-23: Story created via create-story workflow.
- 2026-09-23: Moved the nav/shell breakpoint from `lg` to `md` (768px). The main column is now fluid with reset-proof gutters and BottomNav clearance. Row, quick-add, and drawer tap targets are 44×44 on mobile. No px layout widths remain. Added `responsive-layout.spec.ts`: the breakpoint tests pass; the task-dependent tests are blocked by the pre-existing hydration hang (deferred).
