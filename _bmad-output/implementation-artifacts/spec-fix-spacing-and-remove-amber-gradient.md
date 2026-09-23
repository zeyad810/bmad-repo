---
title: 'Fix Spacing and Remove Amber Background Gradient'
type: 'bugfix'
created: '2026-09-23'
status: 'done'
route: 'one-shot'
---

# Fix Spacing and Remove Amber Background Gradient

## Intent

**Problem:** Buttons, inputs, and selects lacked breathing room and padding due to an unlayered universal CSS reset overriding Tailwind utility padding classes, and an amber radial gradient persisted in the body background.

**Approach:** Move universal box-sizing into `@layer base` to allow Tailwind utility padding classes to take precedence, apply comfortable padding to `.field-control`, buttons, inputs, and selects, and remove the amber background radial gradient and amber selection styling.

## Suggested Review Order

1. [app/globals.css](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/app/globals.css) -- Removed amber radial gradients, moved reset into `@layer base`, added default padding to `.field-control`.
2. [app/layout.tsx](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/app/layout.tsx) -- Swapped legacy amber selection color for theme accent.
3. [components/ui/Button.tsx](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/components/ui/Button.tsx) -- Added generous padding and min-heights across button size variants.
4. [components/tasks/QuickAddBar.tsx](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/components/tasks/QuickAddBar.tsx) -- Added explicit padding to quick-add input and action button.
5. [components/tasks/TaskForm.tsx](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/components/tasks/TaskForm.tsx) -- Added comfortable padding to inputs, textareas, priority/status selects, and drawer buttons.
6. [app/completed/page.tsx](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/app/completed/page.tsx) -- Added padding and touch target sizing to empty-state and archive action buttons.
7. [tests/e2e/touch-targets.spec.ts](file:///c:/Users/user/Desktop/Bmad%20Todo/bmad-repo/tests/e2e/touch-targets.spec.ts) -- Unmarked expected failures now that touch targets pass 44px requirements.
