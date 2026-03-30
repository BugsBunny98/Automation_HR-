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

// Auth state storage path (shared across test projects)
const authFile = path.join(__dirname, 'playwright', '.auth', 'user.json');

// Determine if we should run setup project (can be skipped in some CI scenarios)
const skipSetup = process.env.SKIP_AUTH_SETUP === '1';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // Staging OTP/login is sensitive to parallel hits across files — run one test at a time by default.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,

  // Reporter configuration
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  // Global timeouts
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // Output directories (Docker-compatible paths)
  outputDir: 'test-results',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },

  projects: [
    // ==========================================================================
    // Setup Project — runs first to establish authentication state
    // ==========================================================================
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      testDir: './tests/setup',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // ==========================================================================
    // Chromium Project — main test execution (uses auth state from setup)
    // ==========================================================================
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use stored auth state if setup ran successfully
        ...(skipSetup ? {} : { storageState: authFile }),
      },
      // Depend on setup project to run first (unless explicitly skipped)
      dependencies: skipSetup ? [] : ['setup'],
    },

    // ==========================================================================
    // Google Chrome Project — uses locally installed Chrome
    // ==========================================================================
    {
      name: 'google-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        ...(skipSetup ? {} : { storageState: authFile }),
      },
      dependencies: skipSetup ? [] : ['setup'],
    },

    // ==========================================================================
    // Smoke Tests Project — quick validation suite
    // ==========================================================================
    {
      name: 'smoke',
      testMatch: '**/*.smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        ...(skipSetup ? {} : { storageState: authFile }),
      },
      dependencies: skipSetup ? [] : ['setup'],
    },

    // ==========================================================================
    // Regression Tests Project — comprehensive test suite
    // ==========================================================================
    {
      name: 'regression',
      testMatch: '**/*.regression.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        ...(skipSetup ? {} : { storageState: authFile }),
      },
      dependencies: skipSetup ? [] : ['setup'],
    },

    // ==========================================================================
    // Onboarding Tests Project — CS dashboard onboarding flows
    // ==========================================================================
    {
      name: 'onboarding',
      testMatch: '**/*.onboarding.spec.ts',
      testDir: './tests/onboarding',
      use: {
        ...devices['Desktop Chrome'],
        ...(skipSetup ? {} : { storageState: authFile }),
      },
      dependencies: skipSetup ? [] : ['setup'],
    },
  ],
});
