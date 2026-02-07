const request = require('supertest');

const { app } = require('../../src/server');
const User = require('../../src/models/User');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('User API', () => {
  it('allows a user to update their profile', async () => {
    const { user, token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .patch('/api/users/updateMe')
      .set(authHeaders(token, csrfToken))
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(response.body.data.user.name).toBe('Updated Name');

    const updated = await User.findById(user._id);
    expect(updated.name).toBe('Updated Name');
  });

  it('rejects password updates via updateMe', async () => {
    const { token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .patch('/api/users/updateMe')
      .set(authHeaders(token, csrfToken))
      .send({ password: 'NewPassword123!' })
      .expect(400);

    expect(response.body.message).toMatch(/not for password updates/i);
  });

  it('soft deletes the current user', async () => {
    const { user, token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .delete('/api/users/deleteMe')
      .set(authHeaders(token, csrfToken))
      .expect(204);

    const updated = await User.findById(user._id);
    expect(updated.active).toBe(false);
  });

  it('allows admin to list users', async () => {
    const { token } = await createAuthenticatedUser('Admin');
    await createTestUser('Merchant');

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.users.length).toBeGreaterThan(0);
  });

  it('allows truck owner to list their drivers', async () => {
    const { user: owner, token } = await createAuthenticatedUser('TruckOwner');
    await createTestUser('Driver', { ownerId: owner._id });

    const response = await request(app)
      .get('/api/users/myDrivers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.drivers.length).toBeGreaterThan(0);
  });
});
