import { test, expect } from '../support/merged-fixtures';
import type { Page } from '@playwright/test';

// Coverage for Story 3.3 (Keyboard-Accessible Reorder Fallback).
// Uses @dnd-kit's KeyboardSensor flow: Space picks up, arrows move, Space drops, Escape cancels.

interface StoredTask { id: string; title: string; status: string }

const rows = (page: Page) => page.locator('div.group', { has: page.getByLabel('Reorder task') });
const handleOf = (page: Page, title: string) => rows(page).filter({ hasText: title }).getByLabel('Reorder task');
const liveRegion = (page: Page) => page.locator('[id^="DndLiveRegion"]');

async function key(page: Page, k: string) {
  await page.keyboard.press(k);
  await page.waitForTimeout(80);
}

async function addTask(page: Page, title: string) {
  const input = page.getByPlaceholder('Add a task...');
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function storedTasks(page: Page): Promise<StoredTask[]> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('task-manager:tasks') ?? '[]'));
}

async function titlesAbove(page: Page, above: boolean) {
  const dividerY = (await page.getByText('BACKLOG', { exact: true }).boundingBox())!.y;
  const result: { title: string; y: number }[] = [];
  for (const row of await rows(page).all()) {
    const y = (await row.boundingBox())!.y;
    if ((y < dividerY) === above) result.push({ title: (await row.locator('p').first().textContent()) ?? '', y });
  }
  return result.sort((a, b) => a.y - b.y).map((r) => r.title);
}
const todayTitles = (page: Page) => titlesAbove(page, true);
const backlogTitles = (page: Page) => titlesAbove(page, false);

// Keyboard-drag `title` down until it sits below the divider (dogfooding the feature).
async function keyboardDemote(page: Page, title: string, presses: number) {
  await handleOf(page, title).focus();
  await key(page, 'Space');
  for (let i = 0; i < presses; i++) await key(page, 'ArrowDown');
  await key(page, 'Space');
  await expect(rows(page).filter({ hasText: title })).toHaveClass(/opacity-\[0\.88\]/);
  await page.waitForTimeout(300);
}

test.describe('Keyboard reorder fallback', () => {
  test('3.3-E2E-001 (P0): same-section keyboard reorder persists', async ({ page }) => {
    await page.goto('/');
    for (const t of ['KA', 'KB', 'KC']) await addTask(page, t);
    await expect.poll(() => todayTitles(page)).toEqual(['KA', 'KB', 'KC']);

    await handleOf(page, 'KA').focus();
    await key(page, 'Space');
    await key(page, 'ArrowDown');
    await key(page, 'ArrowDown');
    await key(page, 'Space');

    await expect.poll(() => todayTitles(page)).toEqual(['KB', 'KC', 'KA']);
    await page.reload();
    await expect(page.getByText('KA', { exact: true })).toBeVisible();
    await expect.poll(() => todayTitles(page)).toEqual(['KB', 'KC', 'KA']);
  });

  test('3.3-E2E-002/004/005 (P0): demote across the divider, keep focus, announce by title', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'DA');
    await addTask(page, 'DB');
    const id = (await storedTasks(page)).find((t) => t.title === 'DB')!.id;

    await handleOf(page, 'DB').focus();
    await key(page, 'Space');
    await expect(liveRegion(page)).toContainText('Picked up DB');
    await expect(liveRegion(page)).toContainText('in Today');
    await key(page, 'ArrowDown');
    await key(page, 'Space');

    // 002: status and section
    await expect(rows(page).filter({ hasText: 'DB' })).toHaveClass(/opacity-\[0\.88\]/);
    await expect.poll(() => backlogTitles(page)).toEqual(['DB']);
    await expect.poll(async () => (await storedTasks(page)).find((t) => t.id === id)?.status).toBe('backlog');

    // 005: human announcement, never the raw id
    await expect(liveRegion(page)).toHaveText('DB moved to position 1 of 1 in Backlog.');
    await expect(liveRegion(page)).not.toContainText(id);

    // 004: focus returns to the re-mounted handle
    await expect
      .poll(() =>
        page.evaluate(() => {
          const el = document.activeElement;
          return el?.getAttribute('aria-label')?.startsWith('Reorder task') ? el.closest('div.group')?.querySelector('p')?.textContent : null;
        })
      )
      .toBe('DB');
  });

  test('3.3-E2E-003 (P0): keyboard promote lands last in Today', async ({ page }) => {
    await page.goto('/');
    for (const t of ['PA', 'PB', 'PC']) await addTask(page, t);
    await keyboardDemote(page, 'PC', 1);
    await expect.poll(() => todayTitles(page)).toEqual(['PA', 'PB']);

    await handleOf(page, 'PC').focus();
    await key(page, 'Space');
    await key(page, 'ArrowUp');
    await key(page, 'Space');

    await expect.poll(() => todayTitles(page)).toEqual(['PA', 'PB', 'PC']);
    await expect.poll(async () => (await storedTasks(page)).find((t) => t.title === 'PC')?.status).toBe('next');
    await expect(liveRegion(page)).toHaveText('PC moved to position 3 of 3 in Today.');
  });

  test('3.3-E2E-006 (P1): Escape cancels without changing order', async ({ page }) => {
    await page.goto('/');
    for (const t of ['CA', 'CB']) await addTask(page, t);

    await handleOf(page, 'CA').focus();
    await key(page, 'Space');
    await key(page, 'ArrowDown');
    await key(page, 'Escape');

    await expect(liveRegion(page)).toContainText('Reorder cancelled');
    await expect.poll(() => todayTitles(page)).toEqual(['CA', 'CB']);
  });

  test('3.3-E2E-007 (P2): no keyboard-specific style and no visible feedback surface', async ({ page }) => {
    await page.goto('/');
    for (const t of ['SA', 'SB']) await addTask(page, t);

    await handleOf(page, 'SA').focus();
    await key(page, 'Space');
    // Same dragging class a pointer drag gets (Story 1.3/1.9)
    await expect(rows(page).filter({ hasText: 'SA' })).toHaveClass(/shadow-2xl/);
    await key(page, 'ArrowDown');
    await key(page, 'Space');

    await expect.poll(() => todayTitles(page)).toEqual(['SB', 'SA']);
    await expect(page.locator('[role="alert"], [role="dialog"]')).toHaveCount(0);
    const box = await liveRegion(page).boundingBox();
    expect(box === null || (box.width <= 1 && box.height <= 1)).toBe(true);
  });
});
