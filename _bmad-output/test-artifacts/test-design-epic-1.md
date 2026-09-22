---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-09-21'
---

# Test Design: Epic 1 - Calm Visual Foundation & Core Prioritization Loop

**Date:** 2026-09-21
**Author:** Zeyad
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for Epic 1 (Todo app redesign — Graphite Violet design tokens, `TaskRow`/`PriorityDot`/`QuickAddBar`/`SectionDivider` primitives, Single Stream Today/Backlog layout, drag-to-promote/demote, quiet motion, hydration). Covers Stories 1.1–1.10.

No PRD or Architecture.md exists for this project; this design is grounded in `_bmad-output/planning-artifacts/epics.md` (epic/story acceptance criteria), `_bmad-output/planning-artifacts/ux-design-specification.md`, `_bmad-output/project-context.md`, and direct inspection of the current codebase (which confirmed Epic 1 is greenfield redesign work — none of the target components or design tokens exist yet).

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (≥6): 4 (EPIC1-R01 score 9, EPIC1-R02/R03/R04 score 6 each)
- Critical categories: TECH, BUS (4 of 8 risks); PERF, DATA, OPS each contribute one MONITOR-level risk

**Coverage Summary:**

- P0 scenarios: 6 (~18–28 hours)
- P1 scenarios: 17 (~24–36 hours)
- P2/P3 scenarios: 21 (~16–26 hours)
- **Total effort**: ~58–90 hours (~1.5–2.5 days-equivalent for a dev+QA pair across 1.5–2.5 weeks elapsed)

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| **Epic 2 (in-place delete confirm, TaskDrawer/TaskForm restyle, button hierarchy, empty-state restyle)** | Separate epic per `epics.md` epic breakdown | Covered by its own `test-design-epic-2` run |
| **Epic 3 (Sidebar/BottomNav restyle, full WCAG AA pass, keyboard-reorder fallback, responsive breakpoints, Playwright a11y suite)** | Separate epic per `epics.md`; only the Story 1.1 token-contrast check is in this epic's scope | Covered by its own `test-design-epic-3` run |
| **Already-delivered baseline logic (FR7–FR14 dependency blocking, sort modes, stats panel, persistence, categories) beyond the Unit-level regression net for `calculatePriorityScore`/`sortTasks`** | Per `epics.md` FR Coverage Map, these are unchanged; only referenced here because Epic 1 rewrites the UI layer around them | `1.3-UNIT-001`/`002` protect the shared algorithms; full baseline re-verification is out of scope |
| **NFR6 automated performance threshold enforcement** | No numeric latency budget defined anywhere in source material | Tracked as EPIC1-R05; manual/perceptual QA only until a threshold is agreed |
| **Blocked-task (FR9) visual treatment in the new `TaskRow`** | No Epic 1 acceptance criterion addresses this; not contradicted either | Flagged as a clarification item (see Assumptions) rather than scored as a risk |

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EPIC1-R01 | TECH/BUS | No atomic store action exists to change status and position together; Story 1.7's drag-across-divider promote/demote requires one, but `stores/task-store.ts` currently has `reorderTasks` (position only) and `setStatus` (status only) as separate calls | 3 | 3 | 9 | Design a single atomic store action (e.g. `moveTask(id, newStatus, orderedIds)`) before Story 1.7 implementation begins; test the combined transition directly | dev-team | Before Story 1.7 implementation starts |
| EPIC1-R02 | BUS | Story 1.6 places a task in Today by status (`next`/`in-progress`) **or** by date (due today/overdue) even when stored status is still `backlog`; dragging such a row across the divider (Story 1.7, status-based only) has undefined behavior | 3 | 2 | 6 | Clarify with product/UX whether date-driven Today membership forces a status write, or drag is disabled/no-op for such rows; add a dedicated test once defined | dev-team + UX | Before Story 1.6/1.7 dev complete |
| EPIC1-R03 | TECH | No unit-test framework exists in the project; `calculatePriorityScore`/`sortTasks` — the algorithms behind the epic's core "drag to prioritize" loop — have zero automated coverage while the UI around them is rewritten | 3 | 2 | 6 | Stand up a lightweight unit-test runner (vitest) and add unit specs for both functions before/alongside the redesign | dev-team | Before Story 1.6/1.7 merge |
| EPIC1-R04 | TECH | Current code (e.g. `app/page.tsx`) has extensive hardcoded Tailwind color utilities and inline hex values that Story 1.1's AC explicitly forbids in any Epic-1-touched component | 3 | 2 | 6 | Add a CI/lint check (grep-based or ESLint rule) failing on banned color-utility patterns in Epic-1-touched files | dev-team | Ongoing through Epic 1 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EPIC1-R05 | PERF | NFR6 ("no perceptible lag... immediate") defines no measurable threshold; per NFR criteria this defaults to CONCERNS | 2 | 2 | 4 | Clarify an explicit input-to-visual-update budget with the team; validate via manual/perceptual QA until then | dev-team |
| EPIC1-R06 | BUS | Quick-add "silent no-op" (no error on empty submit) could regress if a generic validation pattern leaks into `QuickAddBar` | 2 | 2 | 4 | E2E test asserting no error/toast DOM node appears after empty-submit | dev-team |
| EPIC1-R07 | DATA | Priority→dot-color mapping could be duplicated inline instead of implemented as the single source of truth the AC requires | 2 | 2 | 4 | Implement as one exported function; unit-test all 4 priority inputs | dev-team |
| EPIC1-R08 | OPS | Hydration skeleton could flash or cause layout jump since `hydrate()` runs in a post-mount `useEffect` | 2 | 2 | 4 | Reserve layout space up front; Playwright test with throttled CPU asserting no spinner and bounded layout shift | dev-team |

### Low-Priority Risks (Score 1-2)

None identified — every risk grounded in Epic 1 material scored 4 or above. No SEC risks apply (no auth, network calls, or untrusted-HTML rendering surface in this epic).

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## NFR Planning

**Purpose:** Capture epic-specific NFR thresholds, planned validation, and evidence expected for later `nfr-assess`. This is not a final evidence audit.

| NFR Category | Requirement / Threshold | Risk Link | Planned Validation | Evidence Needed |
| --- | --- | --- | --- | --- |
| Performance | NFR6: drag-to-reorder feels immediate — **threshold UNKNOWN** | EPIC1-R05 | Manual/perceptual QA now; automated frame-timing assertion once a budget is agreed | QA sign-off note; later a Playwright trace/timing report |
| Reliability | NFR9: hydration shows skeleton, never a spinner, no layout jump | EPIC1-R08 | Playwright with throttled CPU/network asserting skeleton→content order and absence of any spinner element | Playwright HTML report + screenshots |
| Maintainability | NFR1–NFR3: token/spacing/type-scale consistency — no hardcoded utilities, only defined spacing/type scales | EPIC1-R04 | CI static analysis (grep/ESLint rule) across Epic-1-touched files | CI job log / lint report |
| Accessibility (partial) | Story 1.1 AC: `--text` on `--bg`/`--surface` meets WCAG AA contrast | — | axe-playwright or contrast-ratio script | axe report / computed contrast ratios |

**Unknown thresholds:** NFR6's "immediate"/"no perceptible lag" has no numeric ms/frame budget defined anywhere in the source material (epics.md, UX spec, project-context.md). Do not invent a value — clarify with the team (tracked as EPIC1-R05). Full WCAG AA (focus outlines, semantics, keyboard operability) is explicitly Epic 3 scope (NFR5); only the Story 1.1 contrast check applies here.

---

## Entry Criteria

- [ ] Requirements and assumptions agreed upon by QA, Dev, PM
- [ ] Test environment provisioned and accessible (local dev server; no staging/backend needed — pure client-side app)
- [ ] Test data available or factories ready (`tests/support/factories/task-factory.ts` extended for status/pinned/dependency/priority combinations)
- [ ] Feature deployed to test environment
- [ ] **EPIC1-R01 resolved**: atomic status+position store action designed and agreed before Story 1.7 test scaffolding is written
- [ ] Unit-test runner (vitest) configured (EPIC1-R03 mitigation)

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All P1 tests passing (or failures triaged)
- [ ] No open high-priority / high-severity bugs
- [ ] Test coverage agreed as sufficient
- [ ] **EPIC1-R02 clarification resolved** (Today/Backlog membership ambiguity for backlog-status-but-overdue tasks) — `1.7-E2E-005` executed or explicitly waived
- [ ] CI static-analysis checks (`1.1-STATIC-001/002`) green with zero banned-utility violations in Epic-1-touched files

---

## Test Coverage Plan

### P0 (Critical)

**Criteria**: Critical business, security, data-integrity, or compliance impact with no safe workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 1.3 — drag-and-drop reordering regression after `TaskRow` replaces `TaskCard` | E2E | EPIC1-R03 | 1 | QA | Core loop the epic exists to deliver; no unit safety net exists yet, so this E2E check is the only current regression gate |
| Story 1.4 — valid text + Enter/tap creates task at correct position | E2E | — | 1 | QA | Fundamental add flow |
| Story 1.6 — Single Stream layout renders QuickAddBar → Today → Divider → Backlog | E2E | — | 1 | QA | Structural backbone of the whole redesign (FR15) |
| Story 1.7 — drag Backlog task into Today sets status `next` + recalcScores | E2E | EPIC1-R01 | 1 | QA | Cannot be meaningfully executed until EPIC1-R01's atomic action exists |
| Story 1.7 — drag Today task into Backlog sets status `backlog` + recalcScores | E2E | EPIC1-R01 | 1 | QA | Same dependency as above |
| Story 1.8 — complete task directly from Backlog | E2E | — | 1 | QA | Core completion flow, no workaround |

**Total P0**: 6 tests, ~18–28 hours (includes the EPIC1-R01 store-action design work implied by Story 1.7, not just test authoring)

### P1 (High)

**Criteria**: Core, frequent, or complex behavior with material user reach and a limited workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| `calculatePriorityScore` regression coverage (all input combinations) | Unit | EPIC1-R03 | 1 | DEV | Requires standing up vitest first |
| `sortTasks` regression coverage (all sort modes + pinned tie-break) | Unit | EPIC1-R03 | 1 | DEV | Requires standing up vitest first |
| Story 1.1 — no banned color utilities in Epic-1 components | Static analysis | EPIC1-R04 | 1 | DEV | CI/lint job, not Playwright |
| Story 1.1 — `--text` on `--bg`/`--surface` meets WCAG AA contrast | E2E (a11y) | — | 1 | QA | axe or contrast-ratio script |
| Story 1.2 — priority→dot-tone mapping (single source of truth) | Unit | EPIC1-R07 | 1 | DEV | |
| Story 1.3 — `TaskRow` core rendering (handle, dot, title, meta, checkbox) | Component | — | 1 | DEV | See Prerequisites: component-test approach TBD |
| Story 1.3 — completed-task fade/strikethrough | Component | — | 1 | DEV | |
| Story 1.3 — drag handle/checkbox `aria-label`s | Component/a11y | — | 1 | DEV | |
| Story 1.4 — empty submit is a silent no-op | E2E | EPIC1-R06 | 1 | QA | |
| Story 1.4 — `aria-label`, Enter/Escape behavior, mono hint | Component/a11y | — | 1 | DEV | |
| Story 1.6 — Today "recommended" sort order | E2E | — | 1 | QA | |
| Story 1.6 — quick-added task defaults to status `next` | E2E | — | 1 | QA | Functional change from current `"backlog"` default |
| Story 1.7 — same-section drag changes only position, not status | E2E | EPIC1-R01 | 1 | QA | Regression boundary for the new atomic action |
| Story 1.7 — backlog-status-but-overdue task dragged across divider | E2E | EPIC1-R02 | 1 | QA | **Blocked on clarification** — documented, not yet executable |
| Story 1.8 — Backlog checkbox uses same affordance as Today, no extra step | E2E | — | 1 | QA | |
| Story 1.10 — skeleton/blank state shown before hydration, never a spinner | E2E | EPIC1-R08 | 1 | QA | |
| Story 1.10 — skeleton replaced with no layout jump after hydration | E2E | EPIC1-R08 | 1 | QA | |

**Total P1**: 17 tests, ~24–36 hours (includes vitest setup and one CI static-analysis job)

### P2 (Medium)

**Criteria**: Secondary behavior with narrower user reach and an acceptable workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 1.1 — mono `tabular-nums` typography; spacing-scale static check | E2E + Static | EPIC1-R04 | 2 | DEV | |
| Story 1.2 — `PriorityDot` visual rendering (no emoji/pill) | Component | — | 1 | DEV | |
| Story 1.3 — hover/dragging visual states, overdue meta-only, Backlog `.88` opacity | Component/E2E | — | 4 | DEV | |
| Story 1.4 — refocus after add, focused-border state | E2E | — | 2 | QA | |
| Story 1.5 — `SectionDivider` label/rule, renders above empty Backlog | Component/E2E | — | 2 | DEV | |
| Story 1.6 — Backlog opacity/ordering, Today empty-state | E2E | — | 2 | QA | |
| Story 1.7 — promote/demote settles with no confirm/toast | E2E | — | 1 | QA | |
| Story 1.8 — Backlog count decreases in nav after completion | E2E | — | 1 | QA | |
| Story 1.9 — quiet motion negative assertions (no toast/modal/confetti/spinner) | E2E | — | 4 | QA | |

**Total P2**: 19 tests, ~14–22 hours

### P3 (Low)

**Criteria**: Rare, cosmetic, or experimental behavior with minimal impact and an easy workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 1.2 — priority inferable from position without color alone | Manual/exploratory | — | 1 | QA | Qualitative color-blind/low-vision check |
| Story 1.10 — no perceptible skeleton flash on near-instant hydration | Manual/exploratory | — | 1 | QA | Timing-based, AC itself allows small tolerance |

**Total P3**: 2 tests, ~2–4 hours

---

## Execution Strategy

**Philosophy:** Run every functional scenario in pull requests while the suite stays under 15 minutes. Defer only work with material infrastructure or duration cost.

- **Pull request:** All 6 P0 E2E scenarios + the 2 Unit tests (`1.3-UNIT-001/002`) + the 2 static-analysis checks (`1.1-STATIC-001/002`). This is a pure client-side app (no backend, no API layer to test against), so P0+Unit should comfortably fit under 15 minutes once vitest exists.
- **Nightly:** Full P0–P2 E2E regression across all 10 stories, including the axe/contrast checks and the quiet-motion negative assertions.
- **Weekly:** The 2 P3 manual/exploratory scenarios, plus the NFR6 perceptual drag-latency QA pass (no automated threshold exists yet). No k6/load-testing suite applies — there is no backend to load-test.

Do not re-list the individual tests here. They are already in the coverage plan.

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test (approx.) | Total Hours | Notes |
| --- | --- | --- | --- | --- |
| P0 | 6 | ~3.0–4.7 | 18–28 | Higher than a typical P0 test because Story 1.7's tests depend on the EPIC1-R01 architecture fix (new atomic store action), not just test authoring |
| P1 | 17 | ~1.4–2.1 | 24–36 | Includes standing up vitest and one CI lint job (one-time setup cost amortized) |
| P2 | 19 | ~0.7–1.2 | 14–22 | Mostly component/E2E visual-state assertions |
| P3 | 2 | ~1.0–2.0 | 2–4 | Manual/exploratory only |
| **Total** | **44** | **-** | **58–90** | **~1.5–2.5 weeks elapsed for a dev+QA pair** |

### Prerequisites

**Test Data:**

- `tests/support/factories/task-factory.ts` — extend with helpers for pinned, dependency-blocked, overdue, and each `TaskStatus`/`TaskPriority` combination
- `tests/support/merged-fixtures.ts` — no backend/API fixtures needed for this epic (pure localStorage-backed app)

**Tooling:**

- **vitest** (or equivalent) for Unit-level scenarios — does not currently exist in this project (EPIC1-R03)
- **A component-testing approach** for Component-level scenarios (`1.2-COMPONENT-*`, `1.3-COMPONENT-*`, etc.) — this project has no Playwright CT or React Testing Library setup today; either configure `@playwright/experimental-ct-react` or execute these as scoped assertions within full-page Playwright E2E runs using `data-testid` isolation
- **axe-playwright** (or a manual contrast-ratio script) for the Story 1.1 WCAG AA contrast check
- CI static-analysis job (grep or ESLint rule) for the banned-utility and spacing-scale checks

**Environment:**

- Local Next.js dev server (`npm run dev`) — no staging environment or backend service required
- No environment variables beyond the existing `BASE_URL` convention already used in `tests/e2e/`

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers — specifically EPIC1-R01 (must be resolved, not waivable, before Story 1.7 P0 tests can be meaningfully executed) and EPIC1-R02/R03/R04

### Coverage Targets

- **Critical paths** (drag-to-prioritize, add, complete): ≥80% — all 6 P0 scenarios plus their supporting P1 scenarios
- **Security scenarios**: N/A — no SEC risks identified in this epic's scope
- **Business logic** (`calculatePriorityScore`, `sortTasks`, status transitions): ≥70% via Unit + E2E integration
- **Edge cases** (overdue-backlog drag, empty-submit no-op, blocked-dependency scoring inputs): ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated — EPIC1-R01/R02/R03/R04 resolved or explicitly waived with owner and expiry
- [ ] Security tests (SEC category) pass 100% — N/A, no SEC scenarios in scope
- [ ] Performance targets met (PERF category) — N/A pending EPIC1-R05 threshold clarification; tracked as CONCERNS until defined, not a hard gate
- [ ] Planned NFR evidence exists or `nfr-assess` has documented CONCERNS/waivers

---

## Mitigation Plans

### EPIC1-R01: No atomic status+position store action for drag-across-divider (Score: 9)

**Mitigation Strategy:** Design and implement a single store action (e.g. `moveTask(id, newStatus, orderedIds)`) that updates both `status` and `position` in one state transition and triggers `recalcScores()`, replacing the separate `setStatus`/`reorderTasks` calls for this specific interaction.
**Owner:** dev-team
**Timeline:** Before Story 1.7 implementation starts
**Status:** Planned
**Verification:** `1.7-E2E-001`, `1.7-E2E-002`, `1.7-E2E-003` pass, asserting status and position are consistent immediately after drop with no intermediate inconsistent state

### EPIC1-R02: Today/Backlog section-membership ambiguity for date-driven display vs. status field (Score: 6)

**Mitigation Strategy:** Get an explicit product/UX decision on whether a backlog-status task shown in Today (because it's due/overdue) should have its status silently corrected on load, or whether drag interactions are disabled/no-op for such rows.
**Owner:** dev-team + UX
**Timeline:** Before Story 1.6/1.7 are marked done
**Status:** Planned
**Verification:** `1.7-E2E-005` executed against the agreed behavior

### EPIC1-R03: No unit-test safety net for core prioritization algorithms (Score: 6)

**Mitigation Strategy:** Add vitest to the project; write unit specs for `calculatePriorityScore` and `sortTasks` covering all sort modes, priority tiers, due-date bands, and dependency-blocking before the surrounding UI is rewritten.
**Owner:** dev-team
**Timeline:** Before Story 1.6/1.7 merge
**Status:** Planned
**Verification:** `1.3-UNIT-001`, `1.3-UNIT-002` exist and pass in CI

### EPIC1-R04: Incomplete design-token migration (Score: 6)

**Mitigation Strategy:** Add a CI/lint check (grep pattern list or custom ESLint rule) that fails the build if banned Tailwind color utilities or off-scale spacing values appear in any file touched by Epic 1.
**Owner:** dev-team
**Timeline:** Ongoing through Epic 1, enforced before each story's PR merges
**Status:** Planned
**Verification:** `1.1-STATIC-001`, `1.1-STATIC-002` green in CI

---

## Assumptions and Dependencies

### Assumptions

1. `_bmad-output/project-context.md` accurately reflects current architectural conventions (no Architecture.md exists to cross-check against).
2. The existing `@dnd-kit` pointer+keyboard sensor wiring in `DraggableTaskList.tsx` will be extended rather than replaced, so Story 1.7's cross-divider logic builds on top of existing drag-end handling.
3. Blocked-task (FR9) visual treatment in the new `TaskRow` design is an open question for UX, not yet resolved by any Epic 1 acceptance criterion — flagged for confirmation before Story 1.3 is considered complete, not scored as a risk since no AC contradicts current behavior.

### Dependencies

1. Choice of component-testing approach (Playwright CT vs. scoped E2E assertions) — Required before Story 1.2/1.3 component-level scenarios can be authored
2. vitest setup (EPIC1-R03) — Required before any Unit-level scenario can run
3. EPIC1-R01 architecture decision — Required before Story 1.7 P0 test scaffolding is written

### Risks to Plan

- **Risk**: EPIC1-R01's architecture fix is treated as "just test work" and underestimated, delaying Story 1.7
  - **Impact**: Story 1.7 (a headline epic behavior) slips or ships with an ad hoc, untested state-transition path
  - **Contingency**: Call out the store-action design explicitly as a dev task in sprint planning, separate from test-authoring estimates

---

## Follow-on Workflows (Manual)

- Run `/bmad-testarch-atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `/bmad-testarch-automate` for broader coverage once implementation exists.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

**Comments:**

---

---

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
| --- | --- | --- |
| `app/page.tsx` (current pre-redesign home page) | Fully replaced by the Story 1.6 Single Stream layout | None of the current page's own tests exist to regress (`tests/e2e/tasks.spec.ts` only checks page title/body visibility) — new tests supersede it |
| `components/tasks/TaskCard.tsx` | Replaced by `TaskRow` (Story 1.3) | Existing `@dnd-kit` drag wiring in `DraggableTaskList.tsx` must keep working (`1.3-E2E-003`) |
| `stores/task-store.ts` | Extended with a new atomic status+position action (EPIC1-R01) | All existing store methods (`addTask`, `updateTask`, `deleteTask`, `togglePin`, `setSortMode`, `setPriority`, `addCategory`) must continue functioning unchanged — not modified by Epic 1, no regression risk identified for them |
| `tests/e2e/` suite (existing 2 smoke specs) | Superseded in relevance, not removed | Keep passing as a baseline smoke check while the new Epic 1 suite is built out |

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization
- `nfr-criteria.md` - NFR validation criteria
- `playwright-cli.md` - Browser automation reference (not used for live exploration in this run — see Step 2 notes)

### Related Documents

- PRD: none exists — see `_bmad-output/planning-artifacts/epics.md` Requirements Inventory in its place
- Epic: `_bmad-output/planning-artifacts/epics.md` (Epic 1, Stories 1.1–1.10)
- Architecture: none exists — see `_bmad-output/project-context.md` in its place
- UX Design Specification: `_bmad-output/planning-artifacts/ux-design-specification.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
