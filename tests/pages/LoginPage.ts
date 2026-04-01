import type { Locator, Page } from '@playwright/test';
import { LOGIN_URL } from '../data/loginData';

/**
 * Thin page object: navigation, country/phone/OTP actions, and locators for spec-level assertions.
 * Do not add assertions here.
 */
export class LoginPage {
  readonly page: Page;

  /** Native `<select>` when the app uses one; empty count means custom picker. */
  readonly nativeCountrySelect: Locator;

  /** Custom country / dial-code control (combobox, etc.) */
  readonly countryTrigger: Locator;

  /**
   * Bluworks shows a dial-code chip (e.g. +20) next to the phone field — not always a combobox.
   * TODO: Replace with `data-testid` when the app exposes one.
   */
  readonly dialCodeChip: Locator;

  /** Resolves to native select or custom trigger — use for visibility/debug; prefer actions for interaction */
  readonly countrySelector: Locator;

  readonly phoneInput: Locator;

  /**
   * Primary action after entering phone.
   * TODO: Match exact label on staging (e.g. "Continue", "Send code").
   */
  readonly continueButton: Locator;

  /**
   * Single OTP / verification field (accessible name or generic textbox on OTP step).
   * TODO: Prefer `data-testid` from the app for OTP container/inputs.
   */
  readonly otpInput: Locator;

  /**
   * Split OTP boxes — restricted to `autocomplete="one-time-code"` to avoid matching the phone field.
   * TODO: If staging uses digit inputs without this attribute, add stable test ids and scope here.
   */
  readonly otpDigitInputs: Locator;

  /**
   * OTP step submit — keep labels distinct from the phone-step CTA to reduce mis-clicks.
   * TODO: Align with staging copy exactly (e.g. "Verify", "Confirm code").
   */
  readonly otpVerifyButton: Locator;

  /** Single-field or first OTP digit box — for specs to assert OTP step visibility */
  readonly otpEntryArea: Locator;

  /**
   * Generic validation or inline error — TODO: narrow to stable `role="alert"` or test ids when known.
   */
  readonly validationOrErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nativeCountrySelect = page.locator('select').first();

    this.phoneInput = page
      .getByRole('textbox', { name: /enter phone number|phone|mobile|number/i })
      .or(page.getByPlaceholder(/phone|mobile|number/i))
      .first();

    this.dialCodeChip = page
      .locator('div')
      .filter({ has: this.phoneInput })
      .getByText(/^\+\d+$/);

    this.countryTrigger = page
      .getByRole('combobox', { name: /country|dial|code|region/i })
      .or(this.dialCodeChip.first());

    this.countrySelector = this.countryTrigger.or(this.nativeCountrySelect);

    this.continueButton = page
      .getByRole('button', {
        name: /^(continue|next|send(\s+(otp|code))?|login|log\s*in|sign\s*in)$/i,
      })
      .first();

    this.otpDigitInputs = page.locator('input[autocomplete="one-time-code"]');

    this.otpInput = page
      .getByRole('textbox', { name: /otp|code|verification|one[-\s]?time/i })
      .or(this.otpDigitInputs.first())
      .first();

    this.otpVerifyButton = page.getByRole('button', { name: /verify|confirm(\s+code)?/i }).first();

    this.otpEntryArea = this.otpInput.or(this.otpDigitInputs.first());

    this.validationOrErrorMessage = page
      .getByRole('alert')
      .or(page.locator('[class*="error" i]'))
      .or(page.locator('[data-testid*="error" i]'))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await this.phoneInput.waitFor({ state: 'visible' });
  }

  private dialFromChipText(raw: string): string | null {
    const m = raw.replace(/\u00a0/g, ' ').match(/\+\d{1,4}/);
    return m ? m[0] : null;
  }

  async selectCountry(countryName: string): Promise<void> {
    if ((await this.nativeCountrySelect.count()) > 0) {
      const option = this.nativeCountrySelect
        .locator('option')
        .filter({ hasText: new RegExp(countryName, 'i') })
        .first();
      const byValue = await option.getAttribute('value');
      if (byValue != null && byValue.length > 0) {
        await this.nativeCountrySelect.selectOption({ value: byValue });
      } else {
        const labelText = (await option.innerText()).trim();
        await this.nativeCountrySelect.selectOption({ label: labelText });
      }
      return;
    }

    const isUae = /united arab emirates|\buae\b/i.test(countryName);
    const targetDial = isUae ? '+971' : '+20';

    const chip = this.dialCodeChip.first();
    if ((await chip.count()) > 0) {
      const chipText = ((await chip.innerText()) || (await chip.textContent()) || '').trim();
      const currentDial = this.dialFromChipText(chipText);
      if (currentDial === targetDial) {
        return;
      }
      await chip.click();
    } else {
      await this.countryTrigger.click();
    }

    const search = this.page.getByRole('textbox', { name: /search country/i });
    if ((await search.count()) > 0) {
      const q = isUae ? 'United Arab Emirates' : countryName;
      await search.fill(q);
    }

    const listRowPattern = isUae
      ? /United Arab Emirates|UAE|\+\s*971/
      : new RegExp(countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const row = this.page.getByRole('listitem').filter({ hasText: listRowPattern }).first();
    await row.click();
  }

  async enterPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  async submitPhone(): Promise<void> {
    await this.continueButton.click();
  }

  async enterOtp(otp: string): Promise<void> {
    if (otp === '') {
      await this.clearOtpFields();
      return;
    }

    const digits = this.otpDigitInputs;
    const n = await digits.count();
    if (n >= otp.length && n > 0) {
      await digits.first().waitFor({ state: 'visible' });
      for (let i = 0; i < otp.length; i += 1) {
        await digits.nth(i).fill(otp[i]!);
      }
      return;
    }

    await this.otpInput.fill(otp);
  }

  /** Clears single or split OTP fields (no assertions). */
  async clearOtpFields(): Promise<void> {
    const n = await this.otpDigitInputs.count();
    if (n > 0) {
      for (let i = 0; i < n; i += 1) {
        await this.otpDigitInputs.nth(i).clear();
      }
      return;
    }
    await this.otpInput.clear();
  }

  async submitOtp(): Promise<void> {
    await this.otpVerifyButton.click();
  }

  /**
   * Full happy-path action sequence only (no assertions).
   */
  async completeLogin(countryName: string, phone: string, otp: string): Promise<void> {
    await this.goto();
    await this.selectCountry(countryName);
    await this.enterPhone(phone);
    await this.submitPhone();
    await this.enterOtp(otp);
    await this.submitOtp();
  }
}
