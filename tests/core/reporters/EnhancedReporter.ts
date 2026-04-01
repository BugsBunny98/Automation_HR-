/**
 * Enhanced Reporter — Custom Playwright Test Reporter
 * ====================================================
 * Provides a summary of test results with focus on failures and retries.
 *
 * Features:
 * - Failure summary with retry counts
 * - Links to attached artifacts (activity logs, screenshots, traces)
 * - Console output + text file output
 * - CI-friendly formatting
 *
 * Configured in playwright.config.ts:
 *   reporter: [
 *     ['./tests/core/reporters/EnhancedReporter.ts']
 *   ]
 */

import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

class EnhancedReporter implements Reporter {
  private startTime: number = 0;
  private failedTests: Array<{
    test: TestCase;
    result: TestResult;
    retryIndex: number;
  }> = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('  PLAYWRIGHT TEST RUN STARTED');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Projects: ${config.projects.map((p) => p.name).join(', ')}`);
    console.log(`Workers: ${config.workers}`);
    console.log(`Retries: ${config.projects[0]?.retries ?? 0}`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Track failed tests (including retries)
    if (result.status === 'failed' || result.status === 'timedOut') {
      this.failedTests.push({
        test,
        result,
        retryIndex: result.retry,
      });
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const duration = Date.now() - this.startTime;
    const durationSec = (duration / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('  PLAYWRIGHT TEST RUN COMPLETED');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${durationSec}s`);
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // Group failures by test (across retries)
    const failuresByTest = this.groupFailuresByTest();

    if (failuresByTest.size > 0) {
      console.log('───────────────────────────────────────────────────────────────────');
      console.log('  FAILED TESTS SUMMARY');
      console.log('───────────────────────────────────────────────────────────────────\n');

      for (const [testTitle, failures] of failuresByTest.entries()) {
        const totalAttempts = failures.length;
        const lastFailure = failures[failures.length - 1];

        console.log(`✗ ${testTitle}`);
        console.log(`  File: ${lastFailure.test.location.file}:${lastFailure.test.location.line}`);
        console.log(`  Project: ${lastFailure.test.parent.project()?.name || 'unknown'}`);
        console.log(`  Attempts: ${totalAttempts}`);
        console.log(`  Final error: ${lastFailure.result.error?.message || 'Unknown error'}`);

        // List attached artifacts
        const artifacts = lastFailure.result.attachments;
        if (artifacts.length > 0) {
          console.log(`  Artifacts:`);
          for (const attachment of artifacts) {
            const artifactPath = attachment.path || '(inline)';
            console.log(`    - ${attachment.name}: ${artifactPath}`);
          }
        }

        console.log('');
      }

      console.log('───────────────────────────────────────────────────────────────────\n');
    } else {
      console.log('✓ All tests passed!\n');
    }

    // Write summary to file
    await this.writeSummaryFile(result, failuresByTest, durationSec);
  }

  /**
   * Group failures by test title (across retries).
   */
  private groupFailuresByTest(): Map<
    string,
    Array<{ test: TestCase; result: TestResult; retryIndex: number }>
  > {
    const grouped = new Map<
      string,
      Array<{ test: TestCase; result: TestResult; retryIndex: number }>
    >();

    for (const failure of this.failedTests) {
      const key = `${failure.test.parent.project()?.name || 'unknown'} > ${failure.test.title}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(failure);
    }

    // Sort each group by retry index
    for (const failures of grouped.values()) {
      failures.sort((a, b) => a.retryIndex - b.retryIndex);
    }

    return grouped;
  }

  /**
   * Write summary to test-results/summary.txt
   */
  private async writeSummaryFile(
    result: FullResult,
    failuresByTest: Map<string, Array<{ test: TestCase; result: TestResult; retryIndex: number }>>,
    durationSec: string,
  ): Promise<void> {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('  PLAYWRIGHT TEST RUN SUMMARY');
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Status:   ${result.status}`);
    lines.push(`Duration: ${durationSec}s`);
    lines.push(`Date:     ${new Date().toISOString()}`);
    lines.push('');

    if (failuresByTest.size > 0) {
      lines.push('───────────────────────────────────────────────────────────────────');
      lines.push('  FAILED TESTS');
      lines.push('───────────────────────────────────────────────────────────────────');
      lines.push('');

      for (const [testTitle, failures] of failuresByTest.entries()) {
        const totalAttempts = failures.length;
        const lastFailure = failures[failures.length - 1];

        lines.push(`✗ ${testTitle}`);
        lines.push(`  File:     ${lastFailure.test.location.file}:${lastFailure.test.location.line}`);
        lines.push(`  Project:  ${lastFailure.test.parent.project()?.name || 'unknown'}`);
        lines.push(`  Attempts: ${totalAttempts}`);
        lines.push('');
        lines.push(`  Final error:`);
        lines.push(`    ${lastFailure.result.error?.message || 'Unknown error'}`);
        lines.push('');

        if (lastFailure.result.error?.stack) {
          lines.push(`  Stack trace:`);
          const stackLines = lastFailure.result.error.stack.split('\n').slice(0, 10);
          for (const line of stackLines) {
            lines.push(`    ${line}`);
          }
          lines.push('');
        }

        const artifacts = lastFailure.result.attachments;
        if (artifacts.length > 0) {
          lines.push(`  Artifacts:`);
          for (const attachment of artifacts) {
            const artifactPath = attachment.path || '(inline)';
            lines.push(`    - ${attachment.name}: ${artifactPath}`);
          }
          lines.push('');
        }

        lines.push('───────────────────────────────────────────────────────────────────');
        lines.push('');
      }
    } else {
      lines.push('✓ All tests passed!');
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('  END OF SUMMARY');
    lines.push('═══════════════════════════════════════════════════════════════════');

    const summaryPath = path.join('test-results', 'summary.txt');
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(summaryPath, lines.join('\n'), 'utf-8');

    console.log(`[EnhancedReporter] Summary written to: ${summaryPath}\n`);
  }
}

export default EnhancedReporter;
