const request = require('supertest');

const { app } = require('../../src/server');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const {
  createTestShipment,
  createTestTruck,
  ShipmentStatus,
} = require('../utils/dataFactories');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Application API', () => {
  it('creates and manages applications', async () => {
    const merchant = await createTestUser('Merchant');
    const { user: owner, token } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });
    const truck = await createTestTruck(owner._id);

    const shipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.REQUESTED,
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/applications')
      .set(authHeaders(token, csrfToken))
      .send({
        shipmentId: shipment._id.toString(),
        assignedTruckId: truck._id.toString(),
        driverId: driver._id.toString(),
        bidDetails: { price: 4500, currency: 'USD' },
      })
      .expect(201);

    const applicationId = createResponse.body.data.application._id;

    await agent
      .get('/api/applications')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get(`/api/applications/${applicationId}`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/applications/${applicationId}`)
      .set(authHeaders(token, csrfToken))
      .send({ bidDetails: { price: 4800 } })
      .expect(200);

    await agent
      .patch(`/api/applications/${applicationId}/cancel`)
      .set(authHeaders(token, csrfToken))
      .expect(200);
  });

  it('allows merchant to accept an application', async () => {
    const { user: merchant, token: merchantToken } = await createAuthenticatedUser('Merchant');
    const { user: owner, token: ownerToken } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });
    const truck = await createTestTruck(owner._id);
    const shipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.REQUESTED,
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const applicationResponse = await agent
      .post('/api/applications')
      .set(authHeaders(ownerToken, csrfToken))
      .send({
        shipmentId: shipment._id.toString(),
        assignedTruckId: truck._id.toString(),
        driverId: driver._id.toString(),
        bidDetails: { price: 5200, currency: 'USD' },
      })
      .expect(201);

    const applicationId = applicationResponse.body.data.application._id;

    const acceptResponse = await agent
      .patch(`/api/applications/${applicationId}/accept`)
      .set(authHeaders(merchantToken, csrfToken))
      .expect(200);

    expect(acceptResponse.body.data.application.status).toBe('ACCEPTED');
  });

  it('allows merchant to review and reject applications', async () => {
    const { user: merchant, token: merchantToken } = await createAuthenticatedUser('Merchant');
    const { user: owner, token: ownerToken } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });
    const truck = await createTestTruck(owner._id);
    const shipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.REQUESTED,
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const applicationResponse = await agent
      .post('/api/applications')
      .set(authHeaders(ownerToken, csrfToken))
      .send({
        shipmentId: shipment._id.toString(),
        assignedTruckId: truck._id.toString(),
        driverId: driver._id.toString(),
        bidDetails: { price: 5200, currency: 'USD' },
      })
      .expect(201);

    const applicationId = applicationResponse.body.data.application._id;

    await agent
      .get(`/api/shipments/${shipment._id}/applications`)
      .set(authHeaders(merchantToken))
      .expect(200);

    const rejectResponse = await agent
      .patch(`/api/applications/${applicationId}/reject`)
      .set(authHeaders(merchantToken, csrfToken))
      .send({ reason: 'Not a fit' })
      .expect(200);

    expect(rejectResponse.body.data.application.status).toBe('REJECTED');
  });
});
