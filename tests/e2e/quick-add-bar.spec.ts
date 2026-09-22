import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.4 (QuickAddBar & silent-no-op capture).
// Test IDs follow the Epic 1 test-design doc's P0/P1/P2 breakdown for Story 1.4.
test.describe('Quick add bar', () => {
  test('1.4-E2E-001 (P0): valid text creates a task at the position matching its priority score', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');

    // Given: a task added via QuickAddBar (default priority)
    await input.fill('First task (will demote)');
    await input.press('Enter');
    await expect(page.getByText('First task (will demote)')).toBeVisible();

    // When: that task is demoted to Low priority via the existing edit flow
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    await rows.filter({ hasText: 'First task (will demote)' }).getByLabel('Edit task').click();
    // TaskForm select elements have no id/htmlFor label association (pre-existing gap,
    // out of scope for this story) — target the Priority <select> by position (first of two).
    await page.locator('select').first().selectOption('low');
    // Work around a pre-existing, unrelated TaskForm bug: an empty "Est. Minutes" field
    // becomes NaN via valueAsNumber, which zod's z.number().optional() silently rejects,
    // blocking every edit-save with no visible error. Not this story's scope to fix.
    await page.getByPlaceholder('e.g. 45').fill('30');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();

    // And: a second task is added via QuickAddBar (still default priority, so it now
    // scores higher than the demoted first task)
    await input.fill('Second task (higher score)');
    await input.press('Enter');
    await expect(page.getByText('Second task (higher score)')).toBeVisible();

    // Then: the higher-scoring task renders above the demoted one — proving position
    // tracks priority score (via useSortedTasks' recommended sort), not just append order
    const rowTexts = await rows.allTextContents();
    const firstIndex = rowTexts.findIndex((t) => t.includes('First task (will demote)'));
    const secondIndex = rowTexts.findIndex((t) => t.includes('Second task (higher score)'));
    expect(secondIndex).toBeGreaterThanOrEqual(0);
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeLessThan(firstIndex);
  });

  test('1.4-E2E-002 (P1, risk EPIC1-R06): empty submit is a silent no-op', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    const countBefore = await rows.count();

    await input.press('Enter');
    await page.waitForTimeout(200);

    expect(await rows.count()).toBe(countBefore);
    // No visible error/toast/alert appeared (excluding Next.js's own hidden, empty
    // route-announcer element, which is present on every page regardless of this feature).
    const visibleAlertText = await page
      .locator('[role="alert"]:not(#__next-route-announcer__)')
      .allTextContents();
    expect(visibleAlertText.join('')).toBe('');
  });

  test('1.4-E2E-003 (P1): aria-label, Escape clears without losing focus, mono hint visible', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');

    await expect(input).toHaveCount(1);

    await input.fill('Discard me');
    await input.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();

    await expect(page.getByText('↵ add')).toBeVisible();
  });

  test('1.4-E2E-004 (P2): input refocuses and clears after a successful add', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');

    await input.fill('Refocus check');
    await input.press('Enter');
    await expect(page.getByText('Refocus check')).toBeVisible();

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('1.4-E2E-005 (P2): border shows --accent when focused, --border when not', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const bar = page.locator('form:has(input[aria-label="Add a task"])');

    await expect(bar).toHaveCSS('border-color', 'rgb(36, 38, 47)');

    await input.focus();
    await expect(bar).toHaveCSS('border-color', 'rgb(124, 138, 255)');

    await input.blur();
    await expect(bar).toHaveCSS('border-color', 'rgb(36, 38, 47)');
  });
});
