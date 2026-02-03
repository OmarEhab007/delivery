const request = require('supertest');

const { app } = require('../../src/server');
const User = require('../../src/models/User');

const createMerchantAndLogin = async () => {
  const user = await User.create({
    name: 'Integration Merchant',
    email: 'integration@example.com',
    password: 'password123',
    phone: '1234567890',
    role: 'Merchant',
  });

  const response = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: 'password123',
  });

  return {
    token: response.body.accessToken,
  };
};

describe('Integration API', () => {
  test('creates credentials and submits a shipment via API key', async () => {
    const { token } = await createMerchantAndLogin();

    const credentialResponse = await request(app)
      .post('/api/integrations/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ERP Integration', scopes: ['shipments:read', 'shipments:write'] })
      .expect(201);

    const apiKey = credentialResponse.body.data.apiKey;
    expect(apiKey).toBeDefined();

    const shipmentPayload = {
      origin: { address: 'Cairo' },
      destination: { address: 'Riyadh' },
      cargoDetails: { description: 'Textiles', weight: 10 },
    };

    const shipmentResponse = await request(app)
      .post('/api/integrations/shipments')
      .set('X-API-Key', apiKey)
      .set('X-Idempotency-Key', 'erp-123')
      .send(shipmentPayload)
      .expect(201);

    const shipmentId = shipmentResponse.body.data.shipment._id;

    const statusResponse = await request(app)
      .get(`/api/integrations/shipments/${shipmentId}`)
      .set('X-API-Key', apiKey)
      .expect(200);

    expect(statusResponse.body.data.shipment.status).toBeDefined();

    const duplicateResponse = await request(app)
      .post('/api/integrations/shipments')
      .set('X-API-Key', apiKey)
      .set('X-Idempotency-Key', 'erp-123')
      .send(shipmentPayload)
      .expect(200);

    expect(duplicateResponse.body.data.duplicate).toBe(true);
  });
});
