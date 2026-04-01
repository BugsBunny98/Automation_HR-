/**
 * Activity Formatter — Human-Readable Activity Log Output
 * ========================================================
 * Converts structured activity log data into readable text format.
 * Used by ActivityLogger to generate .txt artifacts for quick debugging.
 */

import type { ActivityEntry, ActivityStep } from './ActivityLogger';

interface ActivityLogData {
  test: {
    title: string;
    file: string;
    project: string;
    retryIndex: number;
    status?: string;
  };
  steps: ActivityStep[];
  globalActivities: ActivityEntry[];
  summary: {
    totalSteps: number;
    totalActivities: number;
    duration: number;
  };
}

export class ActivityFormatter {
  /**
   * Convert activity log data to human-readable text.
   */
  static toText(data: ActivityLogData): string {
    const lines: string[] = [];

    // Header
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('  PLAYWRIGHT TEST ACTIVITY LOG');
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Test:        ${data.test.title}`);
    lines.push(`File:        ${data.test.file}`);
    lines.push(`Project:     ${data.test.project}`);
    lines.push(`Retry:       ${data.test.retryIndex}`);
    lines.push(`Status:      ${data.test.status || 'unknown'}`);
    lines.push('');
    lines.push(`Total Steps:      ${data.summary.totalSteps}`);
    lines.push(`Total Activities: ${data.summary.totalActivities}`);
    lines.push(`Total Duration:   ${data.summary.duration}ms`);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('');

    // Global activities (before any step)
    if (data.globalActivities.length > 0) {
      lines.push('─── Global Activities ─────────────────────────────────────────────');
      for (const activity of data.globalActivities) {
        lines.push(this.formatActivity(activity));
      }
      lines.push('');
    }

    // Steps
    for (const step of data.steps) {
      lines.push('───────────────────────────────────────────────────────────────────');
      const statusIcon = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '⊘';
      lines.push(`${statusIcon} STEP: ${step.name}`);
      lines.push(`   Started:  ${new Date(step.startTime).toISOString()}`);
      if (step.endTime) {
        lines.push(`   Ended:    ${new Date(step.endTime).toISOString()}`);
      }
      if (step.duration !== undefined) {
        lines.push(`   Duration: ${step.duration}ms`);
      }
      if (step.details) {
        lines.push(`   Details:  ${step.details}`);
      }
      lines.push('');

      if (step.activities.length > 0) {
        for (const activity of step.activities) {
          lines.push(this.formatActivity(activity, '   '));
        }
        lines.push('');
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('  END OF ACTIVITY LOG');
    lines.push('═══════════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Format a single activity entry.
   */
  private static formatActivity(activity: ActivityEntry, indent = ''): string {
    const time = new Date(activity.timestamp).toISOString().split('T')[1]?.slice(0, 12) || '';
    const typeLabel = activity.type.toUpperCase().padEnd(10);
    const retryLabel = activity.retryIndex !== undefined ? `[R${activity.retryIndex}]` : '';

    let line = `${indent}${time} ${typeLabel} ${retryLabel} ${activity.message}`;

    if (activity.url && activity.type === 'navigation') {
      line += `\n${indent}           → ${activity.url}`;
    }

    if (activity.metadata && Object.keys(activity.metadata).length > 0) {
      const metaStr = JSON.stringify(activity.metadata, null, 2)
        .split('\n')
        .map((l) => `${indent}           ${l}`)
        .join('\n');
      line += `\n${metaStr}`;
    }

    return line;
  }

  /**
   * Convert activity log data to JSON string (pretty-printed).
   */
  static toJson(data: ActivityLogData): string {
    return JSON.stringify(data, null, 2);
  }
}
