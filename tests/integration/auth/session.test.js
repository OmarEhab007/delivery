const request = require('supertest');

const { app } = require('../../../src/server');
const { createTestUser, TEST_PASSWORD } = require('../../utils/authHelpers');

describe('Auth Session Endpoints', () => {
  it('refreshes access tokens and logs out', async () => {
    const user = await createTestUser('Merchant');

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: TEST_PASSWORD,
    });

    expect(loginResponse.status).toBe(200);
    const { accessToken, refreshToken } = loginResponse.body;

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body.data.user.email).toBe(user.email);

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();

    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(200);
  });

  it('updates password for logged-in users', async () => {
    const user = await createTestUser('Merchant');

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: TEST_PASSWORD,
    });

    const accessToken = loginResponse.body.accessToken;

    const updateResponse = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: TEST_PASSWORD,
        newPassword: 'NewPassword456!',
      })
      .expect(200);

    expect(updateResponse.body.accessToken).toBeDefined();

    const relogin = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'NewPassword456!',
    });

    expect(relogin.status).toBe(200);
  });
});
