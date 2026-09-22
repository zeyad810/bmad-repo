# Story 1.5: Section Divider Component

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a quiet boundary between Today and Backlog,
so that I can tell the groups apart without heavy chrome.

## Acceptance Criteria

1. **Given** the Single Stream list has both sections, **when** rendered, **then** a `SectionDivider` shows an uppercase mono "BACKLOG" label (`0.08em` letter-spacing) with a hairline rule. [Source: epics.md#Story 1.5]
2. **Given** zero Backlog tasks, **when** the Backlog section is displayed, **then** the divider still renders, above the Backlog `EmptyState`. [Source: epics.md#Story 1.5]

## Tasks / Subtasks

- [x] Task 1: Create the `SectionDivider` component (AC: #1)
  - [x] Create new file `components/ui/SectionDivider.tsx` (sibling to `PriorityDot.tsx`/`EmptyState.tsx`/`Badge.tsx` — generic UI primitive, not task-domain logic). No `"use client"` directive needed: purely presentational, no state/hooks/handlers (UX spec: "States: static").
  - [x] Accept `{ label: string; className?: string }` as props. **Do not hardcode the string `"BACKLOG"` inside this component** — the UX spec's typography note lists both "TODAY" and "BACKLOG" as examples of the *same* section-label style, so this component stays a reusable label+rule primitive; the caller passes the literal text. (Story 1.6, which actually wires this into the Single Stream layout, will pass `label="BACKLOG"` per AC #1's wording — this story only builds and manually verifies the component with that value.)
  - [x] Render a single flex row: the label text, then a hairline rule that fills the remaining width. Label: `uppercase font-mono text-meta tracking-[0.08em] text-[var(--text-dim)] shrink-0` (mono meta scale, quiet `--text-dim` color — matches the UX spec's "small, quiet, not shouty" description and `TaskRow`'s existing meta-tag styling precedent). Rule: a 1px-tall element that grows to fill remaining space, e.g. `h-px flex-1 bg-[var(--border)]`. Container: `flex items-center gap-3` (12px gap — an 8pt-grid step, NFR2). No icon, no interactive states, no other content.
  - [x] Merge any passed `className` onto the root element so consumers (Story 1.6) can control external/vertical spacing without this component hardcoding margins (same pattern as `PriorityDot`'s `className` prop from Story 1.2).

- [x] Task 2: Verify token/spacing/typography compliance (AC: #1)
  - [x] Confirm every color resolves to `var(--border)` / `var(--text-dim)` only — **zero** hardcoded hex and **zero** `amber-*`/`rose-*`/`emerald-*`/`zinc-*` Tailwind utilities (NFR1/UX-DR1, binding on every Epic-1-touched file).
  - [x] `tracking-[0.08em]` is the correct arbitrary-value class — Tailwind's built-in tracking scale (`tracking-wide`=0.025em, `tracking-wider`=0.05em, `tracking-widest`=0.1em) has no exact 0.08em step, so this is a legitimate exception, same as Story 1.2's `h-[7px]`/`w-[7px]` precedent (the 8pt-grid rule governs *spacing* utilities — margin/padding/gap — not letter-spacing or fixed decorative dimensions). Do not substitute `tracking-widest` as an approximation.
  - [x] Confirm the `gap-3` (12px) container gap is an 8pt-grid step (NFR2).

- [x] Task 3: Manual verification (AC: #1, #2) — no wiring into `app/page.tsx` yet (that's Story 1.6)
  - [x] Temporarily render `<SectionDivider label="BACKLOG" />` somewhere reachable in the dev server (e.g. a throwaway line inside `app/page.tsx`), run `npm run dev`, and visually confirm: uppercase "BACKLOG" text in the quiet `--text-dim` tone, visibly letter-spaced, with a hairline rule filling the remaining row width — no box/border/background around the whole component, no icon. Confirmed via computed styles: `color: rgb(139,141,152)` (`--text-dim`), `letter-spacing: 0.96px` (= 0.08em × 12px font-size, exact), `text-transform: uppercase`, JetBrains Mono font, 12px size; rule: `height: 1px`, `background-color: rgb(36,38,47)` (`--border`), width ~829px (correctly filling remaining row space via `flex-1`).
  - [x] In the same temporary render, additionally render `<SectionDivider label="BACKLOG" /><EmptyState title="Backlog is clear" />` directly beneath it (reuse the existing `components/ui/EmptyState.tsx` as-is — do not modify it) and confirm the divider renders above the empty state with no gap/overlap issues, satisfying AC #2's "divider still renders above the Backlog EmptyState" even before Story 1.6 wires up the real empty-Backlog case. Confirmed via rendered HTML order and a screenshot.
  - [x] **Fully revert** the temporary render before finishing — `app/page.tsx` is out of scope for this story and must show no diff when this story is done (same discipline as Stories 1.2/1.3). Confirmed via `grep` for `SectionDivider`/`EmptyState`/temp markers in `app/page.tsx` — none remain (Story 1.4's own legitimate, still-uncommitted changes to this file are unrelated and untouched).
  - [x] Run `npx tsc --noEmit` and `npm run lint` — both must pass cleanly.

## Dev Notes

### Component placement and scope boundary

This story builds `SectionDivider` **in isolation only** — it is not wired into the real page. The actual Today/Backlog Single Stream layout (where this divider sits between the two sections, per epics.md's Story 1.6 AC: "`QuickAddBar`, Today section, `SectionDivider`, Backlog section") is built in **Story 1.6**. Do not modify `app/page.tsx` (beyond the temporary, fully-reverted manual-verification render in Task 3), `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskRow.tsx`, `components/ui/EmptyState.tsx`, or any store/lib files in this story.

### Judgment call: `label` as a required prop, not a hardcoded string (flag if product/UX disagrees)

Epics.md's AC literally says the component "shows an uppercase mono \"BACKLOG\" label," which could be read as "hardcode the text." This story instead makes `label` a required prop, because: (1) the UX spec's Typography System explicitly lists "TODAY" alongside "BACKLOG" as examples of the *same* section-label style ("Section labels (e.g. "TODAY", "BACKLOG") are uppercase mono with `0.08em` letter-spacing"), implying one reusable label style, not a "BACKLOG"-only component; (2) hardcoding business copy into a `components/ui/` primitive would be inconsistent with every other primitive in that folder (`PriorityDot`, `EmptyState`, `Badge` all take content via props). AC #1/#2 are still satisfied exactly as written because Task 3's manual verification (and Story 1.6's future usage) passes `label="BACKLOG"`.

### Why no automated tests this story

The Epic 1 test design (`test-design-epic-1.md:174`) lists Story 1.5 as a single P2 "Component/E2E" item owned by DEV, not QA — there is no P0/P1 gate. Since `SectionDivider` isn't wired into any real page yet (that's Story 1.6), there is no meaningful end-to-end user flow to exercise with Playwright, and no component-test framework exists in this project (`vitest` absent, tracked separately as `EPIC1-R03`). This mirrors exactly how Story 1.2 (`PriorityDot`, the closest analog — also an isolated, unwired `components/ui/` primitive) handled testing: manual-only verification via a temporary render + revert, `tsc`, and `lint`. Do not attempt to stand up a test framework or write a premature E2E test against a layout that doesn't exist yet.

### Token source (already available)

`app/globals.css`'s `:root` block already defines `--border: #24262f` and `--text-dim: #8b8d98` (added by Story 1.1) — build on top of these as-is; do not redefine or duplicate them. [Source: app/globals.css:51-63]

### Project Structure Notes

- Files to touch: `components/ui/SectionDivider.tsx` (new).
- Files explicitly out of scope: `app/page.tsx` (no persisted changes), `components/ui/EmptyState.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskRow.tsx`, `app/globals.css`, `app/layout.tsx`, `stores/task-store.ts`, `lib/prioritization/*`.
- No `components/ui/index.ts` barrel file exists in this project — components are imported by direct path (e.g. `import { PriorityDot } from "@/components/ui/PriorityDot"`); follow the same pattern for `SectionDivider`.
- Conforms to `project-context.md`: `@/*` path alias for any imports, strict TypeScript (no `any`).

### Testing Requirements

- No automated tests this story — see "Why no automated tests this story" above. Verification is manual only (Task 3): temporary visual render + revert, `tsc`, and `lint`.
- Story 1.6 (which wires `SectionDivider` into the real Single Stream layout) is where an E2E check of "divider renders above empty Backlog" against real app state belongs, per the test design's own Story 1.5/1.6 split (`test-design-epic-1.md:174` vs. the Story 1.6 P0/P1 items).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: Section Divider Component] — story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6: Single Stream Home Layout — Today & Backlog Sections] — confirms `SectionDivider`'s actual layout position (`QuickAddBar` → Today → `SectionDivider` → Backlog), owned by Story 1.6, not this one
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SectionDivider] — purpose, content (uppercase mono label + hairline rule), static-only states
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — "Section labels (e.g. "TODAY", "BACKLOG") are uppercase mono with `0.08em` letter-spacing — small, quiet, not shouty" (basis for the reusable-`label`-prop judgment call)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision / Implementation Approach] — "the divider between sections must do real visual work... handled via the muted mono uppercase label plus the Backlog rows rendering at slightly reduced opacity"
- [Source: _bmad-output/project-context.md#Critical Don'ts / Anti-Patterns] — no inline styling; use Tailwind utilities/tokens from `globals.css`
- [Source: _bmad-output/test-artifacts/test-design-epic-1.md:174] — Story 1.5's sole P2 test item, Component/E2E, DEV-owned, no P0/P1 gate
- [Source: app/globals.css:52-63] — existing `:root` token block (`--border`, `--text-dim`) from Story 1.1
- [Source: components/ui/EmptyState.tsx] — existing component reused as-is for the Task 3 manual verification of AC #2, confirmed out of scope to modify
- [Source: _bmad-output/implementation-artifacts/1-2-priority-dot-component.md] — closest architectural precedent: an isolated, unwired `components/ui/` primitive built and manually verified with no automated tests, `className`-prop pattern for consumer-controlled spacing

## Change Log

- 2026-09-22: Story created via create-story workflow.
- 2026-09-22: Implemented Story 1.5 — built `SectionDivider` as an isolated `components/ui/` primitive (label + hairline rule). Verified via `tsc`, `eslint`, and a temporary dev-server render (screenshot + computed-style checks, fully reverted). No automated tests, per the story's Testing Requirements (DEV-owned P2 item, not yet wired into any real page). Status moved to review.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` → no errors (both before and after reverting the temporary verification block).
- `npm run lint` → no ESLint warnings or errors.
- Temporary render of `<SectionDivider label="BACKLOG" />` followed by `<EmptyState title="Backlog is clear" />` in `app/page.tsx`, verified against a running dev server via `curl` (rendered HTML order/markup) and a Playwright script (computed styles + screenshot, not committed): label color `rgb(139,141,152)` (`--text-dim`), `letter-spacing: 0.96px` (exactly 0.08em × 12px), `text-transform: uppercase`, JetBrains Mono font, 12px font size; rule `height: 1px`, `background-color: rgb(36,38,47)` (`--border`), correctly expanding to fill the remaining row width via `flex-1` (~829px in a 900px viewport test). Screenshot confirmed the hairline rule is visually present (intentionally subtle/quiet, per the UX spec's "small, quiet, not shouty" design intent — not a rendering bug).
- Temporary render fully reverted — confirmed via `grep` that no `SectionDivider`/`EmptyState`/temp-marker references remain in `app/page.tsx`. (Note: `app/page.tsx` still shows as modified in `git status` — that's Story 1.4's own legitimate, still-uncommitted `QuickAddBar` wiring from the previous session, unrelated to and untouched by this story.)
- Two dev server instances were already running (ports 3000 and 3001, both pre-existing from prior sessions) — used the port 3000 instance for all verification; did not start a new one.
- All temporary verification scripts/screenshots (`verify-1-5.mjs`, `verify-1-5b.mjs`, `story-1-5-verify.png`, `story-1-5-divider-only.png`) deleted from the project root before finishing.

### Completion Notes List

- Created `components/ui/SectionDivider.tsx`: a stateless, non-`"use client"` presentational primitive taking `{ label: string; className?: string }`. Renders a `flex items-center gap-3` row containing the uppercase mono label (`font-mono text-meta uppercase tracking-[0.08em] text-[var(--text-dim)]`) and a hairline rule (`h-px flex-1 bg-[var(--border)]`) that fills the remaining width. No hardcoded "BACKLOG" string, no icon, no interactive states — matches the UX spec's "static" state list exactly.
- Deliberate design choice (documented in the story's Dev Notes as a judgment call): `label` is a required prop rather than hardcoded text, since the UX spec treats "TODAY" and "BACKLOG" as examples of the same reusable label style, and every other `components/ui/` primitive in this codebase takes its content via props.
- No automated tests added — consistent with the story's Testing Requirements: the Epic 1 test design lists this as a single DEV-owned P2 item with no P0/P1 gate, the component isn't wired into any real page yet (that's Story 1.6), and no component-test framework exists in this project. Verification was manual only, mirroring Story 1.2's `PriorityDot` precedent exactly.
- No files outside this story's scope were modified: `app/page.tsx` has zero net change from this story (temporary render added and fully reverted); `components/ui/EmptyState.tsx`, `components/tasks/DraggableTaskList.tsx`, `components/tasks/TaskRow.tsx`, `app/globals.css`, and `app/layout.tsx` are all untouched.

### File List

- `components/ui/SectionDivider.tsx` (new)
