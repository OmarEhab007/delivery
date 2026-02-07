const request = require('supertest');

const { app } = require('../../src/server');
const { ShipmentStatus } = require('../../src/models/Shipment');
const {
  createFixedPriceShipment,
  createTestTruck,
} = require('../utils/dataFactories');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Fixed-Price Shipment API', () => {
  it('allows a merchant to create a fixed-price shipment and list their shipments', async () => {
    const { token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/shipments/fixed-price')
      .set(authHeaders(token, csrfToken))
      .send({
        origin: { address: 'Cairo', country: 'EG' },
        destination: { address: 'Riyadh', country: 'SA' },
        cargoDetails: { description: 'Fixed price cargo', weight: 1500 },
        fixedPriceDetails: {
          amount: 4200,
          currency: 'USD',
          requirements: {
            minTruckCapacity: 1000,
            requiredFeatures: ['GPS'],
          },
        },
      })
      .expect(201);

    expect(createResponse.body.data.shipment.pricingType).toBe('FIXED_PRICE');
    expect(createResponse.body.data.shipment.status).toBe(ShipmentStatus.PENDING_APPROVAL);

    await agent
      .get('/api/shipments/fixed-price/my')
      .set(authHeaders(token))
      .expect(200);
  });

  it('allows a merchant to update fixed-price details and convert to bidding', async () => {
    const { user, token } = await createAuthenticatedUser('Merchant');
    const shipment = await createFixedPriceShipment(user._id, 5000, {
      status: ShipmentStatus.REQUESTED,
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .patch(`/api/shipments/${shipment._id}/fixed-price-details`)
      .set(authHeaders(token, csrfToken))
      .send({ amount: 5200, requirements: { maxDeliveryDays: 5 } })
      .expect(200);

    await agent
      .patch(`/api/shipments/${shipment._id}/convert-to-bidding`)
      .set(authHeaders(token, csrfToken))
      .expect(200);
  });

  it('allows a truck owner to browse and accept fixed-price shipments', async () => {
    const { user: merchant } = await createAuthenticatedUser('Merchant');
    const shipment = await createFixedPriceShipment(merchant._id, 5000, {
      status: ShipmentStatus.REQUESTED,
    });

    const { user: owner, token } = await createAuthenticatedUser('TruckOwner');
    const driver = await createTestUser('Driver', { ownerId: owner._id });
    const truck = await createTestTruck(owner._id);

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .get('/api/shipments/available-fixed-price')
      .set(authHeaders(token))
      .expect(200);

    const acceptResponse = await agent
      .post(`/api/shipments/${shipment._id}/accept-fixed-price`)
      .set(authHeaders(token, csrfToken))
      .send({
        truckId: truck._id.toString(),
        driverId: driver._id.toString(),
        acceptanceNote: 'Ready to take this shipment',
      })
      .expect(200);

    expect(acceptResponse.body.data.shipment.status).toBe(ShipmentStatus.ASSIGNED);

    await agent
      .get('/api/shipments/truck-owner/fixed-price-shipments')
      .set(authHeaders(token))
      .expect(200);
  });
});
