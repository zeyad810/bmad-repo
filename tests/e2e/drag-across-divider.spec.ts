import { test, expect } from '../support/merged-fixtures';

// Coverage for Story 1.7 (Drag Across the Divider to Promote or Demote a Task).
// Test IDs follow the Epic 1 test-design doc's P0/P1/P2 breakdown for Story 1.7.
// Uses the same real-pointer-sequence drag technique as tests/e2e/task-reorder.spec.ts
// (locator.dragTo() fires HTML5 drag events, which @dnd-kit's PointerSensor ignores).
async function realDrag(
  page: import('@playwright/test').Page,
  fromHandleBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number }
) {
  await page.mouse.move(fromHandleBox.x + fromHandleBox.width / 2, fromHandleBox.y + fromHandleBox.height / 2);
  await page.mouse.down();
  // Move past the 4px activationConstraint before the drop target move
  await page.mouse.move(
    fromHandleBox.x + fromHandleBox.width / 2,
    fromHandleBox.y + fromHandleBox.height / 2 + 10,
    { steps: 5 }
  );
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

test.describe('Drag across the Today/Backlog divider', () => {
  test('1.7-E2E-001 (P0): dragging a Backlog task into Today sets status to next', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    // Both quick-added tasks default into Today (Story 1.6)
    await input.fill('Move to Today');
    await input.press('Enter');
    await expect(page.getByText('Move to Today')).toBeVisible();
    await input.fill('Stays in Today');
    await input.press('Enter');
    await expect(page.getByText('Stays in Today')).toBeVisible();
    await expect(rows).toHaveCount(2);

    // First, drag "Move to Today" into the empty Backlog to get it into Backlog
    const backlogEmpty = page.getByText('Backlog is clear');
    await expect(backlogEmpty).toBeVisible();
    let handleBox = await rows.filter({ hasText: 'Move to Today' }).getByLabel('Reorder task').boundingBox();
    let targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const backlogRow = rows.filter({ hasText: 'Move to Today' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    // Let @dnd-kit's sibling-reflow transform transition (NFR6) settle before the
    // next drag — measuring/grabbing mid-transition can miss the real target position.
    await page.waitForTimeout(350);

    // Now drag it back into Today, onto the remaining Today row
    handleBox = await backlogRow.getByLabel('Reorder task').boundingBox();
    targetBox = await rows.filter({ hasText: 'Stays in Today' }).boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const todayRow = rows.filter({ hasText: 'Move to Today' });
    await expect(todayRow).not.toHaveClass(/opacity-\[0\.88\]/);

    const dividerY = (await page.getByText('BACKLOG', { exact: true }).boundingBox())!.y;
    const rowY = (await todayRow.boundingBox())!.y;
    expect(rowY).toBeLessThan(dividerY);
  });

  test('1.7-E2E-002 (P0): dragging a Today task into Backlog sets status to backlog', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await input.fill('Demote me');
    await input.press('Enter');
    await expect(page.getByText('Demote me')).toBeVisible();
    await expect(rows).toHaveCount(1);

    const backlogEmpty = page.getByText('Backlog is clear');
    await expect(backlogEmpty).toBeVisible();

    const handleBox = await rows.filter({ hasText: 'Demote me' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    const backlogRow = rows.filter({ hasText: 'Demote me' });
    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
    await expect(backlogRow).toHaveCSS('opacity', '0.88');

    const dividerY = (await page.getByText('BACKLOG', { exact: true }).boundingBox())!.y;
    const rowY = (await backlogRow.boundingBox())!.y;
    expect(rowY).toBeGreaterThan(dividerY);
  });

  test('1.7-E2E-003 (P1): same-section drag only changes position, not status', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    // Get two tasks into Backlog first (dogfooding the cross-section drag)
    await input.fill('BL Task 1');
    await input.press('Enter');
    await expect(page.getByText('BL Task 1')).toBeVisible();
    await input.fill('BL Task 2');
    await input.press('Enter');
    await expect(page.getByText('BL Task 2')).toBeVisible();

    const backlogEmpty = page.getByText('Backlog is clear');
    let handleBox = await rows.filter({ hasText: 'BL Task 1' }).getByLabel('Reorder task').boundingBox();
    let targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);
    // Let the sibling-reflow transition settle before measuring the next target.
    await page.waitForTimeout(350);

    handleBox = await rows.filter({ hasText: 'BL Task 2' }).getByLabel('Reorder task').boundingBox();
    targetBox = await rows.filter({ hasText: 'BL Task 1' }).boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    // Both now in Backlog at .88 opacity
    await expect(rows.filter({ hasText: 'BL Task 1' })).toHaveClass(/opacity-\[0\.88\]/);
    await expect(rows.filter({ hasText: 'BL Task 2' })).toHaveClass(/opacity-\[0\.88\]/);
    await page.waitForTimeout(350);

    // Same-section drag within Backlog: reorder BL Task 1 above BL Task 2
    handleBox = await rows.filter({ hasText: 'BL Task 1' }).getByLabel('Reorder task').boundingBox();
    targetBox = await rows.filter({ hasText: 'BL Task 2' }).boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    // Both rows remain in Backlog (opacity unchanged) — only position changed, not section/status
    await expect(rows.filter({ hasText: 'BL Task 1' })).toHaveClass(/opacity-\[0\.88\]/);
    await expect(rows.filter({ hasText: 'BL Task 2' })).toHaveClass(/opacity-\[0\.88\]/);
    await expect(page.getByText('Backlog is clear')).not.toBeVisible();
  });

  test('1.7-E2E-004 (P2): promote/demote drag settles with no confirmation dialog or toast', async ({ page }) => {
    await page.goto('/');
    const input = page.getByLabel('Add a task');
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });

    await input.fill('Quiet move');
    await input.press('Enter');
    await expect(page.getByText('Quiet move')).toBeVisible();

    const backlogEmpty = page.getByText('Backlog is clear');
    const handleBox = await rows.filter({ hasText: 'Quiet move' }).getByLabel('Reorder task').boundingBox();
    const targetBox = await backlogEmpty.boundingBox();
    if (!handleBox || !targetBox) throw new Error('Could not measure positions');
    await realDrag(page, handleBox, targetBox);

    await expect(rows.filter({ hasText: 'Quiet move' })).toHaveClass(/opacity-\[0\.88\]/);

    // No modal/dialog/toast anywhere in the DOM after the drop settles
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/confirm\?/i)).toHaveCount(0);
  });
});
