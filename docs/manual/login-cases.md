# Manual test cases — Login (staging)

**Application:** Bluworks staging  
**Login URL:** https://staging.bluworks.io/auth/login  
**Post-login URL:** https://staging.bluworks.io/home  
**Staging OTP:** 8182  

**Module:** Authentication — Mobile OTP login  

---

## LGN-001 — Valid Egypt login (012 prefix)

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-001 |
| **Title** | Valid Egypt login with 012 national number |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Staging available; user not logged in; default country Egypt (+20) or ability to select Egypt |
| **Test Data** | Country: Egypt (+20); Phone: 1201644545; OTP: 8182 |
| **Steps** | 1. Open login URL. 2. Ensure Egypt (+20) is selected. 3. Enter phone 1201644545. 4. Submit / continue to request OTP. 5. Enter OTP 8182. 6. Confirm / verify OTP. |
| **Expected Results** | OTP entry is shown after valid phone submit. After valid OTP, user is redirected to `https://staging.bluworks.io/home` (path `/home`). User is no longer on the login screen. |
| **Automation Coverage** | Smoke, Regression |
| **Related Automation Test Name** | `valid Egypt login — LGN-001 012 (012)` in `tests/regression/login.regression.spec.ts` |
| **Notes** | Mirrors smoke coverage for 012 in `tests/smoke/login.smoke.spec.ts` (same number). |

---

## LGN-002 — Valid Egypt login (010 prefix)

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-002 |
| **Title** | Valid Egypt login with 010 national number |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Same as LGN-001 |
| **Test Data** | Country: Egypt (+20); Phone: 1004505531; OTP: 8182 |
| **Steps** | Same flow as LGN-001 with phone 1004505531. |
| **Expected Results** | Same as LGN-001 — redirect to `/home` after successful OTP. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `valid Egypt login — LGN-002 010 (010)` in `tests/regression/login.regression.spec.ts` |

---

## LGN-003 — Valid Egypt login (011 prefix)

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-003 |
| **Title** | Valid Egypt login with 011 national number |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Same as LGN-001 |
| **Test Data** | Country: Egypt (+20); Phone: 1118052239; OTP: 8182 |
| **Steps** | Same flow as LGN-001 with phone 1118052239. |
| **Expected Results** | Same as LGN-001. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `valid Egypt login — LGN-003 011 (011)` in `tests/regression/login.regression.spec.ts` |

---

## LGN-004 — Valid Egypt login (015 prefix)

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-004 |
| **Title** | Valid Egypt login with 015 national number |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Same as LGN-001 |
| **Test Data** | Country: Egypt (+20); Phone: 1555558380; OTP: 8182 |
| **Steps** | Same flow as LGN-001 with phone 1555558380. |
| **Expected Results** | Same as LGN-001. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `valid Egypt login — LGN-004 015 (015)` in `tests/regression/login.regression.spec.ts` |

---

## LGN-005 — UAE number while Egypt selected

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-005 |
| **Title** | UAE-format number entered while Egypt (+20) remains selected |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Staging available; country left on Egypt |
| **Test Data** | Country: Egypt; Phone: value inconsistent with Egypt rules (e.g. UAE national sample used in automation — adjust to product rules) |
| **Steps** | 1. Open login URL. 2. Keep Egypt selected. 3. Enter a UAE-format / invalid-for-Egypt number. 4. Submit phone step. |
| **Expected Results** | Validation error is shown **or** OTP step does not appear. User remains in the login flow (e.g. still on `https://staging.bluworks.io/auth/login` or another pre-home auth route). |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `UAE number entered while Egypt is still selected — validation or no OTP step` in `tests/regression/login.regression.spec.ts` |
| **Notes** | Automation uses `invalidPhones.uaeNumberWhileEgyptSelected` — update when final UAE samples are fixed. |

---

## LGN-006 — Valid UAE login (UAE selected)

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-006 |
| **Title** | Valid UAE login when UAE (+971) is selected |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Staging available; valid UAE test mobile confirmed for environment |
| **Test Data** | Country: UAE (+971); Phone: **TODO** finalize staging UAE number; OTP: 8182 |
| **Steps** | 1. Open login URL. 2. Select UAE (+971). 3. Enter valid UAE phone. 4. Submit. 5. Enter OTP 8182. 6. Verify. |
| **Expected Results** | OTP step appears after valid phone. Successful login redirects to `/home`. |
| **Automation Coverage** | Smoke |
| **Related Automation Test Name** | `valid UAE login when UAE is selected and OTP 8182 is entered` in `tests/smoke/login.smoke.spec.ts` |
| **Notes** | Automation currently uses placeholder `uaeLogin.validPhone` in `tests/data/loginData.ts`. |

---

## LGN-007 — Invalid phone format

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-007 |
| **Title** | Invalid phone number format on Egypt selection |
| **Priority** | Medium |
| **Module** | Login |
| **Preconditions** | Staging available; Egypt selected |
| **Test Data** | Malformed phone (e.g. letters, too short — per product rules) |
| **Steps** | 1. Open login URL. 2. Select Egypt. 3. Enter invalid phone. 4. Submit. |
| **Expected Results** | Validation error is visible. OTP screen does **not** appear. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `invalid phone number format — validation visible, no OTP step` in `tests/regression/login.regression.spec.ts` |

---

## LGN-008 — Empty phone

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-008 |
| **Title** | Empty phone field |
| **Priority** | Medium |
| **Module** | Login |
| **Preconditions** | Staging available; Egypt selected |
| **Test Data** | Phone: empty |
| **Steps** | 1. Open login URL. 2. Select Egypt. 3. Leave phone empty. 4. Submit. |
| **Expected Results** | Required (or equivalent) validation message is visible. User cannot continue to OTP. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `empty phone — required validation, cannot reach OTP` in `tests/regression/login.regression.spec.ts` |

---

## LGN-009 — Invalid OTP

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-009 |
| **Title** | Invalid OTP after valid phone |
| **Priority** | High |
| **Module** | Login |
| **Preconditions** | Valid Egypt phone can reach OTP step |
| **Test Data** | Valid phone (e.g. 1201644545); OTP: incorrect (e.g. 9090 in automation) |
| **Steps** | 1. Complete phone step with valid number. 2. On OTP screen, enter wrong OTP. 3. Submit OTP. |
| **Expected Results** | Error message visible. User stays on OTP step. No redirect to `https://staging.bluworks.io/home` (automation asserts OTP UI remains and URL is not the home URL). |
| **Automation Coverage** | Smoke |
| **Related Automation Test Name** | `invalid OTP after valid phone keeps user on OTP and does not reach home` in `tests/smoke/login.smoke.spec.ts` |

---

## LGN-010 — Empty OTP

| Field | Value |
| --- | --- |
| **Test Case ID** | LGN-010 |
| **Title** | Empty OTP submission |
| **Priority** | Medium |
| **Module** | Login |
| **Preconditions** | Valid phone reaches OTP step |
| **Test Data** | Valid phone; OTP: empty |
| **Steps** | 1. Reach OTP step. 2. Leave OTP empty. 3. Submit / verify. |
| **Expected Results** | Required validation message visible. User remains on OTP step. No redirect to `https://staging.bluworks.io/home`. |
| **Automation Coverage** | Regression |
| **Related Automation Test Name** | `empty OTP — required validation, remain on OTP step` in `tests/regression/login.regression.spec.ts` |

---

## Automation mapping summary

| ID | Smoke / Regression | Spec file |
| --- | --- | --- |
| LGN-001 | Smoke, Regression (same 012 scenario in both suites) | `login.regression.spec.ts`, `login.smoke.spec.ts` |
| LGN-002–004 | Regression | `login.regression.spec.ts` |
| LGN-005 | Regression | `login.regression.spec.ts` |
| LGN-006 | Smoke | `login.smoke.spec.ts` |
| LGN-007–008, LGN-010 | Regression | `login.regression.spec.ts` |
| LGN-009 | Smoke | `login.smoke.spec.ts` |

Playwright tags: `test.describe(..., { tag: '@smoke' })` in `tests/smoke/login.smoke.spec.ts` and `{ tag: '@regression' }` in `tests/regression/login.regression.spec.ts` (applies to all tests in each file).
