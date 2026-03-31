/**
 * Onboarding Test Suite
 * ======================
 * TODO: Implement CS company creation flow tests.
 *
 * This suite covers the CS Dashboard onboarding flows, including:
 * - Company creation by a CS agent
 * - Inviting users to a newly created company
 * - Verifying onboarding state in the UI
 *
 * These tests depend on the `setup` project for authenticated state.
 * Tag all tests with @onboarding so they run via `npm run test:onboarding`.
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding — CS company creation', { tag: '@onboarding' }, () => {
  // TODO: Replace with real onboarding tests once CS Dashboard flows are confirmed.
  test.skip('placeholder — onboarding tests not yet implemented', async ({ page }) => {
    // Step 1: Navigate to CS dashboard
    await page.goto('/cs/dashboard');

    // Step 2: Create a new company
    // TODO: implement company creation steps

    // Step 3: Verify company appears in list
    // TODO: add assertions

    await expect(page).toHaveURL(/dashboard/);
  });
});
