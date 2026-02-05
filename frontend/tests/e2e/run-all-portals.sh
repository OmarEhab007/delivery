#!/bin/bash
# Run all 4 portal E2E test suites with backend restarts between each
# to avoid hitting the API rate limit (300 req/15min).
#
# Usage: ./tests/e2e/run-all-portals.sh
# Requires: docker (backend runs in delivery-app-1 container)

set -e

PORTALS=("admin" "merchant" "truckowner" "driver")
WORKERS="${WORKERS:-2}"
TOTAL_PASS=0
TOTAL_FAIL=0
RESULTS=()

echo "=== E2E Portal Tests ==="
echo "Workers per project: $WORKERS"
echo ""

for portal in "${PORTALS[@]}"; do
  echo "--- Restarting backend (clear rate limits) ---"
  docker restart delivery-app-1 > /dev/null 2>&1
  sleep 5

  echo "--- Running $portal portal tests ---"
  OUTPUT=$(npx playwright test --project="$portal" --workers="$WORKERS" 2>&1)
  EXIT_CODE=$?

  # Extract pass/fail counts from output
  PASSED=$(echo "$OUTPUT" | grep -oE '[0-9]+ passed' | head -1 | grep -oE '[0-9]+' || echo "0")
  FAILED=$(echo "$OUTPUT" | grep -oE '[0-9]+ failed' | head -1 | grep -oE '[0-9]+' || echo "0")

  TOTAL_PASS=$((TOTAL_PASS + PASSED))
  TOTAL_FAIL=$((TOTAL_FAIL + FAILED))

  if [ "$EXIT_CODE" -eq 0 ]; then
    RESULTS+=("  $portal: ${PASSED} passed")
  else
    RESULTS+=("  $portal: ${PASSED} passed, ${FAILED} failed")
  fi

  echo "$OUTPUT" | tail -3
  echo ""
done

echo "=== Summary ==="
for result in "${RESULTS[@]}"; do
  echo "$result"
done
echo ""
echo "Total: ${TOTAL_PASS} passed, ${TOTAL_FAIL} failed"

if [ "$TOTAL_FAIL" -gt 0 ]; then
  exit 1
fi
