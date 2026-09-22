---
runScope: 'epic-level'
runKey: 'epic-1'
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-09-21'
inputDocuments:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/project-context.md'
  - '_bmad/tea/config.yaml'
  - 'package.json'
  - 'tests/e2e/tasks.spec.ts'
  - 'tests/e2e/api-tasks.spec.ts'
  - 'tests/README.md'
  - 'stores/task-store.ts'
  - 'lib/prioritization/score.ts'
  - 'lib/prioritization/sort.ts'
  - 'components/tasks/DraggableTaskList.tsx'
  - 'app/page.tsx'
  - 'components/layout/HydrationProvider.tsx'
  - 'types/index.ts'
  - 'app/globals.css'
  - 'resources/knowledge/risk-governance.md'
  - 'resources/knowledge/probability-impact.md'
  - 'resources/knowledge/test-levels-framework.md'
  - 'resources/knowledge/test-priorities-matrix.md'
  - 'resources/knowledge/nfr-criteria.md'
  - 'resources/knowledge/playwright-cli.md'
---

# Step 1: Detect Mode & Prerequisites — Output

## Mode Decision

**Mode:** Epic-Level Test Design

**Rationale:** No PRD or ADR/architecture decision records exist in the project (only skill/template files under `.claude/skills/`, `.agent/skills/`, `.agents/skills/`). A full epic/story breakdown with acceptance criteria exists at `_bmad-output/planning-artifacts/epics.md`, satisfying Epic-Level Mode's prerequisites (epic/story requirements with acceptance criteria; architecture context available via `_bmad-output/project-context.md` in place of a formal Architecture.md).

## Prerequisite Check

- ✅ Epic and story requirements with acceptance criteria: `_bmad-output/planning-artifacts/epics.md`
- ✅ Architecture context (substitute): `_bmad-output/project-context.md`
- ✅ UX Design Specification: `_bmad-output/planning-artifacts/ux-design-specification.md`
- ❌ No formal PRD.md / Architecture.md / ADR — not required for Epic-Level Mode

## Run Identity

- `run_scope`: `epic-level`
- `epic_num`: `1`
- `run_key`: `epic-1`
- Epic selected by user: **Epic 1 — Calm Visual Foundation & Core Prioritization Loop** (10 stories: 1.1–1.10)

## Checkpoint Status

No pre-existing checkpoint found at `_bmad-output/test-artifacts/test-design-progress-epic-1.md`. Fresh run.

---

# Step 2: Load Context & Knowledge Base — Output

## Configuration Loaded

- `tea_use_playwright_utils`: true (package `@seontechnologies/playwright-utils@^4.4.0` is installed — mandate applies to test *generation*, out of scope for this design-only step)
- `tea_use_pactjs_utils`: true, but **not relevant** — no Pact artifacts, no backend service, no consumer/provider contracts in this app (pure client-side, localStorage-backed)
- `tea_pact_mcp`: mcp (not relevant, same reason)
- `tea_browser_automation`: auto
- `test_stack_type`: auto → **detected: `frontend`** (Next.js 15 / React 19 / TypeScript, no backend indicators, no mobile indicators)
- `test_artifacts`: `_bmad-output/test-artifacts`

## Project Artifacts Loaded (Epic 1 scope)

- Epic 1 stories 1.1–1.10 with full acceptance criteria — `_bmad-output/planning-artifacts/epics.md`
- UX Design Specification — `_bmad-output/planning-artifacts/ux-design-specification.md`
- Technical constraints (substitute for Architecture.md) — `_bmad-output/project-context.md`
- No PRD.md, no prior system-level test-design output exists

## Existing Test Coverage Analysis

- **E2E**: `tests/e2e/tasks.spec.ts` (2 shallow smoke tests: page title, body visibility) and `tests/e2e/api-tasks.spec.ts` (1 smoke test hitting `/`). **No coverage** of drag-and-drop, priority scoring, task CRUD, hydration, or any Epic 1 behavior.
- **Unit**: No unit test framework configured (no vitest/jest in `package.json`). `lib/prioritization/score.ts` and `lib/prioritization/sort.ts` — pure, easily-unit-testable business logic — currently have **zero automated coverage** at any level.
- **Fixtures**: `tests/support/merged-fixtures.ts`, `auth-fixture.ts`, `factories/task-factory.ts` exist but are minimal/generic; no task-list-specific page objects or drag helpers yet.
- **Coverage gap flagged for Step 3**: this is a significant testability risk — Epic 1's core logic (`calculatePriorityScore`, `sortTasks`, drag/reorder, promote/demote) has no safety net today.

## Source Inspection (confirms Epic 1 is greenfield redesign work)

- `app/page.tsx` is the **current pre-redesign** layout (separate quick-capture panel + stats grid + flat "Your queue" list) — exactly what FR15/Story 1.6 replaces with the Single Stream Today/Backlog layout. No Today/Backlog split, no `QuickAddBar`, `SectionDivider`, `TaskRow`, or `PriorityDot` components exist yet — only the legacy `TaskCard`.
- `app/globals.css` uses `@theme` with ad hoc Tailwind colors (amber/emerald) — no Graphite Violet tokens (`--bg`, `--surface`, `--accent`, `--pri-*`) defined yet.
- `stores/task-store.ts`: `reorderTasks` only remaps `position`; it has **no status-mutation path** for cross-section promote/demote (Story 1.7 requires new logic here). `setStatus` exists and sets `completedAt`, usable for Story 1.8.
- `lib/prioritization/score.ts` / `sort.ts`: pure functions, ideal unit-test targets; not currently unit-tested.
- `components/tasks/DraggableTaskList.tsx`: existing `@dnd-kit` wiring (pointer + keyboard sensors already present) that Story 1.3/1.7/3.3 will extend — keyboard sensor already wired, which de-risks Story 3.3 somewhat.
- `types/index.ts`: `TaskStatus` already includes `"next"` and `"backlog"`, confirming the Today ("next"/"in-progress") vs Backlog ("backlog") split FR15 describes maps cleanly onto the existing type.

## Browser Exploration

Skipped — `playwright-cli` is not installed globally in this environment (only `@playwright/test` v1.63.0 as a project devDependency), and no dev server was confirmed running. Per the fallback rule, relying on code/doc analysis (above) instead of live snapshot exploration. Existing acceptance criteria in `epics.md` are detailed enough (exact component states, ARIA labels, timing windows) to design tests without live exploration.

## Knowledge Fragments Loaded (Epic-Level, closed-set selection)

Required: `risk-governance.md`, `probability-impact.md`, `test-levels-framework.md`, `test-priorities-matrix.md`
NFR branch (NFR6 drag latency, NFR9 hydration reliability are performance/reliability-flavored): `nfr-criteria.md`
Playwright CLI branch (`tea_browser_automation: auto`): `playwright-cli.md`
Not loaded (gate conditions not met): Pact/contract-testing fragments (no contract-testing signal), MCP-pattern fragments (none exist in index)

## Confirmed With User

Proceeding without further confirmation — all required epic/story inputs are present and sufficiently detailed (explicit Given/When/Then acceptance criteria per story) to move directly into risk and testability analysis.

---

# Step 3: Testability & Risk Assessment — Output

*(Epic-Level Mode: the system-level architecture testability review in Section 1 of this step is skipped per the workflow; risk assessment and NFR planning below cover all applicable sections for this scope.)*

## Risk Assessment Matrix

Every row is grounded in an explicit Epic 1 acceptance criterion, FR/NFR statement, or a direct source-code finding from Step 2 — no speculative risks added.

| ID | Category | Risk | Prob | Impact | Score | Action | Grounding | Mitigation | Owner | Timeline |
|----|----------|------|:---:|:---:|:---:|--------|-----------|------------|-------|----------|
| EPIC1-R01 | TECH/BUS | Drag-across-divider promote/demote can desync position and status: no combined store action exists today (`reorderTasks` only remaps `position`; `setStatus` is separate), risking a task landing in the wrong section or with a stale status after a drag-drop that should recalc scores | 3 | 3 | **9** | BLOCK | Story 1.7 ACs ("dragged... dropped... status becomes 'next'/'backlog'... recalcScores() runs") vs. `stores/task-store.ts` inspection showing no combined reorder+status-transition action exists yet | Design a single atomic store action (e.g. `moveTask(id, newStatus, orderedIds)`) before implementation; add integration-level test asserting status AND position update together in one drop, plus a same-section drop leaving status untouched | dev-team | Before Story 1.7 implementation starts |
| EPIC1-R02 | BUS | Section-membership ambiguity: Story 1.6 puts a task in Today by status (`next`/`in-progress`) **or** by date (due today/overdue) even when its stored status is still `backlog`; dragging such a task (visually in Today, status=backlog) across the divider has undefined behavior | 3 | 2 | **6** | MITIGATE | Story 1.6 AC ("Today section: tasks with status next/in-progress, **or** due today/overdue") combined with Story 1.7 AC (status-based promote/demote only) | Clarify with product/UX whether date-driven Today membership should force a status write on load, or remain a display-only rule with drag disabled/no-op for such rows; add a dedicated test scenario for an overdue backlog-status task | dev-team + UX | Before Story 1.6/1.7 dev complete |
| EPIC1-R03 | TECH | No unit-test framework exists (`package.json` has no vitest/jest); `lib/prioritization/score.ts` and `sort.ts` — the pure functions behind "the core loop the whole redesign exists for" — have zero automated coverage while `DraggableTaskList`/`TaskRow` are being rewritten around them | 3 | 2 | **6** | MITIGATE | Epic 1 description ("delivering the drag-to-prioritize... core loop") + Step 2 code inspection confirming no unit-test runner is configured | Stand up a lightweight unit-test runner (vitest, fastest fit for Next.js/TS) and add unit specs for `calculatePriorityScore` and `sortTasks` before/alongside the redesign, so regressions surface before E2E | dev-team | Before Story 1.6/1.7 merge |
| EPIC1-R04 | TECH | Incomplete design-token migration: current code has extensive hardcoded Tailwind color utilities and inline hex values (e.g. `text-amber-400`, `bg-emerald-400/10`, `color: "#fb7185"` in `app/page.tsx`) that Story 1.1's AC explicitly forbids in any component "built or restyled in this epic set" | 3 | 2 | **6** | MITIGATE | Story 1.1 AC + direct grep evidence in `app/page.tsx` (`PRIORITY_OPTIONS` colors, amber/emerald/rose/sky utility classes) | Add a CI/lint check (grep-based or ESLint rule) that fails on banned color-utility patterns in files touched by Epic 1; run it against every redesigned component before merge | dev-team | Ongoing through Epic 1 |
| EPIC1-R05 | PERF | NFR6 ("no perceptible lag... immediate") defines no measurable threshold — an unquantified performance NFR that, per NFR criteria, defaults to CONCERNS until a number is agreed | 2 | 2 | **4** | MONITOR | NFR6 text has no ms/frame budget; `nfr-criteria.md` default rule: undefined thresholds → CONCERNS | Clarify an explicit input-to-visual-update budget (e.g. <100ms, aligned with RAIL guidance) with the team; until then, validate via manual/perceptual QA rather than claiming automated PASS | dev-team | Before NFR sign-off |
| EPIC1-R06 | BUS | Quick-add "silent no-op" behavior (FR16/NFR7: no error, no toast on empty submit) is easy to regress if a generic form-validation pattern (e.g. reused from `react-hook-form`+zod in Epic 2) leaks into `QuickAddBar` | 2 | 2 | **4** | MONITOR | Story 1.4 AC ("no task is created, no error is shown") + NFR7 ("no toast/banner/modal feedback... reserved for genuinely unexpected states") | Add an explicit E2E test asserting no error/toast DOM node appears after an empty-submit attempt | dev-team | With Story 1.4 |
| EPIC1-R07 | DATA | Priority→dot-color mapping (critical & high → `--pri-high`, medium → `--pri-med`, low → `--pri-low`) could be implemented inline in multiple components instead of the single source of truth the AC requires, causing future drift | 2 | 2 | **4** | MONITOR | Story 1.2 AC ("this mapping lives in one place as the source of truth") | Implement mapping as one exported constant/function (e.g. `getPriorityDotTone()`); unit-test all 4 priority inputs against it | dev-team | With Story 1.2 |
| EPIC1-R08 | OPS | Hydration skeleton could flash or cause a layout jump: `hydrate()` runs inside a `useEffect` (post-mount), so a one-frame gap between server-rendered markup and client hydration is structurally possible | 2 | 2 | **4** | MONITOR | Story 1.10 AC ("no layout jump or flash of unstyled content") + `HydrationProvider.tsx` inspection (hydrate fires in `useEffect`, after first paint) | Reserve layout space for skeleton/content up front (avoid CLS); add a Playwright test with throttled CPU asserting no spinner element ever mounts and no layout-shift beyond a defined tolerance | dev-team | With Story 1.10 |

**No SEC risks identified** in Epic 1 scope — the epic touches no authentication, no network calls, and no user-generated HTML rendering (task titles render through React's default escaping); this is a scope boundary observation, not a coverage gap.

### Risk Summary

- **BLOCK (score 9):** 1 — EPIC1-R01 must be resolved (atomic store action design) before Story 1.7 implementation; this is the single highest-priority item in the epic.
- **MITIGATE (score 6):** 3 — EPIC1-R02, R03, R04, all requiring action before their respective stories are considered done.
- **MONITOR (score 4):** 4 — EPIC1-R05 through R08, watched via targeted tests but not gating.

## NFR Planning Assessment (Epic 1 scope)

| NFR Category | In Scope? | Threshold Status | Planned Evidence | Notes |
|---|---|---|---|---|
| **Performance** | Yes (NFR6: drag latency) | **UNKNOWN** — no numeric budget defined | Manual/perceptual QA now; automated frame-timing assertion once a threshold is agreed (see EPIC1-R05) | Converted to risk EPIC1-R05 per NFR default-to-CONCERNS rule |
| **Reliability** | Yes (NFR9: hydration) | Behavior fully specified (skeleton before content, no spinner, no jump) even without a numeric threshold | Playwright test asserting skeleton→content transition order and absence of any spinner element; CLS check | Testable without a threshold — behavior-based assertions suffice; layout-jump risk tracked as EPIC1-R08 |
| **Maintainability** | Yes (NFR1–NFR3: token/spacing/type-scale consistency) | Fully specified — explicit token lists, spacing scale, type scale | CI/lint grep check for banned Tailwind color utilities and off-scale spacing values (tracked as EPIC1-R04); this is a CI-tool check, not a Playwright test | Not automatable as a runtime test — belongs in static analysis per `nfr-criteria.md` guidance |
| **Accessibility (partial)** | Yes, narrowly — Story 1.1 AC only (`--text` on `--bg`/`--surface` contrast for body text) | Threshold defined: WCAG AA | Automated contrast check (axe-playwright or a contrast-ratio script) against the defined token pairs | Full WCAG AA pass (focus outlines, semantics, keyboard operability) is explicitly Epic 3 scope (NFR5) — out of scope here beyond this one contrast check |
| **Security** | No | N/A | N/A | No auth, network, or untrusted-HTML rendering surface in this epic |

## Clarifications / Assumptions (outside the risk register — no explicit epic statement to ground a risk)

- Epic 1 has no acceptance criterion describing how a **blocked task** (FR9, dependency-blocked, "already delivered") should render in the new `TaskRow`/`PriorityDot` design. This isn't contradicted by any AC, so it's not scored as a risk, but it should be confirmed with UX before Story 1.3 is considered complete — otherwise the existing blocked-state treatment may be silently dropped in the redesign.

## Summary of Highest Risks

The one **BLOCK-level** risk (EPIC1-R01) is an architectural gap, not a test gap: the store layer has no atomic way to change status and position together, which the drag-across-divider feature (Story 1.7 — one of the epic's headline behaviors) requires. This should be resolved at the design/implementation level before test scaffolding for Story 1.7 is written, since tests written against the wrong state-transition shape would need to be redone. The three **MITIGATE-level** risks (R02–R04) are addressable through combined product clarification (R02) and CI tooling (R03 unit-test runner, R04 lint check) rather than exotic test scenarios. All four **MONITOR-level** risks (R05–R08) are straightforward to cover with targeted assertions once flagged, and are carried into the coverage plan in Step 4.

---

# Step 4: Coverage Plan & Execution Strategy — Output

## Coverage Matrix

Test ID format: `1.{story}-{LEVEL}-{seq}`. Two cross-cutting IDs (`1.3-UNIT-001/002`) anchor to Story 1.3 since `DraggableTaskList`/`TaskRow` are the primary consumers of the prioritization functions, though the functions themselves are shared across Stories 1.6/1.7.

| Test ID | Story | Scenario | Level | Priority | Risk Link |
|---|---|---|---|---|---|
| 1.3-UNIT-001 | 1.3 | `calculatePriorityScore`: importance+urgency+due-date pressure+priority weight+dependency-block penalty across representative combinations (overdue, due-today, blocked, unblocked, each priority tier) | Unit | P1 | EPIC1-R03 |
| 1.3-UNIT-002 | 1.3 | `sortTasks`: each `SortMode` (recommended/manual/priority/due-date/estimated-time/importance/urgency) plus pinned-first tie-break in every mode | Unit | P1 | EPIC1-R03 |
| 1.1-STATIC-001 | 1.1 | CI/lint check: no banned hardcoded Tailwind color utilities (`amber-*`, `rose-*`, `emerald-*`, `zinc-*`, raw hex) in any Epic-1-touched component | Static analysis (CI) | P1 | EPIC1-R04 |
| 1.1-STATIC-002 | 1.1 | CI/lint check: only 4/8/12/16/24/32/48px spacing values used in Epic-1-touched components | Static analysis (CI) | P2 | EPIC1-R04 |
| 1.1-E2E-001 | 1.1 | Design tokens (`--bg`,`--surface`,`--surface-2`,`--border`,`--text`,`--text-dim`,`--accent`,`--accent-soft`,`--pri-high/med/low`) resolve via `getComputedStyle` on `:root` | E2E | P1 | — |
| 1.1-E2E-002 | 1.1 | Manrope loads for UI/body text; JetBrains Mono + `tabular-nums` loads for meta/data text | E2E | P2 | — |
| 1.1-E2E-003 | 1.1 | `--text` on `--bg` and on `--surface` meets WCAG AA contrast for body text sizes (axe or contrast-ratio script) | E2E (a11y) | P1 | — |
| 1.2-UNIT-001 | 1.2 | Priority→dot-tone mapping: `critical`→`--pri-high`, `high`→`--pri-high`, `medium`→`--pri-med`, `low`→`--pri-low`, via the single source-of-truth function | Unit | P1 | EPIC1-R07 |
| 1.2-COMPONENT-001 | 1.2 | `PriorityDot` renders one 7px solid dot per tone; no emoji, no pill/background | Component | P2 | — |
| 1.2-E2E-001 | 1.2 | Priority remains inferable from list position without relying on dot color alone (color-blind/low-vision check) | Manual/exploratory | P3 | — |
| 1.3-COMPONENT-001 | 1.3 | `TaskRow` renders drag handle + `PriorityDot` + title + optional mono meta tag + checkbox; no colored border/ring/emoji | Component | P1 | — |
| 1.3-E2E-001 | 1.3 | Hover → background becomes `--surface-2` with no layout shift | E2E | P2 | — |
| 1.3-E2E-002 | 1.3 | Dragging state → subtle elevation/shadow, no colored ring | E2E | P2 | — |
| 1.3-COMPONENT-002 | 1.3 | Completed task → title faded (`--text-dim`) + strikethrough | Component | P1 | — |
| 1.3-COMPONENT-003 | 1.3 | Overdue task → only meta tag reflects overdue state, row background/border unchanged | Component | P2 | — |
| 1.3-COMPONENT-004 | 1.3 | Backlog-section `TaskRow` renders at `.88` opacity relative to a Today row | Component | P2 | — |
| 1.3-COMPONENT-005 | 1.3 | Drag handle has `aria-label="Reorder task"`; checkbox has `aria-label="Mark complete"`/`"Restore task"` | Component/a11y | P1 | — |
| 1.3-E2E-003 | 1.3 | Existing `@dnd-kit` drag-and-drop reordering keeps working after `TaskRow` replaces `TaskCard` (regression) | E2E | **P0** | EPIC1-R03 |
| 1.4-E2E-001 | 1.4 | Text + Enter/tap creates task with title + default priority, inserted at position matching its priority score | E2E | **P0** | — |
| 1.4-E2E-002 | 1.4 | Empty text + Enter/Add → no task created, no error shown, silent no-op | E2E | P1 | EPIC1-R06 |
| 1.4-E2E-003 | 1.4 | After add, input clears and stays focused for next entry | E2E | P2 | — |
| 1.4-E2E-004 | 1.4 | Focused bar shows `--accent` border; unfocused shows default | E2E | P2 | — |
| 1.4-COMPONENT-001 | 1.4 | `aria-label="Add a task"`; Enter submits; Escape clears text without losing focus; mono `↵ add` hint shown | Component/a11y | P1 | — |
| 1.5-COMPONENT-001 | 1.5 | `SectionDivider` shows uppercase mono "BACKLOG" label (`0.08em` letter-spacing) + hairline rule | Component | P2 | — |
| 1.5-E2E-001 | 1.5 | Divider still renders above Backlog `EmptyState` when zero Backlog tasks | E2E | P2 | — |
| 1.6-E2E-001 | 1.6 | Home page renders top-to-bottom: `QuickAddBar` → Today → `SectionDivider` → Backlog, replacing the old capture/stats/queue layout | E2E | **P0** | — |
| 1.6-E2E-002 | 1.6 | Today tasks follow "recommended" sort (pinned first, then `priorityScore` desc) | E2E | P1 | — |
| 1.6-E2E-003 | 1.6 | Backlog tasks use the same `TaskRow`/ordering logic at `.88` opacity | E2E | P2 | — |
| 1.6-E2E-004 | 1.6 | Zero Today tasks → Today `EmptyState` shown instead of an empty gap | E2E | P2 | — |
| 1.6-E2E-005 | 1.6 | Task added via `QuickAddBar` defaults to status `"next"` (Today), not `"backlog"` (functional change from current baseline) | E2E | P1 | — |
| 1.7-E2E-001 | 1.7 | Drag Backlog task above divider into Today → status becomes `"next"`, `recalcScores()` runs | E2E | **P0** | EPIC1-R01 |
| 1.7-E2E-002 | 1.7 | Drag Today task below divider into Backlog → status becomes `"backlog"`, `recalcScores()` runs | E2E | **P0** | EPIC1-R01 |
| 1.7-E2E-003 | 1.7 | Drag start/end within the same section → only position changes, no status change | E2E | P1 | EPIC1-R01 |
| 1.7-E2E-004 | 1.7 | Promote/demote drop settles with no confirmation dialog or toast | E2E | P2 | — |
| 1.7-E2E-005 | 1.7 | Drag a backlog-status-but-overdue task (Today by date rule) across the divider — behavior pending clarification | E2E | P1 | EPIC1-R02 — **blocked on clarification, see risk register** |
| 1.8-E2E-001 | 1.8 | Backlog checkbox tap → status `"completed"`, `completedAt` set, task moves to Completed view | E2E | **P0** | — |
| 1.8-E2E-002 | 1.8 | Same checkbox affordance as Today works in Backlog with no extra promotion step | E2E | P1 | — |
| 1.8-E2E-003 | 1.8 | Backlog count in Sidebar/BottomNav decreases after completing from Backlog | E2E | P2 | — |
| 1.9-E2E-001 | 1.9 | New task entry uses non-celebratory transition; no toast confirms it | E2E | P2 | — |
| 1.9-E2E-002 | 1.9 | Drag-end settle animation plays; no modal/banner confirms it | E2E | P2 | — |
| 1.9-E2E-003 | 1.9 | Completion fades + strikes through; no confetti/popup/success banner | E2E | P2 | — |
| 1.9-E2E-004 | 1.9 | Add/reprioritize/complete update optimistically with no spinner | E2E | P2 | — |
| 1.10-E2E-001 | 1.10 | Before `hydrate()` completes, brief skeleton/blank state (Graphite Violet) shown, never a spinner | E2E | P1 | EPIC1-R08 |
| 1.10-E2E-002 | 1.10 | After `hydrated` becomes true, skeleton replaced with no layout jump / flash of unstyled content | E2E | P1 | EPIC1-R08 |
| 1.10-E2E-003 | 1.10 | Near-instant hydration shows no perceptible skeleton flash (small delay tolerance acceptable) | Manual/exploratory | P3 | — |

**Duplicate-coverage check:** `calculatePriorityScore`/`sortTasks` are tested once at Unit level (1.3-UNIT-001/002); Stories 1.6/1.7/1.8 E2E scenarios verify *integration* of these functions into the UI (ordering as displayed, status transitions), not the algorithms themselves — no overlap per `test-levels-framework.md`'s duplicate-coverage guard.

## NFR Coverage and Evidence Plan

| NFR | Validation Scenario(s) | Level/Tool | Evidence Artifact for later `nfr-assess` |
|---|---|---|---|
| NFR6 (Performance — drag latency) | Manual/perceptual QA now (threshold UNKNOWN, see EPIC1-R05); revisit with an automated frame-timing assertion once a budget is agreed | Manual now → Playwright trace timing later | QA sign-off note now; trace/timing report once threshold defined |
| NFR9 (Reliability — hydration) | 1.10-E2E-001, 1.10-E2E-002 | Playwright (throttled CPU/network) | Playwright HTML report + screenshots of skeleton→content transition |
| NFR1–NFR3 (Maintainability — token/spacing/type consistency) | 1.1-STATIC-001, 1.1-STATIC-002 | CI static analysis (grep/ESLint rule), not Playwright | CI job log / lint report |
| Accessibility, partial (Story 1.1 contrast only) | 1.1-E2E-003 | axe-playwright or contrast-ratio script | axe report / computed contrast ratios |
| NFR7/NFR8 (quiet feedback, minimal motion) | 1.9-E2E-001 – 004 | Playwright (DOM absence assertions for toast/modal/confetti elements) | Playwright HTML report |

Full NFR PASS/CONCERNS/FAIL determination is deferred to `nfr-assess` once implementation evidence exists; this plan only identifies validation scenarios and evidence sources per the workflow boundary.

## Execution Strategy

- **PR (target <15 min):** All P0 scenarios + Unit tests (1.3-UNIT-001/002) + static-analysis checks (1.1-STATIC-001/002). This is a pure client-side app with fast Playwright specs and no backend/API layer, so P0+Unit should comfortably fit the PR budget.
- **Nightly:** Full P0–P2 E2E regression (all Story 1.1–1.10 scenarios above), including the axe/contrast checks and the quiet-motion negative assertions (1.9-*).
- **Weekly / Manual:** P3 manual/exploratory scenarios (1.2-E2E-001, 1.10-E2E-003) and the NFR6 perceptual drag-latency QA pass, since no automated performance threshold exists yet. No k6/load-testing suite applies — this app has no backend to load-test.

## Resource Estimates

- **P0 (6 scenarios):** ~18–28 hours — includes the Story 1.7 store-action redesign work implied by EPIC1-R01, which is architecture work, not just test authoring
- **P1 (17 scenarios, incl. 2 unit + 1 CI static check):** ~24–36 hours — includes standing up the unit-test runner (EPIC1-R03 mitigation)
- **P2 (19 scenarios):** ~14–22 hours — mostly component/E2E visual-state assertions
- **P3 (2 scenarios):** ~2–4 hours — manual/exploratory only
- **Total:** ~58–90 hours (~1.5–2.5 weeks for a dev+QA pair), excluding the underlying Story 1.7 architecture fix's implementation time beyond test authoring

## Quality Gates

- P0 pass rate = 100% before Epic 1 is considered releasable
- P1 pass rate ≥ 95%
- **EPIC1-R01 (score 9, BLOCK) must be resolved** — atomic status+position store action designed and implemented — before Story 1.7's P0 scenarios (1.7-E2E-001/002) can be executed meaningfully
- **EPIC1-R02 clarification** (Today/Backlog membership ambiguity) resolved before 1.7-E2E-005 is executed; until then it remains a documented, un-executable scenario
- Coverage target ≥ 80% of the 44 scenarios above executing green in CI (Unit + E2E combined)
- NFR validation evidence identified for each in-scope NFR category (Performance, Reliability, Maintainability, partial Accessibility) — see NFR Coverage and Evidence Plan above
- Full NFR PASS/CONCERNS/FAIL status deferred to `nfr-assess` once implementation evidence exists

---

# Step 5: Generate Outputs & Validate — Output

## Execution Mode

Resolved to sequential single-worker generation (epic-level mode is single-document by default; no agent-team/subagent orchestration needed for one output file).

## Output Generated

- `_bmad-output/test-artifacts/test-design-epic-1.md` — using `test-design-template.md`, populated with the Executive Summary, Not in Scope, Risk Assessment (8 risks, 4 high-priority), NFR Planning, Entry/Exit Criteria, Test Coverage Plan (44 scenarios across P0–P3), Execution Strategy, Resource Estimates, Quality Gate Criteria, Mitigation Plans for all 4 high-priority risks, Assumptions and Dependencies, Interworking & Regression, and Appendix.

## Validation Against Checklist

Reviewed against `checklist.md` (Epic-Level Mode sections): risk IDs unique and scored correctly, priority sections contain only Criteria (no execution timing language), Execution Strategy uses the simple PR/Nightly/Weekly structure without re-listing individual tests, resource estimates are interval ranges throughout (no false precision), NFR planning documents unknown thresholds without inventing values, and every material risk has at least one coverage-matrix row at a suitable test level. No orphaned CLI sessions (browser exploration was skipped, not started). No temp artifacts created outside `_bmad-output/test-artifacts/`.

One deviation from the general best-practice guideline "P0 <10% of scenarios" (P0 is 6/44 ≈ 13.6%): each P0 scenario was checked individually against the strict P0 bar (blocks core + no safe workaround) and justified; not relaxed further to hit the guideline number.

## Completion Report

- **Mode used:** Epic-Level Test Design (Epic 1 — Calm Visual Foundation & Core Prioritization Loop)
- **Output file:** `_bmad-output/test-artifacts/test-design-epic-1.md`
- **Progress checkpoint:** `_bmad-output/test-artifacts/test-design-progress-epic-1.md` (this file)
- **Key risks:** EPIC1-R01 (score 9, BLOCK — no atomic status+position store action for Story 1.7's drag-across-divider); EPIC1-R02/R03/R04 (score 6 each — Today/Backlog membership ambiguity, missing unit-test framework, incomplete design-token migration)
- **Gate thresholds:** P0 = 100% pass, P1 ≥ 95%, all score-≥6 risks resolved or waived before release, coverage target ≥ 80% of the 44 scenarios
- **Open assumptions:** blocked-task (FR9) visual treatment in the new `TaskRow` is unresolved by any Epic 1 AC (flagged for UX, not scored as a risk); component-testing tooling choice (Playwright CT vs. scoped E2E) is undecided and blocks Component-level scenario authoring
