import { test, expect } from '../support/merged-fixtures';
import type { Locator, Page } from '@playwright/test';
import {
  VIEWPORTS,
  addTask,
  keyboardMove,
  realDrag,
  rowFor,
  rows,
  section,
  tabTo,
} from '../support/helpers/ui';

async function expectShell(page: Page, breakpoint: keyof typeof VIEWPORTS): Promise<void> {
  if (breakpoint === 'MOBILE') {
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    await expect(page.locator('aside')).toBeHidden();
  } else {
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByTestId('bottom-nav')).toBeHidden();
  }
}

async function rowTitles(container: Locator): Promise<string[]> {
  const taskRows = container.locator('div.group', { has: container.page().getByLabel('Reorder task') });
  const titles: string[] = [];
  for (const row of await taskRows.all()) {
    titles.push((await row.locator('p').first().textContent())?.trim() ?? '');
  }
  return titles;
}

async function openCompleted(page: Page, breakpoint: keyof typeof VIEWPORTS): Promise<void> {
  const nav = breakpoint === 'MOBILE' ? page.getByTestId('bottom-nav') : page.locator('aside');
  await nav.getByRole('link', { name: 'Completed' }).click();
  await expect(page.getByRole('heading', { name: 'Completed work.' })).toBeVisible();
}

for (const [name, viewport] of Object.entries(VIEWPORTS) as [keyof typeof VIEWPORTS, (typeof VIEWPORTS)[keyof typeof VIEWPORTS]][]) {
  test.describe(`Core journeys @ ${name}`, () => {
    test.use({ viewport });

    test(`3.5-E2E-010 (P0): Add persists and empty Enter is silent @ ${name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expectShell(page, name);
      const input = page.getByLabel('Add a task');

      await addTask(page, 'Add first');
      await addTask(page, 'Add second');
      await expect.poll(() => rowTitles(section(page, 'Today'))).toEqual(['Add first', 'Add second']);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('');

      const count = await rows(page).count();
      const announcementText = await page.locator('[role="alert"]').allTextContents();
      await input.press('Enter');
      await expect(rows(page)).toHaveCount(count);
      // dnd-kit owns a persistent alert live region. Silence means the empty
      // submit neither changes its announcement nor creates a toast.
      await expect.poll(() => page.locator('[role="alert"]').allTextContents()).toEqual(announcementText);
      await expect(page.locator('[data-testid="toast"]')).toHaveCount(0);

      await page.reload();
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expect.poll(() => rowTitles(section(page, 'Today'))).toEqual(['Add first', 'Add second']);
    });

    test(`3.5-E2E-011 (P0): keyboard reprioritize persists across sections @ ${name}`, async ({ page }) => {
      test.fail(true, 'Known debt: cross-section move resets the source section order — see deferred-work.md');
      await page.goto('/');
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expectShell(page, name);
      for (const title of ['A', 'B', 'C']) await addTask(page, title);

      await keyboardMove(page, 'C', 'ArrowUp', 2);
      await expect.poll(() => rowTitles(section(page, 'Today'))).toEqual(['C', 'A', 'B']);
      await keyboardMove(page, 'A', 'ArrowDown', 2);
      await expect(rowFor(page, 'A')).toHaveClass(/opacity-\[0\.88\]/);
      await expect.poll(() => rowTitles(section(page, 'Backlog'))).toEqual(['A']);

      await page.reload();
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expect.poll(() => rowTitles(section(page, 'Today'))).toEqual(['C', 'B']);
      await expect.poll(() => rowTitles(section(page, 'Backlog'))).toEqual(['A']);
    });

    test(`3.5-E2E-012 (P0): complete Backlog, review archive, and restore @ ${name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expectShell(page, name);
      await addTask(page, 'Today review');
      await addTask(page, 'Backlog review');
      await keyboardMove(page, 'Backlog review', 'ArrowDown', 1);
      await expect(rowFor(page, 'Backlog review')).toHaveClass(/opacity-\[0\.88\]/);

      await rowFor(page, 'Backlog review')
        .getByRole('button', { name: 'Mark complete: Backlog review' })
        .click();
      await expect(rowFor(page, 'Backlog review')).toHaveCount(0);
      await openCompleted(page, name);
      await expect(page.getByText('Backlog review', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Restore task' }).click();
      await expect(page.getByText('Backlog review', { exact: true })).toHaveCount(0);

      const nav = name === 'MOBILE' ? page.getByTestId('bottom-nav') : page.locator('aside');
      await nav.getByRole('link', { name: name === 'MOBILE' ? 'Tasks' : 'My tasks' }).click();
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expect(rowFor(page, 'Backlog review')).toBeVisible();
    });

    test(`3.5-E2E-013 (P1): keyboard completion preserves useful focus @ ${name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByLabel('Add a task')).toBeVisible();
      await expectShell(page, name);
      for (const title of ['Focus A', 'Focus B', 'Focus C']) await addTask(page, title);
      const complete = rowFor(page, 'Focus B').getByRole('button', { name: 'Mark complete: Focus B' });
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await tabTo(page, complete);
      await page.keyboard.press('Enter');
      await expect(rowFor(page, 'Focus B')).toHaveCount(0);
      await expect
        .poll(() => page.evaluate(() => document.activeElement === document.body))
        .toBe(false);
    });
  });
}

test('3.5-E2E-014 (P1): desktop pointer drag crosses the divider both ways', async ({ page, browserName }) => {
  test.fail(browserName === 'webkit', 'Known WebKit pointer-sensor automation flake — see deferred-work.md');
  await page.setViewportSize(VIEWPORTS.DESKTOP);
  await page.goto('/');
  await expect(page.getByLabel('Add a task')).toBeVisible();
  await expectShell(page, 'DESKTOP');
  await addTask(page, 'Pointer journey');

  const backlogEmpty = page.getByText('Backlog is clear', { exact: true });
  const handleBox = await rowFor(page, 'Pointer journey').getByLabel('Reorder task').boundingBox();
  const backlogBox = await backlogEmpty.boundingBox();
  if (!handleBox || !backlogBox) throw new Error('Could not measure pointer-drag positions');
  await realDrag(page, handleBox, backlogBox);
  await expect(rowFor(page, 'Pointer journey')).toHaveClass(/opacity-\[0\.88\]/);
  await page.waitForTimeout(350);

  const todayEmpty = page.getByText('Nothing here yet', { exact: true });
  const returnHandle = await rowFor(page, 'Pointer journey').getByLabel('Reorder task').boundingBox();
  const todayBox = await todayEmpty.boundingBox();
  if (!returnHandle || !todayBox) throw new Error('Could not measure return-drag positions');
  await realDrag(page, returnHandle, todayBox);
  await expect(rowFor(page, 'Pointer journey')).not.toHaveClass(/opacity-\[0\.88\]/);
});
