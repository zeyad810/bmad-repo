import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.10 (Quiet Initial Hydration State).
// Test IDs follow the Epic 1 test-design doc's P1 rows for Story 1.10
// (1.10-E2E-001, 1.10-E2E-002). 1.10-E2E-003 (P3) is manual/exploratory per
// the test design and is not automated here.
//
// role="status" scoping note (same precedent as tests/e2e/quiet-motion.spec.ts):
// @dnd-kit's DndContext renders its own permanent, visually-hidden a11y live
// region (#DndLiveRegion-*, role="status") whenever it mounts — this is not a
// loading spinner. DndContext is gated behind `hydrated` in this app, so it
// doesn't exist pre-hydration, but it mounts (as expected) the moment
// hydration completes and the real tree renders — well within this test's
// assertion window. Always exclude it, the same way Story 1.9 does.
function spinnerLocator(page: import('@playwright/test').Page) {
  return page.locator('[role="status"]:not([id^="DndLiveRegion"])');
}

test.describe('Quiet initial hydration state', () => {
  test('1.10-E2E-001 (P1): shows a skeleton before hydration, never a spinner', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'CPU throttling requires a CDP session, only available on Chromium — see Dev Notes for this documented cross-browser gap.'
    );

    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const skeleton = page.getByLabel('Loading tasks');
    await expect(skeleton).toBeVisible();
    await expect(spinnerLocator(page)).toHaveCount(0);

    await expect(skeleton).toBeHidden();
    await expect(page.getByLabel('Add a task')).toBeVisible();

    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });

  test('1.10-E2E-002 (P1): after hydration, skeleton is gone and real content renders with tokens applied', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Loading tasks')).toBeHidden();
    await expect(page.getByLabel('Add a task')).toBeVisible();
    await expect(page.getByText('Nothing here yet')).toBeVisible();
    await expect(page.getByText('BACKLOG', { exact: true })).toBeVisible();
    await expect(page.getByText('Backlog is clear')).toBeVisible();
    await expect(spinnerLocator(page)).toHaveCount(0);

    // Confirms real content, not a flash of unstyled HTML — the Graphite
    // Violet token is actually resolved on the page, not just present in CSS source.
    const surfaceToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()
    );
    expect(surfaceToken).toBe('#13141a');
  });

  // 1.10-E2E-003 (P3, manual/exploratory per the Epic 1 test design): confirm
  // on a real machine that near-instant hydration shows no perceptible
  // skeleton flash. Not automated — see story Completion Notes.
});
