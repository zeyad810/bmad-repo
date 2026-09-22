# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quiet-motion.spec.ts >> Quiet motion for add, reprioritize, and complete >> 1.9-E2E-004 (P2): no spinner appears during add, reorder, or complete
- Location: tests\e2e\quiet-motion.spec.ts:110:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByLabel('Add a task')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - link "StickyTasks Personal command center" [ref=e4]:
      - /url: /
      - generic [ref=e9]:
        - generic [ref=e10]: StickyTasks
        - generic [ref=e11]: Personal command center
    - generic [ref=e12]: Workspace
    - navigation [ref=e13]:
      - link "My tasks 0" [ref=e14]:
        - /url: /
        - generic [ref=e18]: My tasks
        - generic [ref=e19]: "0"
      - link "Completed 0" [ref=e20]:
        - /url: /completed
        - generic [ref=e24]: Completed
        - generic [ref=e25]: "0"
    - generic [ref=e26]:
      - generic [ref=e27]: Today
      - generic [ref=e31]:
        - generic [ref=e32]: "0"
        - generic [ref=e33]: completed
      - paragraph [ref=e35]: Small wins add up. Keep your queue moving.
    - generic [ref=e36]: Prioritize what matters
  - generic [ref=e39]:
    - banner [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e42]: Workspace synced locally
        - generic [ref=e44]:
          - generic [ref=e45]: Your focus board
          - generic [ref=e46]: Private
    - main [ref=e47]:
      - generic "Loading tasks" [ref=e48]: BACKLOG
```

# Test source

```ts
  1   | import { test, expect } from '../support/merged-fixtures';
  2   | 
  3   | // Coverage for Story 1.9 (Quiet Motion for Add, Reprioritize, and Complete).
  4   | // Test IDs follow the Epic 1 test-design doc's P2 "quiet motion negative
  5   | // assertions" row. Reuses the realDrag/quickAdd conventions established in
  6   | // tests/e2e/complete-from-backlog.spec.ts and tests/e2e/drag-across-divider.spec.ts.
  7   | async function realDrag(
  8   |   page: import('@playwright/test').Page,
  9   |   fromHandleBox: { x: number; y: number; width: number; height: number },
  10  |   toBox: { x: number; y: number; width: number; height: number }
  11  | ) {
  12  |   await page.mouse.move(fromHandleBox.x + fromHandleBox.width / 2, fromHandleBox.y + fromHandleBox.height / 2);
  13  |   await page.mouse.down();
  14  |   await page.mouse.move(
  15  |     fromHandleBox.x + fromHandleBox.width / 2,
  16  |     fromHandleBox.y + fromHandleBox.height / 2 + 10,
  17  |     { steps: 5 }
  18  |   );
  19  |   await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 });
  20  |   await page.mouse.up();
  21  | }
  22  | 
  23  | async function quickAdd(page: import('@playwright/test').Page, title: string) {
  24  |   const input = page.getByLabel('Add a task');
> 25  |   await input.click();
      |               ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  26  |   await input.fill(title);
  27  |   await input.press('Enter');
  28  |   if (!(await page.getByText(title).isVisible().catch(() => false))) {
  29  |     await input.press('Enter');
  30  |   }
  31  |   await expect(page.getByText(title)).toBeVisible();
  32  | }
  33  | 
  34  | // No toast/banner/celebration surface exists anywhere in this app; assert
  35  | // none of these ever appear, regardless of which action triggered the check.
  36  | // (Does not check role="status"/"alert" here: @dnd-kit renders its own
  37  | // permanent, visually-hidden a11y live region with role="status"
  38  | // (`#DndLiveRegion-*`) whenever DndContext mounts, and Next.js dev mode
  39  | // renders a route-announcer with role="alert" — neither is a toast/banner;
  40  | // see spinnerLocator below for the scoped "no spinner" check instead.)
  41  | async function expectNoFeedbackChrome(page: import('@playwright/test').Page) {
  42  |   await expect(page.getByRole('dialog')).toHaveCount(0);
  43  |   await expect(page.getByRole('alertdialog')).toHaveCount(0);
  44  | }
  45  | 
  46  | // Scoped spinner check: excludes @dnd-kit's own permanent a11y live region
  47  | // (id starts with "DndLiveRegion"), which is always present and is not a
  48  | // loading indicator.
  49  | function spinnerLocator(page: import('@playwright/test').Page) {
  50  |   return page.locator('[role="status"]:not([id^="DndLiveRegion"])');
  51  | }
  52  | 
  53  | test.describe('Quiet motion for add, reprioritize, and complete', () => {
  54  |   test('1.9-E2E-001 (P2): adding a task shows no toast/banner and uses the entry transition', async ({ page }) => {
  55  |     await page.goto('/');
  56  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  57  | 
  58  |     await quickAdd(page, 'Quiet add');
  59  | 
  60  |     await expectNoFeedbackChrome(page);
  61  | 
  62  |     const newRow = rows.filter({ hasText: 'Quiet add' });
  63  |     const animationName = await newRow.evaluate((el) => getComputedStyle(el).animationName);
  64  |     expect(animationName).toBe('task-enter');
  65  |   });
  66  | 
  67  |   test('1.9-E2E-002 (P2): same-section drag settle shows no modal/banner', async ({ page }) => {
  68  |     await page.goto('/');
  69  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  70  | 
  71  |     await quickAdd(page, 'Settle A');
  72  |     await quickAdd(page, 'Settle B');
  73  |     await expect(rows).toHaveCount(2);
  74  | 
  75  |     const handleBox = await rows.filter({ hasText: 'Settle B' }).getByLabel('Reorder task').boundingBox();
  76  |     const targetBox = await rows.filter({ hasText: 'Settle A' }).boundingBox();
  77  |     if (!handleBox || !targetBox) throw new Error('Could not measure positions');
  78  |     await realDrag(page, handleBox, targetBox);
  79  | 
  80  |     await page.waitForTimeout(350);
  81  |     await expectNoFeedbackChrome(page);
  82  |     await expect(page.getByText(/confirm\?/i)).toHaveCount(0);
  83  |   });
  84  | 
  85  |   test('1.9-E2E-003 (P2): completing a task fades/strikes through with no confetti/popup/banner', async ({ page }) => {
  86  |     await page.goto('/');
  87  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  88  | 
  89  |     await quickAdd(page, 'Complete quietly');
  90  |     const row = rows.filter({ hasText: 'Complete quietly' });
  91  |     const checkBtn = row.getByLabel('Mark complete');
  92  | 
  93  |     await checkBtn.click();
  94  | 
  95  |     // Playwright's web-first assertions auto-retry, so this correctly
  96  |     // tolerates the ~200ms completion delay without a fixed wait.
  97  |     await expect(page.getByText('Complete quietly')).not.toBeVisible();
  98  |     await expectNoFeedbackChrome(page);
  99  | 
  100 |     const storedTask = await page.evaluate(() => {
  101 |       const raw = localStorage.getItem('task-manager:tasks');
  102 |       if (!raw) return null;
  103 |       const tasks = JSON.parse(raw);
  104 |       return tasks.find((t: { title: string }) => t.title === 'Complete quietly');
  105 |     });
  106 |     expect(storedTask).not.toBeNull();
  107 |     expect(storedTask.status).toBe('completed');
  108 |   });
  109 | 
  110 |   test('1.9-E2E-004 (P2): no spinner appears during add, reorder, or complete', async ({ page }) => {
  111 |     await page.goto('/');
  112 |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  113 |     const spinner = spinnerLocator(page);
  114 | 
  115 |     await quickAdd(page, 'Spinner check A');
  116 |     await expect(spinner).toHaveCount(0);
  117 | 
  118 |     await quickAdd(page, 'Spinner check B');
  119 |     await expect(spinner).toHaveCount(0);
  120 | 
  121 |     const handleBox = await rows.filter({ hasText: 'Spinner check B' }).getByLabel('Reorder task').boundingBox();
  122 |     const targetBox = await rows.filter({ hasText: 'Spinner check A' }).boundingBox();
  123 |     if (!handleBox || !targetBox) throw new Error('Could not measure positions');
  124 |     await realDrag(page, handleBox, targetBox);
  125 |     await page.waitForTimeout(350);
```