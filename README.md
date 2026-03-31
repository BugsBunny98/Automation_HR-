# Playwright E2E Automation — Bluworks Staging

Production-ready Playwright + TypeScript framework with Docker support.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Docker + Docker Compose | optional (for containerised runs) |

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

## Docker Usage

### Why Docker for CI?

Docker eliminates "works on my machine" by pinning the OS, browser binaries, and
Node version inside the image. Use it in CI/CD and when sharing results across teams.
Use local runs for fast feedback during development.

### Build the image

```bash
docker build -t playwright-e2e .
```

### Run test suites via Docker Compose

```bash
# All tests
npm run docker:test            # or: docker compose run --rm playwright

# Smoke tests only
npm run docker:smoke           # or: docker compose run --rm smoke

# Regression tests
npm run docker:regression      # or: docker compose run --rm regression

# Onboarding tests
npm run docker:onboarding      # or: docker compose run --rm onboarding
```

### Run a single spec file inside Docker

```bash
docker compose run --rm playwright \
  npx playwright test tests/smoke/login.smoke.spec.ts --project=chromium
```

### Pass env values inline (no .env file needed)

```bash
docker run --rm \
  -e E2E_BASE_URL=https://staging.bluworks.io \
  -e E2E_STAGING_OTP=8182 \
  -e SKIP_AUTH_SETUP=1 \
  playwright-e2e npx playwright test --project=chromium --grep @smoke
```

### View reports after a Docker run

Reports are mounted to your host machine automatically:

```bash
npm run report:show
# or
npx playwright show-report playwright-report
```

---

## Project Structure

```
├── Dockerfile                        # Official Playwright image, pinned v1.51.0
├── docker-compose.yml                # Services: playwright, smoke, regression, onboarding
├── .dockerignore
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
`playwright/.auth/user.json`. All other projects load this file via `storageState`.

To skip auth setup (e.g. when running login tests that need a fresh session):

```bash
SKIP_AUTH_SETUP=1 npm run test:smoke
```

Auth state is gitignored. The `playwright/.auth/` directory is committed via `.gitkeep`.

---

## Best Practices

- **Page Objects are thin** — selectors + reusable actions only; assertions live in spec files.
- **API for setup/teardown** — use `ApiClient` to create/clean test data; don't rely on UI for preconditions.
- **Serial execution** — `workers: 1` prevents OTP rate-limiting on staging.
- **Tag every test** — `@smoke` for critical paths, `@regression` for full coverage, `@onboarding` for CS flows.
- **Docker for CI** — guarantees the same Chromium version that the image was built with.
- **Local for dev** — faster iteration; skip the Docker overhead during active development.
