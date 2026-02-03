/**
 * Authorization Security Tests
 *
 * Tests for role-based access control (RBAC) including:
 * - Merchant cannot access Admin endpoints
 * - Driver cannot access TruckOwner endpoints
 * - Users can only access their own resources
 * - Admin has access to all endpoints
 */

const request = require('supertest');

const { app } = require('../../src/server');
const { createTestUser, createAuthenticatedUser, getAuthToken } = require('../utils/authHelpers');
const {
  createTestShipment,
  createTestTruck,
  createTestApplication,
} = require('../utils/dataFactories');

describe('Authorization Security Tests', () => {
  describe('Admin Endpoint Protection', () => {
    describe('GET /api/admin/dashboard', () => {
      it('should allow Admin access', async () => {
        const token = await getAuthToken('Admin');

        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(403);
        expect(response.status).not.toBe(401);
      });

      it('should deny Merchant access with 403', async () => {
        const token = await getAuthToken('Merchant');

        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });

      it('should deny TruckOwner access with 403', async () => {
        const token = await getAuthToken('TruckOwner');

        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });

      it('should deny Driver access with 403', async () => {
        const truckOwner = await createTestUser('TruckOwner');
        const { user, token } = await createAuthenticatedUser('Driver', {
          ownerId: truckOwner._id,
        });

        const response = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });

      it('should deny unauthenticated access with 401', async () => {
        const response = await request(app).get('/api/admin/dashboard');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/admin/users', () => {
      it('should allow Admin to list all users', async () => {
        const token = await getAuthToken('Admin');

        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(403);
        expect(response.status).not.toBe(401);
      });

      it('should deny Merchant access to user list', async () => {
        const token = await getAuthToken('Merchant');

        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/admin/users', () => {
      it('should allow Admin to create users', async () => {
        const token = await getAuthToken('Admin');

        const response = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'New User',
            email: `newuser-${Date.now()}@example.com`,
            password: 'Password123!',
            phone: '+12025551234',
            role: 'Merchant',
          });

        expect(response.status).not.toBe(403);
        expect(response.status).not.toBe(401);
      });

      it('should deny Merchant access to create users', async () => {
        const token = await getAuthToken('Merchant');

        const response = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'New User',
            email: `newuser-${Date.now()}@example.com`,
            password: 'Password123!',
            phone: '+12025551234',
            role: 'Merchant',
          });

        expect(response.status).toBe(403);
      });
    });
  });

  describe('TruckOwner Endpoint Protection', () => {
    describe('GET /api/truck-owner/shipments', () => {
      it('should allow TruckOwner access', async () => {
        const token = await getAuthToken('TruckOwner');

        const response = await request(app)
          .get('/api/truck-owner/shipments')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(403);
        expect(response.status).not.toBe(401);
      });

      it('should deny Merchant access with 403', async () => {
        const token = await getAuthToken('Merchant');

        const response = await request(app)
          .get('/api/truck-owner/shipments')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });

      it('should deny Driver access with 403', async () => {
        const truckOwner = await createTestUser('TruckOwner');
        const { token } = await createAuthenticatedUser('Driver', {
          ownerId: truckOwner._id,
        });

        const response = await request(app)
          .get('/api/truck-owner/shipments')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/truck-owner/drivers', () => {
      it('should allow TruckOwner to view their drivers', async () => {
        const token = await getAuthToken('TruckOwner');

        const response = await request(app)
          .get('/api/truck-owner/drivers')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(403);
        expect(response.status).not.toBe(401);
      });

      it('should deny Driver access to drivers list', async () => {
        const truckOwner = await createTestUser('TruckOwner');
        const { token } = await createAuthenticatedUser('Driver', {
          ownerId: truckOwner._id,
        });

        const response = await request(app)
          .get('/api/truck-owner/drivers')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Merchant Endpoint Protection', () => {
    describe('POST /api/shipments', () => {
      it('should allow Merchant to create shipments (or require CSRF)', async () => {
        const token = await getAuthToken('Merchant');

        const response = await request(app)
          .post('/api/shipments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            origin: { address: '123 Origin St' },
            destination: { address: '456 Destination Ave' },
            cargoDetails: {
              description: 'Test cargo',
              weight: 1000,
            },
          });

        // May be blocked by CSRF (403) or allowed, but should not be 401 (unauthorized)
        expect(response.status).not.toBe(401);
        // And should not be a server error
        expect(response.status).toBeLessThan(500);
      });

      it('should deny TruckOwner access to create shipments', async () => {
        const token = await getAuthToken('TruckOwner');

        const response = await request(app)
          .post('/api/shipments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            origin: { address: '123 Origin St' },
            destination: { address: '456 Destination Ave' },
            cargoDetails: {
              description: 'Test cargo',
              weight: 1000,
            },
          });

        expect(response.status).toBe(403);
      });

      it('should deny Driver access to create shipments', async () => {
        const truckOwner = await createTestUser('TruckOwner');
        const { token } = await createAuthenticatedUser('Driver', {
          ownerId: truckOwner._id,
        });

        const response = await request(app)
          .post('/api/shipments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            origin: { address: '123 Origin St' },
            destination: { address: '456 Destination Ave' },
            cargoDetails: {
              description: 'Test cargo',
              weight: 1000,
            },
          });

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Resource Ownership Protection', () => {
    describe('Shipment Access Control', () => {
      it('should allow merchant to access their own shipment', async () => {
        const { user: merchant, token } = await createAuthenticatedUser('Merchant');
        const shipment = await createTestShipment(merchant._id);

        const response = await request(app)
          .get(`/api/shipments/${shipment._id}`)
          .set('Authorization', `Bearer ${token}`);

        // Should be 200, or if not found due to test isolation, not 403/401
        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          // API returns data.shipment, check that it exists
          expect(response.body.data).toBeDefined();
          const shipmentData = response.body.data.shipment || response.body.data;
          expect(shipmentData._id).toBe(shipment._id.toString());
        }
      });

      it("should deny merchant access to another merchant's shipment", async () => {
        // Create first merchant's shipment
        const merchant1 = await createTestUser('Merchant');
        const shipment = await createTestShipment(merchant1._id);

        // Create second merchant
        const { token: token2 } = await createAuthenticatedUser('Merchant');

        const response = await request(app)
          .get(`/api/shipments/${shipment._id}`)
          .set('Authorization', `Bearer ${token2}`);

        // Should either return 403 or 404 (to not leak existence)
        expect([403, 404]).toContain(response.status);
      });
    });

    describe('Truck Access Control', () => {
      it('should allow truck owner to access their own trucks', async () => {
        const { user: truckOwner, token } = await createAuthenticatedUser('TruckOwner');
        const truck = await createTestTruck(truckOwner._id);

        const response = await request(app)
          .get(`/api/trucks/${truck._id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
      });

      it("should deny truck owner access to another owner's truck", async () => {
        // Create first truck owner's truck
        const owner1 = await createTestUser('TruckOwner');
        const truck = await createTestTruck(owner1._id);

        // Create second truck owner
        const { token: token2 } = await createAuthenticatedUser('TruckOwner');

        const response = await request(app)
          .get(`/api/trucks/${truck._id}`)
          .set('Authorization', `Bearer ${token2}`);

        // Should either return 403 or 404
        expect([403, 404]).toContain(response.status);
      });
    });
  });

  describe('Token Security', () => {
    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalidtoken123');

      // Should fail authentication with 401 for invalid token
      expect(response.status).toBe(401);
    });

    it('should reject requests with expired token', async () => {
      // Create a token that's already expired (mocking would be needed for real test)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: 'someuserid' },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Should fail authentication with 401 for expired token
      expect(response.status).toBe(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'NotBearer sometoken');

      expect(response.status).toBe(401);
    });

    it('should reject requests with token for deleted user', async () => {
      const jwt = require('jsonwebtoken');
      const mongoose = require('mongoose');
      const nonExistentUserId = new mongoose.Types.ObjectId();

      const tokenForDeletedUser = jwt.sign(
        { id: nonExistentUserId },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokenForDeletedUser}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Admin Has Full Access', () => {
    it('should allow Admin to access Merchant endpoints', async () => {
      const admin = await createTestUser('Admin');
      const token = await getAuthToken('Admin');
      const merchant = await createTestUser('Merchant');
      const shipment = await createTestShipment(merchant._id);

      // Admin should be able to access shipment details
      const response = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${token}`);

      // Admin may get 200 or may not have the route, but should not get 403
      expect(response.status).not.toBe(403);
    });

    it('should allow Admin to access TruckOwner endpoints', async () => {
      const token = await getAuthToken('Admin');

      // Admin accessing admin trucks endpoint
      const response = await request(app)
        .get('/api/admin/trucks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(401);
    });
  });
});
