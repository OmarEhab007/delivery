#!/bin/bash

# Check if we should run with coverage
if [ "$1" == "--coverage" ]; then
  # Run tests with coverage report
  JWT_SECRET=test-secret-key-for-development-only \
  JWT_EXPIRES_IN=90d \
  NODE_ENV=test \
  LOG_LEVEL=info \
  npm test -- --coverage
else
  # Run tests without coverage
  JWT_SECRET=test-secret-key-for-development-only \
  JWT_EXPIRES_IN=90d \
  NODE_ENV=test \
  LOG_LEVEL=info \
  npm test
fi

# Exit with the same code as the test command
exit $? 