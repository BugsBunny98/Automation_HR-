import { test, expect } from '@playwright/test';
import {
  countryLabels,
  egyptPhonesByPrefix,
  invalidPhones,
  postLoginUrlRegex,
  stagingOtp,
  type EgyptPrefix,
} from '../data/loginData';
import { LoginPage } from '../pages/LoginPage';

const egyptPrefixCases: { id: string; prefix: EgyptPrefix }[] = [
  { id: 'LGN-001 012', prefix: '012' },
  { id: 'LGN-002 010', prefix: '010' },
  { id: 'LGN-003 011', prefix: '011' },
  { id: 'LGN-004 015', prefix: '015' },
];

const loginPath = /\/auth\/login/;

test.describe('Login — regression', { tag: '@regression' }, () => {
  test.describe.configure({ mode: 'serial' });

  for (const { id, prefix } of egyptPrefixCases) {
    test(`valid Egypt login — ${id} (${prefix})`, async ({ page }) => {
      test.skip(
        prefix === '015' && process.env.E2E_ENABLE_EGYPT_015 !== '1',
        '1555558380 does not receive OTP on current staging; set E2E_ENABLE_EGYPT_015=1 in .env when this MSISDN is valid.',
      );

      const login = new LoginPage(page);
      await login.goto();
      await login.selectCountry(countryLabels.egypt);
      await login.enterPhone(egyptPhonesByPrefix[prefix]);
      await login.submitPhone();

      await expect(login.otpEntryArea).toBeVisible();
      await login.enterOtp(stagingOtp.valid);
      await login.submitOtp();

      await expect(page).toHaveURL(postLoginUrlRegex);
      await expect(page).not.toHaveURL(loginPath);
    });
  }

  test('UAE number entered while Egypt is still selected — validation or no OTP step', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(invalidPhones.uaeNumberWhileEgyptSelected);
    await login.submitPhone();

    await expect
      .poll(
        async () => {
          const validationShown = await login.validationOrErrorMessage.isVisible();
          const otpShown = await login.otpEntryArea.isVisible();
          return validationShown || !otpShown;
        },
        {
          timeout: 10_000,
          message:
            'Expected inline validation, or OTP step not shown (UAE number with Egypt country)',
        },
      )
      .toBeTruthy();

    await expect(page).toHaveURL(loginPath);
  });

  test('invalid phone number format — cannot submit, no OTP step', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(invalidPhones.malformed);

    // Staging disables Login until the phone field is valid; no server round-trip.
    await expect(login.continueButton).toBeDisabled();
    await expect(login.otpEntryArea).toBeHidden();
  });

  test('empty phone — Login disabled, cannot reach OTP', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone('');

    await expect(login.continueButton).toBeDisabled();
    await expect(login.otpEntryArea).toBeHidden();
  });

  test('empty OTP — required validation, remain on OTP step', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
    await login.enterPhone(egyptPhonesByPrefix['012']);
    await login.submitPhone();

    await expect(login.otpEntryArea).toBeVisible();
    await login.enterOtp('');
    await login.submitOtp();

    await expect(login.validationOrErrorMessage).toBeVisible();
    await expect(login.otpEntryArea).toBeVisible();
    await expect(page).not.toHaveURL(postLoginUrlRegex);
  });
});
