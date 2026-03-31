# =============================================================================
# Playwright E2E Test Container
# =============================================================================
# Uses the official Microsoft Playwright image pinned to v1.51.0 (matching
# the project's package.json @playwright/test version).
# Browsers are pre-installed in the image — npm ci is all that's needed.
#
# Build:  docker build -t playwright-e2e .
# Run:    docker run --rm --env-file .env playwright-e2e
# =============================================================================

FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (browsers are already in the image)
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY playwright.config.ts ./
COPY tests/ ./tests/
COPY scripts/ ./scripts/

# Create writable output directories
RUN mkdir -p /app/playwright-report \
    /app/test-results \
    /app/playwright/.auth \
    && chmod -R 777 /app/playwright-report \
                    /app/test-results \
                    /app/playwright/.auth

ENV CI=true
ENV NODE_ENV=test
ENV SKIP_AUTH_SETUP=1

CMD ["npx", "playwright", "test", "--project=chromium"]
