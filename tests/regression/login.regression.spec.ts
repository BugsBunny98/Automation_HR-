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
import { test as enhancedTest } from '../core/fixtures/enhancedFixtures';
import { assertVisible, assertHidden, assertUrlContains } from '../core/assertions/assertionHelpers';
import { recoverableFill } from '../core/resilience/recoverable-actions';

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

  // Enhanced test with resilience layer and activity logging
  enhancedTest(
    'UAE number entered while Egypt is still selected — validation shown, no OTP step',
    async ({ page, activityLogger, diagnostics, resilientPhoneInput }) => {
      activityLogger.startStep('Enter UAE number with Egypt country selected');

      // Use resilient locator with fallback strategies
      await recoverableFill(
        await resilientPhoneInput.getLocator(),
        invalidPhones.uaeNumberWhileEgyptSelected,
        { logger: activityLogger },
      );

      await login.submitPhone();
      activityLogger.endStep('pass');

      activityLogger.startStep('Verify validation error and blocked progression');

      // Use assertion helpers with logging
      await assertVisible(login.validationOrErrorMessage, {
        message: 'Validation error should be shown for mismatched country/phone',
        timeout: 10_000,
        logger: activityLogger,
      });

      await assertHidden(login.otpEntryArea, {
        message: 'OTP step should not appear for invalid phone',
        logger: activityLogger,
      });

      await assertUrlContains(page, loginUrlRegex, {
        message: 'Should remain on login page',
        logger: activityLogger,
      });

      activityLogger.endStep('pass');

      // Log diagnostics summary
      activityLogger.logAction('other', `Diagnostics summary: ${diagnostics.getSummary()}`);
    },
  );

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
