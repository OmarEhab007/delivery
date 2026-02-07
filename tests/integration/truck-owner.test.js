const request = require('supertest');

const { app } = require('../../src/server');
const { ShipmentStatus } = require('../../src/models/Shipment');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createTestShipment, createTestTruck, createTestApplication } = require('../utils/dataFactories');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Truck Owner API', () => {
  it('supports truck owner assignment flow', async () => {
    const { user: owner, token } = await createAuthenticatedUser('TruckOwner');
    const merchant = await createTestUser('Merchant');
    const driver = await createTestUser('Driver', { ownerId: owner._id });
    const truck = await createTestTruck(owner._id);

    const shipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.CONFIRMED,
    });

    await createTestApplication(shipment._id, owner._id, {
      status: 'ACCEPTED',
      assignedTruckId: truck._id,
      driverId: driver._id,
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await request(app)
      .get('/api/truck-owner/shipments')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/truck-owner/shipments/available')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/truck-owner/drivers/available')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/truck-owner/trucks/available')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/truck-owner/shipments/${shipment._id}/assign`)
      .set(authHeaders(token, csrfToken))
      .send({ driverId: driver._id.toString(), truckId: truck._id.toString() })
      .expect(200);
  });
});
