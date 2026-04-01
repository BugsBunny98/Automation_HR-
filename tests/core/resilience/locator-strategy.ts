/**
 * Locator Strategy Definitions
 * =============================
 * Defines fallback chains for common UI elements.
 * Each strategy is an ordered list of locator approaches:
 * 1. Semantic (role, label) — most stable
 * 2. Test ID — requires app instrumentation
 * 3. Text/Placeholder — less stable but useful
 *
 * Usage:
 *   import { LOGIN_BUTTON_STRATEGY } from '@/tests/core/resilience/locator-strategy';
 *   const locator = new ResilientLocator(page, LOGIN_BUTTON_STRATEGY, 'Login button');
 */

export type LocatorType = 'role' | 'label' | 'placeholder' | 'testId' | 'text' | 'css';

export interface LocatorStrategyStep {
  type: LocatorType;
  value: string | RegExp | { role: string; name?: string | RegExp };
  description?: string;
}

export type LocatorStrategy = LocatorStrategyStep[];

// ============================================================================
// Login Page Strategies
// ============================================================================

export const PHONE_INPUT_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'textbox', name: /phone|mobile/i },
    description: 'Semantic role with phone/mobile label',
  },
  {
    type: 'placeholder',
    value: /phone|mobile/i,
    description: 'Placeholder text containing phone/mobile',
  },
  {
    type: 'testId',
    value: 'phone-input',
    description: 'Test ID attribute',
  },
  {
    type: 'css',
    value: 'input[type="tel"]',
    description: 'Fallback: tel input type',
  },
];

export const CONTINUE_BUTTON_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'button', name: /continue|next/i },
    description: 'Semantic role with continue/next label',
  },
  {
    type: 'testId',
    value: 'continue-button',
    description: 'Test ID attribute',
  },
  {
    type: 'text',
    value: /^(continue|next)$/i,
    description: 'Exact text match',
  },
];

export const LOGIN_BUTTON_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'button', name: /login|log\s*in|sign\s*in/i },
    description: 'Semantic role with login/sign in label',
  },
  {
    type: 'testId',
    value: 'login-button',
    description: 'Test ID attribute',
  },
  {
    type: 'text',
    value: /^(login|log\s*in|sign\s*in)$/i,
    description: 'Exact text match',
  },
];

export const OTP_INPUT_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'textbox', name: /otp|code|verification/i },
    description: 'Semantic role with OTP/code label',
  },
  {
    type: 'placeholder',
    value: /otp|code|verification/i,
    description: 'Placeholder text containing OTP/code',
  },
  {
    type: 'testId',
    value: 'otp-input',
    description: 'Test ID attribute',
  },
];

export const SUBMIT_OTP_BUTTON_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'button', name: /verify|submit|confirm/i },
    description: 'Semantic role with verify/submit label',
  },
  {
    type: 'testId',
    value: 'submit-otp-button',
    description: 'Test ID attribute',
  },
  {
    type: 'text',
    value: /^(verify|submit|confirm)$/i,
    description: 'Exact text match',
  },
];

export const VALIDATION_MESSAGE_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'alert' },
    description: 'ARIA alert role',
  },
  {
    type: 'testId',
    value: 'validation-message',
    description: 'Test ID attribute',
  },
  {
    type: 'css',
    value: '[role="alert"], .error-message, .validation-error',
    description: 'Fallback: common error classes',
  },
];

// ============================================================================
// Country Selector Strategies
// ============================================================================

export const COUNTRY_SELECTOR_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'combobox', name: /country|region/i },
    description: 'Semantic combobox with country label',
  },
  {
    type: 'testId',
    value: 'country-selector',
    description: 'Test ID attribute',
  },
  {
    type: 'css',
    value: 'select[name*="country"], select[id*="country"]',
    description: 'Fallback: select with country in name/id',
  },
];

// ============================================================================
// Generic Strategies
// ============================================================================

export const LOADING_INDICATOR_STRATEGY: LocatorStrategy = [
  {
    type: 'role',
    value: { role: 'status', name: /loading/i },
    description: 'ARIA status role with loading label',
  },
  {
    type: 'testId',
    value: 'loading-indicator',
    description: 'Test ID attribute',
  },
  {
    type: 'css',
    value: '.loading, .spinner, [data-loading="true"]',
    description: 'Fallback: common loading classes',
  },
];
