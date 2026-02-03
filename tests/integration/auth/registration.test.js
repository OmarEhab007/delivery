/**
 * Registration Integration Tests
 *
 * Tests for the user registration flow including:
 * - Merchant registration creates approval request
 * - TruckOwner registration creates approval request
 * - Validation errors for invalid input
 * - Duplicate email prevention
 */

const request = require('supertest');

const { app } = require('../../../src/server');
const User = require('../../../src/models/User');
const { UserRegistrationRequest } = require('../../../src/models/UserRegistrationRequest');
const { createTestUser, createAuthenticatedUser } = require('../../utils/authHelpers');

/**
 * Helper to check if error array contains an error for a specific field
 * Express-validator uses 'param' in older versions and 'path' in newer versions
 */
const hasErrorForField = (errors, fieldName) => {
  if (!errors || !Array.isArray(errors)) return false;
  return errors.some((e) => e.path === fieldName || e.param === fieldName);
};

describe('Registration API', () => {
  describe('POST /api/auth/register/merchant', () => {
    const validMerchantData = {
      name: 'Test Merchant',
      email: 'testmerchant@example.com',
      password: 'Password123!',
      phone: '+12025551234',
    };

    it('should create a registration request for merchant', async () => {
      const timestamp = Date.now();
      const userData = {
        ...validMerchantData,
        email: `merchant-${timestamp}@example.com`,
      };

      const response = await request(app).post('/api/auth/register/merchant').send(userData);

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toMatch(/approval/i);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.requestId).toBeDefined();
      expect(response.body.data.state).toBe('PENDING');
    });

    it('should store registration request in database', async () => {
      const timestamp = Date.now();
      const userData = {
        ...validMerchantData,
        email: `merchant-db-${timestamp}@example.com`,
      };

      const response = await request(app).post('/api/auth/register/merchant').send(userData);

      expect(response.status).toBe(202);

      // Verify the request is stored in database
      const registrationRequest = await UserRegistrationRequest.findById(
        response.body.data.requestId
      );
      expect(registrationRequest).toBeDefined();
      expect(registrationRequest.role).toBe('Merchant');
      expect(registrationRequest.payload.email).toBe(userData.email);
      expect(registrationRequest.state).toBe('PENDING');
    });

    it('should not create user directly (requires approval)', async () => {
      const timestamp = Date.now();
      const userData = {
        ...validMerchantData,
        email: `merchant-no-direct-${timestamp}@example.com`,
      };

      await request(app).post('/api/auth/register/merchant').send(userData);

      // User should NOT be created directly
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeNull();
    });

    describe('Validation Errors', () => {
      it('should return 400 for invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...validMerchantData,
            email: 'notanemail',
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(hasErrorForField(response.body.errors, 'email')).toBe(true);
      });

      it('should return 400 for missing name', async () => {
        const { name, ...dataWithoutName } = validMerchantData;

        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...dataWithoutName,
            email: `merchant-noname-${Date.now()}@example.com`,
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });

      it('should return 400 for missing email', async () => {
        const { email, ...dataWithoutEmail } = validMerchantData;

        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send(dataWithoutEmail);

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });

      it('should return 400 for missing password', async () => {
        const { password, ...dataWithoutPassword } = validMerchantData;

        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...dataWithoutPassword,
            email: `merchant-nopwd-${Date.now()}@example.com`,
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });

      it('should return 400 for missing phone', async () => {
        const { phone, ...dataWithoutPhone } = validMerchantData;

        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...dataWithoutPhone,
            email: `merchant-nophone-${Date.now()}@example.com`,
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });

      it('should return 400 for password too short', async () => {
        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...validMerchantData,
            email: `merchant-shortpwd-${Date.now()}@example.com`,
            password: '12345', // Only 5 characters
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(hasErrorForField(response.body.errors, 'password')).toBe(true);
      });
    });

    describe('Duplicate Email Prevention', () => {
      it('should return 400 for duplicate email (existing user)', async () => {
        // Create an existing user
        const existingUser = await createTestUser('Merchant');

        // Try to register with the same email
        const response = await request(app)
          .post('/api/auth/register/merchant')
          .send({
            ...validMerchantData,
            email: existingUser.email,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/exists/i);
      });
    });
  });

  describe('POST /api/auth/register/truckOwner', () => {
    const validTruckOwnerData = {
      name: 'Test Truck Owner',
      email: 'testtruckowner@example.com',
      password: 'Password123!',
      phone: '+12025551234',
      companyName: 'Test Trucking Co',
      companyAddress: '123 Truck Street, Trucking City',
    };

    it('should create a registration request for truck owner', async () => {
      const timestamp = Date.now();
      const userData = {
        ...validTruckOwnerData,
        email: `truckowner-${timestamp}@example.com`,
      };

      const response = await request(app).post('/api/auth/register/truckOwner').send(userData);

      expect(response.status).toBe(202);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toMatch(/approval/i);
      expect(response.body.data.requestId).toBeDefined();
    });

    it('should require company name for truck owner registration', async () => {
      const { companyName, ...dataWithoutCompanyName } = validTruckOwnerData;

      const response = await request(app)
        .post('/api/auth/register/truckOwner')
        .send({
          ...dataWithoutCompanyName,
          email: `truckowner-nocompany-${Date.now()}@example.com`,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should require company address for truck owner registration', async () => {
      const { companyAddress, ...dataWithoutCompanyAddress } = validTruckOwnerData;

      const response = await request(app)
        .post('/api/auth/register/truckOwner')
        .send({
          ...dataWithoutCompanyAddress,
          email: `truckowner-noaddr-${Date.now()}@example.com`,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/register/driver', () => {
    it('should require authentication for driver registration', async () => {
      const response = await request(app)
        .post('/api/auth/register/driver')
        .send({
          name: 'Test Driver',
          email: `driver-${Date.now()}@example.com`,
          password: 'Password123!',
          phone: '+12025551234',
          licenseNumber: 'DL-123456',
        });

      expect(response.status).toBe(401);
    });

    it('should require TruckOwner role for driver registration', async () => {
      const { user, token } = await createAuthenticatedUser('Merchant');

      const response = await request(app)
        .post('/api/auth/register/driver')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Driver',
          email: `driver-${Date.now()}@example.com`,
          password: 'Password123!',
          phone: '+12025551234',
          licenseNumber: 'DL-123456',
        });

      expect(response.status).toBe(403);
    });

    it('should allow TruckOwner to register a driver', async () => {
      const { user, token } = await createAuthenticatedUser('TruckOwner');

      const response = await request(app)
        .post('/api/auth/register/driver')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Driver',
          email: `driver-${Date.now()}@example.com`,
          password: 'Password123!',
          phone: '+12025551234',
          licenseNumber: 'DL-123456',
        });

      expect(response.status).toBe(202);
      expect(response.body.data.requestId).toBeDefined();
    });

    it('should require license number for driver registration', async () => {
      const { user, token } = await createAuthenticatedUser('TruckOwner');

      const response = await request(app)
        .post('/api/auth/register/driver')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Driver',
          email: `driver-nolic-${Date.now()}@example.com`,
          password: 'Password123!',
          phone: '+12025551234',
          // Missing licenseNumber
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should handle emails with leading/trailing spaces', async () => {
      const timestamp = Date.now();
      const email = `  merchant-spaces-${timestamp}@example.com  `;

      const response = await request(app).post('/api/auth/register/merchant').send({
        name: 'Test Merchant',
        email: email,
        password: 'Password123!',
        phone: '+12025551234',
      });

      // Should either accept (with trimming) or reject gracefully
      expect([200, 202, 400]).toContain(response.status);
    });

    it('should handle very long input gracefully', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app)
        .post('/api/auth/register/merchant')
        .send({
          name: longString,
          email: `merchant-long-${Date.now()}@example.com`,
          password: 'Password123!',
          phone: '+12025551234',
        });

      // Should handle gracefully (either accept or reject with proper error)
      expect(response.status).toBeLessThan(500);
    });
  });
});
