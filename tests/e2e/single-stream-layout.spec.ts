import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.6 (Single Stream Home Layout — Today & Backlog sections).
// Test IDs follow the Epic 1 test-design doc's P0/P1/P2 breakdown for Story 1.6.
test.describe('Single Stream home layout', () => {
  test('1.6-E2E-001 (P0): renders QuickAddBar, Today, SectionDivider, Backlog in order', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Add a task')).toBeVisible();
    await expect(page.getByText('Nothing here yet')).toBeVisible();
    const divider = page.getByText('BACKLOG', { exact: true });
    await expect(divider).toBeVisible();
    await expect(page.getByText('Backlog is clear')).toBeVisible();

    const quickAddBox = await page.getByLabel('Add a task').boundingBox();
    const todayEmptyBox = await page.getByText('Nothing here yet').boundingBox();
    const dividerBox = await divider.boundingBox();
    const backlogEmptyBox = await page.getByText('Backlog is clear').boundingBox();

    expect(quickAddBox).not.toBeNull();
    expect(todayEmptyBox).not.toBeNull();
    expect(dividerBox).not.toBeNull();
    expect(backlogEmptyBox).not.toBeNull();

    expect(quickAddBox!.y).toBeLessThan(todayEmptyBox!.y);
    expect(todayEmptyBox!.y).toBeLessThan(dividerBox!.y);
    expect(dividerBox!.y).toBeLessThan(backlogEmptyBox!.y);
  });

  test('1.6-E2E-002 (P1): a quick-added task defaults into the Today section, not Backlog', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');

    await input.fill('New task');
    await input.press('Enter');

    await expect(page.getByText('New task')).toBeVisible();
    await expect(page.getByText('Nothing here yet')).not.toBeVisible();
    await expect(page.getByText('Backlog is clear')).toBeVisible();

    const taskBox = await page.getByText('New task').boundingBox();
    const dividerBox = await page.getByText('BACKLOG', { exact: true }).boundingBox();
    expect(taskBox).not.toBeNull();
    expect(dividerBox).not.toBeNull();
    expect(taskBox!.y).toBeLessThan(dividerBox!.y);
  });

  test('1.6-E2E-003 (P1): Today section follows the recommended (score-descending) sort', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await input.fill('Low prio task');
    await input.press('Enter');
    await expect(page.getByText('Low prio task')).toBeVisible();

    await rows.filter({ hasText: 'Low prio task' }).getByLabel('Edit task').click();
    await page.locator('select').first().selectOption('low');
    // Work around a pre-existing, unrelated TaskForm bug (see Story 1.4's Dev Agent Record):
    // an empty "Est. Minutes" field becomes NaN via valueAsNumber, silently blocking save.
    await page.getByPlaceholder('e.g. 45').fill('30');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();

    await input.fill('High prio task');
    await input.press('Enter');
    await expect(page.getByText('High prio task')).toBeVisible();

    const rowTexts = await rows.allTextContents();
    const lowIdx = rowTexts.findIndex((t) => t.includes('Low prio task'));
    const highIdx = rowTexts.findIndex((t) => t.includes('High prio task'));
    expect(highIdx).toBeGreaterThanOrEqual(0);
    expect(lowIdx).toBeGreaterThanOrEqual(0);
    expect(highIdx).toBeLessThan(lowIdx);
  });

  test('1.6-E2E-004 (P2): a task moved to Backlog renders at .88 opacity', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await input.fill('Task to demote');
    await input.press('Enter');
    await expect(page.getByText('Task to demote')).toBeVisible();

    await rows.filter({ hasText: 'Task to demote' }).getByLabel('Edit task').click();
    await page.locator('select').nth(1).selectOption('backlog');
    await page.getByPlaceholder('e.g. 45').fill('30');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();

    const backlogRow = rows.filter({ hasText: 'Task to demote' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    await expect(backlogRow).toHaveCSS('opacity', '0.88');
  });

  test('1.6-E2E-005 (P2): Today empty-state shows when only Backlog has tasks', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await input.fill('Only backlog task');
    await input.press('Enter');
    await expect(page.getByText('Only backlog task')).toBeVisible();

    await rows.filter({ hasText: 'Only backlog task' }).getByLabel('Edit task').click();
    await page.locator('select').nth(1).selectOption('backlog');
    await page.getByPlaceholder('e.g. 45').fill('30');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();

    await expect(page.getByText('Nothing here yet')).toBeVisible();
    await expect(page.getByText('Backlog is clear')).not.toBeVisible();
  });
});
