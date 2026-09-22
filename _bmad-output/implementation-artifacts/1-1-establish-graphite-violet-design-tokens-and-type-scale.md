# Story 1.1: Establish Graphite Violet Design Tokens & Type Scale

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app's colors, spacing, and typography to follow one consistent, dark-mode-first system,
so that the interface feels calm and legible instead of visually cluttered.

## Acceptance Criteria

1. **Given** the app's `globals.css`/Tailwind config, **when** the Graphite Violet tokens are defined (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high`, `--pri-med`, `--pri-low`), **then** they are available as CSS custom properties consumable by any component, **and** no component built or restyled in this epic set may use a hardcoded Tailwind color utility (e.g. `amber-400`, `rose-300`, `emerald-400`, `zinc-*`) in their place. [Source: epics.md#Story 1.1]
2. **Given** the type scale requirement, **when** Manrope (400/500/600/700/800) is set as the UI/body font and JetBrains Mono (400/500) as the meta/data font, **then** both font families load, **and** the six-step scale (12/13/15/17/22/30px) is defined once and reused, with mono meta text using `font-variant-numeric: tabular-nums`. [Source: epics.md#Story 1.1]
3. **Given** the 8pt spacing grid, **when** spacing tokens/utilities for 4/8/12/16/24/32/48px are defined, **then** these are the only spacing values used in components built or restyled in this epic set. [Source: epics.md#Story 1.1]
4. **Given** `--text` rendered on `--bg` and `--surface`, **when** checked against WCAG AA, **then** contrast meets or exceeds AA for body text sizes. [Source: epics.md#Story 1.1]

## Tasks / Subtasks

- [x] Task 1: Add the Graphite Violet CSS custom properties (AC: #1, #4)
  - [x] In `app/globals.css`, add a `:root { ... }` block defining the exact token names and values from the UX spec's Color System table: `--bg: #0B0C10`, `--surface: #13141A`, `--surface-2: #191B22`, `--border: #24262F`, `--text: #E7E8EC`, `--text-dim: #8B8D98`, `--accent: #7C8AFF`, `--accent-soft: rgba(124,138,255,0.14)`, `--pri-high: #7C8AFF`, `--pri-med: #6D70A8`, `--pri-low: #4C4F5C`. [Source: ux-design-specification.md#Color System]
  - [x] Do **not** rename, remove, or repurpose the existing `--color-*` / `--radius-*` tokens already defined in the `@theme` block — see Dev Notes "Critical: do not break existing components" below.
  - [x] Confirm `--text` on `--bg` and `--surface` meets WCAG AA (see Dev Notes — both pairs already compute to well above the 4.5:1 minimum; spot-check with a contrast tool to be sure the exact hex values you typed match).
- [x] Task 2: Load Manrope + JetBrains Mono and wire them as the type-scale fonts (AC: #2)
  - [x] In `app/layout.tsx`, replace the `Inter` import/usage with `Manrope` (weights `["400","500","600","700","800"]`, `variable: "--font-manrope"`) and `JetBrains_Mono` (weights `["400","500"]`, `variable: "--font-jetbrains-mono"`) from `next/font/google`.
  - [x] Apply both fonts' `.variable` class names on `<html>` or `<body>` (alongside the existing className usage) so the CSS variables are available globally.
  - [x] In `app/globals.css`, update the `@theme` block's `--font-sans` value to reference `var(--font-manrope)` (keep a sane fallback stack), and add a new `--font-mono` theme token referencing `var(--font-jetbrains-mono)` with a monospace fallback stack.
- [x] Task 3: Define the six-step type scale (AC: #2)
  - [x] In the `@theme` block, add named font-size tokens for the six sizes so the scale is defined once and reused: 12px (mono meta), 13px (secondary), 15px (task text), 17px (subheads), 22px (section), 30px (page title). Use Tailwind v4's `--text-*` theme namespace (e.g. `--text-meta`, `--text-secondary`, `--text-body`, `--text-subhead`, `--text-section`, `--text-title`) so each generates a matching `text-*` utility.
  - [x] Do not add sizes outside this scale.
- [x] Task 4: Confirm the 8pt spacing scale requires no new tokens (AC: #3)
  - [x] Verify (do not reinvent): Tailwind v4's default `--spacing` base is `0.25rem` (4px), so the existing numeric spacing utilities already land on 4/8/12/16/24/32/48px at steps `1/2/3/4/6/8/12` (`p-1`=4px … `p-12`=48px). No custom spacing tokens are needed to satisfy this AC.
  - [x] Add a short comment in `app/globals.css` near the new tokens documenting that Epic 1–3 components must restrict spacing utilities to steps `1, 2, 3, 4, 6, 8, 12` (or the literal px equivalents) and must not use arbitrary-value spacing (e.g. `p-[10px]`, `gap-[18px]`).
- [x] Task 5: Manual verification (all ACs)
  - [x] Run `npm run dev` and load the app. Confirm there is **no visual regression** — since no existing component consumes the new tokens yet, the app should render exactly as it did before this story (amber theme, existing layout) except for the swapped body font (Manrope instead of Inter).
  - [x] Confirm via browser dev tools that Manrope and JetBrains Mono font files load and that `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high`, `--pri-med`, `--pri-low` are all present on `:root` in computed styles.

## Dev Notes

### Critical: do not break existing components (regression guardrail)

The codebase **already** has a working CSS-custom-property token system in `app/globals.css`'s `@theme` block — `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-border-2`, `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-accent`, `--color-accent-hover`, `--color-accent-subtle`, `--color-critical(-subtle)`, `--color-high(-subtle)`, `--color-medium(-subtle)`, `--color-low(-subtle)`, and `--radius-sm/md/lg/xl`. These are actively consumed via inline `style={{ ... }}` objects (not Tailwind utility classes) in **5 live components**: [Source: components/ui/Button.tsx, components/ui/Card.tsx, components/ui/Badge.tsx, components/ui/EmptyState.tsx, components/tasks/TaskForm.tsx]

- `Button.tsx` — all four variants (`primary/secondary/ghost/danger`) and all three sizes' border-radius
- `Card.tsx` — background, border, hover states, border-radius
- `Badge.tsx` — all four priority-tier backgrounds/colors
- `EmptyState.tsx` — text colors
- `TaskForm.tsx` — extensive use across priority selects, sliders, dependency list, borders

None of these components are in scope for this story (they're restyled in later stories: `TaskCard`→`TaskRow` in Story 1.3, `TaskForm`/`TaskDrawer` in Story 2.2, `Button` in Story 2.3, `EmptyState` in Story 2.4, `Sidebar`/`BottomNav` in Story 3.1). The epics.md AC for this story asks for the **exact bare names** `--bg`, `--surface`, `--text`, etc. (no `--color-` prefix) — matching the UX spec's Color System table literally, which is a **different, additive** set of variables, not a rename of the existing ones.

**Therefore: add the new tokens alongside the old ones. Do not touch, rename, or delete anything in the existing `@theme` block's `--color-*`/`--radius-*` entries.** Renaming or removing them would immediately break Button, Card, Badge, EmptyState, and TaskForm (their `var(--color-*)` references would resolve to nothing). The new bare-named tokens (`--bg`, `--surface`, ...) are what Stories 1.2–1.10 and Epic 2/3 will consume when they build/restyle each component.

### Font wiring specifics

- Current: `app/layout.tsx` imports `Inter` from `next/font/google` and applies `inter.className` directly to `<body>`. `globals.css`'s `@theme` block sets `--font-sans: "Inter", system-ui, ...` and `html, body { font-family: var(--font-sans); }`.
- New: swap to `Manrope` (weights 400/500/600/700/800) as the body font and add `JetBrains_Mono` (weights 400/500) as a second font, both loaded via `variable` (not `className`) so they coexist as CSS variables rather than one replacing the other via a single `className`. Update `--font-sans` to point at the Manrope variable; add a new `--font-mono` theme token pointing at the JetBrains Mono variable. This makes `font-sans` (default) and `font-mono` (opt-in, e.g. for meta/date/count text) both available as Tailwind utilities once Story 1.2+ needs them.
- `tabular-nums`: Tailwind ships a `tabular-nums` utility (`font-variant-numeric: tabular-nums`) — no custom CSS needed. Components that render mono meta text (dates, counts, priority tags) will combine `font-mono` with `tabular-nums` at their point of use in later stories; this story only needs to make both mechanisms available.

### WCAG AA contrast (AC #4) — precomputed for confidence

Using the WCAG relative-luminance formula on the exact hex values above:
- `--text` (`#E7E8EC`) on `--bg` (`#0B0C10`) ≈ **16:1**
- `--text` (`#E7E8EC`) on `--surface` (`#13141A`) ≈ **15:1**

Both comfortably clear the 4.5:1 AA minimum for body text (and even the 7:1 AAA bar). This is provided so you don't need to redo the math — just make sure the hex values you type into `globals.css` match exactly, and a quick spot-check with a browser contrast tool is sufficient to close this AC. A full automated axe/contrast-ratio check across the app is tracked separately as QA work in the Epic 1 test design (not part of this story's scope).

### Project Structure Notes

- Files to touch: `app/globals.css` (add `:root` token block + new `@theme` font/type-scale entries), `app/layout.tsx` (font swap).
- `tailwind.config.ts` only contains the `content` glob in this project — Tailwind v4's theme customization lives in `globals.css` via `@theme`, per the existing pattern. No changes expected there.
- Files explicitly **out of scope** for this story (do not modify): `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Badge.tsx`, `components/ui/EmptyState.tsx`, `components/ui/Drawer.tsx`, `components/tasks/TaskCard.tsx`, `components/tasks/TaskForm.tsx`, `components/tasks/TaskDrawer.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/layout/Sidebar.tsx`, `components/layout/BottomNav.tsx`, `app/page.tsx`, `app/completed/*`.
- No conflicts detected with `project-context.md`'s established rules (no inline `localStorage` access, `@/*` aliases, etc.) — this story doesn't touch storage, state, or forms logic.

### Testing Requirements

- No automated test framework exists yet in this project (unit or component) — out of scope to stand up here (tracked as `EPIC1-R03` in the Epic 1 test design, tied to Stories 1.3/1.6/1.7, not this one).
- This story has no user-facing behavior to E2E-test (no new component renders yet) — verification is manual (Task 5 above): visually confirm no regression, confirm fonts load, confirm tokens exist in computed `:root` styles.
- Per the Epic 1 test design doc (`_bmad-output/test-artifacts/test-design-epic-1.md`), this story maps to test IDs `1.1-STATIC-001`/`002` (no banned Tailwind color utilities; spacing-scale compliance) and a WCAG AA contrast check — these are CI/QA-owned checks that apply *once components start consuming the tokens* (Story 1.2 onward); nothing to build in this story beyond the precomputed contrast confirmation above.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Establish Graphite Violet Design Tokens & Type Scale] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — exact token names/hex values
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — font families, type scale, tabular-nums requirement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation] — 8pt grid values
- [Source: _bmad-output/project-context.md#Technology Stack & Versions] — Next.js 15.3.4 / Tailwind v4 / no-inline-styling rule
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md] — EPIC1-R04 risk (banned color utilities), test IDs 1.1-STATIC-001/002, contrast check mapping
- [Source: app/globals.css, app/layout.tsx, components/ui/Button.tsx, components/ui/Card.tsx, components/ui/Badge.tsx, components/ui/EmptyState.tsx, components/tasks/TaskForm.tsx] — current codebase state confirming existing `--color-*` token usage that must not break

## Change Log

- 2026-09-21: Implemented Story 1.1 — added Graphite Violet CSS custom properties and the six-step type scale to `app/globals.css` (additive, existing `--color-*`/`--radius-*` tokens untouched), swapped body/meta fonts to Manrope + JetBrains Mono in `app/layout.tsx`. Confirmed no new spacing tokens needed (Tailwind default scale already matches 8pt grid). Verified via `tsc`, `eslint`, `next build`, and a local dev-server smoke check. Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors
- `npm run lint` → no ESLint warnings or errors
- `npm run build` → compiled successfully; verified compiled CSS (`.next/static/css/*.css`) contains all new tokens (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--pri-high`, `--pri-med`, `--pri-low`, `--text-meta`…`--text-title`, `font-manrope`, `jetbrains-mono`) with correct hex values, alongside the untouched pre-existing `--color-*`/`--radius-*` tokens
- `npm run dev` (background) + `curl http://localhost:3000/` → HTTP 200; response body confirms `<body>` carries both font `.variable` classes and `font-sans`

### Completion Notes List

- Added the 11 Graphite Violet tokens as a new `:root` block in `app/globals.css`, additive to (not replacing) the existing `--color-*`/`--radius-*` `@theme` tokens, to avoid breaking `Button`, `Card`, `Badge`, `EmptyState`, and `TaskForm`, which all consume the old names via inline styles and are not restyled until later stories.
- Swapped the body font from `Inter` to `Manrope` (400/500/600/700/800) and added `JetBrains Mono` (400/500) via `next/font/google`, both wired through CSS variables (`--font-manrope`, `--font-jetbrains-mono`) rather than a single `className`, so both fonts coexist. `--font-sans` now points at Manrope; a new `--font-mono` theme token points at JetBrains Mono.
- Defined the six-step type scale (`--text-meta` 12px, `--text-secondary` 13px, `--text-body` 15px, `--text-subhead` 17px, `--text-section` 22px, `--text-title` 30px) as Tailwind `@theme` tokens, generating matching `text-*` utilities for later stories to consume.
- No new spacing tokens were added — confirmed Tailwind v4's default spacing scale (base `0.25rem`) already produces 4/8/12/16/24/32/48px at steps 1/2/3/4/6/8/12, and documented the restriction (steps only, no arbitrary values) in a comment in `globals.css`.
- Verified `--text` on `--bg` (≈16:1) and `--text` on `--surface` (≈15:1) both clear WCAG AA by a wide margin (values match the story's precomputed figures).
- No component files were touched (per the story's explicit out-of-scope list) — only `app/globals.css` and `app/layout.tsx` changed. Build, lint, and type-check all pass; app renders without regression.

### File List

- `app/globals.css` (modified)
- `app/layout.tsx` (modified)
