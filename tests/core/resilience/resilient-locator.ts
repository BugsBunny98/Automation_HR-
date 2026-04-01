/**
 * Resilient Locator — Locator with Fallback Chain
 * ================================================
 * Attempts multiple locator strategies in order until one succeeds.
 * Logs each attempt for debugging.
 *
 * Design principles:
 * - Explicit fallback (no magic)
 * - Every attempt is logged
 * - Throws clear error when all strategies fail
 *
 * Usage:
 *   const loginButton = new ResilientLocator(page, LOGIN_BUTTON_STRATEGY, 'Login button');
 *   await loginButton.click();
 */

import type { Locator, Page } from '@playwright/test';
import type { ActivityLogger } from '../activity/ActivityLogger';
import type { LocatorStrategy, LocatorStrategyStep } from './locator-strategy';

export class ResilientLocator {
  private page: Page;
  private strategy: LocatorStrategy;
  private name: string;
  private logger?: ActivityLogger;

  constructor(page: Page, strategy: LocatorStrategy, name: string, logger?: ActivityLogger) {
    this.page = page;
    this.strategy = strategy;
    this.name = name;
    this.logger = logger;
  }

  /**
   * Locate the element by trying each strategy in order.
   * Returns the first locator that finds at least one element.
   */
  async locate(): Promise<Locator> {
    this.logger?.logAction('resilience', `Locating: ${this.name}`, { strategies: this.strategy.length });

    for (let i = 0; i < this.strategy.length; i++) {
      const step = this.strategy[i];
      const locator = this.buildLocator(step);

      try {
        // Check if element exists with a short timeout
        const count = await locator.count();
        if (count > 0) {
          this.logger?.logAction('resilience', `✓ Found ${this.name} using strategy ${i + 1}/${this.strategy.length}: ${step.type}`, {
            strategy: step.description || step.type,
            count,
          });
          return locator;
        }
      } catch (error) {
        // Strategy failed, try next
        this.logger?.logAction('resilience', `✗ Strategy ${i + 1}/${this.strategy.length} failed: ${step.type}`, {
          strategy: step.description || step.type,
          error: (error as Error).message,
        });
      }
    }

    // All strategies failed
    const strategyList = this.strategy.map((s, i) => `${i + 1}. ${s.type} (${s.description || 'no description'})`).join('\n');
    const errorMessage = `Failed to locate "${this.name}" after trying ${this.strategy.length} strategies:\n${strategyList}`;

    this.logger?.logAction('resilience', `✗ All strategies failed for: ${this.name}`);
    throw new Error(errorMessage);
  }

  /**
   * Build a Playwright locator from a strategy step.
   */
  private buildLocator(step: LocatorStrategyStep): Locator {
    switch (step.type) {
      case 'role':
        if (typeof step.value === 'object' && 'role' in step.value) {
          return this.page.getByRole(step.value.role as any, { name: step.value.name });
        }
        throw new Error(`Invalid role strategy value: ${JSON.stringify(step.value)}`);

      case 'label':
        if (typeof step.value === 'string' || step.value instanceof RegExp) {
          return this.page.getByLabel(step.value);
        }
        throw new Error(`Invalid label strategy value: ${JSON.stringify(step.value)}`);

      case 'placeholder':
        if (typeof step.value === 'string' || step.value instanceof RegExp) {
          return this.page.getByPlaceholder(step.value);
        }
        throw new Error(`Invalid placeholder strategy value: ${JSON.stringify(step.value)}`);

      case 'testId':
        if (typeof step.value === 'string') {
          return this.page.getByTestId(step.value);
        }
        throw new Error(`Invalid testId strategy value: ${JSON.stringify(step.value)}`);

      case 'text':
        if (typeof step.value === 'string' || step.value instanceof RegExp) {
          return this.page.getByText(step.value, { exact: true });
        }
        throw new Error(`Invalid text strategy value: ${JSON.stringify(step.value)}`);

      case 'css':
        if (typeof step.value === 'string') {
          return this.page.locator(step.value);
        }
        throw new Error(`Invalid css strategy value: ${JSON.stringify(step.value)}`);

      default:
        throw new Error(`Unknown locator type: ${(step as any).type}`);
    }
  }

  /**
   * Click the element after locating it.
   */
  async click(options?: Parameters<Locator['click']>[0]): Promise<void> {
    const locator = await this.locate();
    this.logger?.logAction('click', `Click: ${this.name}`);
    await locator.click(options);
  }

  /**
   * Fill the element with a value after locating it.
   */
  async fill(value: string, options?: { force?: boolean; noWaitAfter?: boolean; timeout?: number }): Promise<void> {
    const locator = await this.locate();
    const redactedValue = this.logger?.redactSensitive(value) || value;
    this.logger?.logAction('fill', `Fill: ${this.name} = ${redactedValue}`);
    await locator.fill(value, options);
  }

  /**
   * Check if the element is visible.
   */
  async isVisible(): Promise<boolean> {
    try {
      const locator = await this.locate();
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Wait for the element to be visible.
   */
  async waitForVisible(timeout = 15000): Promise<void> {
    const locator = await this.locate();
    this.logger?.logAction('wait', `Wait for visible: ${this.name}`, { timeout });
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get the underlying Playwright locator (for advanced usage).
   */
  async getLocator(): Promise<Locator> {
    return await this.locate();
  }
}
