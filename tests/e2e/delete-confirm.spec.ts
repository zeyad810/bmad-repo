import { test, expect } from '../support/merged-fixtures';
import type { Page } from '@playwright/test';

// Coverage for Story 2.1 (In-Place Delete Confirm).
// Test IDs assigned directly under the 2.1-E2E-* prefix (no test-design-epic-2.md exists yet),
// following the ID/priority convention modeled in Epic 1's specs (e.g. 1.8-E2E-001).

async function quickAdd(page: Page, title: string) {
  // NOTE: QuickAddBar.tsx currently has no aria-label on its input (only a
  // placeholder) despite Story 1.4's dev record claiming otherwise — a
  // pre-existing, out-of-scope regression logged in deferred-work.md.
  // Use the placeholder locator so this spec isn't blocked by it.
  const input = page.getByPlaceholder('Add a task...');
  await input.click();
  await input.fill(title);
  await input.press('Enter');
  if (!(await page.getByText(title).isVisible().catch(() => false))) {
    await input.press('Enter');
  }
  await expect(page.getByText(title)).toBeVisible();
}

function failOnNativeDialog(page: Page) {
  page.on('dialog', (dialog) => {
    dialog.dismiss();
    throw new Error(`Unexpected native dialog appeared: ${dialog.message()}`);
  });
}

test.describe('In-place delete confirm', () => {
  test('2.1-E2E-001 (P0): tap-tap deletes a task from the active list, no native dialog', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Delete Me 1');
    const row = rows.filter({ hasText: 'Delete Me 1' });
    const deleteBtn = row.getByLabel('Delete task');
    await deleteBtn.click();

    // First tap: enters confirm state, task must NOT be deleted yet
    await expect(page.getByText('Delete Me 1')).toBeVisible();
    const confirmBtn = row.getByLabel('Confirm delete task');
    await expect(confirmBtn).toBeVisible();

    // Second tap within the window: deletes
    await confirmBtn.click();
    await expect(page.getByText('Delete Me 1')).not.toBeVisible();
  });

  test('2.1-E2E-002 (P1): tapping elsewhere while confirming cancels the delete', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Delete Me 2');
    const row = rows.filter({ hasText: 'Delete Me 2' });
    await row.getByLabel('Delete task').click();
    await expect(row.getByLabel('Confirm delete task')).toBeVisible();

    // Tap elsewhere on the page (outside the row)
    await page.mouse.click(5, 5);

    await expect(row.getByLabel('Delete task')).toBeVisible();
    await expect(page.getByText('Delete Me 2')).toBeVisible();
  });

  test('2.1-E2E-003 (P1): confirm window elapsing cancels the delete and reverts the icon', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Delete Me 3');
    const row = rows.filter({ hasText: 'Delete Me 3' });
    await row.getByLabel('Delete task').click();
    await expect(row.getByLabel('Confirm delete task')).toBeVisible();

    // Window elapses (~2-3s) without a second tap
    await page.waitForTimeout(3000);

    await expect(row.getByLabel('Delete task')).toBeVisible();
    await expect(page.getByText('Delete Me 3')).toBeVisible();
  });

  test('2.1-E2E-004 (P1): Completed archive delete uses the identical confirm pattern', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Delete Me 4');
    const row = rows.filter({ hasText: 'Delete Me 4' });
    await row.getByLabel('Mark complete').click();
    await expect(page.getByText('Delete Me 4')).not.toBeVisible();

    await page.goto('/completed');
    const archiveRow = page.locator('article', { hasText: 'Delete Me 4' });
    await expect(archiveRow).toBeVisible();
    const deleteBtn = archiveRow.getByTitle('Delete task');
    await deleteBtn.click();

    // First tap: enters confirm state, still present
    await expect(archiveRow).toBeVisible();
    const confirmBtn = archiveRow.getByTitle('Tap again to confirm');
    await expect(confirmBtn).toBeVisible();

    // Second tap: deletes
    await confirmBtn.click();
    await expect(page.getByText('Delete Me 4')).not.toBeVisible();
  });

  test('2.1-E2E-005 (P2): Clear archive uses in-place confirm instead of window.confirm()', async ({ page }) => {
    failOnNativeDialog(page);
    await page.goto('/');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await quickAdd(page, 'Delete Me 5a');
    await rows.filter({ hasText: 'Delete Me 5a' }).getByLabel('Mark complete').click();
    await quickAdd(page, 'Delete Me 5b');
    await rows.filter({ hasText: 'Delete Me 5b' }).getByLabel('Mark complete').click();

    await page.goto('/completed');
    await expect(page.getByText('Delete Me 5a')).toBeVisible();
    await expect(page.getByText('Delete Me 5b')).toBeVisible();

    const clearBtn = page.getByRole('button', { name: /clear archive/i });
    await clearBtn.click();

    // First tap: enters confirm state, tasks remain
    await expect(page.getByText('Delete Me 5a')).toBeVisible();
    await expect(page.getByText('Delete Me 5b')).toBeVisible();
    const confirmBtn = page.getByRole('button', { name: /tap to confirm/i });
    await expect(confirmBtn).toBeVisible();

    // Second tap: clears the archive
    await confirmBtn.click();
    await expect(page.getByText('Delete Me 5a')).not.toBeVisible();
    await expect(page.getByText('Delete Me 5b')).not.toBeVisible();
    await expect(page.getByText('Nothing here yet')).toBeVisible();
  });
});
