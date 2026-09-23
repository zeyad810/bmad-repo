# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: delete-confirm.spec.ts >> In-place delete confirm >> 2.1-E2E-005 (P2): Clear archive uses in-place confirm instead of window.confirm()
- Location: tests\e2e\delete-confirm.spec.ts:111:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Delete Me 5b')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Delete Me 5b') with timeout 15000ms
  - waiting for getByText('Delete Me 5b')

```

```yaml
- complementary:
  - link "StickyTasks Personal command center":
    - /url: /
    - img
    - text: StickyTasks Personal command center
  - text: Workspace
  - navigation "Primary":
    - link "My tasks 1":
      - /url: /
      - img
      - text: My tasks 1
    - link "Completed 1":
      - /url: /completed
      - img
      - text: Completed 1
  - img
  - text: Today 1 completed
  - paragraph: Small wins add up. Keep your queue moving.
  - img
  - text: Prioritize what matters
- banner: Workspace synced locally Your focus board Private
- main:
  - link "Back to my tasks":
    - /url: /
    - img
    - text: Back to my tasks
  - paragraph: Archive
  - heading "Completed work." [level=1]
  - paragraph: A record of the things you have moved forward.
  - button "Clear archive":
    - img
    - text: Clear archive
  - img
  - heading "All completed" [level=2]
  - text: 1 Wednesday, September 23
  - article:
    - text: Medium 01
    - heading "Delete Me 5a" [level=3]
    - button "Restore task":
      - img
    - button "Edit task":
      - img
    - button "Delete task":
      - img
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
  23  | function failOnNativeDialog(page: Page) {
  24  |   page.on('dialog', (dialog) => {
  25  |     dialog.dismiss();
  26  |     throw new Error(`Unexpected native dialog appeared: ${dialog.message()}`);
  27  |   });
  28  | }
  29  | 
  30  | test.describe('In-place delete confirm', () => {
  31  |   test('2.1-E2E-001 (P0): tap-tap deletes a task from the active list, no native dialog', async ({ page }) => {
  32  |     failOnNativeDialog(page);
  33  |     await page.goto('/');
  34  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  35  | 
  36  |     await quickAdd(page, 'Delete Me 1');
  37  |     const row = rows.filter({ hasText: 'Delete Me 1' });
  38  |     const deleteBtn = row.getByLabel('Delete task');
  39  |     await deleteBtn.click();
  40  | 
  41  |     // First tap: enters confirm state, task must NOT be deleted yet
  42  |     await expect(page.getByText('Delete Me 1')).toBeVisible();
  43  |     const confirmBtn = row.getByLabel('Confirm delete task');
  44  |     await expect(confirmBtn).toBeVisible();
  45  | 
  46  |     // Second tap within the window: deletes
  47  |     await confirmBtn.click();
  48  |     await expect(page.getByText('Delete Me 1')).not.toBeVisible();
  49  |   });
  50  | 
  51  |   test('2.1-E2E-002 (P1): tapping elsewhere while confirming cancels the delete', async ({ page }) => {
  52  |     failOnNativeDialog(page);
  53  |     await page.goto('/');
  54  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  55  | 
  56  |     await quickAdd(page, 'Delete Me 2');
  57  |     const row = rows.filter({ hasText: 'Delete Me 2' });
  58  |     await row.getByLabel('Delete task').click();
  59  |     await expect(row.getByLabel('Confirm delete task')).toBeVisible();
  60  | 
  61  |     // Tap elsewhere on the page (outside the row)
  62  |     await page.mouse.click(5, 5);
  63  | 
  64  |     await expect(row.getByLabel('Delete task')).toBeVisible();
  65  |     await expect(page.getByText('Delete Me 2')).toBeVisible();
  66  |   });
  67  | 
  68  |   test('2.1-E2E-003 (P1): confirm window elapsing cancels the delete and reverts the icon', async ({ page }) => {
  69  |     failOnNativeDialog(page);
  70  |     await page.goto('/');
  71  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  72  | 
  73  |     await quickAdd(page, 'Delete Me 3');
  74  |     const row = rows.filter({ hasText: 'Delete Me 3' });
  75  |     await row.getByLabel('Delete task').click();
  76  |     await expect(row.getByLabel('Confirm delete task')).toBeVisible();
  77  | 
  78  |     // Window elapses (~2-3s) without a second tap
  79  |     await page.waitForTimeout(3000);
  80  | 
  81  |     await expect(row.getByLabel('Delete task')).toBeVisible();
  82  |     await expect(page.getByText('Delete Me 3')).toBeVisible();
  83  |   });
  84  | 
  85  |   test('2.1-E2E-004 (P1): Completed archive delete uses the identical confirm pattern', async ({ page }) => {
  86  |     failOnNativeDialog(page);
  87  |     await page.goto('/');
  88  |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  89  | 
  90  |     await quickAdd(page, 'Delete Me 4');
  91  |     const row = rows.filter({ hasText: 'Delete Me 4' });
  92  |     await row.getByLabel('Mark complete').click();
  93  |     await expect(page.getByText('Delete Me 4')).not.toBeVisible();
  94  | 
  95  |     await page.goto('/completed');
  96  |     const archiveRow = page.locator('article', { hasText: 'Delete Me 4' });
  97  |     await expect(archiveRow).toBeVisible();
  98  |     const deleteBtn = archiveRow.getByTitle('Delete task');
  99  |     await deleteBtn.click();
  100 | 
  101 |     // First tap: enters confirm state, still present
  102 |     await expect(archiveRow).toBeVisible();
  103 |     const confirmBtn = archiveRow.getByTitle('Tap again to confirm');
  104 |     await expect(confirmBtn).toBeVisible();
  105 | 
  106 |     // Second tap: deletes
  107 |     await confirmBtn.click();
  108 |     await expect(page.getByText('Delete Me 4')).not.toBeVisible();
  109 |   });
  110 | 
  111 |   test('2.1-E2E-005 (P2): Clear archive uses in-place confirm instead of window.confirm()', async ({ page }) => {
  112 |     failOnNativeDialog(page);
  113 |     await page.goto('/');
  114 |     const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
  115 | 
  116 |     await quickAdd(page, 'Delete Me 5a');
  117 |     await rows.filter({ hasText: 'Delete Me 5a' }).getByLabel('Mark complete').click();
  118 |     await quickAdd(page, 'Delete Me 5b');
  119 |     await rows.filter({ hasText: 'Delete Me 5b' }).getByLabel('Mark complete').click();
  120 | 
  121 |     await page.goto('/completed');
  122 |     await expect(page.getByText('Delete Me 5a')).toBeVisible();
> 123 |     await expect(page.getByText('Delete Me 5b')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  124 | 
  125 |     const clearBtn = page.getByRole('button', { name: /clear archive/i });
  126 |     await clearBtn.click();
  127 | 
  128 |     // First tap: enters confirm state, tasks remain
  129 |     await expect(page.getByText('Delete Me 5a')).toBeVisible();
  130 |     await expect(page.getByText('Delete Me 5b')).toBeVisible();
  131 |     const confirmBtn = page.getByRole('button', { name: /tap to confirm/i });
  132 |     await expect(confirmBtn).toBeVisible();
  133 | 
  134 |     // Second tap: clears the archive
  135 |     await confirmBtn.click();
  136 |     await expect(page.getByText('Delete Me 5a')).not.toBeVisible();
  137 |     await expect(page.getByText('Delete Me 5b')).not.toBeVisible();
  138 |     await expect(page.getByText('Nothing here yet')).toBeVisible();
  139 |   });
  140 | });
  141 | 
```