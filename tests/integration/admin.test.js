const request = require('supertest');

const { app } = require('../../src/server');
const { ShipmentStatus, ShipmentApprovalState, createCompleteScenario, createTestShipment } = require('../utils/dataFactories');
const { createAuthenticatedUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Admin API', () => {
  it('handles admin dashboard and management endpoints', async () => {
    const { token } = await createAuthenticatedUser('Admin');
    const scenario = await createCompleteScenario();

    const pendingShipment = await createTestShipment(scenario.merchant._id, {
      status: ShipmentStatus.PENDING_APPROVAL,
      approval: {
        state: ShipmentApprovalState.PENDING,
        submittedBy: scenario.merchant._id,
        submittedAt: new Date(),
      },
    });

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .get('/api/admin/dashboard')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get('/api/admin/users')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get('/api/admin/shipments')
      .set(authHeaders(token))
      .expect(200);

    const approveResponse = await agent
      .patch(`/api/admin/shipments/${pendingShipment._id}/approve`)
      .set(authHeaders(token, csrfToken))
      .expect(200);

    expect(approveResponse.body.data.shipment.status).toBe(ShipmentStatus.REQUESTED);

    await agent
      .patch(`/api/admin/shipments/${pendingShipment._id}/status`)
      .set(authHeaders(token, csrfToken))
      .send({ status: ShipmentStatus.REQUESTED })
      .expect(200);

    const brokerResponse = await agent
      .post('/api/admin/brokers')
      .set(authHeaders(token, csrfToken))
      .send({ name: 'Test Broker', licenseNumber: 'LIC-001' })
      .expect(201);

    const brokerId = brokerResponse.body.data.broker._id;

    await agent
      .patch(`/api/admin/brokers/${brokerId}`)
      .set(authHeaders(token, csrfToken))
      .send({ status: 'ACTIVE' })
      .expect(200);

    await agent
      .get('/api/admin/applications')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/admin/applications/${scenario.application._id}/status`)
      .set(authHeaders(token, csrfToken))
      .send({ status: 'ACCEPTED', adminNotes: 'Approved by admin' })
      .expect(200);

    await agent
      .get('/api/admin/trucks')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/admin/trucks/${scenario.truck._id}/status`)
      .set(authHeaders(token, csrfToken))
      .send({ status: 'IN_SERVICE' })
      .expect(200);
  });

  it('manages users through admin endpoints', async () => {
    const { token } = await createAuthenticatedUser('Admin');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/admin/users')
      .set(authHeaders(token, csrfToken))
      .send({
        name: 'Admin Managed User',
        email: `managed-${Date.now()}@example.com`,
        password: 'password123',
        phone: '+15550001111',
        role: 'Merchant',
      })
      .expect(201);

    const userId = createResponse.body.data.user._id;

    await agent
      .get(`/api/admin/users/${userId}`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .put(`/api/admin/users/${userId}`)
      .set(authHeaders(token, csrfToken))
      .send({ name: 'Updated Managed User', active: false })
      .expect(200);

    await agent
      .delete(`/api/admin/users/${userId}`)
      .set(authHeaders(token, csrfToken))
      .expect(200);
  });
});
