# Playwright E2E Automation — Bluworks Staging

Production-ready Playwright + TypeScript framework for E2E testing.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

---

## Local Setup

```bash
# 1. Install dependencies
npm ci

# 2. Install Playwright browsers
npm run install:browsers

# 3. Create your local env file
cp .env.example .env
# Edit .env — at minimum set E2E_BASE_URL
```

---

## Running Tests Locally

```bash
# All tests (chromium)
npm run test:e2e

# Smoke suite (@smoke tag)
npm run test:smoke

# Regression suite (@regression tag)
npm run test:regression

# Onboarding suite (@onboarding tag)
npm run test:onboarding

# Headed (visible browser)
npm run test:headed

# Debug a single file
npx playwright test tests/smoke/login.smoke.spec.ts --debug

# List all tests without running
npm run test:list
```

---

## Project Structure

```
├── playwright.config.ts              # Config: projects, retries, timeouts, reporters
├── package.json                      # Scripts and dependencies
├── .env.example                      # Copy → .env, never commit .env
├── .github/workflows/playwright.yml  # CI: smoke on PR, regression/onboarding on dispatch
├── playwright/
│   └── .auth/
│       └── .gitkeep                  # Dir committed; user.json is gitignored
└── tests/
    ├── data/loginData.ts             # Centralised test data
    ├── pages/LoginPage.ts            # Page Object Model — Login
    ├── fixtures/index.ts             # Custom Playwright fixtures
    ├── api/apiClient.ts              # API helpers for setup/cleanup
    ├── setup/global.setup.ts         # Auth setup — saves storageState
    ├── smoke/login.smoke.spec.ts     # @smoke tests
    ├── regression/login.regression.spec.ts  # @regression tests
    └── onboarding/onboarding.spec.ts # @onboarding tests (TODO)
```

---

## CI/CD — GitHub Actions

| Job | Trigger | Suite |
|-----|---------|-------|
| `smoke` | PR to `main`/`release/**`, push to `main` | `@smoke` |
| `regression` | `workflow_dispatch` | `@regression` |
| `onboarding` | `workflow_dispatch` | `@onboarding` |

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `APP_BASE_URL` | Staging URL, e.g. `https://staging.bluworks.io` |
| `STAGING_OTP` | Fixed OTP for staging logins |
| `TEST_EMAIL` | Test account phone/email |
| `TEST_PASSWORD` | Test account OTP/password |

If a secret is missing the workflow falls back to safe defaults (e.g. `https://staging.bluworks.io`).

### Trigger regression manually

1. GitHub → **Actions** → **Playwright E2E**
2. **Run workflow** → choose `regression` → **Run workflow**

---

## Authentication State

`tests/setup/global.setup.ts` logs in via UI and saves the browser session to
`playwright/.auth/user.json`. The `onboarding` project loads this file via `storageState`.

Login tests (`smoke` and `regression`) always start with a fresh, unauthenticated browser.

Auth state is gitignored. The `playwright/.auth/` directory is committed via `.gitkeep`.

---

## Viewing Reports

After any test run:

```bash
npm run report:show
# or
npx playwright show-report playwright-report
```

HTML reports are saved to `playwright-report/` and can be opened in any browser.

---

## Best Practices

- **Page Objects are thin** — selectors + reusable actions only; assertions live in spec files.
- **API for setup/teardown** — use `ApiClient` to create/clean test data; don't rely on UI for preconditions.
- **Serial execution** — `workers: 1` prevents OTP rate-limiting on staging.
- **Tag every test** — `@smoke` for critical paths, `@regression` for full coverage, `@onboarding` for CS flows.
