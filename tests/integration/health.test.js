const request = require('supertest');

const { app } = require('../../src/server');
const { createAuthenticatedUser } = require('../utils/authHelpers');

describe('Health Endpoints', () => {
  it('exposes debug and system health endpoints for admins', async () => {
    const { token } = await createAuthenticatedUser('Admin');

    await request(app)
      .get('/health/debug')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get('/health/system')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect([200, 503, 500]).toContain(res.status);
      });

    await request(app)
      .get('/health/storage')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect([200, 503, 500]).toContain(res.status);
      });

    await request(app)
      .get('/health/database')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect([200, 503]).toContain(res.status);
      });

    await request(app)
      .get('/health/comprehensive')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        expect([200, 503, 500]).toContain(res.status);
      });

    await request(app)
      .get('/health/cache-test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
