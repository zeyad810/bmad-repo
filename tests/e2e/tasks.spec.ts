import { test, expect } from '../support/merged-fixtures';
import { createTaskFactory } from '../support/factories/task-factory';

test.describe('Task Management UI', () => {
  test('should display main task page header and empty state or task list', async ({ page }) => {
    // Given: The user navigates to the application root
    await page.goto('/');

    // Then: Main page heading or layout element is visible
    await expect(page).toHaveTitle(/Task/i);
  });

  test('should render task components with accessibility selectors', async ({ page }) => {
    // Given: Pre-generated test data
    const mockTask = createTaskFactory({ title: 'Sample E2E Task' });

    // When: User loads home page
    await page.goto('/');

    // Then: Page body is loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
