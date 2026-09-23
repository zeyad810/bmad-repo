import { test, expect } from '../support/merged-fixtures';
import type { Locator, Page } from '@playwright/test';

// Coverage for Story 3.1 (Restyle Sidebar & BottomNav).
// Test IDs assigned directly under the 3.1-E2E-* prefix, following the
// convention used by Stories 2.1–2.4.

const ACCENT = 'rgb(124, 138, 255)';
const ACCENT_SOFT = 'rgba(124, 138, 255, 0.14)';
const TEXT = 'rgb(231, 232, 236)';
const TEXT_DIM = 'rgb(139, 141, 152)';
const SURFACE_2 = 'rgb(25, 27, 34)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const MOBILE = { width: 390, height: 844 };

// Tailwind v4 palette colors compute to oklch(), so "not amber rgb" checks
// pass vacuously — scan class names for ad hoc palette/hex utilities instead.
async function bannedClasses(root: Locator) {
  return root.evaluate((el) =>
    [el, ...Array.from(el.querySelectorAll('*'))]
      .map((n) => n.getAttribute('class') ?? '')
      .filter((c) => /(?:amber|emerald|zinc)-|white\/|#[0-9a-fA-F]{3,6}\b/.test(c))
  );
}

function css(locator: Locator, prop: string) {
  return locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
}

function bottomNav(page: Page) {
  return page.getByTestId('bottom-nav');
}

test.describe('Sidebar & BottomNav restyle', () => {
  test('3.1-E2E-001 (P1): Sidebar has no ad hoc color utilities or inline styles', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    expect(await bannedClasses(sidebar)).toEqual([]);
    await expect(sidebar.locator('[style]')).toHaveCount(0);

    const brandChip = sidebar.getByTestId('brand-mark');
    expect(await css(brandChip, 'background-color')).toBe(SURFACE_2);
  });

  test('3.1-E2E-002 (P1): Sidebar active item uses --accent-soft background only', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('aside');
    const myTasks = sidebar.getByRole('link', { name: /my tasks/i });
    const completed = sidebar.getByRole('link', { name: /completed/i });

    await expect(myTasks).toHaveAttribute('aria-current', 'page');
    await expect(completed).not.toHaveAttribute('aria-current', /.*/);
    expect(await css(myTasks, 'background-color')).toBe(ACCENT_SOFT);
    expect(await css(myTasks, 'color')).toBe(TEXT);
    expect(await css(completed, 'background-color')).toBe(TRANSPARENT);
    expect(await css(completed, 'color')).toBe(TEXT_DIM);

    await completed.click();
    await expect(page).toHaveURL(/\/completed$/);
    await expect(completed).toHaveAttribute('aria-current', 'page');
    await expect(myTasks).not.toHaveAttribute('aria-current', /.*/);
    await expect.poll(() => css(completed, 'background-color')).toBe(ACCENT_SOFT);
    await expect.poll(() => css(myTasks, 'background-color')).toBe(TRANSPARENT);
  });

  test('3.1-E2E-003 (P1): Mobile shows a token-styled BottomNav instead of the Sidebar', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    await expect(bottomNav(page)).toBeVisible();
    await expect(page.locator('aside')).toBeHidden();
    expect(await bannedClasses(bottomNav(page))).toEqual([]);
    await expect(bottomNav(page).locator('[style]')).toHaveCount(0);
  });

  test('3.1-E2E-004 (P1): BottomNav active tab differs by accent color only', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    const nav = bottomNav(page);
    const tasks = nav.getByRole('link', { name: 'Tasks' });
    const completed = nav.getByRole('link', { name: 'Completed' });

    await expect(tasks).toHaveAttribute('aria-current', 'page');
    expect(await css(tasks, 'color')).toBe(ACCENT);
    expect(await css(completed, 'color')).toBe(TEXT_DIM);

    for (const prop of ['background-color', 'font-size', 'font-weight']) {
      expect(await css(tasks, prop)).toBe(await css(completed, prop));
    }
    const [tasksIcon, completedIcon] = [tasks.locator('svg').first(), completed.locator('svg').first()];
    const [a, b] = [await tasksIcon.boundingBox(), await completedIcon.boundingBox()];
    if (!a || !b) throw new Error('Could not measure nav icons');
    expect(a.width).toBe(b.width);
    expect(a.height).toBe(b.height);
    expect(await tasksIcon.getAttribute('stroke-width')).toBe(await completedIcon.getAttribute('stroke-width'));

    await completed.click();
    await expect(page).toHaveURL(/\/completed$/);
    await expect(completed).toHaveAttribute('aria-current', 'page');
    // The links transition colors; wait for the token endpoints after routing.
    await expect.poll(() => css(completed, 'color')).toBe(ACCENT);
    await expect.poll(() => css(tasks, 'color')).toBe(TEXT_DIM);
  });

  test('3.1-E2E-005 (P2): BottomNav tap targets are at least 44px tall', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');

    const links = bottomNav(page).getByRole('link');
    await expect(links).toHaveCount(2);
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      if (!box) throw new Error('Could not measure nav link');
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
