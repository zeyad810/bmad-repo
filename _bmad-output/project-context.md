---
project_name: 'Todo'
user_name: 'Zeyad'
date: '2026-09-21'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 18
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Framework:** Next.js `15.3.4` (App Router)
- **UI Library:** React `19.0.0`
- **Language:** TypeScript `^5` (Strict mode enabled, ES2017 target, `@/*` path alias)
- **State Management:** Zustand `5.0.5`
- **Form & Validation:** React Hook Form `7.56.4` + Zod `3.25.67`
- **Drag & Drop:** `@dnd-kit/core` `6.3.1`, `@dnd-kit/sortable` `8.0.0`, `@dnd-kit/utilities` `3.2.2`
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss` `^4`) + Lucide React `0.468.0` icons
- **Date Utilities:** `date-fns` `4.1.0`
- **E2E Testing:** Playwright `1.63.0` + `@seontechnologies/playwright-utils` `4.4.0`

---

## Critical Implementation Rules

### 1. Language & TypeScript Rules
- **Strict Typing:** Strict TypeScript is enabled (`strict: true`). Never use `any`; use explicit domain interfaces from `@/types` (e.g., `Task`, `Category`, `AppSettings`).
- **Path Aliases:** Always use `@/*` for internal project imports (e.g., `import { useTaskStore } from "@/stores/task-store"`). Relative imports like `../../types` are prohibited.
- **Async & Storage Operations:** All local storage reads/writes must go through `@/lib/storage/task-storage.ts` — direct `localStorage` access inside components or stores is forbidden.

### 2. Framework & Component Rules (Next.js 15 & React 19)
- **Client Component Boundaries:** Explicitly tag interactive components using `"use client";` at the very top of the file when using React state, Zustand, or `@dnd-kit`.
- **Zustand Hydration Pattern:** Always call `useTaskStore.getState().hydrate()` or invoke `hydrate()` inside a `useEffect` on root client wrappers to avoid SSR/hydration mismatches.
- **Score Recalculation Integrity:** Task additions, updates, priority changes, or deletions in `useTaskStore` MUST run through `recalcScores()` to keep `priorityScore` consistent across the app.
- **Form Management & Validation:** Use `react-hook-form` paired with `zod` schemas (`@hookform/resolvers/zod`). Keep Zod validation schemas separated from pure presentational components.

### 3. Drag & Drop (@dnd-kit) Guidelines
- Use `@dnd-kit/core` and `@dnd-kit/sortable` inside dedicated client components (`components/tasks/...`).
- Ensure all drag items are wrapped in `<SortableContext>` with unique item IDs stringified.

### 4. E2E Testing Standards (Playwright)
- **Test Location & Naming:** All E2E spec files must reside in `./tests/e2e/` with the `.spec.ts` extension.
- **Custom Fixtures:** Use custom fixtures from `@/tests/support/auth-fixture.ts` and test data factories in `@/tests/support/factories/` instead of hardcoded test state.
- **Artifact Reporting:** Ensure test results and reports output exclusively to `_bmad-output/test-artifacts/` (configured in `playwright.config.ts`). Do not place reports in the root directory.

### 5. Critical Don'ts / Anti-Patterns
- ❌ **DO NOT** mutate task state directly without calling `saveTasks()` or score recalculations.
- ❌ **DO NOT** use inline styling; use Tailwind CSS v4 classes and utilities from `@/app/globals.css`.
- ❌ **DO NOT** bypass `task-storage.ts` for browser persistence.
- ❌ **DO NOT** hardcode API or base URLs in tests — always reference `process.env.BASE_URL || 'http://localhost:3000'`.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns or dependencies emerge.

**For Humans:**
- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.

_Last Updated: 2026-09-21_
