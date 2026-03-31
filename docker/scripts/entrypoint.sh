#!/bin/bash
# =============================================================================
# Playwright Test Container Entrypoint
# =============================================================================
# Flexible entrypoint script that supports multiple test suites and custom args.
#
# Environment Variables:
#   TEST_SUITE    - Test suite to run: e2e, smoke, regression, onboarding, setup
#   PLAYWRIGHT_*  - Any Playwright environment variables
#
# Usage:
#   docker run playwright-e2e                              # Runs full e2e suite
#   docker run -e TEST_SUITE=smoke playwright-e2e          # Runs smoke tests
#   docker run playwright-e2e npx playwright test --debug  # Custom command
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print environment info
log_info "=== Playwright E2E Test Runner ==="
log_info "Node version: $(node --version)"
log_info "NPM version: $(npm --version)"
log_info "Playwright version: $(npx playwright --version)"
log_info "Test suite: ${TEST_SUITE:-e2e}"
log_info "Base URL: ${E2E_BASE_URL:-not set}"
log_info "CI mode: ${CI:-false}"

# Ensure report directories exist with correct permissions
mkdir -p /app/playwright-report /app/test-results /app/playwright/.auth
chmod -R 777 /app/playwright-report /app/test-results /app/playwright/.auth 2>/dev/null || true

# If custom command is passed, execute it directly
if [ "$1" != "npx" ] && [ -n "$1" ]; then
    log_info "Executing custom command: $@"
    exec "$@"
fi

# Determine test command based on TEST_SUITE environment variable
TEST_SUITE="${TEST_SUITE:-e2e}"
PLAYWRIGHT_ARGS=""

case "$TEST_SUITE" in
    "smoke")
        log_info "Running SMOKE test suite..."
        PLAYWRIGHT_ARGS="--grep @smoke"
        ;;
    "regression")
        log_info "Running REGRESSION test suite..."
        PLAYWRIGHT_ARGS="--grep @regression"
        ;;
    "onboarding")
        log_info "Running ONBOARDING test suite..."
        PLAYWRIGHT_ARGS="--grep @onboarding"
        ;;
    "setup")
        log_info "Running SETUP project only..."
        PLAYWRIGHT_ARGS="--project=setup"
        ;;
    "e2e"|"all"|"")
        log_info "Running FULL E2E test suite..."
        PLAYWRIGHT_ARGS=""
        ;;
    *)
        log_warn "Unknown TEST_SUITE: $TEST_SUITE, running full suite"
        PLAYWRIGHT_ARGS=""
        ;;
esac

# Add project filter if not already specified
if [[ ! "$PLAYWRIGHT_ARGS" =~ "--project" ]]; then
    PLAYWRIGHT_ARGS="--project=chromium $PLAYWRIGHT_ARGS"
fi

# Execute Playwright tests
log_info "Executing: npx playwright test $PLAYWRIGHT_ARGS $@"
echo ""

# Run tests and capture exit code
set +e
npx playwright test $PLAYWRIGHT_ARGS "$@"
EXIT_CODE=$?
set -e

# Report results
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    log_success "All tests passed!"
else
    log_error "Tests failed with exit code: $EXIT_CODE"
fi

# Show report location
if [ -f "/app/playwright-report/index.html" ]; then
    log_info "HTML report available at: playwright-report/index.html"
fi

if [ -d "/app/test-results" ] && [ "$(ls -A /app/test-results 2>/dev/null)" ]; then
    log_info "Test artifacts available in: test-results/"
fi

exit $EXIT_CODE
