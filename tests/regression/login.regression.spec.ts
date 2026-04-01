import { test, expect } from '@playwright/test';
import {
  countryLabels,
  egyptPhonesByPrefix,
  invalidPhones,
  loginUrlRegex,
  postLoginUrlRegex,
  stagingOtp,
  type EgyptPrefix,
} from '../data/loginData';
import { LoginPage } from '../pages/LoginPage';

// ---------------------------------------------------------------------------
// Test case matrix
// ---------------------------------------------------------------------------

const egyptPrefixCases: { id: string; prefix: EgyptPrefix }[] = [
  { id: 'LGN-001', prefix: '012' },
  { id: 'LGN-002', prefix: '010' },
  { id: 'LGN-003', prefix: '011' },
  { id: 'LGN-004', prefix: '015' },
];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Login — regression', { tag: '@regression' }, () => {
  // ✅ [1] Removed serial mode — tests are independent; parallelism restored.
  // Each test calls login.goto() via beforeEach, so there is no shared state
  // that would require serial execution.

  let login: LoginPage;

  // ✅ [2] Shared setup extracted into beforeEach — eliminates 3-line boilerplate
  // from every test and ensures a clean page/state on every run.
  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
    await login.selectCountry(countryLabels.egypt);
  });

  // -------------------------------------------------------------------------
  // Happy-path: valid Egypt login (parametrised)
  // -------------------------------------------------------------------------

  for (const { id, prefix } of egyptPrefixCases) {
    // ✅ [7] @smoke tag added to happy-path tests so they can be run in fast
    // pre-merge CI pipelines via `--grep @smoke` without the full suite.
    test(
      `valid Egypt login — ${id} (${prefix})`,
      { tag: ['@regression', '@smoke'] },
      async ({ page }) => {
        test.skip(
          prefix === '015' && process.env.E2E_ENABLE_EGYPT_015 !== '1',
          '1555558380 does not receive OTP on current staging; set E2E_ENABLE_EGYPT_015=1 in .env when valid.',
        );

        // ✅ [3] test.step() wraps logical phases so Playwright HTML reports show
        // exactly which phase (phone entry vs OTP) failed, not just the test name.
        await test.step('Enter and submit phone number', async () => {
          await login.enterPhone(egyptPhonesByPrefix[prefix]);
          await login.submitPhone();
          await expect(login.otpEntryArea).toBeVisible();
        });

        await test.step('Complete OTP verification', async () => {
          await login.enterOtp(stagingOtp.valid);
          await login.submitOtp();
          await expect(page).toHaveURL(postLoginUrlRegex);
          await expect(page).not.toHaveURL(loginUrlRegex);
        });
      },
    );
  }

  // -------------------------------------------------------------------------
  // Negative: wrong country / mismatched number
  // -------------------------------------------------------------------------

  test('UAE number entered while Egypt is still selected — validation shown, no OTP step', async ({ page }) => {
    // ✅ [4] Replaced expect.poll() with a direct, deterministic assertion.
    // The expected outcome is clear: the app should block progression and show
    // an error. If both validation paths are genuinely possible, split into two
    // separate tests with concrete per-path assertions instead.
    await login.enterPhone(invalidPhones.uaeNumberWhileEgyptSelected);
    await login.submitPhone();

    await expect(login.validationOrErrorMessage).toBeVisible({ timeout: 10_000 });
    await expect(login.otpEntryArea).toBeHidden();
    await expect(page).toHaveURL(loginUrlRegex);
  });

  // -------------------------------------------------------------------------
  // Negative: malformed / empty input
  // -------------------------------------------------------------------------

  test('invalid phone number format — submit disabled, no OTP step', async () => {
    await login.enterPhone(invalidPhones.malformed);

    // Staging disables the button until the field is valid — no server round-trip.
    await expect(login.continueButton).toBeDisabled();
    await expect(login.otpEntryArea).toBeHidden();
  });

  test('empty phone — submit disabled, cannot reach OTP', async () => {
    await login.enterPhone('');

    await expect(login.continueButton).toBeDisabled();
    await expect(login.otpEntryArea).toBeHidden();
  });

  // -------------------------------------------------------------------------
  // Negative: OTP step errors
  // -------------------------------------------------------------------------

  test('empty OTP submitted — required validation shown, remain on OTP step', async ({ page }) => {
    await test.step('Reach OTP step', async () => {
      await login.enterPhone(egyptPhonesByPrefix['012']);
      await login.submitPhone();
      await expect(login.otpEntryArea).toBeVisible();
    });

    await test.step('Submit empty OTP and verify validation', async () => {
      await login.enterOtp('');
      await login.submitOtp();

      await expect(login.validationOrErrorMessage).toBeVisible();
      await expect(login.otpEntryArea).toBeVisible();
      await expect(page).not.toHaveURL(postLoginUrlRegex);
    });
  });

  // ✅ [6] New test — wrong (but non-empty) OTP. This is a common regression
  // point: the OTP field accepts input but the server rejects the code.
  test('wrong OTP submitted — error shown, remain on OTP step', async ({ page }) => {
    await test.step('Reach OTP step', async () => {
      await login.enterPhone(egyptPhonesByPrefix['012']);
      await login.submitPhone();
      await expect(login.otpEntryArea).toBeVisible();
    });

    await test.step('Submit wrong OTP and verify error', async () => {
      await login.enterOtp(stagingOtp.invalid);
      await login.submitOtp();

      await expect(login.validationOrErrorMessage).toBeVisible();
      await expect(login.otpEntryArea).toBeVisible();
      await expect(page).not.toHaveURL(postLoginUrlRegex);
    });
  });
});
