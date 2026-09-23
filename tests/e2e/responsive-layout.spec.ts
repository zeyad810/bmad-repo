import { test, expect } from '../support/merged-fixtures';
import type { Locator, Page } from '@playwright/test';

// Coverage for Story 3.2 (Responsive Breakpoint & Touch Target Compliance).
// Test IDs follow the 3.x-E2E-* convention from Stories 2.1–3.1.

const MOBILE = { width: 390, height: 844 };
const SMALL_MOBILE = { width: 320, height: 568 };
const MOBILE_EDGE = { width: 767, height: 900 };
const DESKTOP_EDGE = { width: 768, height: 900 };
const TABLET = { width: 1024, height: 768 };
const DESKTOP = { width: 1280, height: 720 };

async function expectMinTarget(locator: Locator, min = 44) {
  const box = await locator.boundingBox();
  expect(box, 'element must be rendered').not.toBeNull();
  // Chromium can report exact 44px CSS targets as 43.99998 physical pixels.
  expect(box!.width).toBeGreaterThanOrEqual(min - 0.01);
  expect(box!.height).toBeGreaterThanOrEqual(min - 0.01);
}

async function addTask(page: Page, title: string) {
  const input = page.getByPlaceholder('Add a task...');
  await input.fill(title);
  await input.press('Enter');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

function rowFor(page: Page, title: string) {
  return page.locator('div.group', { has: page.getByLabel('Reorder task') }).filter({ hasText: title });
}

async function shellState(page: Page) {
  const aside = page.locator('aside');
  return {
    aside: await aside.isVisible(),
    bottomNav: await page.getByTestId('bottom-nav').isVisible(),
    mobileBrand: await page.getByTestId('mobile-brand-mark').isVisible(),
    asideWidth: (await aside.boundingBox())?.width ?? 0,
  };
}

test.describe('Responsive breakpoint & touch targets', () => {
  test('3.2-E2E-001 (P0): 767px is mobile, 768px is desktop', async ({ page }) => {
    await page.setViewportSize(MOBILE_EDGE);
    await page.goto('/');
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    await expect(page.locator('aside')).toBeHidden();
    await expect(page.getByTestId('mobile-brand-mark')).toBeVisible();

    await page.setViewportSize(DESKTOP_EDGE);
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByTestId('bottom-nav')).toBeHidden();
    await expect(page.getByTestId('mobile-brand-mark')).toBeHidden();
  });

  test('3.2-E2E-002 (P1): tablet widths render the same layout as desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await expect(page.locator('aside')).toBeVisible();
    const desktop = await shellState(page);
    expect(desktop).toEqual({ aside: true, bottomNav: false, mobileBrand: false, asideWidth: 252 });

    for (const size of [DESKTOP_EDGE, TABLET]) {
      await page.setViewportSize(size);
      await expect(page.locator('aside')).toBeVisible();
      expect(await shellState(page)).toEqual(desktop);
    }
  });

  for (const size of [MOBILE, SMALL_MOBILE]) {
    test(`3.2-E2E-003 (P1): single column with no horizontal scroll at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const long = 'Responsive long title '.padEnd(80, 'x');
      await addTask(page, 'Responsive short');
      await addTask(page, long);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      const a = (await rowFor(page, 'Responsive short').boundingBox())!;
      const b = (await rowFor(page, long).boundingBox())!;
      expect(a.x).toBe(b.x);
      expect(a.x).toBeGreaterThanOrEqual(16);
      expect(a.x + a.width).toBeLessThanOrEqual(size.width - 16);
    });
  }

  test('3.2-E2E-004 (P0): row controls are at least 44x44 on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await addTask(page, 'Touch target task');
    const row = rowFor(page, 'Touch target task');

    await expectMinTarget(row.getByLabel('Reorder task'));
    await expectMinTarget(row.getByLabel('Mark complete'));
    await expectMinTarget(row.getByLabel('Edit task'));
    await expectMinTarget(row.getByLabel('Delete task'));
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    await row.getByLabel('Delete task').click();
    const armed = row.getByLabel('Confirm delete task');
    await expectMinTarget(armed);
    const clipped = await armed.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(clipped).toBe(false);
  });

  test('3.2-E2E-005 (P1): the last row is not covered by the BottomNav', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    for (let i = 1; i <= 8; i++) await addTask(page, `Scroll task ${i}`);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    const last = (await rows.last().boundingBox())!;
    const nav = (await page.getByTestId('bottom-nav').boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(nav.y);
  });

  test('3.2-E2E-006 (P2): drag handle keeps touch-action none, no inline styles, 44px quick-add', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await addTask(page, 'Inline style task');
    const row = rowFor(page, 'Inline style task');

    const touchAction = await row.getByLabel('Reorder task').evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe('none');
    await expect(row.locator('[style]')).toHaveCount(0);
    expect(await row.getAttribute('style')).toBeNull();

    expect((await page.getByPlaceholder('Add a task...').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await page.getByRole('button', { name: 'Add' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
