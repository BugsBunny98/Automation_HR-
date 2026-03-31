/**
 * Global Setup — Authentication State
 * ====================================
 * This setup project runs before all other test projects to establish
 * authenticated session state that can be reused across tests.
 *
 * The auth state is stored in playwright/.auth/user.json and loaded
 * automatically by dependent test projects.
 *
 * Environment Variables:
 *   - TEST_EMAIL: Email/phone for login (optional, defaults to test data)
 *   - TEST_PASSWORD: Password/OTP for login (optional, defaults to test OTP)
 *   - SKIP_AUTH_SETUP: Set to '1' to skip this setup entirely
 *
 * To run setup manually:
 *   npx playwright test --project=setup
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { egyptPhonesByPrefix, stagingOtp, countryLabels, postLoginUrlRegex } from '../data/loginData';

// Auth file path (must match playwright.config.ts)
const authFile = path.join(__dirname, '..', '..', 'playwright', '.auth', 'user.json');

// Ensure auth directory exists
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup.describe('Authentication Setup', () => {
  setup('authenticate and save state', async ({ page }) => {
    // Skip if auth state already exists and is fresh (optional optimization)
    if (process.env.REUSE_AUTH_STATE === '1' && fs.existsSync(authFile)) {
      const stats = fs.statSync(authFile);
      const ageMs = Date.now() - stats.mtimeMs;
      const maxAgeMs = 30 * 60 * 1000; // 30 minutes

      if (ageMs < maxAgeMs) {
        setup.skip(true, 'Reusing existing auth state (less than 30 minutes old)');
        return;
      }
    }

    // Determine login credentials
    const testPhone = process.env.TEST_EMAIL || egyptPhonesByPrefix['012'];
    const testOtp = process.env.TEST_PASSWORD || stagingOtp.valid;
    const testCountry = process.env.TEST_COUNTRY || countryLabels.egypt;

    console.log(`[Setup] Authenticating with phone: ${testPhone.slice(0, 4)}****`);

    // Perform login flow
    const loginPage = new LoginPage(page);

    try {
      // Navigate to login
      await loginPage.goto();
      await expect(loginPage.phoneInput).toBeVisible({ timeout: 15_000 });

      // Select country if not default
      if (testCountry !== countryLabels.egypt) {
        await loginPage.selectCountry(testCountry);
      }

      // Enter phone and submit
      await loginPage.enterPhone(testPhone);
      await loginPage.submitPhone();

      // Wait for OTP screen
      await expect(loginPage.otpEntryArea).toBeVisible({ timeout: 30_000 });

      // Enter OTP and verify
      await loginPage.enterOtp(testOtp);
      await loginPage.submitOtp();

      // Wait for successful login redirect
      await expect(page).toHaveURL(postLoginUrlRegex, { timeout: 30_000 });

      console.log(`[Setup] Login successful, saving auth state to: ${authFile}`);

      // Save authenticated state
      await page.context().storageState({ path: authFile });

      console.log('[Setup] Auth state saved successfully');
    } catch (error) {
      console.error('[Setup] Authentication failed:', error);

      // Take screenshot for debugging
      const screenshotPath = path.join(__dirname, '..', '..', 'test-results', 'setup-failure.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[Setup] Screenshot saved: ${screenshotPath}`);

      // Create empty auth state to prevent dependent tests from failing to load
      const emptyState = {
        cookies: [],
        origins: [],
      };
      fs.writeFileSync(authFile, JSON.stringify(emptyState, null, 2));
      console.log('[Setup] Empty auth state created to prevent load errors');

      throw error;
    }
  });
});
