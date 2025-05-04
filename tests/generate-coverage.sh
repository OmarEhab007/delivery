#!/bin/bash

# Set environment variables for testing
export NODE_ENV=test
export JWT_SECRET=test_secret

# Create directories if they don't exist
mkdir -p logs
mkdir -p coverage

# Run tests with coverage
echo "Generating test coverage report..."
npx jest --coverage

echo "Test coverage report available in: ./coverage/lcov-report/index.html" 