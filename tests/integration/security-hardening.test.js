/**
 * @fileoverview Integration tests for production security hardening features.
 *
 * Covers:
 *   - Password policy enforcement on merchant registration
 *   - Kubernetes liveness probe  (GET /health/live)
 *   - Kubernetes readiness probe (GET /health/ready)
 */

const request = require('supertest');
const { app } = require('../../src/server');

describe('Security Hardening Tests', () => {
  // ---------------------------------------------------------------
  // Password Policy — POST /api/auth/register/merchant
  // ---------------------------------------------------------------
  describe('Password Policy', () => {
    const endpoint = '/api/auth/register/merchant';

    const validPayload = (overrides = {}) => ({
      name: 'Test Merchant',
      email: `test-pw-${Date.now()}@example.com`,
      password: 'StrongP@ss123!',
      phone: '0501234567',
      ...overrides,
    });

    it('should reject a password shorter than 12 characters', async () => {
      const res = await request(app)
        .post(endpoint)
        .send(validPayload({ email: 'test-pw-weak@example.com', password: 'short' }));

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);

      const passwordError = res.body.errors.find((e) => e.param === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toMatch(/12 characters/i);
    });

    it('should reject a password missing an uppercase letter', async () => {
      const res = await request(app)
        .post(endpoint)
        .send(validPayload({ email: 'test-pw-nouppercase@example.com', password: 'nouppercase1!@' }));

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();

      const passwordError = res.body.errors.find((e) => e.param === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toMatch(/uppercase/i);
    });

    it('should reject a password missing a special character', async () => {
      const res = await request(app)
        .post(endpoint)
        .send(validPayload({ email: 'test-pw-nospecial@example.com', password: 'NoSpecialChar12' }));

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();

      const passwordError = res.body.errors.find((e) => e.param === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError.msg).toMatch(/special character/i);
    });

    it('should accept a compliant password and return 202', async () => {
      const res = await request(app)
        .post(endpoint)
        .send(validPayload({ email: 'test-pw-strong@example.com', password: 'StrongP@ss123!' }));

      // Merchant registration returns 202 (pending admin approval)
      expect(res.status).toBe(202);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.requestId).toBeDefined();
    });
  });

  // ---------------------------------------------------------------
  // Health Probes — GET /health/live & GET /health/ready
  // ---------------------------------------------------------------
  describe('Health Probes', () => {
    describe('GET /health/live', () => {
      it('should return 200', async () => {
        const res = await request(app).get('/health/live');

        expect(res.status).toBe(200);
      });

      it('should return status ok with a timestamp', async () => {
        const res = await request(app).get('/health/live');

        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
        // Verify timestamp is a valid ISO-8601 string
        expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
      });
    });

    describe('GET /health/ready', () => {
      it('should return 200 when the database is connected', async () => {
        // In the test environment MongoDB Memory Server is connected
        const res = await request(app).get('/health/ready');

        expect(res.status).toBe(200);
      });

      it('should include status ready', async () => {
        const res = await request(app).get('/health/ready');

        expect(res.body.status).toBe('ready');
        expect(res.body.timestamp).toBeDefined();
      });
    });
  });
});
