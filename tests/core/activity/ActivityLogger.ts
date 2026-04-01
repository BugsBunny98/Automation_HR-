/**
 * Activity Logger — Step-by-Step Test Activity Tracking
 * =======================================================
 * Records every test action with timestamps, URLs, retry context, and metadata.
 * Provides full traceability for debugging failures in CI/CD pipelines.
 *
 * Key features:
 * - Step-level tracking (start/end with duration)
 * - Action logging (navigation, click, fill, assertion, API, recovery)
 * - Sensitive data redaction (passwords, tokens, OTPs)
 * - Retry index tracking
 * - Automatic attachment to Playwright test results
 *
 * Usage:
 *   const logger = new ActivityLogger(page, testInfo);
 *   logger.startStep('Login flow');
 *   logger.logAction('click', 'Click login button', { selector: 'button' });
 *   logger.endStep('pass');
 *   await logger.attachToTest();
 */

import type { Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ActivityFormatter } from './ActivityFormatter';

export type ActivityStatus = 'pass' | 'fail' | 'skip';
export type ActivityType = 'navigation' | 'click' | 'fill' | 'assertion' | 'api' | 'recovery' | 'resilience' | 'wait' | 'other';

export interface ActivityEntry {
  timestamp: string;
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  url?: string;
  retryIndex?: number;
  duration?: number;
  status?: ActivityStatus;
}

export interface ActivityStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: ActivityStatus;
  details?: string;
  activities: ActivityEntry[];
}

export class ActivityLogger {
  private page: Page;
  private testInfo: TestInfo;
  private steps: ActivityStep[] = [];
  private currentStep: ActivityStep | null = null;
  private globalActivities: ActivityEntry[] = [];

  // Patterns for sensitive data redaction
  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /otp/i,
    /auth/i,
    /bearer/i,
    /api[_-]?key/i,
  ];

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  /**
   * Start a new logical step in the test.
   * Steps help organize activity logs into phases (e.g., "Phone entry", "OTP verification").
   */
  startStep(name: string): void {
    if (this.currentStep) {
      this.endStep('pass', 'Auto-closed by next step');
    }

    this.currentStep = {
      name,
      startTime: Date.now(),
      activities: [],
    };

    this.log('other', `▶ Step started: ${name}`, { stepName: name });
  }

  /**
   * End the current step with a status and optional details.
   */
  endStep(status: ActivityStatus, details?: string): void {
    if (!this.currentStep) {
      console.warn('[ActivityLogger] endStep called without active step');
      return;
    }

    const now = Date.now();
    this.currentStep.endTime = now;
    this.currentStep.duration = now - this.currentStep.startTime;
    this.currentStep.status = status;
    this.currentStep.details = details;

    const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⊘';
    this.log(
      'other',
      `${icon} Step ended: ${this.currentStep.name} (${this.currentStep.duration}ms)`,
      { stepName: this.currentStep.name, status, duration: this.currentStep.duration },
    );

    this.steps.push(this.currentStep);
    this.currentStep = null;
  }

  /**
   * Log a test action with type, message, and optional metadata.
   * Automatically redacts sensitive values.
   */
  logAction(type: ActivityType, message: string, metadata?: Record<string, unknown>): void {
    const redactedMetadata = metadata ? this.redactMetadata(metadata) : undefined;
    this.log(type, message, redactedMetadata);
  }

  /**
   * Log an API call with method, endpoint, and response status.
   */
  logApiCall(name: string, method: string, endpoint: string, status: number): void {
    const redactedEndpoint = this.redactSensitive(endpoint);
    this.log('api', `${name}: ${method} ${redactedEndpoint} → ${status}`, {
      method,
      endpoint: redactedEndpoint,
      status,
    });
  }

  /**
   * Log a recovery action (e.g., retry after transient failure).
   */
  logRecovery(action: string, reason: string): void {
    this.log('recovery', `Recovery: ${action} (reason: ${reason})`, { action, reason });
  }

  /**
   * Core logging method — records an activity entry.
   */
  private log(type: ActivityType, message: string, metadata?: Record<string, unknown>): void {
    const entry: ActivityEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata,
      url: this.page.url(),
      retryIndex: this.testInfo.retry,
    };

    if (this.currentStep) {
      this.currentStep.activities.push(entry);
    } else {
      this.globalActivities.push(entry);
    }
  }

  /**
   * Redact sensitive values from metadata objects.
   */
  private redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (this.isSensitiveKey(key)) {
        redacted[key] = this.redactSensitive(String(value));
      } else if (typeof value === 'string') {
        redacted[key] = this.redactSensitive(value);
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactMetadata(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Check if a key name suggests sensitive data.
   */
  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
  }

  /**
   * Redact sensitive values in strings (e.g., passwords, tokens).
   * Keeps first 4 chars visible for debugging.
   */
  redactSensitive(value: string): string {
    if (!value || value.length === 0) return value;

    // If value looks like a token/password (long alphanumeric), redact most of it
    if (value.length > 8 && /^[a-zA-Z0-9_-]+$/.test(value)) {
      return `${value.slice(0, 4)}****`;
    }

    // If value contains sensitive keywords, redact entirely
    if (this.SENSITIVE_PATTERNS.some((pattern) => pattern.test(value))) {
      return '****';
    }

    return value;
  }

  /**
   * Attach activity logs to the Playwright test result as artifacts.
   * Saves both JSON (machine-readable) and text (human-readable) formats.
   */
  async attachToTest(): Promise<void> {
    // Close any open step
    if (this.currentStep) {
      this.endStep('pass', 'Auto-closed at test end');
    }

    const testTitle = this.testInfo.title.replace(/[^a-zA-Z0-9-_]/g, '_');
    const retryIndex = this.testInfo.retry;
    const baseFilename = `activity-${testTitle}-retry${retryIndex}`;

    // Prepare log data
    const logData = {
      test: {
        title: this.testInfo.title,
        file: this.testInfo.file,
        project: this.testInfo.project.name,
        retryIndex,
        status: this.testInfo.status,
      },
      steps: this.steps,
      globalActivities: this.globalActivities,
      summary: {
        totalSteps: this.steps.length,
        totalActivities: this.steps.reduce((sum, s) => sum + s.activities.length, 0) + this.globalActivities.length,
        duration: this.steps.reduce((sum, s) => sum + (s.duration || 0), 0),
      },
    };

    // Ensure output directory exists
    fs.mkdirSync(this.testInfo.outputDir, { recursive: true });

    // Save JSON
    const jsonPath = path.join(this.testInfo.outputDir, `${baseFilename}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(logData, null, 2), 'utf-8');
    await this.testInfo.attach('activity-log-json', { path: jsonPath, contentType: 'application/json' });

    // Save human-readable text
    const textContent = ActivityFormatter.toText(logData);
    const textPath = path.join(this.testInfo.outputDir, `${baseFilename}.txt`);
    fs.writeFileSync(textPath, textContent, 'utf-8');
    await this.testInfo.attach('activity-log-text', { path: textPath, contentType: 'text/plain' });

    console.log(`[ActivityLogger] Logs attached: ${baseFilename}.{json,txt}`);
  }

  /**
   * Get a summary of logged activities (useful for debugging).
   */
  getSummary(): string {
    const totalSteps = this.steps.length + (this.currentStep ? 1 : 0);
    const totalActivities =
      this.steps.reduce((sum, s) => sum + s.activities.length, 0) +
      (this.currentStep?.activities.length || 0) +
      this.globalActivities.length;

    return `Steps: ${totalSteps}, Activities: ${totalActivities}, Retry: ${this.testInfo.retry}`;
  }
}
