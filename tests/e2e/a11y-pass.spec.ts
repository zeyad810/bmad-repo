import { test, expect } from '../support/merged-fixtures';
import type { Locator, Page } from '@playwright/test';

// Coverage for Story 3.4 (Accessibility Pass — Contrast, Focus, and Semantics).

const ACCENT = 'rgb(124, 138, 255)';
const TEXT_DIM = 'rgb(139, 141, 152)';
const MOBILE = { width: 390, height: 844 };

async function outline(page: Page) {
  return page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element);
    return { color: s.outlineColor, style: s.outlineStyle, width: s.outlineWidth };
  });
}

async function tabTo(page: Page, locator: Locator, max = 40) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error('element never reached by Tab');
}

async function expectAccentFocus(page: Page, locator: Locator) {
  await tabTo(page, locator);
  await expect(locator).toBeFocused();
  // Poll: Tailwind v4 `transition-colors` also animates outline-color (~150ms).
  await expect.poll(() => outline(page)).toEqual({ color: ACCENT, style: 'solid', width: '2px' });
}

async function addTask(page: Page, title: string) {
  const input = page.getByLabel('Add a task');
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

const rowFor = (page: Page, title: string) =>
  page.locator('div.group', { has: page.getByLabel('Reorder task') }).filter({ hasText: title });

async function activeLabel(page: Page) {
  return page.evaluate(() => (document.activeElement === document.body ? 'BODY' : document.activeElement?.getAttribute('aria-label')));
}

test.describe('Accessibility pass', () => {
  test('3.4-E2E-001 (P0): nav links show the accent focus outline', async ({ page }) => {
    await page.goto('/');
    const aside = page.locator('aside');
    await expectAccentFocus(page, aside.getByRole('link', { name: /completed/i }));

    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await expectAccentFocus(page, page.getByTestId('bottom-nav').getByRole('link', { name: 'Tasks' }));
  });

  test('3.4-E2E-002 (P0): quick-add, row controls and form fields show the accent outline', async ({ page }) => {
    await page.goto('/');
    await expectAccentFocus(page, page.getByLabel('Add a task'));
    await addTask(page, 'Focus ring task');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await expectAccentFocus(page, page.getByRole('button', { name: /add task/i }));
    const row = rowFor(page, 'Focus ring task');
    for (const name of [/^Reorder task: /, /^Mark complete: /, /^Edit task: /, /^Delete task: /]) {
      await expectAccentFocus(page, row.getByRole('button', { name }));
    }
    await row.getByRole('button', { name: /^Edit task: / }).press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Title')).toBeFocused();
    await expect.poll(() => outline(page)).toEqual({ color: ACCENT, style: 'solid', width: '2px' });
    await expectAccentFocus(page, dialog.getByLabel('Priority'));
  });

  test('3.4-E2E-003 (P1): placeholder and header text meet AA via --text-dim', async ({ page }) => {
    await page.goto('/');
    // Header is server-rendered shell; assert it before the hydrated quick-add.
    await expect(page.locator('header').getByText('Private', { exact: true })).toHaveCSS('color', TEXT_DIM);
    await expect(page.locator('header').getByText('Your focus board')).toHaveCSS('color', TEXT_DIM);
    const placeholder = await page
      .getByPlaceholder('Add a task...')
      .evaluate((el) => getComputedStyle(el, '::placeholder').color);
    expect(placeholder).toBe(TEXT_DIM);
  });

  test('3.4-E2E-004 (P0): task lists use list, heading and button semantics', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'Sem A');
    await addTask(page, 'Sem B');
    await addTask(page, 'Sem C');
    // Demote Sem C via keyboard so Backlog has one item
    await rowFor(page, 'Sem C').getByRole('button', { name: /^Reorder task: / }).focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(80);
    await page.keyboard.press('Space');
    await expect(rowFor(page, 'Sem C')).toHaveClass(/opacity-\[0\.88\]/);

    await expect(page.getByRole('heading', { level: 1, name: 'My tasks' })).toHaveCount(1);
    const today = page.getByRole('region', { name: 'Today' });
    const backlog = page.getByRole('region', { name: 'Backlog' });
    await expect(today.getByRole('list').getByRole('listitem')).toHaveCount(2);
    await expect(backlog.getByRole('list').getByRole('listitem')).toHaveCount(1);
    await expect(rowFor(page, 'Sem A').getByRole('button', { name: 'Reorder task: Sem A' })).toHaveCount(1);
    await expect(rowFor(page, 'Sem A').getByText('Medium priority')).toHaveCount(1);
  });

  test('3.4-E2E-005 (P0): Add journey by keyboard, Escape clears and keeps focus', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    await tabTo(page, input);
    await page.keyboard.type('Keyboard added');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Keyboard added', { exact: true })).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');

    await page.keyboard.type('draft');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('3.4-E2E-006 (P0): Review & Complete by keyboard keeps focus on a neighbour', async ({ page }) => {
    await page.goto('/');
    for (const t of ['RA', 'RB', 'RC']) await addTask(page, t);

    await tabTo(page, rowFor(page, 'RB').getByRole('button', { name: 'Mark complete: RB' }));
    await page.keyboard.press('Enter');
    await expect(rowFor(page, 'RB')).toHaveCount(0);
    await expect.poll(() => activeLabel(page)).toBe('Mark complete: RC');

    await page.keyboard.press('Enter');
    await expect(rowFor(page, 'RC')).toHaveCount(0);
    await expect.poll(() => activeLabel(page)).toBe('Mark complete: RA');

    await page.keyboard.press('Enter');
    await expect(rowFor(page, 'RA')).toHaveCount(0);
    await expect.poll(() => activeLabel(page)).toBe('Add a task');
  });

  test('3.4-E2E-007 (P1): Reprioritize journey by keyboard', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'KA');
    await addTask(page, 'KB');
    await tabTo(page, rowFor(page, 'KA').getByRole('button', { name: /^Reorder task: / }));
    for (const k of ['Space', 'ArrowDown', 'Space']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(80);
    }
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    await expect(rows.nth(0)).toContainText('KB');
    await expect(rows.nth(1)).toContainText('KA');
  });

  test('3.4-E2E-008 (P1): the drawer is a modal dialog that traps and returns focus', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'Dialog task');
    const edit = rowFor(page, 'Dialog task').getByRole('button', { name: 'Edit task: Dialog task' });
    await tabTo(page, edit);
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Edit Task' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(edit).toBeFocused();
  });

  test('3.4-E2E-009 (P2): pinch-zoom is not disabled', async ({ page }) => {
    await page.goto('/');
    const content = (await page.locator('meta[name="viewport"]').getAttribute('content')) ?? '';
    expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(content).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/);
  });
});
