/**
 * Assertion Helpers — Reusable, Logged Assertions
 * ================================================
 * Wraps Playwright assertions with:
 * - Custom error messages
 * - Activity logging integration
 * - Consistent timeout handling
 * - Better failure diagnostics
 *
 * Usage:
 *   import { assertVisible, assertText } from '@/tests/core/assertions/assertionHelpers';
 *
 *   await assertVisible(page.locator('button'), {
 *     message: 'Login button should be visible',
 *     timeout: 10000,
 *     logger,
 *   });
 */

import { expect, type Locator, type Page } from '@playwright/test';
import type { ActivityLogger } from '../activity/ActivityLogger';

interface AssertionOptions {
  message?: string;
  timeout?: number;
  logger?: ActivityLogger;
}

/**
 * Assert that a locator is visible on the page.
 */
export async function assertVisible(locator: Locator, options?: AssertionOptions): Promise<void> {
  const message = options?.message || 'Element should be visible';
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert visible: ${message}`);

  try {
    await expect(locator, message).toBeVisible({ timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that a locator is hidden (not visible) on the page.
 */
export async function assertHidden(locator: Locator, options?: AssertionOptions): Promise<void> {
  const message = options?.message || 'Element should be hidden';
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert hidden: ${message}`);

  try {
    await expect(locator, message).toBeHidden({ timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that a locator contains specific text.
 */
export async function assertText(
  locator: Locator,
  expected: string | RegExp,
  options?: AssertionOptions,
): Promise<void> {
  const message = options?.message || `Element should contain text: ${expected}`;
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert text: ${message}`);

  try {
    await expect(locator, message).toHaveText(expected, { timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that the page URL matches a pattern.
 */
export async function assertUrlContains(
  page: Page,
  expected: string | RegExp,
  options?: AssertionOptions,
): Promise<void> {
  const message = options?.message || `URL should contain: ${expected}`;
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert URL: ${message}`);

  try {
    await expect(page, message).toHaveURL(expected, { timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`, { url: page.url() });
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`, { url: page.url() });
    throw error;
  }
}

/**
 * Assert that a locator is enabled (not disabled).
 */
export async function assertEnabled(locator: Locator, options?: AssertionOptions): Promise<void> {
  const message = options?.message || 'Element should be enabled';
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert enabled: ${message}`);

  try {
    await expect(locator, message).toBeEnabled({ timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that a locator is disabled.
 */
export async function assertDisabled(locator: Locator, options?: AssertionOptions): Promise<void> {
  const message = options?.message || 'Element should be disabled';
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert disabled: ${message}`);

  try {
    await expect(locator, message).toBeDisabled({ timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that an API response has a successful status (200-299).
 */
export async function assertApiOk(
  response: { status: () => number; statusText: () => string; url: () => string },
  options?: Omit<AssertionOptions, 'timeout'>,
): Promise<void> {
  const status = response.status();
  const message = options?.message || `API response should be OK (got ${status} ${response.statusText()})`;

  options?.logger?.logAction('assertion', `Assert API OK: ${message}`, {
    url: response.url(),
    status,
    statusText: response.statusText(),
  });

  try {
    expect(status, message).toBeGreaterThanOrEqual(200);
    expect(status, message).toBeLessThan(300);
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that a locator has a specific attribute value.
 */
export async function assertAttribute(
  locator: Locator,
  attribute: string,
  expected: string | RegExp,
  options?: AssertionOptions,
): Promise<void> {
  const message = options?.message || `Element attribute "${attribute}" should be: ${expected}`;
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert attribute: ${message}`);

  try {
    await expect(locator, message).toHaveAttribute(attribute, expected, { timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Assert that a locator has a specific count.
 */
export async function assertCount(locator: Locator, expected: number, options?: AssertionOptions): Promise<void> {
  const message = options?.message || `Element count should be: ${expected}`;
  const timeout = options?.timeout || 15000;

  options?.logger?.logAction('assertion', `Assert count: ${message}`);

  try {
    await expect(locator, message).toHaveCount(expected, { timeout });
    options?.logger?.logAction('assertion', `✓ ${message}`);
  } catch (error) {
    options?.logger?.logAction('assertion', `✗ ${message}: ${(error as Error).message}`);
    throw error;
  }
}
