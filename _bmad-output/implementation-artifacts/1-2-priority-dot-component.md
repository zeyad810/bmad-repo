# Story 1.2: Priority Dot Component

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a task's priority as a single quiet colored dot,
so that I can read priority at a glance without emoji or colored badges.

## Acceptance Criteria

1. **Given** a task with priority critical/high/medium/low, **when** its `PriorityDot` renders, **then** it shows a single 7px solid dot in the mapped token color, **and** no emoji or colored pill/background is rendered. [Source: epics.md#Story 1.2]
2. **Given** the Task type has 4 priority levels but the design system defines 3 dot tones, **when** mapping priority to color, **then** `critical` and `high` both render `--pri-high`, `medium` renders `--pri-med`, `low` renders `--pri-low`, **and** this mapping lives in one place as the source of truth. [Source: epics.md#Story 1.2]
3. **Given** a color-blind or low-vision user, **when** viewing a `PriorityDot`, **then** priority is still inferable from the task's list position, not from dot color alone. [Source: epics.md#Story 1.2]

## Tasks / Subtasks

- [x] Task 1: Create the `PriorityDot` component (AC: #1, #2)
  - [x] Create new file `components/ui/PriorityDot.tsx` (sibling to the existing `Badge.tsx` primitive — same folder, since this is a generic UI primitive, not task-domain logic). No `"use client"` directive needed: purely presentational, no state/hooks/handlers.
  - [x] Define and export a single priority→dot-tone map as the AC #2 "one place" source of truth, e.g.:
    ```ts
    export const PRIORITY_DOT_CLASS: Record<TaskPriority, string> = {
      critical: "bg-[var(--pri-high)]",
      high: "bg-[var(--pri-high)]",
      medium: "bg-[var(--pri-med)]",
      low: "bg-[var(--pri-low)]",
    };
    ```
    `critical` and `high` intentionally resolve to the identical class/color — this is correct per AC #2, not a bug to "fix" into distinct tones.
  - [x] Render one element: a 7px × 7px solid circle using the mapped class, e.g. `<span aria-hidden="true" className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${PRIORITY_DOT_CLASS[priority]}`} />`. No text, no emoji, no pill/badge background — a bare dot only.
  - [x] Accept `{ priority: TaskPriority; className?: string }` as props; merge any passed `className` onto the root span so consumers (Story 1.3's `TaskRow`) can control layout spacing (e.g. margin) without this component hardcoding it.

- [x] Task 2: Verify the component satisfies token/inline-style/color-utility rules (AC: #1, #2)
  - [x] Confirm the dot's color is driven only by `var(--pri-high)` / `var(--pri-med)` / `var(--pri-low)` (defined in `app/globals.css`'s `:root` block by Story 1.1) via Tailwind's arbitrary-value syntax (`bg-[var(--pri-...)]`) — **not** inline `style={{ background: ... }}` and **not** a hardcoded Tailwind palette color (e.g. `bg-amber-400`), per `project-context.md`'s no-inline-styling rule and the epics' "no hardcoded Tailwind color utility" constraint.
  - [x] The `h-[7px] w-[7px]` arbitrary sizing is an intentional, spec-mandated exception to the 8pt spacing scale (7px is not a grid step) — the 8pt-grid rule governs spacing utilities (margin/padding/gap), not this fixed icon-like dimension explicitly required by AC #1. Do not round it to 8px.

- [x] Task 3: Manual verification (all ACs) — no wiring into `TaskCard`/`TaskRow` yet (that's Story 1.3)
  - [x] Temporarily render all four variants (`<PriorityDot priority="critical" />`, `high`, `medium`, `low`) somewhere reachable in the dev server (e.g. a throwaway line inside `app/page.tsx`), run `npm run dev`, and visually confirm: one 7px solid circular dot per priority, correct color per the map, no emoji/text/pill background, `critical`/`high` visually identical.
  - [x] **Fully revert** the temporary render before finishing — `app/page.tsx` is out of scope for this story (its Single Stream layout arrives in Story 1.6) and must show no diff when this story is done.
  - [x] Run `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.

## Dev Notes

### Component placement and scope boundary

This story builds `PriorityDot` **in isolation only** — it is not wired into any existing component. `TaskCard.tsx` (which currently renders priority via emoji + a colored left border) is replaced by `TaskRow` in **Story 1.3**, which is where `PriorityDot` actually gets consumed. Do not modify `components/tasks/TaskCard.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskForm.tsx`, or `app/page.tsx` in this story (beyond the temporary, fully-reverted manual-verification render described in Task 3).

### `PriorityBadge` / `Badge.tsx` — leave untouched

`components/ui/Badge.tsx` already exports an emoji-based `PriorityBadge` (🔴/🟠/🟡/🟢 + colored pill) plus `getPriorityColor`/`getPriorityDot` helpers keyed off the **old** `--color-critical/high/medium/low` tokens. It is currently unused anywhere in the app (confirmed via search — no component imports `PriorityBadge`). The UX spec calls for eventually "retiring" it in favor of `PriorityDot`, but no story's acceptance criteria assign that removal — do not delete or modify `Badge.tsx` in this story; it's dead code that a later story may clean up.

### AC #3 is satisfied architecturally, not by new code in this component

"Priority inferable from list position, not color alone" is enforced by how `TaskRow` (Story 1.3) positions rows in the priority-sorted list, not by anything `PriorityDot` itself needs to render (e.g. do not add a text label or pattern inside the dot to "help" — that would violate AC #1's "single dot, no pill" requirement). This story's job is simply to not be the *only* signal by design — keep it a pure color/shape indicator and let the consuming list carry the positional signal.

### Token source (already available — added by Story 1.1, currently uncommitted)

`app/globals.css`'s `:root` block already defines `--pri-high: #7c8aff`, `--pri-med: #6d70a8`, `--pri-low: #4c4f5c` (added by Story 1.1, alongside `--bg`/`--surface`/`--text`/etc.). Per `git status`, this change is present in the working tree but not yet committed — build on top of it as-is; do not redefine or duplicate these tokens. [Source: app/globals.css:51-63]

### Project Structure Notes

- Files to touch: `components/ui/PriorityDot.tsx` (new).
- Files explicitly out of scope: `components/ui/Badge.tsx`, `components/tasks/TaskCard.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskForm.tsx`, `app/page.tsx` (no persisted changes), `app/globals.css`, `app/layout.tsx` (already correctly set up by Story 1.1 — no new tokens needed here).
- No `components/ui/index.ts` barrel file exists in this project — components are imported by direct path (e.g. `import { Badge } from "@/components/ui/Badge"`); follow the same pattern for `PriorityDot`.
- Conforms to `project-context.md`: `@/*` path alias for any imports, strict TypeScript (`TaskPriority` from `@/types`, never `any`).

### Testing Requirements

- No unit or component test framework exists in this project yet (`vitest` is not installed; tracked separately as risk `EPIC1-R03` in the Epic 1 test design — out of scope to stand up here). The test design doc (`_bmad-output/test-artifacts/test-design-epic-1.md`) maps this story to `1.2-UNIT-001` (priority→dot-tone mapping, single source of truth) and a `1.2-COMPONENT-*` visual-rendering check, but both are explicitly blocked on an undecided component-testing approach (Playwright CT vs. scoped E2E) — that decision is a project-level dependency, not something to resolve in this story.
- Verification for this story is manual only (Task 3 above): temporary visual render + revert, `tsc`, and `lint`. This mirrors how Story 1.1 handled testing before any framework existed.
- The AC #3 color-blind/low-vision check is tracked as a manual/exploratory QA item in the test design doc, not an automated check — no action needed in this story beyond the architectural note above.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Priority Dot Component] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#PriorityDot (replaces emoji-based PriorityBadge)] — 7px solid dot, single-signal purpose, states, accessibility rule
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — `--pri-high`/`--pri-med`/`--pri-low` hex values and semantic intent
- [Source: _bmad-output/project-context.md#Critical Don'ts / Anti-Patterns] — no inline styling; use Tailwind utilities/tokens from `globals.css`
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md] — `1.2-UNIT-001`/`1.2-COMPONENT-*` test IDs, `EPIC1-R03`/`EPIC1-R07` risk links, component-testing-approach dependency
- [Source: app/globals.css:51-63] — existing `:root` token block (`--pri-high`/`--pri-med`/`--pri-low`) from Story 1.1
- [Source: components/ui/Badge.tsx] — existing (unused) `PriorityBadge`/emoji approach being superseded, confirmed out of scope for this story
- [Source: components/tasks/TaskCard.tsx] — current emoji + colored-border priority treatment this component will eventually replace (in Story 1.3, not here)
- [Source: types/index.ts] — `TaskPriority` type definition (`"critical" | "high" | "medium" | "low"`)
- [Source: _bmad-output/implementation-artifacts/1-1-establish-graphite-violet-design-tokens-and-type-scale.md] — previous story: confirms tokens are additive/available and which components remain untouched until their own restyle stories

## Change Log

- 2026-09-21: Story created via create-story workflow.
- 2026-09-21: Implemented Story 1.2 — added `PriorityDot` component with the single-source-of-truth priority→tone map. Verified via `tsc`, `eslint`, and a temporary dev-server render (fully reverted). Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors
- `npm run lint` → no ESLint warnings or errors
- `npm run dev` (background) + `curl http://localhost:3000/` with a temporary render of all four `PriorityDot` variants in `app/page.tsx` → confirmed rendered HTML: four bare `<span aria-hidden="true">` elements, `h-[7px] w-[7px] shrink-0 rounded-full`, no text/emoji/pill background; `critical`/`high` both emit `bg-[var(--pri-high)]` (identical), `medium` emits `bg-[var(--pri-med)]`, `low` emits `bg-[var(--pri-low)]`
- Fetched compiled CSS (`.next/static/css/app/layout.css` via dev server) and confirmed `--pri-high: #7c8aff`, `--pri-med: #6d70a8`, `--pri-low: #4c4f5c` are present and correctly valued
- Temporary verification render in `app/page.tsx` fully reverted; `git status`/`git diff --stat` confirm zero diff on that file after revert
- Dev server process stopped after verification (confirmed port 3000 released)

### Completion Notes List

- Created `components/ui/PriorityDot.tsx` exporting `PRIORITY_DOT_CLASS` (the AC #2 single source of truth for priority→dot-tone mapping) and the `PriorityDot` component — a bare 7×7px circular `<span>`, colored via Tailwind arbitrary-value classes referencing the Story 1.1 `--pri-high`/`--pri-med`/`--pri-low` CSS custom properties (no inline `style`, no hardcoded Tailwind palette color).
- `critical` and `high` both map to `--pri-high` per AC #2 — confirmed intentional, not consolidated further.
- Component accepts an optional `className` prop so future consumers (Story 1.3's `TaskRow`) can control layout spacing without this component hardcoding margins.
- `aria-hidden="true"` applied since the dot is a purely decorative signal — AC #3 (priority inferable without color) is satisfied by how the consuming list positions rows, not by anything inside this component; no label/pattern was added here per the story's explicit Dev Notes guidance.
- No files outside this story's scope were modified: `Badge.tsx`/`PriorityBadge`, `TaskCard.tsx`, `DraggableTaskList.tsx`, `TaskForm.tsx`, `app/page.tsx`, `app/globals.css`, and `app/layout.tsx` are all untouched (verified via `git status`).
- No automated tests were added — no unit/component test framework exists in this project yet (confirmed via `package.json`; tracked as `EPIC1-R03` in the Epic 1 test design), consistent with the story's Testing Requirements section. Verification was manual: temporary render + HTML/CSS inspection via curl, `tsc`, and `lint`.

### File List

- `components/ui/PriorityDot.tsx` (new)
