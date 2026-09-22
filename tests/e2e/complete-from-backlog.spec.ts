import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.8 (Complete a Task Directly From the Backlog Section).
// Test IDs follow the Epic 1 test-design doc's P0/P1/P2 breakdown for Story 1.8.
async function realDrag(
  page: import('@playwright/test').Page,
  fromHandleBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number }
) {
  await page.mouse.move(fromHandleBox.x + fromHandleBox.width / 2, fromHandleBox.y + fromHandleBox.height / 2);
  await page.mouse.down();
  // Move past the 4px activationConstraint before the drop target move
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

test.describe('Complete a task directly from Backlog', () => {
  test('1.8-E2E-001 (P0): complete task directly from Backlog moves it out of Backlog into Completed view', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    // Quick-add a task
    await quickAdd(page, 'Backlog Item 1');

    // Demote to Backlog via realDrag across the divider
    const backlogEmpty = page.getByText('Backlog is clear');
    await expect(backlogEmpty).toBeVisible();
    const handleBox = await rows.filter({ hasText: 'Backlog Item 1' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const backlogRow = rows.filter({ hasText: 'Backlog Item 1' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    await page.waitForTimeout(350);

    // Tap checkbox directly in Backlog
    const checkBtn = backlogRow.getByLabel('Mark complete');
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    // Verify row moves out of Backlog
    await expect(page.getByText('Backlog Item 1')).not.toBeVisible();
    await expect(page.getByText('Backlog is clear')).toBeVisible();

    // Verify localStorage data: status === "completed", completedAt is set
    const storedTask = await page.evaluate(() => {
      const raw = localStorage.getItem('task-manager:tasks');
      if (!raw) return null;
      const tasks = JSON.parse(raw);
      return tasks.find((t: { title: string }) => t.title === 'Backlog Item 1');
    });
    expect(storedTask).not.toBeNull();
    expect(storedTask.status).toBe('completed');
    expect(typeof storedTask.completedAt).toBe('string');
    const todayPrefix = new Date().toISOString().slice(0, 10);
    expect(storedTask.completedAt.startsWith(todayPrefix)).toBe(true);

    // Navigate to /completed and verify task appears in Completed view
    await page.goto('/completed');
    await expect(page.getByText('Backlog Item 1')).toBeVisible();
  });

  test('1.8-E2E-002 (P1): Backlog checkbox uses same affordance as Today with no extra step or modal', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    // Add two tasks: one stays in Today, one moves to Backlog
    await quickAdd(page, 'Backlog Check');

    const backlogEmpty = page.getByText('Backlog is clear');
    await expect(backlogEmpty).toBeVisible();
    const handleBox = await rows.filter({ hasText: 'Backlog Check' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const backlogRow = rows.filter({ hasText: 'Backlog Check' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    await page.waitForTimeout(350);

    await quickAdd(page, 'Today Check');

    const todayRow = rows.filter({ hasText: 'Today Check' });
    await expect(todayRow).not.toHaveClass(/opacity-\[0\.88\]/);

    // Compare affordances: both must have native button with aria-label="Mark complete"
    const todayCheckBtn = todayRow.getByLabel('Mark complete');
    const backlogCheckBtn = backlogRow.getByLabel('Mark complete');
    await expect(todayCheckBtn).toBeVisible();
    await expect(backlogCheckBtn).toBeVisible();

    const todayTagName = await todayCheckBtn.evaluate((el) => el.tagName);
    const backlogTagName = await backlogCheckBtn.evaluate((el) => el.tagName);
    expect(backlogTagName).toBe('BUTTON');
    expect(backlogTagName).toBe(todayTagName);

    // Click backlog checkbox once: completes immediately with no confirmation modal or dialog
    await backlogCheckBtn.click();
    await expect(page.getByText('Backlog Check')).not.toBeVisible();

    // Confirm no dialog/modal/toast appeared
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('[role="alertdialog"]')).toHaveCount(0);

    // Today task remains active and untouched
    await expect(page.getByText('Today Check')).toBeVisible();
  });

  test('1.8-E2E-003 (P2): active task count decreases and completed count increases after Backlog completion', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    // Add two tasks
    await quickAdd(page, 'Item for Backlog');

    const backlogEmpty = page.getByText('Backlog is clear');
    await expect(backlogEmpty).toBeVisible();
    const handleBox = await rows.filter({ hasText: 'Item for Backlog' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const backlogRow = rows.filter({ hasText: 'Item for Backlog' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    await page.waitForTimeout(350);

    await quickAdd(page, 'Item for Today');

    // Sidebar navigation check on desktop
    const sidebar = page.locator('aside');
    const myTasksNav = sidebar.getByRole('link', { name: /my tasks/i });
    const completedNav = sidebar.getByRole('link', { name: /completed/i });

    await expect(myTasksNav).toContainText('2');
    await expect(completedNav).toContainText('0');

    // Complete the backlog task
    await backlogRow.getByLabel('Mark complete').click();
    await expect(page.getByText('Item for Backlog')).not.toBeVisible();

    // Assert counts updated reactively: active decremented to 1, completed incremented to 1
    await expect(myTasksNav).toContainText('1');
    await expect(completedNav).toContainText('1');
  });
});
