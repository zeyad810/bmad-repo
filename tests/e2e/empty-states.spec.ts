import { test, expect } from '../support/merged-fixtures';
import type { Page } from '@playwright/test';

// Coverage for Story 2.4 (Restyle Empty States).
// Test IDs assigned directly under the 2.4-E2E-* prefix, following the
// convention used by Stories 2.1–2.3.

async function quickAdd(page: Page, title: string) {
  // QuickAddBar's input has no aria-label (pre-existing regression tracked in
  // deferred-work.md), so locate it by placeholder.
  const input = page.getByPlaceholder('Add a task...');
  await input.click();
  await input.fill(title);
  await input.press('Enter');
  if (!(await page.getByText(title).isVisible().catch(() => false))) {
    await input.press('Enter');
  }
  await expect(page.getByText(title)).toBeVisible();
}

function emptyState(page: Page, text: string) {
  return page.getByTestId('empty-state').filter({ hasText: text });
}

test.describe('Empty states', () => {
  test('2.4-E2E-001 (P1): Today and Backlog show plain copy with no illustration or emoji', async ({ page }) => {
    await page.goto('/');

    const today = emptyState(page, 'Nothing here yet');
    const backlog = emptyState(page, 'Backlog is clear');
    await expect(today).toBeVisible();
    await expect(backlog).toBeVisible();

    for (const state of [today, backlog]) {
      await expect(state.locator('svg, img, [style]')).toHaveCount(0);
      await expect(state).not.toHaveAttribute('style', /.+/);
      const text = await state.innerText();
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  test('2.4-E2E-002 (P1): empty state uses Graphite Violet tokens and keeps its drop-target height', async ({ page }) => {
    await page.goto('/');

    const today = emptyState(page, 'Nothing here yet');
    await expect(today.getByText('Nothing here yet')).toHaveCSS('color', 'rgb(139, 141, 152)');

    const box = await today.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });

  test('2.4-E2E-003 (P1): Completed empty state keeps its copy and link, restyled', async ({ page }) => {
    await page.goto('/completed');

    const state = emptyState(page, 'Nothing here yet');
    await expect(state).toBeVisible();
    await expect(state.getByText('Finished tasks will collect here as you make progress.')).toBeVisible();
    await expect(state.locator('svg')).toHaveCount(0);

    // Positive check only: Tailwind v4 palette colors compute to oklch(), so a
    // "not amber rgb(...)" assertion would pass vacuously.
    const link = state.getByRole('link', { name: /view active tasks/i });
    await expect(link).toHaveCSS('color', 'rgb(124, 138, 255)');

    await link.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
  });

  test('2.4-E2E-004 (P2): empty states come and go with data', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Empty state toggle');
    await expect(emptyState(page, 'Nothing here yet')).toBeHidden();
    await expect(emptyState(page, 'Backlog is clear')).toBeVisible();

    await rows.filter({ hasText: 'Empty state toggle' }).getByLabel('Mark complete').click();
    // Completion commits after TaskRow's COMPLETE_TRANSITION_MS delay.
    await expect(rows.filter({ hasText: 'Empty state toggle' })).toHaveCount(0);
    await expect(emptyState(page, 'Nothing here yet')).toBeVisible();

    await page.goto('/completed');
    await expect(page.getByText('Empty state toggle')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });
});
