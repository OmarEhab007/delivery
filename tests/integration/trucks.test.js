const request = require('supertest');

const { app } = require('../../src/server');
const Truck = require('../../src/models/Truck');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Truck API', () => {
  it('creates, updates, assigns, and deletes a truck', async () => {
    const { user: owner, token } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/trucks')
      .set(authHeaders(token, csrfToken))
      .send({
        plateNumber: 'TRK-1001',
        model: 'Test Model',
        capacity: 12000,
        year: 2022,
        truckType: 'Flatbed',
      })
      .expect(201);

    const truckId = createResponse.body.data.truck._id;

    const listResponse = await agent
      .get('/api/trucks')
      .set(authHeaders(token))
      .expect(200);

    expect(listResponse.body.data.trucks.length).toBeGreaterThan(0);

    const updateResponse = await agent
      .patch(`/api/trucks/${truckId}`)
      .set(authHeaders(token, csrfToken))
      .send({ model: 'Updated Model' })
      .expect(200);

    expect(updateResponse.body.data.truck.model).toBe('Updated Model');

    const assignResponse = await agent
      .patch(`/api/trucks/${truckId}/assign/${driver._id}`)
      .set(authHeaders(token, csrfToken))
      .expect(200);

    expect(assignResponse.body.data.truck.driverId.toString()).toBe(driver._id.toString());

    await agent
      .delete(`/api/trucks/${truckId}`)
      .set(authHeaders(token, csrfToken))
      .expect(204);

    const updated = await Truck.findById(truckId);
    expect(updated.active).toBe(false);
  });

  it('prevents duplicate plate numbers', async () => {
    const { token } = await createAuthenticatedUser('TruckOwner');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post('/api/trucks')
      .set(authHeaders(token, csrfToken))
      .send({
        plateNumber: 'TRK-2002',
        model: 'First Model',
        capacity: 8000,
        year: 2021,
      })
      .expect(201);

    const response = await agent
      .post('/api/trucks')
      .set(authHeaders(token, csrfToken))
      .send({
        plateNumber: 'TRK-2002',
        model: 'Second Model',
        capacity: 9000,
        year: 2022,
      })
      .expect(400);

    expect(response.body.message).toMatch(/already exists/i);
  });
});
