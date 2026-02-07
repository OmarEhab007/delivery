const request = require('supertest');

const { app } = require('../../../src/server');
const { createAuthenticatedUser } = require('../../utils/authHelpers');

describe('Admin Registration Requests', () => {
  it('lists and approves/rejects registration requests', async () => {
    const merchantEmail = `merchant-${Date.now()}@example.com`;
    const ownerEmail = `owner-${Date.now()}@example.com`;

    await request(app).post('/api/auth/register/merchant').send({
      name: 'Pending Merchant',
      email: merchantEmail,
      password: 'Password123!',
      phone: '+12025550101',
    });

    await request(app).post('/api/auth/register/truckOwner').send({
      name: 'Pending Owner',
      email: ownerEmail,
      password: 'Password123!',
      phone: '+12025550102',
      companyName: 'Pending Logistics',
      companyAddress: '123 Pending St',
    });

    const { token } = await createAuthenticatedUser('Admin');

    const listResponse = await request(app)
      .get('/api/admin/registration-requests')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const requests = listResponse.body.data.requests;
    const merchantRequest = requests.find((req) => req.payload.email === merchantEmail);
    const ownerRequest = requests.find((req) => req.payload.email === ownerEmail);

    expect(merchantRequest).toBeDefined();
    expect(ownerRequest).toBeDefined();

    await request(app)
      .patch(`/api/admin/registration-requests/${merchantRequest._id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .patch(`/api/admin/registration-requests/${ownerRequest._id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Incomplete documents' })
      .expect(200);
  });
});
