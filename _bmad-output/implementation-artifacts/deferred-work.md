# Deferred Work

## Deferred from: code review of 1-6-single-stream-home-layout-today-and-backlog-sections (2026-09-22)

- Overdue Backlog tasks qualify as Today tasks via `isTodayTask`, creating drag status ambiguity (`hooks/useTasks.ts:33-46`) — deferred, pre-existing (tracked as risk `EPIC1-R02` in Epic 1 test design).
- Hardcoded priority score fallbacks in `handleQuickAdd` (`app/page.tsx:113`) — deferred, pre-existing pattern from Story 1.4.

## Deferred from: dev-story of 1-8-complete-a-task-directly-from-the-backlog-section (2026-09-22)

- **Webkit-only flakiness in `QuickAddBar`-dependent tests**: tests in `quick-add-bar.spec.ts`, `single-stream-layout.spec.ts`, and `drag-across-divider.spec.ts` intermittently fail on the `webkit` project with `getByText(<just-added title>)` timing out (15s) after `input.press('Enter')`. Reproduced across two full-suite runs on 2026-09-22 with different subsets failing each time (3 failures on one run, 9 on an immediate re-run of the same files), indicating timing/perf flakiness rather than a deterministic break. Chromium and firefox were consistently green across both runs, as was all of `complete-from-backlog.spec.ts` (Story 1.8's own coverage, 9/9 passing on all three browsers both times). No production code was changed in Story 1.8's session, so this is pre-existing and unrelated to that story's scope — likely Next.js dev-server (`npm run dev`) compile/render latency compounding with WebKit's slower automation driver. Needs investigation (e.g. explicit `waitForResponse`/compile-warmup, or a `webServer` prod build for test runs) before it can be trusted as a hard regression gate.
