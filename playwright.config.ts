import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

function readBaseURL(): string {
  const raw = process.env.E2E_BASE_URL?.trim();
  const candidate = (raw && raw.length > 0 ? raw : 'https://staging.bluworks.io').replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(
      `[playwright.config] Invalid E2E_BASE_URL: "${raw ?? ''}". ` +
        'Use an absolute URL like https://staging.bluworks.io (see .env.example).',
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[playwright.config] E2E_BASE_URL must be http(s). Got: "${candidate}"`);
  }
  return candidate;
}

const baseURL = readBaseURL();

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  // Staging OTP/login is sensitive to parallel hits across files — run one test at a time by default.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['line']] : [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    /** Bundled Chromium (CI + default) */
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    /** Installed Google Chrome on your machine — run: npm run test:chrome */
    {
      name: 'google-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
