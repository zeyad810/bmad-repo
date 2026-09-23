# Story 3.1: Restyle Sidebar & BottomNav

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the desktop sidebar and mobile bottom nav to match the calm Graphite Violet visual language,
so that navigation feels like the same product as the task list.

## Acceptance Criteria

1. **Given** `Sidebar.tsx`, **when** restyled, **then** it uses Graphite Violet tokens instead of the current amber styling, **and** the active nav item shows via an `--accent-soft` background (no bright active-color chrome). [Source: epics.md#Story 3.1; UX-DR8; ux-design-specification.md#Navigation Patterns]
2. **Given** `BottomNav.tsx`, **when** restyled, **then** it uses Graphite Violet tokens, **and** the active tab is distinguished only by accent color, not by size or added labels. [Source: epics.md#Story 3.1; UX-DR8]
3. **Given** both components' current amber/emerald Tailwind utility classes, **when** restyled, **then** no such ad hoc color utilities remain for branding or active-state purposes. [Source: epics.md#Story 3.1; UX-DR1; NFR1]

## Tasks / Subtasks

- [x] Task 1: Restyle `components/layout/Sidebar.tsx` (AC: #1, #3)
  - [x] Replace every class string with module-level `*_CLASS` constants (the idiom from `Button.tsx`, `TaskForm.tsx`, `EmptyState.tsx`). Keep **one utility per CSS property per element**, and give active and inactive items separate constants (`NAV_ITEM_ACTIVE_CLASS` / `NAV_ITEM_INACTIVE_CLASS`) instead of stacking conflicting `bg-*`/`text-*` utilities.
  - [x] **Brand mark** (`Link href="/"`): remove `bg-amber-400`, `text-[#17120a]`, and the amber glow `shadow-[…rgba(245,158,11,…)]`. New chip: `rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]`, no shadow. The accent is **not** decorative (UX spec Color System), so the `CircleDot` icon uses `--text`, not `--accent`. Wordmark "StickyTasks": `text-[var(--text)]`, weight 600–700. Subtitle "Personal command center": `text-meta text-[var(--text-dim)]`.
  - [x] **"Workspace" label**: uppercase mono section label per the spec: `font-mono text-meta uppercase tracking-[0.08em] text-[var(--text-dim)]`. Drop the `text-[10px]`/`tracking-[0.16em]`/`zinc-600`.
  - [x] **Nav items**:
    - Active: `bg-[var(--accent-soft)] text-[var(--text)]`. No amber, no accent-colored text or icon, no border or ring. The soft background alone marks the active item.
    - Inactive: `text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]`.
    - Shared: `rounded-sm` (8px), `text-secondary` (13px), `font-medium`, `transition-colors`, and the focus ring `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]` (the same classes as `Button.tsx`'s `BASE_CLASS`).
    - Icon: one fixed `size={16}` and one fixed `strokeWidth={2}` for both states. Remove the `active ? 2.4 : 1.9` swap. Emphasis comes from the background only.
    - Count: `font-mono text-meta tabular-nums text-[var(--text-dim)]` in **both** states (no amber and no accent on the active count). **Keep the count inside the `<Link>`**, because `complete-from-backlog.spec.ts` asserts `toContainText('2')` on the link.
    - Add `aria-current={active ? "page" : undefined}` to the `Link`. It costs nothing and 3.4 needs it.
    - Keep the labels exactly **"My tasks"** and **"Completed"**. `complete-from-backlog.spec.ts:148-149` uses `getByRole('link', { name: /my tasks/i })` and `/completed/i` scoped to `aside`.
  - [x] **Nav landmark**: `<nav aria-label="Primary">`.
  - [x] **"Today" stats card**:
    - Remove the progress bar entirely: both the track `div` and the fill `div` with its **inline `style={{ width }}`**. The inline style violates project-context §5, and an amber or accent fill would be decorative accent use, which the UX spec forbids ("accent reserved exclusively as a priority/status signal").
    - Keep the card showing `stats.completedToday` + "completed".
    - Restyle: card `rounded-sm border border-[var(--border)] bg-[var(--surface)]`. Heading "Today" gets the same mono uppercase label style as "Workspace". The `BarChart3` icon moves from `text-amber-400` to `text-[var(--text-dim)]`, or is removed. The number is `font-mono text-section tabular-nums text-[var(--text)]` (22px; fall back to `text-[22px]` if the `text-section` utility doesn't apply). "completed" is `text-meta text-[var(--text-dim)]`.
    - Keep the line "Small wins add up. Keep your queue moving." as `text-meta text-[var(--text-dim)]`.
  - [x] **Footer** "✦ Prioritize what matters" (`Sparkles`): restyle to `text-meta text-[var(--text-dim)]`. Keep it (this is a restyle, not a content cut). See Question 2.
  - [x] **Aside shell**: `border-r border-[var(--border)] bg-[var(--bg)]` in place of `border-white/[0.07] bg-[#101113]`.
    - Keep `hidden … lg:flex` and `w-[252px] shrink-0` **unchanged**. The breakpoint change to 768px/`md` and the fixed-width question both belong to **Story 3.2**.
    - For spacing, see Dev Notes → "The global reset zeroes padding/margin utilities".
  - [x] Result: `grep -nE "amber|emerald|zinc|white/|#[0-9a-fA-F]{3,6}|style=" components/layout/Sidebar.tsx` returns nothing.

- [x] Task 2: Restyle `components/layout/BottomNav.tsx` (AC: #2, #3)
  - [x] Delete the per-item `activeClass` (`text-amber-300 bg-amber-400/10`, `text-emerald-300 bg-emerald-400/10`). One shared active style: **`text-[var(--accent)]`, and nothing else changes**. That means:
    - no background on the active tab
    - the same `size={20}` and `strokeWidth={2}` for both states (remove `strokeWidth={active ? 2.5 : 1.8}`, which is a weight change)
    - no extra label, underline, or dot
  - [x] Inactive: `text-[var(--text-dim)] hover:text-[var(--text)]`. Put the color on the `Link` only; the icon (`currentColor`) and count inherit it. Don't set a second text color on children.
  - [x] **Icon-only**, per the UX spec ("icon-only with the active tab distinguished by accent color"): the visible "Tasks"/"Completed" text becomes `<span className="sr-only">`, so the accessible name is kept (`getByRole('link', { name: 'Tasks' })` still works). Also add `aria-current={active ? "page" : undefined}`.
  - [x] Count badge: keep it, restyle to `font-mono text-meta tabular-nums` with no pill background (`bg-white/[0.12]` removed) and no `text-[9px]` (below the type scale). Hide it when `count === 0`, as today. Keep the absolute offset positioning next to the icon. `-right-*`/`-top-*` are `inset` utilities, which the reset does not touch.
  - [x] Shell: `border-t border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl` in place of `border-white/[0.08] bg-[#101113]/90`. Keep `fixed bottom-0 left-0 right-0 z-40 lg:hidden` and `pb-safe` unchanged. The breakpoint is 3.2's job.
  - [x] Tap targets: each `Link` is `flex min-h-12 flex-1 items-center justify-center rounded-sm` (48px tall, ≥44px). Add the same `focus-visible` accent outline as the Sidebar items. Don't size anything with `py-*` (see the reset note).
  - [x] `<nav aria-label="Primary" data-testid="bottom-nav">`.
  - [x] Result: `grep -nE "amber|emerald|zinc|white/|#[0-9a-fA-F]{3,6}|style=|strokeWidth=\{active" components/layout/BottomNav.tsx` returns nothing.

- [x] Task 3: Mobile header brand mark in `app/layout.tsx` (AC: #3)
  - [x] The `lg:hidden` brand chip in the header (`bg-amber-400 text-[#17120a]` + "StickyTasks" `text-white`) is the mobile counterpart of the Sidebar brand, and it's the only branding a mobile user sees. Restyle it the same way as Task 1's brand mark: `rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]`, with the wordmark in `text-[var(--text)]`.
  - [x] **Touch nothing else in `layout.tsx`.** The emerald "synced" dot, the header chrome, the body background, the `selection:bg-amber-400` rule, and the amber radial gradient in `globals.css` are all outside this story (see Question 1).

- [x] Task 4: E2E coverage in the new `tests/e2e/nav-restyle.spec.ts` (AC: #1, #2, #3)
  - [x] Import `test`/`expect` from `../support/merged-fixtures`, the same as `empty-states.spec.ts`. No hardcoded base URL; use `page.goto('/')`.
  - [x] Write the tests in the table under Dev Notes → Testing Requirements.
  - [ ] Run: `npx playwright test tests/e2e/nav-restyle.spec.ts tests/e2e/complete-from-backlog.spec.ts --project=chromium`. **If the run is blocked by the known dev-server/hydration issue** (see `deferred-work.md` for 2.1–2.4), don't debug the server. Record the failure in the Debug Log, add a `deferred-work.md` entry, leave this subtask unchecked, and close out. This is standing guidance from Zeyad.

- [x] Task 5: Static verification
  - [x] `npx tsc --noEmit` → exit 0. `npm run lint` → clean.
  - [x] Run the greps from Tasks 1–2. Also confirm that `app/layout.tsx` has no `amber` inside the header brand chip.
  - [x] Update `globals.css`'s token comment if it still names Sidebar/BottomNav as `--color-*` consumers. (As of 2.4 it names only Card/Badge. Verify and don't edit if it's already accurate.)

## Dev Notes

### Current state (read before touching anything)

**`components/layout/Sidebar.tsx` (73 lines, `"use client"`)** uses `usePathname()` + `useStats()` from `@/hooks/useTasks`. `navItems` is `[{ "/", "My tasks", ListTodo }, { "/completed", "Completed", CheckCircle2 }]`. Active means `pathname === item.href`. It contains:
- The aside: `hidden w-[252px] shrink-0 flex-col border-r border-white/[0.07] bg-[#101113] px-4 py-5 lg:flex`.
- The brand link: a 40×40 amber chip (`bg-amber-400`, `rounded-[13px]`, an amber glow shadow) with `CircleDot`, plus "StickyTasks" / "Personal command center".
- The "Workspace" label (`text-[10px] … tracking-[0.16em] text-zinc-600`).
- The nav links. Active is `bg-amber-400/[0.12] text-amber-300` with a thicker icon stroke and an amber count; inactive is `text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200`. The count is `stats.active` for `/` and `stats.completedAll` for `/completed`.
- The "Today" stats card: `BarChart3` in amber, `stats.completedToday`, and an amber progress bar whose width comes from an **inline `style`**, `completedToday / (active + completedToday)`.
- The footer: `Sparkles` + "Prioritize what matters".

**`components/layout/BottomNav.tsx` (27 lines, `"use client"`)** has the items `[{ "/", "Tasks", ListTodo, stats.active, amber activeClass }, { "/completed", "Completed", CheckCircle2, stats.completedAll, emerald activeClass }]`. That's two different active colors, which is exactly what AC #2 and #3 remove. The shell is `fixed bottom-0 … bg-[#101113]/90 … lg:hidden`, with an inner `mx-auto flex max-w-sm … pb-safe`. Active items get a background tint and a heavier stroke. Labels are visible at `text-[11px]`, and the count pill is `text-[9px]`.

**`app/layout.tsx`** renders `<Sidebar />`, then the content column (a sticky header with an `lg:hidden` amber brand chip, then `<main>`), then `<BottomNav />`. Only the brand chip is in scope (Task 3).

**Must preserve:**
- The routes and link targets (`/`, `/completed`).
- The reactive counts from `useStats()`. **Don't change `hooks/useTasks.ts`.**
- The `lg:` visibility split.
- `pb-safe` on the BottomNav, for the iOS safe area.
- The `z-40` stacking. The header is `z-30`, and `Drawer` must still cover the nav, so don't raise it.
- The `"use client"` directive, and the named exports `Sidebar`/`BottomNav`.

### Tokens: which namespace to use

- There are two token sets in `app/globals.css`. The `@theme` `--color-*` set is **legacy amber** (`--color-accent: #fbbf24`). The `:root` Graphite Violet set is `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, and `--accent-soft`. **Use only the `:root` set**, via the arbitrary-value idiom the codebase already uses, e.g. `bg-[var(--accent-soft)]` and `text-[var(--text-dim)]`. Don't use Tailwind's `bg-accent`, `text-accent`, or `bg-accent-subtle`: those resolve to the **amber** `@theme` tokens and would silently reintroduce amber.
- Opacity on a var color (`bg-[var(--bg)]/90`) works in Tailwind v4, which compiles it through `color-mix()`.
- Type scale utilities come from `@theme --text-*`: `text-meta` (12px), `text-secondary` (13px), `text-body` (15px), `text-section` (22px). If one doesn't apply, fall back to `text-[Npx]` with the same value, as 2.2 and 2.3 did. Don't add utility blocks. Don't go below 12px: the current 9–11px sizes are off-scale.
- Radius: `rounded-sm` is **8px** in this theme (the `@theme` `--radius-*` overrides), and `rounded-lg` is 16px. Use `rounded-sm` for chips, nav items, and the card. Drop `rounded-[13px]`/`rounded-xl`/`rounded-2xl`.

### The global reset zeroes padding/margin utilities (critical, carried from 2.3/2.4)

`app/globals.css` has `* { box-sizing: border-box; margin: 0; padding: 0; … }` **outside any cascade layer**. Tailwind v4 utilities live in `@layer utilities`, and unlayered rules win regardless of specificity. So **every `p-*`/`px-*`/`py-*`/`m-*`/`mt-*`/`mb-*`/`space-y-*` is silently 0**. The Sidebar's `px-4 py-5`, `mb-10`, `px-3 py-2.5`, and `mt-auto` are all no-ops today; 2.3's red-phase screenshot showed the sidebar flush to its edges. The fix (moving the reset into `@layer base`) is an **open `[Review][Decision]` in Story 2.3**. It's not decided here.

For this story, lay out with properties the reset doesn't touch, the same approach 2.4 used:
- **Vertical rhythm:** make the aside's inner content a `flex flex-col gap-8` column, the nav list a `flex flex-col gap-1`, and so on. Use `gap-*`, not `space-y-*` (which is margin-based). To push the stats card to the bottom, use a `flex-1` spacer `div` in place of `mt-auto` (margin).
- **Aside inset:** make the aside `flex flex-col items-center`, and put its content in one wrapper `div` with `w-55 self-center` (220px, which leaves 16px each side of the 252px aside). For top and bottom breathing room, use empty `h-6`/`h-5` spacer divs or `min-h-*` on the first and last blocks, not `py-*`.
- **Horizontal inset inside nav items:** use `min-h-10` (40px) plus a grid, e.g. `grid grid-cols-[40px_1fr_auto] items-center`, with the icon centered in the 40px column. Right-align the count with a trailing fixed column or `justify-self-end` plus a `w-8 text-center` span. Don't use `px-*`.
- **Stats card:** it needs an inner inset. Use an inner `div` with `w-full` inside a card that is `flex flex-col items-center`, and give that inner div a width `calc`: `w-[calc(100%-32px)]` gives a 16px inset. Or accept a gap-only layout. Either way, not `p-4`.
- `inset`/`top`/`right` (`-top-2`, `-right-3`) and `h-*`/`w-*`/`min-h-*` all work.
- **Don't** work around it with inline styles or new unlayered CSS rules for these components. **If Zeyad resolves 2.3's decision before you start** (the reset has moved into `@layer base` in `globals.css`), ignore this section and use normal 8pt `p-*`/`gap-*` utilities. Check `globals.css` first.

### What must be preserved (regression guard)

| Hook | Used by |
|---|---|
| `page.locator('aside')` → `getByRole('link', { name: /my tasks/i })` / `{ name: /completed/i }`, and `toContainText('<count>')` on each, updating reactively after complete | `complete-from-backlog.spec.ts:146-160` |
| `/completed` link reachable from the nav; `/completed` page itself unchanged | `delete-confirm.spec.ts`, `empty-states.spec.ts` 2.4-E2E-003/004, `button-hierarchy.spec.ts` |
| Desktop Chrome projects run at 1280×720, so the Sidebar is visible (`lg:flex`) and the BottomNav is hidden | every existing spec. Don't change the breakpoint in this story. |
| `getByRole('link', { name: /completed/i })` inside `aside` must match exactly one link. Don't add other visible text containing "completed" **as a link** in the aside. The stats card's "completed" is a `span`, which is fine. | strict mode in `complete-from-backlog.spec.ts` |

### Scope boundaries: what NOT to touch

- **Breakpoints** (`lg` → `md`/768px), `w-[252px]`, single-column layout, and 44px audits of rows: **Story 3.2**.
- A focus-ring audit across all elements, contrast checks, and axe: **Story 3.4 / 3.5**. You do add the focus ring to the nav links here, because you're rewriting their classes anyway.
- `app/layout.tsx` beyond the header brand chip. `app/globals.css`'s body background, amber radial gradient, `.field-control` amber focus, and `selection:bg-amber-400`: see Question 1.
- `hooks/useTasks.ts` (`useStats`), `HydrationProvider.tsx`, Card/Badge (`--color-*`), and the rest of `/completed`.
- No new dependencies (`clsx`, `tailwind-merge`, `cva`). Join class strings by hand.

### Previous story intelligence (Epic 2)

- **2.3/2.4 pattern:** module-level `*_CLASS` constants, Graphite Violet `var(--…)` arbitrary values, a `data-*` test hook, and no inline styles. `Button.tsx`'s `BASE_CLASS` is the reference for the focus-ring classes.
- **2.2:** put exactly one utility per property per element. Tailwind doesn't guarantee which of two conflicting utilities wins (e.g. `text-[var(--text)]` and `text-[var(--text-dim)]` both on one link). Build the active and inactive class strings separately.
- **2.4 testing lesson:** Tailwind v4 palette colors (`amber-300`, etc.) compute to `oklch(...)`, so an assertion like "color is not amber rgb" passes vacuously. **Assert the positive token value** (e.g. `rgb(124, 138, 255)`), and add a DOM class-name scan for banned palette names.
- **2.1–2.4 E2E runs never reached green.** The client appears stuck in hydration against the dev server on :3000 (see `deferred-work.md`). Add tasks with `getByPlaceholder('Add a task...')`, because the QuickAddBar input lacks its `aria-label` (a deferred regression). If a native dialog could appear, collect dialogs into an array and assert it's empty. Webkit-only quick-add timeouts are pre-existing flakiness.
- **Git:** the history is only `b2d374d Initial commit` and `29cf79a chore: update package-lock.json`. The working tree has uncommitted Epic 1–2 changes, including `app/globals.css`. Build on the working-tree state and don't revert anything.

### Latest tech notes

The versions are pinned per `project-context.md`, and no upgrades are needed:
- **Tailwind v4:** the `sr-only` utility exists. Numeric spacing like `w-55`/`w-63` is generated from `--spacing` (0.25rem) without config. `bg-[var(--x)]/90` uses `color-mix`. `aria-[current=page]:` variants exist, but explicit per-state constants are clearer and match the codebase.
- **Next.js 15:** `usePathname()` from `next/navigation` is unchanged. `Link` forwards `aria-current` to the `<a>`.
- **lucide-react 0.468:** `size`/`strokeWidth` props are unchanged. Icons render with `stroke="currentColor"`, so color comes from the parent link.

### Project Structure Notes

- **Modified:** `components/layout/Sidebar.tsx`, `components/layout/BottomNav.tsx`, `app/layout.tsx` (header brand chip only).
- **New:** `tests/e2e/nav-restyle.spec.ts`.
- Use `@/*` imports only, strict TS with no `any`, and named exports. Keep `"use client"` at the top of both nav components.

### Testing Requirements

New spec: `tests/e2e/nav-restyle.spec.ts`. Test IDs use the `3.1-E2E-*` prefix.

Helper for the ad hoc class scan (use it in 001 and 003):

```ts
async function bannedClasses(root: Locator) {
  return root.evaluate((el) =>
    [el, ...Array.from(el.querySelectorAll('*'))]
      .map((n) => n.getAttribute('class') ?? '')
      .filter((c) => /\b(?:[a-z:]*)(?:amber|emerald|zinc)-|white\/|#[0-9a-fA-F]{3,6}\b/.test(c))
  );
}
```

| Test ID | Priority | Scenario |
|---|---|---|
| `3.1-E2E-001` | P1 | Desktop (default 1280×720), `/`: in `aside`, `bannedClasses` returns `[]`, and `aside [style]` has count 0 (the progress bar is gone). The brand chip's computed `background-color` is `rgb(25, 27, 34)` (`--surface-2`). |
| `3.1-E2E-002` | P1 | Sidebar active state: on `/`, "My tasks" has `aria-current="page"` and computed `background-color` `rgba(124, 138, 255, 0.14)`. "Completed" has no `aria-current` and computes `rgba(0, 0, 0, 0)`. The active link's `color` is `rgb(231, 232, 236)` (`--text`), **not** accent. Click "Completed" → the states swap and the URL is `/completed`. |
| `3.1-E2E-003` | P1 | Mobile: `page.setViewportSize({ width: 390, height: 844 })`, `/`. `getByTestId('bottom-nav')` is visible and `aside` is hidden. `bannedClasses` on bottom-nav returns `[]`. |
| `3.1-E2E-004` | P1 | BottomNav active by color only (mobile viewport): the "Tasks" link (`getByRole('link', { name: 'Tasks' })` in bottom-nav) has `aria-current="page"` and `color` `rgb(124, 138, 255)`. "Completed" has `color` `rgb(139, 141, 152)`. Both links compute the **same** `background-color`, the same `font-size`, and the same icon `svg` `boundingBox()` width and height, and both svgs have the same `stroke-width` attribute. Navigate to `/completed` → the colors swap. |
| `3.1-E2E-005` | P2 | Touch targets: on the mobile viewport, each bottom-nav link's `boundingBox().height` is ≥ 44. |
| regression | P1 | Re-run `complete-from-backlog.spec.ts` (the sidebar count test at lines 146-160). |

Run it on chromium first. Report cross-browser results honestly. If the environment blocks the run, apply the Task 4 guidance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] for the story and ACs. See also [#UX Design Requirements]: UX-DR8 (Sidebar/BottomNav restyle), UX-DR1/2/3 (tokens, 8pt, type scale), and UX-DR15 (breakpoint, owned by 3.2).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns (lines 449-453)]: desktop uses the accent-soft active item; mobile is icon-only with an accent-color active tab. See also [#Color System]: the accent is never decorative. And [#Typography System]: mono uppercase labels, 0.08em.
- [Source: _bmad-output/project-context.md §2, §5]: `"use client"`, no inline styling, `@/*` imports.
- [Source: components/layout/Sidebar.tsx:1-73], [components/layout/BottomNav.tsx:1-27], [app/layout.tsx:36-62], [app/globals.css:15-37 legacy @theme, 51-63 :root Graphite Violet, 78 unlayered reset, 94 .pb-safe], [hooks/useTasks.ts:74-110 useStats]
- [Source: components/ui/Button.tsx:10-13]: focus-ring class reference.
- [Source: _bmad-output/implementation-artifacts/2-3-restyle-buttons-and-enforce-hierarchy.md]: the open reset decision and the radius gotcha. [2-4-restyle-empty-states.md]: gap/min-h layout under the reset, and positive-token assertions. [deferred-work.md]: the E2E blocker and the QuickAddBar aria-label.
- [Source: tests/e2e/complete-from-backlog.spec.ts:146-160]: the sidebar regression hook.

### Questions for Zeyad (non-blocking; defaults chosen above)

1. **Leftover amber outside the nav:** the body's amber radial gradient, `selection:bg-amber-400`, `.field-control`'s amber focus ring, and the header's emerald "synced" dot all remain. No story in Epic 3 owns them. Should they go into 3.4 (the accessibility pass touches focus anyway), or into a small cleanup story?
2. **Sidebar content:** the progress bar is removed (inline style plus decorative accent), but the "Today" card, "Small wins add up…", and "Prioritize what matters" are kept and restyled. Would you rather cut the card and footer copy for an even quieter sidebar?
3. **Global reset (2.3 decision):** this story works around the unlayered reset again (a 3rd time). Resolving it before 3.2, which is all about layout and spacing, would remove a lot of workaround classes. Do you want to decide it now?

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5)

### Debug Log References

- Red phase (`npx playwright test tests/e2e/nav-restyle.spec.ts --project=chromium`): 5/5 failed as expected. The old amber classes were present, `aria-current` was null, and the `bottom-nav`/`brand-mark` hooks were missing.
- Green phase, same command: **5/5 passed** (3.7s).
- `npx tsc --noEmit`: exit 0. `npm run lint`: "No ESLint warnings or errors".
- Greps from Tasks 1–2: no matches in `Sidebar.tsx` or `BottomNav.tsx`. The `globals.css` token comment names only Card/Badge, so it's already accurate and I didn't edit it.
- Regression `complete-from-backlog.spec.ts --project=chromium`: 3/3 failed at the quick-add step, before any sidebar assertion ran. The spec's helper uses `getByLabel('Add a task')` (a known deferred regression). A throwaway copy using `getByPlaceholder` also timed out at `locator.click`, which matches the 2.3/2.4 hydration hang. The copy was deleted. Per standing guidance, I didn't debug further. Logged in `deferred-work.md`.
- The IDE suggested canonical classes such as `bg-bg`/`text-accent`. I ignored them on purpose: those map to the **legacy amber** `@theme` tokens.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **Sidebar:** the file is rewritten around `*_CLASS` constants and uses only Graphite Violet `var(--…)` tokens.
  - The brand chip is `--surface-2` + `--border` + a `--text` icon, with no glow.
  - The "Workspace"/"Today" labels are mono uppercase with 0.08em tracking.
  - The active nav item is `--accent-soft` bg + `--text`. Inactive is `--text-dim` with a `--surface-2` hover. The icon stroke is fixed, counts are mono `tabular-nums` inside the link, and links have `aria-current="page"`, an accent focus ring, and `nav aria-label="Primary"`.
  - The progress bar and its inline `style` are removed. The Today card (count, "completed", copy) and the footer stay, restyled.
  - Layout uses only gap, width, and min-height (`w-55` content column, grid nav rows, a `flex-1` spacer), because the unlayered reset still zeroes padding and margin.
  - The `lg:` breakpoint and `w-[252px]` are unchanged (Story 3.2's job).
- **BottomNav:** icon-only, with labels in `sr-only` so accessible names stay "Tasks"/"Completed". The only active signal is `--accent` text color: size, stroke, and background are the same in both states. The count is mono and has no pill. Tabs are 48px tall (`min-h-12`) with an accent focus ring. The shell is `--bg`/90 + `--border`. `pb-safe`, `z-40`, and `lg:hidden` are kept.
  - One minor change: the inner row is now `w-full` instead of `mx-auto max-w-sm`. `mx-auto` was already zeroed by the reset, so tabs were left-packed inside 384px. Now they span the bar.
- **layout.tsx:** only the mobile header brand chip and wordmark were changed. Everything else is untouched.
- Added a `data-testid="brand-mark"` hook on the Sidebar chip for 3.1-E2E-001.
- **Verified:** `nav-restyle.spec.ts` 5/5 on chromium, plus tsc and lint. **Not verified:** firefox/webkit weren't run, and the `complete-from-backlog.spec.ts` sidebar-count regression is blocked by the pre-existing hydration/quick-add issue. That's why the Task 4 run subtask is left unchecked on purpose.

### File List

- `components/layout/Sidebar.tsx` (modified)
- `components/layout/BottomNav.tsx` (modified)
- `app/layout.tsx` (modified: mobile header brand chip only)
- `tests/e2e/nav-restyle.spec.ts` (new)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-09-23: Story created via create-story workflow.
- 2026-09-23: Restyled Sidebar, BottomNav, and the mobile header brand chip to Graphite Violet tokens (no amber/emerald, no inline styles, `aria-current`, focus rings). Added `nav-restyle.spec.ts` (5/5 green on chromium). The sidebar-count regression is blocked by the pre-existing hydration issue (deferred).
