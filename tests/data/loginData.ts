/**
 * Shared login test data for staging (bluworks).
 * Keep specs free of raw literals where possible.
 *
 * URLs derive from `E2E_BASE_URL` (see `.env.example`). Loaded after `dotenv` in `playwright.config.ts`.
 */

function readBaseUrl(): string {
  const raw = process.env.E2E_BASE_URL?.trim();
  const candidate = (raw && raw.length > 0 ? raw : 'https://staging.bluworks.io').replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(
      `[loginData] Invalid E2E_BASE_URL: "${raw ?? ''}". ` +
        'Set a valid absolute URL in `.env` (copy from `.env.example`).',
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `[loginData] E2E_BASE_URL must use http or https. Got: "${candidate}"`,
    );
  }
  return candidate;
}

/** Staging / target origin (no trailing slash) */
export const BASE_URL = readBaseUrl();

export const LOGIN_URL = `${BASE_URL}/auth/login` as const;
export const HOME_URL = `${BASE_URL}/home` as const;

/**
 * Successful mobile login does not always land on `/home` on staging (e.g. billing-blocked for some users).
 * Assertions use this pattern so tests stay honest with the product while still proving we left `/auth/login`.
 */
export const postLoginUrlRegex = new RegExp(
  `^${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(home|billing-blocked)(/|\\?|$)`,
);

const validOtp = process.env.E2E_STAGING_OTP?.trim();
const invalidOtp = process.env.E2E_INVALID_OTP?.trim();

/**
 * Fixed staging OTP for Egypt (overridable for forks / other envs).
 */
export const stagingOtp = {
  valid: validOtp && validOtp.length > 0 ? validOtp : '8182',
  invalid: invalidOtp && invalidOtp.length > 0 ? invalidOtp : '9090',
};

/**
 * Fixed staging OTP for UAE — different from Egypt.
 */
export const uaeOtp = {
  valid: '2050',
  invalid: '9090',
};

/**
 * TODO: Align `egypt` / `uae` strings with the exact labels shown in the staging country picker
 * (e.g. "Egypt (+20)", "UAE (+971)").
 */
export const countryLabels = {
  egypt: 'Egypt',
  uae: 'United Arab Emirates',
} as const;

/**
 * Egypt mobile samples grouped by local prefix (without leading 0 in stored value where UI expects national number).
 * Numbers provided by requirements; UI may expect with or without leading 0 — adjust if staging differs.
 */
export const egyptPhonesByPrefix = {
  '012': '1201644545',
  '010': '1004505531',
  '011': '1118052239',
  '015': '1555558380',
} as const;

/** Egypt national prefix keys used in `egyptPhonesByPrefix` */
export type EgyptPrefix = keyof typeof egyptPhonesByPrefix;

/**
 * UAE login — valid national number for staging.
 */
export const uaeLogin = {
  validPhone: '507021238',
} as const;

/**
 * Invalid / misuse samples for negative paths.
 */
export const invalidPhones = {
  /** Clearly invalid pattern for Egypt selection */
  malformed: '12ab34cd',
  tooShort: '123',
  /** Entered while Egypt (+20) is still selected — should fail validation or block OTP. */
  uaeNumberWhileEgyptSelected: '507021238',
} as const;
