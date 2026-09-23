import { test, expect } from '../support/merged-fixtures';
import type { Page } from '@playwright/test';

// Coverage for Story 2.2 (Restyle Task Editing — TaskDrawer & TaskForm).
// Test IDs assigned under the 2.2-E2E-* prefix, following Story 2.1's convention.

async function quickAdd(page: Page, title: string) {
  // QuickAddBar's input has no aria-label (pre-existing regression, see
  // deferred-work.md) — locate it by placeholder, as delete-confirm.spec.ts does.
  const input = page.getByPlaceholder('Add a task...');
  await input.click();
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title)).toBeVisible();
}

async function openEdit(page: Page, title: string) {
  const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  await rows.filter({ hasText: title }).getByLabel('Edit task').click();
  await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
}

test.describe('Task form restyle', () => {
  test('2.2-E2E-001 (P0): edit round-trip still saves', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Restyle round trip');
    await openEdit(page, 'Restyle round trip');

    await page.getByLabel('Priority').selectOption('low');
    // Pre-existing Est. Minutes NaN bug (see story Dev Notes) — fill it to allow save.
    await page.getByPlaceholder('e.g. 45').fill('30');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('task-manager:tasks'));
    const tasks = JSON.parse(stored ?? '[]') as { title: string; priority: string }[];
    expect(tasks.find((t) => t.title === 'Restyle round trip')?.priority).toBe('low');
  });

  test('2.2-E2E-002 (P1): empty title shows a quiet inline error', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Restyle empty title');
    await openEdit(page, 'Restyle empty title');

    const title = page.getByLabel('Title');
    await title.fill('');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
    await expect(title).toHaveAttribute('aria-invalid', 'true');
  });

  test('2.2-E2E-003 (P1): no emoji in priority options or drawer', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Restyle no emoji');
    await openEdit(page, 'Restyle no emoji');

    const options = await page.getByLabel('Priority').locator('option').allTextContents();
    expect(options.map((o) => o.trim())).toEqual(['Critical', 'High', 'Medium', 'Low']);

    const drawerText = (await page.locator('form').textContent()) ?? '';
    expect(drawerText).not.toMatch(/🔴|🟠|🟡|🟢|📌/u);
  });

  test('2.2-E2E-004 (P2): no inline styles on form content', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Restyle no inline');
    await openEdit(page, 'Restyle no inline');

    // Buttons excluded: Button.tsx stays inline-styled until Story 2.3.
    await expect(page.locator('form [style]:not(button)')).toHaveCount(0);
  });

  test('2.2-E2E-005 (P2): priority dot reflects the selection', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Restyle dot');
    await openEdit(page, 'Restyle dot');

    const select = page.getByLabel('Priority');
    const priorityDot = page.locator('[data-testid="priority-field"] span[aria-hidden="true"]');

    await select.selectOption('low');
    await expect(priorityDot).toHaveClass(/bg-\[var\(--pri-low\)\]/);
    await select.selectOption('high');
    await expect(priorityDot).toHaveClass(/bg-\[var\(--pri-high\)\]/);
  });
});
