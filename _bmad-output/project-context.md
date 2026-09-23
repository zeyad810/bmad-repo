---
project_name: 'Todo'
user_name: 'Zeyad'
date: '2026-09-23'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'state_and_domain_rules', 'storage_rules', 'testing_rules', 'accessibility_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 26
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Framework:** Next.js `15.3.4` (App Router)
- **UI Library:** React `19.0.0`
- **Language:** TypeScript `^5` (strict mode, ES2017 target, `@/*` path alias)
- **State Management:** Zustand `5.0.5` (single store: `useTaskStore`)
- **Form & Validation:** React Hook Form `7.56.4` + Zod `3.25.67` (`@hookform/resolvers` `^3.10.0`)
- **Drag & Drop:** `@dnd-kit/core` `6.3.1`, `@dnd-kit/sortable` `8.0.0`, `@dnd-kit/utilities` `3.2.2`
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss` `^4`) + Lucide React `0.468.0` icons
- **Date Utilities:** `date-fns` `4.1.0`
- **E2E Testing:** Playwright `1.63.0` + `@seontechnologies/playwright-utils` `4.4.0`
- **Accessibility Testing:** `@axe-core/playwright` `^4.13.0`
- **Linting:** ESLint `^9` + `eslint-config-next` `15.3.4`

---

## Critical Implementation Rules

### 1. Language & TypeScript Rules
- **Strict typing:** `strict: true` — never use `any`. Prefer explicit interfaces from `@/types` (`Task`, `Category`, `AppSettings`).
- **Path aliases only:** All internal imports must use `@/*` (e.g. `import { useTaskStore } from "@/stores/task-store"`). Relative `../../` imports across top-level directories are prohibited.
- **Domain literal unions are the source of truth:** Never inline string literals for status/priority/sort/view. Use `TaskStatus`, `TaskPriority`, `SortMode`, `ViewMode` from `@/types`. Adding a new state means updating the union in `types/index.ts` first.
- **SSR guards required:** Any code that touches `window`, `document`, or `localStorage` must guard with `typeof window === "undefined"` (see `lib/storage/storage.ts`) OR live in a `"use client"` component gated by hydration.

### 2. Framework & Component Rules (Next.js 15 App Router / React 19)
- **Client component boundaries:** Any file using React state, `useEffect`, Zustand, or `@dnd-kit` must start with `"use client";`. Server components must not import from `@/stores/*` or `@/components/tasks/*` transitively.
- **Hydration flow:** `useTaskStore` starts empty. It is hydrated once via `HydrationProvider` (`components/layout/HydrationProvider.tsx`) which calls `hydrate()`. `hydrate()` is idempotent (guarded by the `hydrated` flag) — DO NOT re-invoke it in per-component `useEffect`s.
- **Hydration UX:** While `hydrated === false`, render `HydrationSkeleton` (or an equivalent quiet placeholder). Never render tasks or empty-state copy before hydration — it causes SSR/CSR mismatches and flashes.
- **Icons:** Use Lucide React icons only (`import { Icon } from "lucide-react"`). Do not add SVG icon packages or inline raw SVG for iconography.

### 3. State Management & Domain Rules (Zustand `useTaskStore`)
- **Single source of truth:** All task/category/settings mutations must go through `useTaskStore` actions. Never `set()` on the store from outside the store definition.
- **Score recalculation is mandatory:** Any action that adds, updates, deletes, moves, or re-prioritizes a task MUST wrap the resulting task array in `recalcScores()` before `set()`/`saveTasks()`. Skipping this leaves `priorityScore` stale and breaks `recommended` sort.
- **Position invariants:** Only `reorderTasks()` and `moveTask()` may write `position`. `moveTask()` renumbers the SOURCE section to close gaps in addition to placing the moved task in the destination — mirror this pattern for any new cross-section move.
- **Completion metadata:** Setting status to `"completed"` must also set `completedAt` (ISO datetime) and stash `previousStatus`. Moving out of completed must clear `completedAt`. Use `setStatus()` — do not roll your own.
- **ID generation:** Use the store-local `generateId()` (`${Date.now()}-${random36}`). Do not import `uuid` or `crypto.randomUUID()` — it changes ID shape and breaks stored data compatibility.

### 4. Storage Rules
- **Public entrypoint:** All persistence goes through `@/lib/storage/task-storage.ts` (`loadTasks`, `saveTasks`, `loadSettings`, `saveSettings`, `loadCategories`, `saveCategories`).
- **Layered internals:** `lib/storage/storage.ts` (typed `storageGet`/`storageSet`/`storageRemove` with SSR + parse-error guards) and `lib/storage/keys.ts` (`STORAGE_KEYS` const map) are internal. Do not call `localStorage` directly from components, stores, or hooks.
- **Namespaced keys:** All keys are prefixed `task-manager:` and defined in `STORAGE_KEYS`. New keys must be added there — never inline a raw string.

### 5. Forms & Validation (React Hook Form + Zod)
- Pair `useForm` with `zodResolver` from `@hookform/resolvers/zod`.
- Keep Zod schemas colocated with the form component OR in a `schema.ts` sibling — never inside a rendered JSX file body.
- Form submit handlers must call the corresponding `useTaskStore` action; never mutate the store's `tasks` array in place.

### 6. Drag & Drop (@dnd-kit)
- Live in dedicated client components under `components/tasks/` (see `DraggableTaskList.tsx`, `TaskRow.tsx`).
- Wrap draggables in `<SortableContext>` with stringified unique task IDs.
- On drop, always route through `reorderTasks()` (same section) or `moveTask()` (cross-section) — never `updateTask()` for position/status changes.
- A keyboard-accessible reorder fallback is required (see story 3-3) — do not ship a DnD surface without it.

### 7. E2E & Accessibility Testing (Playwright + axe)
- **Location & naming:** All specs live in `./tests/e2e/` as `*.spec.ts`. Support code (fixtures, factories) lives in `./tests/support/`.
- **Fixtures:** Use `@/tests/support/auth-fixture.ts` and factories from `@/tests/support/factories/` — no hardcoded test state.
- **Base URL:** Never hardcode `http://localhost:3000`. Read from `process.env.BASE_URL || 'http://localhost:3000'`.
- **Artifacts:** Reports and traces must be written to `_bmad-output/test-artifacts/` (already configured in `playwright.config.ts`). Do not emit into repo root.
- **Accessibility gate:** New UI surfaces must have an axe scan in `tests/e2e/axe-scan.spec.ts` (or a peer spec) using `@axe-core/playwright`. The `test:e2e:a11y` script gates: `axe-scan`, `core-journeys`, `touch-targets` — keep all three green.
- **Touch targets:** Interactive elements must meet minimum touch-target size validated by `tests/e2e/touch-targets.spec.ts`. Do not shrink controls below the tested threshold.

### 8. Styling Rules (Tailwind v4)
- Use Tailwind utility classes and design tokens defined in `app/globals.css`. Do not add inline `style={{...}}` for anything a utility class can express.
- The design system is "graphite violet" (established in story 1-1) — reuse tokens/utilities rather than introducing new color hex values.
- Use `PriorityDot`, `Badge`, `Card`, `Button`, `EmptyState`, `SectionDivider` from `components/ui/` before creating new primitives.
- Respect quiet-motion conventions (story 1-9): keep animations subtle; avoid layout-shifting transitions.

### 9. Development Workflow Rules
- **BMAD story flow:** Sprint state is tracked in `_bmad-output/implementation-artifacts/sprint-status.yaml`. When a story is implemented, dev moves it to `review`; do not skip statuses.
- **Story files:** Live under `_bmad-output/implementation-artifacts/`. Implementation must satisfy the story's acceptance criteria before moving to `review`.
- **Commit style:** Conventional-commit style (`feat:`, `chore:`, `fix:`, …) — see existing history.
- **Never run `next dev` from an agent to debug live** — per user standing preference, do not chase local dev-server/port issues; document any E2E gap and close out.

### 10. Critical Don'ts / Anti-Patterns
- ❌ **DO NOT** mutate `useTaskStore` state without going through a store action, and never skip `recalcScores()` on task-shape mutations.
- ❌ **DO NOT** call `localStorage` directly — always go through `task-storage.ts`.
- ❌ **DO NOT** write `position` outside `reorderTasks()`/`moveTask()`.
- ❌ **DO NOT** inline string literals for `TaskStatus` / `TaskPriority` / `SortMode` / `ViewMode` — import the union types.
- ❌ **DO NOT** call `hydrate()` from feature components; the root `HydrationProvider` owns it.
- ❌ **DO NOT** render task lists before `hydrated === true` — use `HydrationSkeleton`.
- ❌ **DO NOT** use inline styles; use Tailwind v4 utilities and tokens from `app/globals.css`.
- ❌ **DO NOT** hardcode `http://localhost:3000` in tests — read `process.env.BASE_URL`.
- ❌ **DO NOT** ship a new interactive surface without an axe scan and a keyboard-accessible path.
- ❌ **DO NOT** write test artifacts to the repo root — always to `_bmad-output/test-artifacts/`.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns or dependencies emerge.

**For Humans:**
- Keep this file lean and focused on agent needs.
- Update when the technology stack or store contract changes.
- Review at the end of each epic for outdated rules.

_Last Updated: 2026-09-23_
