/**
 * Recoverable Actions — Retry-Safe UI Interactions
 * =================================================
 * Provides controlled retry logic for transient UI failures.
 *
 * Design principles:
 * - Max 2 attempts per action (1 retry)
 * - Every retry is logged
 * - No silent failures
 * - Throws after exhausting attempts
 *
 * Common transient failures:
 * - Element detached from DOM during interaction
 * - Element obscured by animation
 * - Network delay causing stale state
 *
 * Usage:
 *   await recoverableClick(page.locator('button'), {
 *     maxAttempts: 2,
 *     logger,
 *   });
 */

import type { Locator, Page } from '@playwright/test';
import type { ActivityLogger } from '../activity/ActivityLogger';

interface RecoverableOptions {
  maxAttempts?: number;
  logger?: ActivityLogger;
  onRetry?: () => Promise<void>;
}

interface RecoverableFillOptions extends RecoverableOptions {
  clearFirst?: boolean;
}

interface RecoverableNavigationOptions extends RecoverableOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

/**
 * Click with retry on transient failures.
 */
export async function recoverableClick(locator: Locator, options?: RecoverableOptions): Promise<void> {
  const maxAttempts = options?.maxAttempts || 2;
  const logger = options?.logger;

  logger?.logAction('resilience', 'Recoverable click started', { maxAttempts });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await locator.click({ timeout: 10000 });
      logger?.logAction('click', `✓ Click succeeded (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const errorMessage = (error as Error).message;

      logger?.logAction('resilience', `✗ Click failed (attempt ${attempt}/${maxAttempts}): ${errorMessage}`);

      if (isLastAttempt) {
        logger?.logAction('resilience', 'All click attempts exhausted');
        throw error;
      }

      // Log recovery and optionally execute custom retry logic
      logger?.logRecovery('click retry', `Transient failure: ${errorMessage}`);
      if (options?.onRetry) {
        await options.onRetry();
      }

      // Small delay before retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

/**
 * Fill input with retry on transient failures.
 */
export async function recoverableFill(locator: Locator, value: string, options?: RecoverableFillOptions): Promise<void> {
  const maxAttempts = options?.maxAttempts || 2;
  const clearFirst = options?.clearFirst ?? true;
  const logger = options?.logger;
  const redactedValue = logger?.redactSensitive(value) || value;

  logger?.logAction('resilience', `Recoverable fill started: ${redactedValue}`, { maxAttempts, clearFirst });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (clearFirst) {
        await locator.clear({ timeout: 5000 });
      }
      await locator.fill(value, { timeout: 10000 });
      logger?.logAction('fill', `✓ Fill succeeded (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const errorMessage = (error as Error).message;

      logger?.logAction('resilience', `✗ Fill failed (attempt ${attempt}/${maxAttempts}): ${errorMessage}`);

      if (isLastAttempt) {
        logger?.logAction('resilience', 'All fill attempts exhausted');
        throw error;
      }

      logger?.logRecovery('fill retry', `Transient failure: ${errorMessage}`);
      if (options?.onRetry) {
        await options.onRetry();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

/**
 * Navigate with retry on transient failures.
 */
export async function recoverableNavigation(page: Page, url: string, options?: RecoverableNavigationOptions): Promise<void> {
  const maxAttempts = options?.maxAttempts || 2;
  const waitUntil = options?.waitUntil || 'domcontentloaded';
  const logger = options?.logger;

  logger?.logAction('resilience', `Recoverable navigation started: ${url}`, { maxAttempts, waitUntil });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(url, { waitUntil, timeout: 30000 });
      logger?.logAction('navigation', `✓ Navigation succeeded (attempt ${attempt}/${maxAttempts})`, { url });
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const errorMessage = (error as Error).message;

      logger?.logAction('resilience', `✗ Navigation failed (attempt ${attempt}/${maxAttempts}): ${errorMessage}`);

      if (isLastAttempt) {
        logger?.logAction('resilience', 'All navigation attempts exhausted');
        throw error;
      }

      logger?.logRecovery('navigation retry', `Transient failure: ${errorMessage}`);
      if (options?.onRetry) {
        await options.onRetry();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Wait for a condition with retry on transient failures.
 */
export async function recoverableWaitFor(
  locator: Locator,
  state: 'visible' | 'hidden' | 'attached' | 'detached',
  options?: RecoverableOptions & { timeout?: number },
): Promise<void> {
  const maxAttempts = options?.maxAttempts || 2;
  const timeout = options?.timeout || 15000;
  const logger = options?.logger;

  logger?.logAction('resilience', `Recoverable wait for ${state} started`, { maxAttempts, timeout });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await locator.waitFor({ state, timeout });
      logger?.logAction('wait', `✓ Wait for ${state} succeeded (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      const errorMessage = (error as Error).message;

      logger?.logAction('resilience', `✗ Wait for ${state} failed (attempt ${attempt}/${maxAttempts}): ${errorMessage}`);

      if (isLastAttempt) {
        logger?.logAction('resilience', 'All wait attempts exhausted');
        throw error;
      }

      logger?.logRecovery(`wait for ${state} retry`, `Transient failure: ${errorMessage}`);
      if (options?.onRetry) {
        await options.onRetry();
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
