# API Testing Guide

## Overview

This guide provides instructions for testing the Delivery App APIs. It covers manual testing with Postman as well as automated testing with Jest.

## Postman Collection

A Postman collection is included in the project root (`delivery-app-postman-collection.json`). This collection contains pre-configured requests for all API endpoints.

### Importing the Collection

1. Open Postman
2. Click on "Import" button
3. Select or drag the `delivery-app-postman-collection.json` file
4. The collection will be imported with all requests and environments

### Setting Up Environment Variables

1. Create a new environment in Postman
2. Set the following variables:
   - `baseUrl`: The base URL of your API (e.g., `http://localhost:3000/api`)
   - `adminToken`: JWT token for admin user (obtained after login)
   - `merchantToken`: JWT token for merchant user (obtained after login)
   - `truckOwnerToken`: JWT token for truck owner user (obtained after login)
   - `driverToken`: JWT token for driver user (obtained after login)

### Authentication

Before testing protected endpoints, you need to obtain JWT tokens:

1. Execute the "Login" request in the Auth folder
2. The response will contain a JWT token
3. Use the "Set as Variable" feature in Postman to set the token to the appropriate environment variable (e.g., `merchantToken`)

### Testing Workflow

The collection is organized to follow typical user workflows:

1. **Auth Flow**:
   - Register users of different roles
   - Login to obtain tokens
   - Test password reset flow

2. **Merchant Flow**:
   - Create shipments
   - View and manage shipments
   - Select applications from truck owners

3. **Truck Owner Flow**:
   - Create and manage trucks
   - Register drivers
   - Apply for shipments

4. **Driver Flow**:
   - View assigned shipments
   - Update shipment status and location

5. **Admin Flow**:
   - Manage users
   - View and manage all shipments
   - View system statistics

## Automated Testing

The application uses Jest and Supertest for automated API testing.

### Test Structure

Tests are organized in the `tests/` directory:

```
tests/
├── unit/              # Unit tests for models, services, etc.
├── integration/       # API integration tests
├── fixtures/          # Test data fixtures
└── setup.js           # Test setup and teardown
```

### Running Tests

To run all tests:

```bash
npm test
```

To run specific test suites:

```bash
npm test -- --testPathPattern=auth
```

To run tests with coverage:

```bash
npm run test:coverage
```

### Writing API Tests

Example API test for creating a shipment:

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { Shipment } = require('../../src/models/Shipment');
const { signToken } = require('../../src/utils/jwtUtils');

describe('Shipment API', () => {
  let merchant;
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Shipment.deleteMany({});

    // Create a test merchant
    merchant = await User.create({
      name: 'Test Merchant',
      email: 'merchant@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'Merchant'
    });

    token = signToken(merchant._id);
  });

  describe('POST /api/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        origin: {
          address: 'Origin Address',
          country: 'USA'
        },
        destination: {
          address: 'Destination Address',
          country: 'Canada'
        },
        cargoDetails: {
          description: 'Test Cargo',
          weight: 1000,
          volume: 10
        }
      };

      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.shipment).toHaveProperty('_id');
      expect(response.body.data.shipment.merchantId).toBe(merchant._id.toString());
      expect(response.body.data.shipment.status).toBe('REQUESTED');
    });
  });
});
```

## Common Test Scenarios

### Authentication Tests

1. **Registration**:
   - Valid registration should create a user and return a token
   - Duplicate email should return an error
   - Invalid data should return validation errors

2. **Login**:
   - Valid credentials should return a token
   - Invalid credentials should return an error
   - Inactive user should not be able to login

3. **Password Reset**:
   - Request password reset with valid email
   - Reset password with valid token
   - Use expired token should fail

### Shipment Tests

1. **Create Shipment**:
   - Merchant creates a shipment with valid data
   - Invalid data should return validation errors
   - Non-merchant users cannot create shipments

2. **Apply for Shipment**:
   - Truck owner applies for a shipment
   - Cannot apply twice for the same shipment
   - Cannot apply with unavailable truck

3. **Select Application**:
   - Merchant accepts an application
   - Other applications are automatically rejected
   - Shipment status is updated to CONFIRMED

4. **Shipment Timeline**:
   - Truck owner/driver adds timeline entries
   - Shipment status is updated accordingly
   - Access control is enforced

### User Management Tests

1. **Profile Update**:
   - User can update their own profile
   - Password update requires current password
   - Email uniqueness is enforced

2. **Truck Management**:
   - Truck owner can create trucks
   - Truck owner can assign drivers to trucks
   - Truck availability is tracked correctly

## Testing Best Practices

1. **Use clean database for each test**: Reset the database state before each test to ensure isolation.

2. **Test both positive and negative cases**: Test successful operations as well as error handling.

3. **Test authorization**: Ensure users can only access resources they are authorized to access.

4. **Use appropriate assertions**: Be specific about what you're testing and use appropriate assertions.

5. **Mock external services**: Use mocks for external services like email, payment gateways, etc.

6. **Test the complete workflow**: Test end-to-end scenarios that mimic real user behavior.

7. **Performance testing**: For critical endpoints, include basic performance tests.

## Debugging Failed Tests

1. Check the test logs for detailed error information
2. Verify that your test environment variables are set correctly
3. Ensure the database connection is working
4. Check for race conditions in asynchronous tests
5. Use `console.log` or debugging tools to track request/response data
6. Verify that your test data is correct

## Load Testing

For load testing critical endpoints, you can use tools like:

- Apache JMeter
- Artillery.io
- LoadRunner

Example Artillery.io configuration:

```yaml
# load-test.yml
config:
  target: "http://localhost:3000/api"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"
      Authorization: "Bearer {{token}}"

scenarios:
  - name: "List shipments and view details"
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "merchant@example.com"
            password: "password123"
          capture:
            json: "$.data.token"
            as: "token"
      - get:
          url: "/shipments"
          headers:
            Authorization: "Bearer {{token}}"
      - get:
          url: "/shipments/{{shipmentId}}"
          headers:
            Authorization: "Bearer {{token}}"
```

Run the load test:

```bash
artillery run load-test.yml
``` 