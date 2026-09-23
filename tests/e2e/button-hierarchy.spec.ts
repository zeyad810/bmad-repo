import { test, expect } from '../support/merged-fixtures';
import type { Page } from '@playwright/test';

// Coverage for Story 2.3 (Restyle Buttons & Enforce Hierarchy).
// Test IDs assigned under the 2.3-E2E-* prefix, following Story 2.1's convention.

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

function drawerForm(page: Page) {
  // Drawer has no role="dialog"; scope by the form that owns Save Changes.
  return page.locator('form', { has: page.getByRole('button', { name: /save changes/i }) });
}

function failOnNativeDialog(page: Page) {
  page.on('dialog', (dialog) => {
    dialog.dismiss();
    throw new Error(`Unexpected native dialog appeared: ${dialog.message()}`);
  });
}

test.describe('Button hierarchy', () => {
  test('2.3-E2E-001 (P1): home has exactly one primary button', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Hierarchy home');

    const primaries = page.locator('[data-variant="primary"]:visible');
    await expect(primaries).toHaveCount(1);
    await expect(primaries).toHaveText(/add/i);
  });

  test('2.3-E2E-002 (P1): drawer has exactly one primary button', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Hierarchy drawer');
    await openEdit(page, 'Hierarchy drawer');

    const form = drawerForm(page);
    const primaries = form.locator('[data-variant="primary"]');
    await expect(primaries).toHaveCount(1);
    await expect(primaries).toHaveText(/save changes/i);
    await expect(form.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-variant', 'secondary');
  });

  test('2.3-E2E-003 (P0): danger appears only once Clear archive is armed', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    await quickAdd(page, 'Hierarchy archive');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    await rows.filter({ hasText: 'Hierarchy archive' }).getByLabel('Mark complete').click();

    await page.goto('/completed');
    await expect(page.getByText('Hierarchy archive')).toBeVisible();
    await expect(page.locator('[data-variant="danger"]')).toHaveCount(0);

    const clearBtn = page.getByRole('button', { name: /clear archive/i });
    await expect(clearBtn).toHaveAttribute('data-variant', 'secondary');
    await clearBtn.click();

    const armed = page.getByRole('button', { name: /tap to confirm/i });
    await expect(armed).toHaveAttribute('data-variant', 'danger');
    await expect(page.getByText('Hierarchy archive')).toBeVisible();

    // Confirm window (~2.5s) elapses → back to secondary, nothing deleted.
    const reverted = page.getByRole('button', { name: /clear archive/i });
    await expect(reverted).toHaveAttribute('data-variant', 'secondary', { timeout: 5000 });
    await expect(page.getByText('Hierarchy archive')).toBeVisible();
  });

  test('2.3-E2E-004 (P2): shared buttons carry no inline styles', async ({ page }) => {
    await page.goto('/');
    await quickAdd(page, 'Hierarchy inline');
    await expect(page.locator('button[data-variant][style]')).toHaveCount(0);

    await openEdit(page, 'Hierarchy inline');
    await expect(drawerForm(page).locator('button[data-variant]')).toHaveCount(2);
    await expect(page.locator('button[data-variant][style]')).toHaveCount(0);
  });

  test('2.3-E2E-005 (P2): primary uses the Graphite Violet accent', async ({ page }) => {
    await page.goto('/');
    const addBtn = page.locator('[data-variant="primary"]').first();
    await expect(addBtn).toHaveCSS('background-color', 'rgb(124, 138, 255)');
  });
});
