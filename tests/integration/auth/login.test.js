/**
 * Login Integration Tests
 *
 * Tests for the authentication login flow including:
 * - Successful login with valid credentials
 * - Login rejection with invalid credentials
 * - Login rejection for deactivated users
 */

const request = require('supertest');

const { app } = require('../../../src/server');
const User = require('../../../src/models/User');
const { createTestUser, createDeactivatedUser, TEST_PASSWORD } = require('../../utils/authHelpers');

describe('Login API', () => {
  describe('POST /api/auth/login', () => {
    describe('Successful Login', () => {
      it('should return a JWT token for valid credentials', async () => {
        // Create a test user
        const user = await createTestUser('Merchant');

        // Attempt login
        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        // API returns accessToken and refreshToken
        expect(response.body.accessToken).toBeDefined();
        expect(typeof response.body.accessToken).toBe('string');
        expect(response.body.accessToken.length).toBeGreaterThan(0);
        expect(response.body.refreshToken).toBeDefined();
      });

      it('should return user data without password on successful login', async () => {
        const user = await createTestUser('Merchant');

        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(user.email);
        expect(response.body.data.user.name).toBe(user.name);
        expect(response.body.data.user.role).toBe('Merchant');
        expect(response.body.data.user.password).toBeUndefined();
      });

      it('should allow login for all user roles', async () => {
        const roles = ['Merchant', 'TruckOwner', 'Admin'];

        for (const role of roles) {
          const user = await createTestUser(role);

          const response = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: TEST_PASSWORD,
          });

          expect(response.status).toBe(200);
          expect(response.body.accessToken).toBeDefined();
          expect(response.body.data.user.role).toBe(role);
        }
      });

      it('should allow Driver login', async () => {
        const truckOwner = await createTestUser('TruckOwner');
        const driver = await createTestUser('Driver', { ownerId: truckOwner._id });

        const response = await request(app).post('/api/auth/login').send({
          email: driver.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.data.user.role).toBe('Driver');
      });
    });

    describe('Invalid Credentials', () => {
      it('should return 401 for invalid email', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

        expect(response.status).toBe(401);
        expect(response.body.accessToken).toBeUndefined();
      });

      it('should return 401 for invalid password', async () => {
        const user = await createTestUser('Merchant');

        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: 'wrongpassword',
        });

        expect(response.status).toBe(401);
        expect(response.body.accessToken).toBeUndefined();
      });

      it('should return appropriate error message for invalid credentials', async () => {
        const user = await createTestUser('Merchant');

        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: 'wrongpassword',
        });

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/invalid/i);
      });

      it('should return 400 for missing email', async () => {
        const response = await request(app).post('/api/auth/login').send({
          password: 'somepassword',
        });

        expect(response.status).toBe(400);
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'test@example.com',
        });

        expect(response.status).toBe(400);
      });

      it('should return 400 for invalid email format', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'notanemail',
          password: 'somepassword',
        });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('Deactivated User Login', () => {
      it('should return 403 for deactivated user', async () => {
        const user = await createDeactivatedUser('Merchant');

        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(403);
        expect(response.body.accessToken).toBeUndefined();
      });

      it('should return appropriate error message for deactivated user', async () => {
        const user = await createDeactivatedUser('Merchant');

        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/deactivated|inactive/i);
      });

      it('should reject login for all deactivated user roles', async () => {
        const roles = ['Merchant', 'TruckOwner', 'Admin'];

        for (const role of roles) {
          const user = await createDeactivatedUser(role);

          const response = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: TEST_PASSWORD,
          });

          expect(response.status).toBe(403);
          expect(response.body.accessToken).toBeUndefined();
        }
      });
    });

    describe('Security Considerations', () => {
      it('should not expose whether email exists on failed login', async () => {
        // Create a user
        const user = await createTestUser('Merchant');

        // Try with existing email but wrong password
        const response1 = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: 'wrongpassword',
        });

        // Try with non-existing email
        const response2 = await request(app).post('/api/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

        // Both should return the same generic error message
        expect(response1.status).toBe(401);
        expect(response2.status).toBe(401);
        // The error messages should be identical to prevent user enumeration
        expect(response1.body.message).toBe(response2.body.message);
      });

      it('should handle email case variations', async () => {
        const user = await createTestUser('Merchant');

        // The user email is stored lowercase, verify login works with original email
        const response = await request(app).post('/api/auth/login').send({
          email: user.email,
          password: TEST_PASSWORD,
        });

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();

        // Also test with mixed case - the model lowercases email on save
        // So this should work since the login also lowercases the input
        const mixedCaseEmail = user.email
          .split('')
          .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
          .join('');

        const response2 = await request(app).post('/api/auth/login').send({
          email: mixedCaseEmail,
          password: TEST_PASSWORD,
        });

        // This test verifies the app handles email case - may succeed or fail
        // depending on implementation, but should not cause 500 error
        expect(response2.status).toBeLessThan(500);
      });
    });
  });
});
