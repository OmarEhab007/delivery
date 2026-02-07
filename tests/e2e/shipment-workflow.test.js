const { app } = require('../../src/server');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('API E2E: Shipment workflow', () => {
  it('creates, approves, and accepts a shipment bid', async () => {
    const { user: merchant, token: merchantToken } = await createAuthenticatedUser('Merchant');
    const { user: admin, token: adminToken } = await createAuthenticatedUser('Admin');
    const { user: owner, token: ownerToken } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });

    const merchantAgent = createAgent(app);
    const merchantCsrf = await getCsrfToken(merchantAgent);

    const shipmentResponse = await merchantAgent
      .post('/api/shipments')
      .set(authHeaders(merchantToken, merchantCsrf))
      .send({
        origin: { address: 'Port Said', country: 'EG' },
        destination: { address: 'Jeddah', country: 'SA' },
        cargoDetails: { description: 'Electronics', weight: 500 },
      })
      .expect(201);

    const shipmentId = shipmentResponse.body.data.shipment._id;

    const adminAgent = createAgent(app);
    const adminCsrf = await getCsrfToken(adminAgent);

    await adminAgent
      .patch(`/api/admin/shipments/${shipmentId}/approve`)
      .set(authHeaders(adminToken, adminCsrf))
      .expect(200);

    const ownerAgent = createAgent(app);
    const ownerCsrf = await getCsrfToken(ownerAgent);

    const truckResponse = await ownerAgent
      .post('/api/trucks')
      .set(authHeaders(ownerToken, ownerCsrf))
      .send({
        plateNumber: 'E2E-100',
        model: 'E2E Truck',
        capacity: 9000,
        year: 2020,
      })
      .expect(201);

    const truckId = truckResponse.body.data.truck._id;

    const applicationResponse = await ownerAgent
      .post('/api/applications')
      .set(authHeaders(ownerToken, ownerCsrf))
      .send({
        shipmentId,
        assignedTruckId: truckId,
        driverId: driver._id.toString(),
        bidDetails: { price: 5500, currency: 'USD' },
      })
      .expect(201);

    const applicationId = applicationResponse.body.data.application._id;

    await merchantAgent
      .patch(`/api/applications/${applicationId}/accept`)
      .set(authHeaders(merchantToken, merchantCsrf))
      .expect(200);
  });
});
