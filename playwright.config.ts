import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const prodServer = !!process.env.E2E_PROD;
const serverPort = new URL(baseURL).port || 3000;

/**
 * Playwright Test Configuration for Task Manager (Next.js)
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: '_bmad-output/test-artifacts/playwright-report', open: 'never' }],
    ['junit', { outputFile: '_bmad-output/test-artifacts/junit-results.xml' }],
  ],
  use: {
    baseURL,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: prodServer
      ? `npm run build && npx next start -p ${serverPort}`
      : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI && !prodServer,
    timeout: (prodServer ? 240 : 120) * 1000,
  },
});
