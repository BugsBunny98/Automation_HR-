/**
 * Diagnostics Collector — Browser Event Capture
 * ==============================================
 * Captures browser console logs, page errors, failed network requests,
 * and page crashes during test execution.
 *
 * Provides deep visibility into what went wrong when a test fails.
 *
 * Usage:
 *   const diagnostics = new DiagnosticsCollector(page, testInfo);
 *   await diagnostics.startCollection();
 *   // ... test runs ...
 *   await diagnostics.attachToTest();  // On test end
 */

import type { Page, TestInfo, ConsoleMessage, Request, Response } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface ConsoleLog {
  timestamp: string;
  type: string;
  text: string;
  location?: string;
}

export interface PageError {
  timestamp: string;
  message: string;
  stack?: string;
}

export interface FailedRequest {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  responseBody?: string;
}

export interface DiagnosticsData {
  test: {
    title: string;
    file: string;
    retryIndex: number;
  };
  consoleLogs: ConsoleLog[];
  pageErrors: PageError[];
  failedRequests: FailedRequest[];
  pageCrashes: number;
  collectionStarted: string;
  collectionEnded?: string;
}

export class DiagnosticsCollector {
  private page: Page;
  private testInfo: TestInfo;
  private consoleLogs: ConsoleLog[] = [];
  private pageErrors: PageError[] = [];
  private failedRequests: FailedRequest[] = [];
  private pageCrashes = 0;
  private collectionStarted: string;
  private isCollecting = false;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.collectionStarted = new Date().toISOString();
  }

  /**
   * Start collecting diagnostics by attaching event listeners to the page.
   */
  async startCollection(): Promise<void> {
    if (this.isCollecting) return;
    this.isCollecting = true;

    // Console messages
    this.page.on('console', (msg: ConsoleMessage) => {
      this.consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url,
      });
    });

    // Page errors (uncaught exceptions)
    this.page.on('pageerror', (error: Error) => {
      this.pageErrors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
      });
    });

    // Failed network requests (4xx, 5xx)
    this.page.on('response', async (response: Response) => {
      const status = response.status();
      if (status >= 400) {
        let body: string | undefined;
        try {
          body = await response.text();
          if (body.length > 500) {
            body = body.slice(0, 500) + '... (truncated)';
          }
        } catch {
          body = '(unable to read response body)';
        }

        this.failedRequests.push({
          timestamp: new Date().toISOString(),
          method: response.request().method(),
          url: response.url(),
          status,
          statusText: response.statusText(),
          responseBody: body,
        });
      }
    });

    // Page crashes
    this.page.on('crash', () => {
      this.pageCrashes += 1;
      this.pageErrors.push({
        timestamp: new Date().toISOString(),
        message: 'Page crashed',
      });
    });

    console.log(`[DiagnosticsCollector] Started collection for: ${this.testInfo.title}`);
  }

  /**
   * Stop collection and attach diagnostics to test results.
   * Called automatically by the diagnostics fixture on test end.
   */
  async attachToTest(): Promise<void> {
    const data: DiagnosticsData = {
      test: {
        title: this.testInfo.title,
        file: this.testInfo.file,
        retryIndex: this.testInfo.retry,
      },
      consoleLogs: this.consoleLogs,
      pageErrors: this.pageErrors,
      failedRequests: this.failedRequests,
      pageCrashes: this.pageCrashes,
      collectionStarted: this.collectionStarted,
      collectionEnded: new Date().toISOString(),
    };

    const testTitle = this.testInfo.title.replace(/[^a-zA-Z0-9-_]/g, '_');
    const retryIndex = this.testInfo.retry;
    const filename = `diagnostics-${testTitle}-retry${retryIndex}.json`;
    const filepath = path.join(this.testInfo.outputDir, filename);

    // Ensure output directory exists
    fs.mkdirSync(this.testInfo.outputDir, { recursive: true });

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    await this.testInfo.attach('diagnostics', { path: filepath, contentType: 'application/json' });

    // Log summary
    const summary = [
      `[DiagnosticsCollector] Summary for ${this.testInfo.title}:`,
      `  Console logs: ${this.consoleLogs.length}`,
      `  Page errors: ${this.pageErrors.length}`,
      `  Failed requests: ${this.failedRequests.length}`,
      `  Page crashes: ${this.pageCrashes}`,
    ].join('\n');

    console.log(summary);
  }

  /**
   * Get a quick summary string (useful for inline logging).
   */
  getSummary(): string {
    return `Console: ${this.consoleLogs.length}, Errors: ${this.pageErrors.length}, Failed requests: ${this.failedRequests.length}, Crashes: ${this.pageCrashes}`;
  }

  /**
   * Check if any critical issues were detected.
   */
  hasCriticalIssues(): boolean {
    return this.pageErrors.length > 0 || this.pageCrashes > 0 || this.failedRequests.some((r) => r.status >= 500);
  }
}
