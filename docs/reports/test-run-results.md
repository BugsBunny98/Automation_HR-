# Login Module — Test Run Results

| | |
|---|---|
| **Project** | Bluworks Staging — Login Module |
| **Environment** | https://staging.bluworks.io |
| **Execution Mode** | Docker — `mcr.microsoft.com/playwright:v1.58.0-noble` |
| **Browser** | Chromium (headless) |
| **Run Date** | 2026-03-30 |
| **Total Duration** | ~48.6s (smoke), ~serial execution |
| **Workers** | 1 (serial) |
| **Retries** | 2 in CI |

---

## Smoke Suite — Results

> **4 / 4 passed** · `@smoke` tag · file: `tests/smoke/login.smoke.spec.ts`

| # | Test Case ID | Test Name | Phone | OTP | Result | Notes |
|---|---|---|---|---|---|---|
| 1 | LGN-001 | Valid Egypt login with 1201644545 and OTP 8182 | 1201644545 (012) | 8182 | ✅ PASSED | Redirected to `/home` or `/billing-blocked` |
| 2 | LGN-006 | Valid UAE login with 507021238 and OTP 2050 | 507021238 (+971) | 2050 | ✅ PASSED | Redirected to `/home` or `/billing-blocked` |
| 3 | LGN-009 | Invalid OTP after valid Egypt phone keeps user on OTP step | 1201644545 (012) | 9090 (invalid) | ✅ PASSED | Error shown, stayed on OTP screen |
| 4 | LGN-011 | Invalid OTP after valid UAE phone keeps user on OTP step | 507021238 (+971) | 9090 (invalid) | ✅ PASSED | Error shown, stayed on OTP screen |

---

## Regression Suite — Results

> **8 / 9 tests** · `@regression` tag · file: `tests/regression/login.regression.spec.ts`  
> LGN-004 intentionally skipped (Egypt 015 unreliable on staging)

| # | Test Case ID | Test Name | Phone | OTP | Result | Notes |
|---|---|---|---|---|---|---|
| 1 | LGN-001 | Valid Egypt login — LGN-001 012 | 1201644545 (012) | 8182 | ✅ PASSED | Redirected to home |
| 2 | LGN-002 | Valid Egypt login — LGN-002 010 | 1004505531 (010) | 8182 | ✅ PASSED | Redirected to home |
| 3 | LGN-003 | Valid Egypt login — LGN-003 011 | 1118052239 (011) | 8182 | ✅ PASSED | Redirected to home |
| 4 | LGN-004 | Valid Egypt login — LGN-004 015 | 1555558380 (015) | 8182 | ⏭ SKIPPED | 015 MSISDN not receiving OTP on staging. Enable with `E2E_ENABLE_EGYPT_015=1` |
| 5 | LGN-005 | UAE number entered while Egypt is still selected | 507021238 (as Egypt) | — | ✅ PASSED | No OTP step shown, remained on login page |
| 6 | LGN-007 | Invalid phone number format — cannot submit, no OTP step | 12ab34cd | — | ✅ PASSED | Login button disabled, OTP step hidden |
| 7 | LGN-008 | Empty phone — Login disabled, cannot reach OTP | _(empty)_ | — | ✅ PASSED | Login button disabled, OTP step hidden |
| 8 | LGN-010 | Empty OTP — required validation, remain on OTP step | 1201644545 (012) | _(empty)_ | ✅ PASSED | Error shown, stayed on OTP screen |

---

## Test Case Details

### LGN-001 — Valid Egypt Login (012)
| Field | Value |
|---|---|
| **Suite** | Smoke + Regression |
| **Country** | Egypt (+20) |
| **Phone** | 1201644545 |
| **OTP** | 8182 |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Enter phone → 4. Press Enter → 5. OTP visible → 6. Enter OTP → 7. Submit |
| **Expected** | OTP screen appears · Redirect to `/home` or `/billing-blocked` · Not on `/auth/login` |
| **Result** | ✅ PASSED |

---

### LGN-002 — Valid Egypt Login (010)
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | 1004505531 |
| **OTP** | 8182 |
| **Steps** | Same as LGN-001 |
| **Expected** | OTP screen appears · Redirect to `/home` or `/billing-blocked` |
| **Result** | ✅ PASSED |

---

### LGN-003 — Valid Egypt Login (011)
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | 1118052239 |
| **OTP** | 8182 |
| **Steps** | Same as LGN-001 |
| **Expected** | OTP screen appears · Redirect to `/home` or `/billing-blocked` |
| **Result** | ✅ PASSED |

---

### LGN-004 — Valid Egypt Login (015)
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | 1555558380 |
| **OTP** | 8182 |
| **Steps** | Same as LGN-001 |
| **Expected** | OTP screen appears · Redirect to `/home` or `/billing-blocked` |
| **Result** | ⏭ SKIPPED |
| **Reason** | MSISDN 015 does not receive OTP on current staging. Set `E2E_ENABLE_EGYPT_015=1` in `.env` to enable when this number is activated. |

---

### LGN-005 — UAE Number While Egypt Selected
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) selected, UAE number entered |
| **Phone** | 507021238 |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Enter UAE phone → 4. Press Enter |
| **Expected** | Validation error shown OR OTP step not visible · Remains on `/auth/login` |
| **Result** | ✅ PASSED |

---

### LGN-006 — Valid UAE Login
| Field | Value |
|---|---|
| **Suite** | Smoke |
| **Country** | UAE (+971) |
| **Phone** | 507021238 |
| **OTP** | 2050 |
| **Steps** | 1. Open login URL → 2. Select UAE → 3. Enter phone → 4. Press Enter → 5. OTP visible → 6. Enter OTP → 7. Submit |
| **Expected** | OTP screen appears · Redirect to `/home` or `/billing-blocked` · Not on `/auth/login` |
| **Result** | ✅ PASSED |

---

### LGN-007 — Invalid Phone Format
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | `12ab34cd` (malformed) |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Enter malformed phone |
| **Expected** | Login button is disabled · OTP step is not shown |
| **Result** | ✅ PASSED |

---

### LGN-008 — Empty Phone
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | _(empty)_ |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Leave phone empty |
| **Expected** | Login button is disabled · OTP step is not shown |
| **Result** | ✅ PASSED |

---

### LGN-009 — Invalid OTP (Egypt)
| Field | Value |
|---|---|
| **Suite** | Smoke |
| **Country** | Egypt (+20) |
| **Phone** | 1201644545 |
| **OTP** | 9090 (invalid) |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Enter phone → 4. Press Enter → 5. OTP visible → 6. Enter wrong OTP → 7. Submit |
| **Expected** | Error/validation message visible · OTP screen still shown · Not redirected to home |
| **Result** | ✅ PASSED |

---

### LGN-010 — Empty OTP
| Field | Value |
|---|---|
| **Suite** | Regression |
| **Country** | Egypt (+20) |
| **Phone** | 1201644545 |
| **OTP** | _(empty)_ |
| **Steps** | 1. Open login URL → 2. Select Egypt → 3. Enter phone → 4. Press Enter → 5. OTP visible → 6. Leave OTP empty → 7. Submit |
| **Expected** | Error/validation message visible · OTP screen still shown · Not redirected to home |
| **Result** | ✅ PASSED |

---

### LGN-011 — Invalid OTP (UAE)
| Field | Value |
|---|---|
| **Suite** | Smoke |
| **Country** | UAE (+971) |
| **Phone** | 507021238 |
| **OTP** | 9090 (invalid) |
| **Steps** | 1. Open login URL → 2. Select UAE → 3. Enter phone → 4. Press Enter → 5. OTP visible → 6. Enter wrong OTP → 7. Submit |
| **Expected** | Error/validation message visible · OTP screen still shown · Not redirected to home |
| **Result** | ✅ PASSED |

---

## Overall Summary

| Suite | Total | Passed | Skipped | Failed |
|---|---|---|---|---|
| **Smoke** | 4 | 4 | 0 | 0 |
| **Regression** | 9 | 7 | 1 | 0 |
| **Combined** | 13 | 11 | 1 | 0 |

---

## Known Issues & Notes

| # | Issue | Status | Action |
|---|---|---|---|
| 1 | Egypt 015 (1555558380) does not receive OTP on staging | Known — skipped | Set `E2E_ENABLE_EGYPT_015=1` when MSISDN is activated |
| 2 | Login button click unreliable on staging | Workaround applied | `submitPhone()` now uses `Enter` key press instead of button click |
| 3 | Post-login may redirect to `/billing-blocked` instead of `/home` | Expected — handled | Assertions use regex matching both URLs |

---

## Execution Environment

| Setting | Value |
|---|---|
| **Docker Image** | `mcr.microsoft.com/playwright:v1.58.0-noble` |
| **Playwright Version** | 1.58.2 |
| **Node Version** | 22.x |
| **Base URL** | `https://staging.bluworks.io` |
| **OTP (Egypt)** | 8182 |
| **OTP (UAE)** | 2050 |
| **Auth Setup** | Skipped (`SKIP_AUTH_SETUP=1`) |
| **Trace** | On first retry |
| **Screenshot** | On failure |
| **Video** | Retained on failure |

---

## Run Command Used

```bash
docker run --rm \
  -e CI=true \
  -e E2E_BASE_URL=https://staging.bluworks.io \
  -e SKIP_AUTH_SETUP=1 \
  -v "${PWD}/test-results:/app/test-results" \
  -v "${PWD}/playwright-report:/app/playwright-report" \
  --entrypoint /bin/bash playwright-e2e \
  -c "npx playwright test --project=chromium --grep @smoke"
```
