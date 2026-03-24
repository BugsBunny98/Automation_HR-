import { test, expect } from '@playwright/test';
import {
  countryLabels,
  egyptPhonesByPrefix,
  postLoginUrlRegex,
  stagingOtp,
} from '../data/loginData';
import { LoginPage } from '../pages/LoginPage';

const loginPath = /\/auth\/login/;

test.describe('Login — smoke', { tag: '@smoke' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('valid Egypt login with 1201644545 and OTP 8182', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(egyptPhonesByPrefix['012']);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp(stagingOtp.valid);
    await login.submitOtp();

    await expect(page).toHaveURL(postLoginUrlRegex);
    await expect(page).not.toHaveURL(loginPath);
  });

  test('valid UAE login when UAE is selected and OTP 8182 is entered', async ({ page }) => {
    const uaePhone = process.env.E2E_UAE_PHONE?.trim();
    test.skip(
      !uaePhone,
      'Set E2E_UAE_PHONE in .env to a valid staging UAE mobile (see .env.example). Placeholder data will not receive OTP.',
    );

    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.uae);
    await login.enterPhone(uaePhone!);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp(stagingOtp.valid);
    await login.submitOtp();

    await expect(page).toHaveURL(postLoginUrlRegex);
    await expect(page).not.toHaveURL(loginPath);
  });

  test('invalid OTP after valid phone keeps user on OTP and does not reach home', async ({ page }) => {
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
});
