import { test, expect } from '@playwright/test';
import {
  countryLabels,
  egyptPhonesByPrefix,
  postLoginUrlRegex,
  stagingOtp,
  uaeLogin,
  uaeOtp,
} from '../data/loginData';
import { LoginPage } from '../pages/LoginPage';
import { test as enhancedTest } from '../core/fixtures/enhancedFixtures';
import { assertVisible, assertUrlContains } from '../core/assertions/assertionHelpers';
import { recoverableClick } from '../core/resilience/recoverable-actions';

const loginPath = /\/auth\/login/;

test.describe('Login — smoke', { tag: '@smoke' }, () => {
  test.describe.configure({ mode: 'serial' });

  // Enhanced test with full reliability framework integration
  enhancedTest('valid Egypt login with 1201644545 and OTP 8182', async ({ page, activityLogger, diagnostics }) => {
    activityLogger.startStep('Navigate to login page');
    const login = new LoginPage(page, activityLogger);
    await login.goto();
    activityLogger.endStep('pass');

    activityLogger.startStep('Select country and enter phone');
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(egyptPhonesByPrefix['012']);
    await recoverableClick(login.continueButton, { logger: activityLogger });
    activityLogger.endStep('pass');

    activityLogger.startStep('Verify OTP step appears');
    await assertVisible(login.otpEntryArea, {
      message: 'OTP entry area should be visible after valid phone submission',
      logger: activityLogger,
    });
    activityLogger.endStep('pass');

    activityLogger.startStep('Complete OTP verification');
    await login.enterOtp(stagingOtp.valid);
    await login.submitOtp();
    activityLogger.endStep('pass');

    activityLogger.startStep('Verify successful login redirect');
    await assertUrlContains(page, postLoginUrlRegex, {
      message: 'Should redirect to post-login page',
      logger: activityLogger,
    });
    await expect(page).not.toHaveURL(loginPath);
    activityLogger.endStep('pass');

    // Log diagnostics summary
    activityLogger.logAction('other', `Diagnostics summary: ${diagnostics.getSummary()}`);
  });

  test('valid UAE login with 507021238 and OTP 2050', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.uae);
    await login.enterPhone(uaeLogin.validPhone);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp(uaeOtp.valid);
    await login.submitOtp();

    await expect(page).toHaveURL(postLoginUrlRegex);
    await expect(page).not.toHaveURL(loginPath);
  });

  test('invalid OTP after valid Egypt phone keeps user on OTP step', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(egyptPhonesByPrefix['012']);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp(stagingOtp.invalid);
    await login.submitOtp();

    await expect(login.validationOrErrorMessage).toBeVisible();
    await expect(login.otpEntryArea).toBeVisible();
    await expect(page).not.toHaveURL(postLoginUrlRegex);
  });

  test('invalid OTP after valid UAE phone keeps user on OTP step', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.uae);
    await login.enterPhone(uaeLogin.validPhone);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp(uaeOtp.invalid);
    await login.submitOtp();

    await expect(login.validationOrErrorMessage).toBeVisible();
    await expect(login.otpEntryArea).toBeVisible();
    await expect(page).not.toHaveURL(postLoginUrlRegex);
  });
});
