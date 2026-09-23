# Playwright Test Suite for Task Manager

This directory contains the End-to-End (E2E) and API test suites built with [Playwright](https://playwright.dev/).

---

## 🚀 Quick Start

### 1. Install Dependencies
Ensure Playwright and browsers are installed:
```bash
npx playwright install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` or set environment variables:
```bash
cp .env.example .env.local
```

---

## 🧪 Running Tests

| Command | Description |
| :--- | :--- |
| `npm run test:e2e` | Run all E2E tests headless |
| `npm run test:e2e:a11y` | Run the accessibility, responsive journey, and touch-target gate |
| `npm run test:e2e:ui` | Run tests with interactive Playwright UI mode |
| `npm run test:e2e:headed` | Run tests in headed browser mode |
| `npm run test:e2e:debug` | Run tests in debug step-by-step mode |
| `npm run test:e2e:report` | View the generated HTML test report |

### Run Against a Production Build

Use a clean port to build and serve the production application before Playwright runs.

PowerShell:

```powershell
$env:E2E_PROD='1'; $env:BASE_URL='http://localhost:3100'; npx playwright test --project=chromium
```

Bash:

```bash
E2E_PROD=1 BASE_URL=http://localhost:3100 npx playwright test --project=chromium
```

Unset `E2E_PROD` to return to the default development-server flow.

---

## 🏗️ Architecture Overview

- **`tests/e2e/`**: Spec files for UI and API tests (`*.spec.ts`).
- **`tests/support/merged-fixtures.ts`**: Merged Playwright fixtures (`test`, `expect`). Always import `test` from here instead of `@playwright/test`.
- **`tests/support/auth-fixture.ts`**: Reusable auth provider and token fixtures.
- **`tests/support/fixtures/axe-fixture.ts`**: WCAG-tagged axe builder fixture and readable violation formatting.
- **`tests/support/factories/`**: Test data factory functions (e.g. `createTaskFactory`).

---

## 🎯 Best Practices

1. **Explicit Selectors:** Prefer user-facing roles and `data-testid` attributes over brittle CSS or XPath selectors.
2. **Isolation:** Every test must be independent and runnable in parallel.
3. **No Hardcoded Sleeps:** Use auto-waiting assertions (`expect(locator).toBeVisible()`) rather than static timeouts.
4. **Given / When / Then Structure:** Maintain clean, structured test steps for high readability.

---

## 🔄 CI Integration

The test suite runs automatically on CI pull-request checks via Playwright CLI with HTML and JUnit XML output artifacts saved to `_bmad-output/test-artifacts/`.
