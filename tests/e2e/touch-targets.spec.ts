import { test, expect } from '../support/merged-fixtures';
import { createAppTask, seedTasks } from '../support/factories/app-task-factory';
import { addTask, expectMinTarget, rowFor, VIEWPORTS } from '../support/helpers/ui';

test.describe('Mobile touch-target gaps', () => {
  test.use({ viewport: VIEWPORTS.MOBILE });

  test('3.5-E2E-020 (P1): every BottomNav tab is at least 44x44', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Add a task')).toBeVisible();
    const links = page.getByTestId('bottom-nav').getByRole('link');
    await expect(links).toHaveCount(2);
    for (const link of await links.all()) await expectMinTarget(link);
  });

  test('3.5-E2E-021 (P1): TaskDrawer actions are at least 44px tall', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Add a task')).toBeVisible();
    await addTask(page, 'Touch drawer');
    await rowFor(page, 'Touch drawer').getByRole('button', { name: 'Edit task: Touch drawer' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Task' });
    await expect(dialog).toBeVisible();

    const controls = [
      dialog.getByRole('button', { name: 'Close' }),
      dialog.getByRole('button', { name: 'Save Changes' }),
      dialog.getByRole('button', { name: 'Cancel' }),
    ];
    for (const control of controls) {
      const measured = await control.boundingBox();
      expect(measured, 'control must be rendered').not.toBeNull();
      test.info().annotations.push({
        type: 'touch-target-measurement',
        description: `${await control.getAttribute('aria-label') ?? await control.textContent()}: ${measured!.width}x${measured!.height}`,
      });
      const size = await expectMinTarget(control);
      test.info().annotations.push({
        type: 'touch-target',
        description: `${await control.getAttribute('aria-label') ?? await control.textContent()}: ${size.width}x${size.height}`,
      });
    }
  });

  test('3.5-E2E-022 (P2): Completed empty and archive actions are at least 44px tall', async ({ page }) => {
    await page.goto('/completed');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    const emptyAction = page.getByRole('link', { name: /View active tasks/ });
    const measuredEmpty = await emptyAction.boundingBox();
    expect(measuredEmpty, 'View active tasks must be rendered').not.toBeNull();
    test.info().annotations.push({
      type: 'touch-target-measurement',
      description: `View active tasks: ${measuredEmpty!.width}x${measuredEmpty!.height}`,
    });
    const emptySize = await expectMinTarget(emptyAction);
    test.info().annotations.push({
      type: 'touch-target',
      description: `View active tasks: ${emptySize.width}x${emptySize.height}`,
    });

    await seedTasks(page, [
      createAppTask({
        title: 'Archived target',
        status: 'completed',
        completedAt: '2026-09-23T10:00:00.000Z',
      }),
    ]);
    await page.goto('/completed');
    const clearArchive = page.getByRole('button', { name: 'Clear archive' });
    await expect(clearArchive).toBeVisible();
    const archiveSize = await expectMinTarget(clearArchive);
    test.info().annotations.push({
      type: 'touch-target',
      description: `Clear archive: ${archiveSize.width}x${archiveSize.height}`,
    });
  });
});
