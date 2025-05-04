#!/bin/bash

# Set environment variables for testing
export NODE_ENV=test
export JWT_SECRET=test_secret

# Create directories if they don't exist
mkdir -p logs

# Run tests
echo "Running tests for Authentication Module..."
npx jest auth.test.js

echo "Running tests for Fleet Management Module..."
npx jest fleet.test.js

echo "Running tests for Shipment Management Module..."
npx jest shipment.test.js

echo "Running tests for Application/Bid System Module..."
npx jest application.test.js

# Or run all tests at once
# echo "Running all tests..."
# npx jest 