/**
 * Diagnostics Fixture — Automatic Browser Event Collection
 * =========================================================
 * Playwright fixture that automatically starts diagnostics collection
 * at the beginning of each test and attaches results at the end.
 *
 * Usage in tests:
 *   test('my test', async ({ page, diagnostics }) => {
 *     // diagnostics is already collecting
 *     // ... test code ...
 *     // diagnostics.json will be attached automatically
 *   });
 */

import { test as base } from '@playwright/test';
import { DiagnosticsCollector } from './DiagnosticsCollector';

type DiagnosticsFixtures = {
  diagnostics: DiagnosticsCollector;
};

export const test = base.extend<DiagnosticsFixtures>({
  diagnostics: async ({ page }, use, testInfo) => {
    const diagnostics = new DiagnosticsCollector(page, testInfo);
    await diagnostics.startCollection();

    // Provide diagnostics to the test
    await use(diagnostics);

    // After test completes, attach diagnostics
    await diagnostics.attachToTest();
  },
});

export { expect } from '@playwright/test';
