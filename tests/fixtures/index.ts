/**
 * Custom Playwright Fixtures
 * ===========================
 * Extends Playwright's base test fixtures with:
 * - Pre-authenticated page fixture
 * - API client fixture
 * - Test data cleanup fixture
 * - Common page object fixtures
 *
 * Usage:
 *   import { test, expect } from '../fixtures';
 *   test('my test', async ({ authenticatedPage, apiClient }) => { ... });
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { ApiClient } from '../api/apiClient';
import { LoginPage } from '../pages/LoginPage';

// Define custom fixture types
export type TestFixtures = {
  /** API client for backend operations */
  apiClient: ApiClient;

  /** Login page object */
  loginPage: LoginPage;

  /** Page that is already authenticated (uses stored auth state) */
  authenticatedPage: Page;

  /** Fresh page without any auth state */
  freshPage: Page;

  /** Test data cleanup handler */
  testDataCleanup: TestDataCleanup;
};

export type TestDataCleanup = {
  /** Register a cleanup function to run after the test */
  register: (cleanupFn: () => Promise<void>) => void;
};

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // ===========================================================================
  // API Client Fixture
  // ===========================================================================
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();

    // Provide the client to the test
    await use(client);

    // Cleanup after test
    await client.dispose();
  },

  // ===========================================================================
  // Login Page Fixture
  // ===========================================================================
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // ===========================================================================
  // Authenticated Page Fixture
  // ===========================================================================
  // This fixture uses the default page which already has auth state loaded
  // via the storageState option in playwright.config.ts
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  // ===========================================================================
  // Fresh Page Fixture (no auth state)
  // ===========================================================================
  freshPage: async ({ browser }, use) => {
    // Create a new context without the default storage state
    const context = await browser.newContext({
      storageState: undefined,
    });

    const page = await context.newPage();

    await use(page);

    // Cleanup
    await context.close();
  },

  // ===========================================================================
  // Test Data Cleanup Fixture
  // ===========================================================================
  testDataCleanup: async ({}, use) => {
    const cleanupFunctions: Array<() => Promise<void>> = [];

    const cleanup: TestDataCleanup = {
      register: (cleanupFn) => {
        cleanupFunctions.push(cleanupFn);
      },
    };

    await use(cleanup);

    // Run all registered cleanup functions after the test
    for (const fn of cleanupFunctions.reverse()) {
      try {
        await fn();
      } catch (error) {
        console.error('[TestDataCleanup] Cleanup function failed:', error);
      }
    }
  },
});

// Re-export expect for convenience
export { expect };

// ===========================================================================
// Additional Test Utilities
// ===========================================================================

/**
 * Wait for network idle (useful after complex actions)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a labeled screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, label: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `debug-${label}-${timestamp}.png`;
  await page.screenshot({ path: `test-results/${filename}`, fullPage: true });
  console.log(`[Debug] Screenshot saved: test-results/${filename}`);
}

/**
 * Retry an action with exponential backoff
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options: { maxAttempts?: number; initialDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, initialDelayMs = 1000, maxDelayMs = 10000 } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Retry] Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}
