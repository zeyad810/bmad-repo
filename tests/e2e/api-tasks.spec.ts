import { test, expect } from '../support/merged-fixtures';

test.describe('Task Management API', () => {
  test('should return 200 OK or appropriate status on health / root check', async ({ request }) => {
    // Given: An API request to the root or health endpoint
    const response = await request.get('/');

    // Then: Response status is OK (200)
    expect(response.status()).toBeLessThan(400);
  });
});
