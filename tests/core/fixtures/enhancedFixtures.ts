/**
 * Enhanced Fixtures — Reliability & Resilience Framework
 * =======================================================
 * Extends the base test fixtures with enterprise-grade reliability features:
 * - Activity logging for step-by-step traceability
 * - Diagnostics collection (console logs, errors, failed requests)
 * - Resilient locators with fallback strategies
 *
 * Usage:
 *   import { test, expect } from '@/tests/core/fixtures/enhancedFixtures';
 *
 *   test('my test', async ({ page, activityLogger, diagnostics }) => {
 *     activityLogger.startStep('Login');
 *     // ... test code ...
 *     activityLogger.endStep('pass');
 *   });
 *
 * Note: This extends the existing fixtures from tests/fixtures/index.ts
 */

import { test as base } from '../../fixtures';
import { ActivityLogger } from '../activity/ActivityLogger';
import { DiagnosticsCollector } from '../diagnostics/DiagnosticsCollector';
import { ResilientLocator } from '../resilience/resilient-locator';
import {
  LOGIN_BUTTON_STRATEGY,
  PHONE_INPUT_STRATEGY,
  OTP_INPUT_STRATEGY,
  CONTINUE_BUTTON_STRATEGY,
  SUBMIT_OTP_BUTTON_STRATEGY,
  VALIDATION_MESSAGE_STRATEGY,
} from '../resilience/locator-strategy';

// Type definition for enhanced fixtures
export type EnhancedFixtures = {
  /** Activity logger for step-by-step action tracking */
  activityLogger: ActivityLogger;

  /** Diagnostics collector for browser events */
  diagnostics: DiagnosticsCollector;

  /** Resilient locator for login button */
  resilientLoginButton: ResilientLocator;

  /** Resilient locator for phone input */
  resilientPhoneInput: ResilientLocator;

  /** Resilient locator for OTP input */
  resilientOtpInput: ResilientLocator;

  /** Resilient locator for continue button */
  resilientContinueButton: ResilientLocator;

  /** Resilient locator for submit OTP button */
  resilientSubmitOtpButton: ResilientLocator;

  /** Resilient locator for validation message */
  resilientValidationMessage: ResilientLocator;
};

// Extend base test with enhanced fixtures
export const test = base.extend<EnhancedFixtures>({
  // ===========================================================================
  // Activity Logger Fixture
  // ===========================================================================
  activityLogger: async ({ page }, use, testInfo) => {
    const logger = new ActivityLogger(page, testInfo);

    // Provide logger to the test
    await use(logger);

    // Attach logs after test completes
    await logger.attachToTest();
  },

  // ===========================================================================
  // Diagnostics Collector Fixture
  // ===========================================================================
  diagnostics: async ({ page }, use, testInfo) => {
    const diagnostics = new DiagnosticsCollector(page, testInfo);
    await diagnostics.startCollection();

    // Provide diagnostics to the test
    await use(diagnostics);

    // Attach diagnostics after test completes
    await diagnostics.attachToTest();
  },

  // ===========================================================================
  // Resilient Locator Fixtures
  // ===========================================================================
  resilientLoginButton: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, LOGIN_BUTTON_STRATEGY, 'Login button', activityLogger);
    await use(locator);
  },

  resilientPhoneInput: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, PHONE_INPUT_STRATEGY, 'Phone input', activityLogger);
    await use(locator);
  },

  resilientOtpInput: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, OTP_INPUT_STRATEGY, 'OTP input', activityLogger);
    await use(locator);
  },

  resilientContinueButton: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, CONTINUE_BUTTON_STRATEGY, 'Continue button', activityLogger);
    await use(locator);
  },

  resilientSubmitOtpButton: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, SUBMIT_OTP_BUTTON_STRATEGY, 'Submit OTP button', activityLogger);
    await use(locator);
  },

  resilientValidationMessage: async ({ page, activityLogger }, use) => {
    const locator = new ResilientLocator(page, VALIDATION_MESSAGE_STRATEGY, 'Validation message', activityLogger);
    await use(locator);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
