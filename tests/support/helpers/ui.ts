import { expect } from '../merged-fixtures';
import type { Locator, Page } from '@playwright/test';

export const VIEWPORTS = {
  MOBILE: { width: 390, height: 844 },
  DESKTOP: { width: 1280, height: 720 },
} as const;

export async function addTask(page: Page, title: string): Promise<void> {
  const input = page.getByPlaceholder('Add a task...');
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

export function rows(page: Page): Locator {
  return page.locator('div.group', { has: page.getByLabel('Reorder task') });
}

export function rowFor(page: Page, title: string): Locator {
  return rows(page).filter({ hasText: title });
}

export async function tabTo(page: Page, locator: Locator, max = 40): Promise<void> {
  for (let index = 0; index < max; index += 1) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error('Element was not reached by Tab');
}

export async function expectMinTarget(locator: Locator, min = 44): Promise<{ width: number; height: number }> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box, 'element must be rendered').not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(min);
  expect(box!.height).toBeGreaterThanOrEqual(min);
  return { width: box!.width, height: box!.height };
}

export async function realDrag(
  page: Page,
  fromHandleBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number }
): Promise<void> {
  await page.mouse.move(
    fromHandleBox.x + fromHandleBox.width / 2,
    fromHandleBox.y + fromHandleBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    fromHandleBox.x + fromHandleBox.width / 2,
    fromHandleBox.y + fromHandleBox.height / 2 + 10,
    { steps: 5 }
  );
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

export async function keyboardMove(
  page: Page,
  title: string,
  direction: 'ArrowUp' | 'ArrowDown',
  presses: number
): Promise<void> {
  await rowFor(page, title).getByRole('button', { name: `Reorder task: ${title}` }).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  for (let index = 0; index < presses; index += 1) {
    await page.keyboard.press(direction);
    await page.waitForTimeout(80);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
}

export function section(page: Page, name: 'Today' | 'Backlog'): Locator {
  return page.getByRole('region', { name });
}
