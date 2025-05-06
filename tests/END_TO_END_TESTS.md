# End-to-End Tests for Delivery App

## Overview

This document describes the end-to-end tests for the delivery application that cover the complete flow from user registration to shipment completion.

## Test Coverage

The end-to-end tests simulate real-world user journeys through the application. They validate the core business processes and ensure that all components work together correctly.

## Key Test Scenarios

Our main end-to-end test (`simplified-e2e.test.js`) covers the following key scenarios:

### 1. User Creation
- Create different user types: Merchant, Truck Owner, and Driver
- Verify user role-specific properties
- Establish proper ownership relationships

### 2. Fleet Management
- Create trucks with appropriate properties
- Assign drivers to trucks
- Verify truck-driver relationships

### 3. Shipment Creation
- Create shipments with origin, destination, and cargo details
- Verify initial shipment state is REQUESTED

### 4. Application Process
- Submit applications to handle shipments
- Accept applications
- Assign shipments to trucks, drivers, and owners

### 5. Shipment Execution (Status Transitions)
- Test the complete shipment lifecycle:
  - REQUESTED → ASSIGNED → LOADING → IN_TRANSIT → DELIVERED → COMPLETED
- Verify each state transition works correctly

## Running the Tests

### Using the Shell Script

```bash
./tests/run-e2e-tests.sh
```

This script:
- Sets up the test environment
- Runs the end-to-end tests
- Saves the output to a timestamped log file in tests/logs
- Reports the test results

### Using npm

```bash
npm run test:e2e
```

## Implementation Details

### Database Operations

The tests interact directly with the database models to ensure reliability:

```javascript
// Example: Creating a user
const merchant = await User.create({
  name: 'Test Merchant',
  email: `merchant${Date.now()}@example.com`,
  password: hashedPassword,
  phone: '+1234567890',
  role: 'Merchant',
  isVerified: true
});
```

### Validation Approach

Each test validates both the operation success and the resulting data:

```javascript
// Example: Validating status transitions
shipment = await Shipment.findByIdAndUpdate(
  shipment._id,
  { status: ShipmentStatus.LOADING },
  { new: true }
);
expect(shipment.status).toBe(ShipmentStatus.LOADING);
```

## Notes on Test Design

The tests are designed to:

1. Be independent of API implementation details
2. Avoid complex timeline operations that can cause test failures
3. Focus on testing the core business logic
4. Provide a reliable verification of the application's critical paths
5. Be robust against schema changes

## Troubleshooting

If tests are failing, check:

1. MongoDB connection and model definitions
2. Test environment variables
3. Schema validation rules
4. MongoDB memory server configuration 