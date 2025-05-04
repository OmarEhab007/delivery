# Delivery App Test Suite

This directory contains automated tests for the Delivery App API. The tests are built using Jest and Supertest to validate the functionality of the completed modules.

## Setup

The test suite uses an in-memory MongoDB server for testing to ensure tests are isolated and do not depend on external databases.

## Test Structure

The tests are organized by module:

1. **Authentication Module** (`auth.test.js`)
   - User registration
   - User login
   - Profile management
   - Password management

2. **Fleet Management Module** (`fleet.test.js`)
   - Truck registration
   - Truck management (CRUD operations)
   - Driver assignment
   - Truck search and filtering

3. **Shipment Management Module** (`shipment.test.js`)
   - Shipment creation
   - Shipment management (CRUD operations)
   - Shipment status updates
   - Shipment search and filtering

4. **Application/Bid System Module** (`application.test.js`)
   - Application submission
   - Application management
   - Application approval workflow
   - Application search and filtering

## Test Utilities

The `utils/testUtils.js` file contains helper functions for creating test data:
- Creating test users with different roles
- Generating JWT tokens
- Creating test trucks, shipments, and applications

## Running Tests

You can run tests using the provided bash script:

```bash
./run-tests.sh
```

Or run specific test files:

```bash
npm test -- auth.test.js
npm test -- fleet.test.js
npm test -- shipment.test.js
npm test -- application.test.js
```

Or run all tests:

```bash
npm test
```

## Test Coverage

The test suite covers the following aspects of each module:
- API endpoint functionality
- Data validation
- Authorization and access control
- Business logic and workflows
- Error handling

## Test Limitations and Challenges

There are a few limitations and challenges with the current test suite:

1. **JWT Token Issues**: The application has specific JWT token requirements that need to be aligned with the test environment. Setting proper environment variables is crucial.

2. **Route Path Differences**: Ensure that test API routes match the actual routes in the application. The test files contain the correct routes.

3. **User Roles**: The User model has specific roles ('Merchant', 'TruckOwner', 'Driver') that must be used in the tests.

4. **Required Fields for Different Roles**: Each role has specific required fields (e.g., TruckOwner requires companyName and companyAddress).

5. **MongoDB Connection**: Tests use an in-memory MongoDB server to avoid affecting production data. This requires proper setup and teardown.

## Using Tests as Documentation

Even if tests cannot be directly executed due to environment or configuration issues, the test files serve as valuable documentation for the API:

1. They document API endpoints and routes
2. They explain the data structures and relationships
3. They demonstrate the business logic and workflows
4. They show validation and authorization requirements

## Adding New Tests

When adding new features, please follow these guidelines:
1. Create test data using the utility functions in `utils/testUtils.js`
2. Structure tests with descriptive `describe` and `it` blocks
3. Test both success and failure scenarios
4. Test authorization and permissions
5. Ensure tests are isolated and do not depend on other tests 