const request = require('supertest');

const { app } = require('../../../src/server');
const { createTestUser } = require('../../utils/authHelpers');

describe('Auth password reset flow', () => {
  it('issues and consumes password reset tokens', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const user = await createTestUser('Merchant');

      const forgotResponse = await request(app)
        .post('/api/auth/forgotPassword')
        .send({ email: user.email })
        .expect(200);

      expect(forgotResponse.body.resetToken).toBeDefined();

      await request(app)
        .patch(`/api/auth/resetPassword/${forgotResponse.body.resetToken}`)
        .send({ password: 'newPassword123' })
        .expect(200);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
