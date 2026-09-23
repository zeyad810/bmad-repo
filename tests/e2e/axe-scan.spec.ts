import { test, expect } from '../support/merged-fixtures';
import { formatViolations } from '../support/fixtures/axe-fixture';
import { createAppTask, seedTasks } from '../support/factories/app-task-factory';
import { addTask, rowFor, VIEWPORTS } from '../support/helpers/ui';

test.describe('Automated WCAG scans', () => {
  test('3.5-E2E-001 (P0): empty home has no WCAG A/AA violations', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await expect(page.getByLabel('Add a task')).toBeVisible();
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`3.5-E2E-002 (P0): populated home has no WCAG A/AA violations @ ${name}`, async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.setViewportSize(viewport);
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await seedTasks(page, [
        createAppTask({ title: 'Today critical', priority: 'critical', position: 0 }),
        createAppTask({ title: 'Today medium', priority: 'medium', position: 1, dueDate: futureDate }),
        createAppTask({ title: 'Today low', priority: 'low', position: 2 }),
        createAppTask({ title: 'Backlog high', status: 'backlog', priority: 'high', position: 0 }),
        createAppTask({ title: 'Backlog low', status: 'backlog', priority: 'low', position: 1 }),
      ]);
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expect(page.getByText('Backlog low', { exact: true })).toBeVisible();
      const results = await makeAxeBuilder().analyze();
      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  }

  test('3.5-E2E-003 (P1): delete-armed row has no WCAG A/AA violations', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await expect(page.getByLabel('Add a task')).toBeVisible();
    await addTask(page, 'Armed delete');
    await rowFor(page, 'Armed delete').getByRole('button', { name: 'Delete task: Armed delete' }).click();
    await expect(page.getByRole('button', { name: 'Confirm delete task: Armed delete' })).toBeVisible();
    const results = await makeAxeBuilder().analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('3.5-E2E-004 (P0): edit TaskDrawer has no WCAG A/AA violations', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    await expect(page.getByLabel('Add a task')).toBeVisible();
    await addTask(page, 'Drawer scan');
    await rowFor(page, 'Drawer scan').getByRole('button', { name: 'Edit task: Drawer scan' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit Task' })).toBeVisible();
    const results = await makeAxeBuilder().include('[role="dialog"]').analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('3.5-E2E-005 (P0): empty Completed page passes except known contrast debt', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto('/completed');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    // Legacy Completed colors are tracked in deferred-work.md (Story 3.4 Q1).
    const results = await makeAxeBuilder().disableRules(['color-contrast']).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('3.5-E2E-006 (P0): populated Completed page passes except known contrast debt', async ({
    page,
    makeAxeBuilder,
  }) => {
    await seedTasks(page, [
      createAppTask({ title: 'Completed one', status: 'completed', completedAt: '2026-09-22T10:00:00.000Z' }),
      createAppTask({ title: 'Completed two', status: 'completed', completedAt: '2026-09-21T10:00:00.000Z' }),
    ]);
    await page.goto('/completed');
    await expect(page.getByText('Completed two', { exact: true })).toBeVisible();
    // Legacy Completed colors are tracked in deferred-work.md (Story 3.4 Q1).
    const results = await makeAxeBuilder().disableRules(['color-contrast']).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  test('3.5-E2E-007 (P2): Completed contrast debt remains visible', async ({ page, makeAxeBuilder }) => {
    test.fail(true, 'Known debt: legacy Completed header/TaskCard contrast — see deferred-work.md (3.4 Q1)');
    await seedTasks(page, [
      createAppTask({
        title: 'Contrast debt',
        status: 'completed',
        completedAt: '2026-09-23T10:00:00.000Z',
      }),
    ]);
    await page.goto('/completed');
    await expect(page.getByText('Contrast debt', { exact: true })).toBeVisible();
    const results = await makeAxeBuilder().withRules(['color-contrast']).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
    // Chromium currently returns this rule as clean on the layered legacy
    // surface, so retain a concrete debt sentinel until the token is migrated.
    await expect(page.getByRole('link', { name: /Back to my tasks/ })).not.toHaveClass(/text-zinc-600/);
  });
});
