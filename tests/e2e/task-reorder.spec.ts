import { test, expect } from '../support/merged-fixtures';

// Regression coverage for Story 1.3 (TaskRow replaces TaskCard): the @dnd-kit
// drag-and-drop wiring in DraggableTaskList.tsx must keep working unchanged.
// Test ID: 1.3-E2E-003 (Epic 1 test design, sole P0 gate for this story).
test.describe('Task reorder via drag-and-drop', () => {
  test('dragging a task row above another reorders the queue', async ({ page }) => {
    // Given: two tasks exist in the queue, created through the real quick-capture form
    // (this app is pure localStorage-backed — there is no seed/API layer to bypass the UI with)
    await page.goto('/');

    // Story 1.4 replaced the old quick-capture form with QuickAddBar; locate the
    // input via its aria-label contract rather than incidental placeholder copy.
    const titleInput = page.getByLabel('Add a task');
    const addButton = page.getByRole('button', { name: /add task/i });

    await titleInput.fill('Task A');
    await addButton.click();
    await titleInput.fill('Task B');
    await addButton.click();

    const handles = page.getByLabel('Reorder task');
    await expect(handles).toHaveCount(2);

    // Rows are identified by their drag handle's aria-label (added in Story 1.3), not a data-testid
    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Task A');
    await expect(rows.nth(1)).toContainText('Task B');

    const firstHandleBox = await handles.nth(0).boundingBox();
    const secondRowBox = await rows.nth(1).boundingBox();
    if (!firstHandleBox || !secondRowBox) {
      throw new Error('Could not measure drag handle/row positions');
    }

    // When: the first row is dragged below the second
    // NOTE: locator.dragTo() fires HTML5 drag events, which @dnd-kit's PointerSensor
    // does not listen for — a real pointer sequence is required instead.
    await page.mouse.move(firstHandleBox.x + firstHandleBox.width / 2, firstHandleBox.y + firstHandleBox.height / 2);
    await page.mouse.down();
    // Move past the 4px activationConstraint configured in DraggableTaskList.tsx before the drop target move
    await page.mouse.move(
      firstHandleBox.x + firstHandleBox.width / 2,
      firstHandleBox.y + firstHandleBox.height / 2 + 10,
      { steps: 5 }
    );
    // Drop at the target row's own center (not an arbitrary offset) so this stays
    // correct regardless of row height across browsers/font rendering.
    await page.mouse.move(
      secondRowBox.x + secondRowBox.width / 2,
      secondRowBox.y + secondRowBox.height / 2,
      { steps: 10 }
    );
    await page.mouse.up();

    // Then: the rendered order reflects the drag, confirming reorderTasks()/setSortMode("manual")
    // still fire correctly through TaskRow (replacing TaskCard)
    await expect(rows.nth(0)).toContainText('Task B');
    await expect(rows.nth(1)).toContainText('Task A');
  });
});
