import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.9 (Quiet Motion for Add, Reprioritize, and Complete).
// Test IDs follow the Epic 1 test-design doc's P2 "quiet motion negative
// assertions" row. Reuses the realDrag/quickAdd conventions established in
// tests/e2e/complete-from-backlog.spec.ts and tests/e2e/drag-across-divider.spec.ts.
async function realDrag(
  page: import('@playwright/test').Page,
  fromHandleBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number }
) {
  await page.mouse.move(fromHandleBox.x + fromHandleBox.width / 2, fromHandleBox.y + fromHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    fromHandleBox.x + fromHandleBox.width / 2,
    fromHandleBox.y + fromHandleBox.height / 2 + 10,
    { steps: 5 }
  );
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

async function quickAdd(page: import('@playwright/test').Page, title: string) {
  const input = page.getByLabel('Add a task');
  await input.click();
  await input.fill(title);
  await input.press('Enter');
  if (!(await page.getByText(title).isVisible().catch(() => false))) {
    await input.press('Enter');
  }
  await expect(page.getByText(title)).toBeVisible();
}

// No toast/banner/celebration surface exists anywhere in this app; assert
// none of these ever appear, regardless of which action triggered the check.
// (Does not check role="status"/"alert" here: @dnd-kit renders its own
// permanent, visually-hidden a11y live region with role="status"
// (`#DndLiveRegion-*`) whenever DndContext mounts, and Next.js dev mode
// renders a route-announcer with role="alert" — neither is a toast/banner;
// see spinnerLocator below for the scoped "no spinner" check instead.)
async function expectNoFeedbackChrome(page: import('@playwright/test').Page) {
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
}

// Scoped spinner check: excludes @dnd-kit's own permanent a11y live region
// (id starts with "DndLiveRegion"), which is always present and is not a
// loading indicator.
function spinnerLocator(page: import('@playwright/test').Page) {
  return page.locator('[role="status"]:not([id^="DndLiveRegion"])');
}

test.describe('Quiet motion for add, reprioritize, and complete', () => {
  test('1.9-E2E-001 (P2): adding a task shows no toast/banner and uses the entry transition', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Quiet add');

    await expectNoFeedbackChrome(page);

    const newRow = rows.filter({ hasText: 'Quiet add' });
    const animationName = await newRow.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe('task-enter');
  });

  test('1.9-E2E-002 (P2): same-section drag settle shows no modal/banner', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Settle A');
    await quickAdd(page, 'Settle B');
    await expect(rows).toHaveCount(2);

    const handleBox = await rows.filter({ hasText: 'Settle B' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await rows.filter({ hasText: 'Settle A' }).boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    await page.waitForTimeout(350);
    await expectNoFeedbackChrome(page);
    await expect(page.getByText(/confirm\?/i)).toHaveCount(0);
  });

  test('1.9-E2E-003 (P2): completing a task fades/strikes through with no confetti/popup/banner', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Complete quietly');
    const row = rows.filter({ hasText: 'Complete quietly' });
    const checkBtn = row.getByLabel('Mark complete');

    await checkBtn.click();

    // Playwright's web-first assertions auto-retry, so this correctly
    // tolerates the ~200ms completion delay without a fixed wait.
    await expect(page.getByText('Complete quietly')).not.toBeVisible();
    await expectNoFeedbackChrome(page);

    const storedTask = await page.evaluate(() => {
      const raw = localStorage.getItem('task-manager:tasks');
      if (!raw) return null;
      const tasks = JSON.parse(raw);
      return tasks.find((t: { title: string }) => t.title === 'Complete quietly');
    });
    expect(storedTask).not.toBeNull();
    expect(storedTask.status).toBe('completed');
  });

  test('1.9-E2E-004 (P2): no spinner appears during add, reorder, or complete', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    const spinner = spinnerLocator(page);

    await quickAdd(page, 'Spinner check A');
    await expect(spinner).toHaveCount(0);

    await quickAdd(page, 'Spinner check B');
    await expect(spinner).toHaveCount(0);

    const handleBox = await rows.filter({ hasText: 'Spinner check B' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await rows.filter({ hasText: 'Spinner check A' }).boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);
    await page.waitForTimeout(350);
    await expect(spinner).toHaveCount(0);

    await rows.filter({ hasText: 'Spinner check A' }).getByLabel('Mark complete').click();
    await expect(spinner).toHaveCount(0);
    await expect(page.getByText('Spinner check A')).not.toBeVisible();
    await expect(spinner).toHaveCount(0);
  });
});
