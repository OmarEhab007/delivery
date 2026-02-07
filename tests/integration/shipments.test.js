const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { app } = require('../../src/server');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');
const { DocumentType } = require('../../src/models/Document');
const { createAuthenticatedUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

const SAMPLE_PDF = path.join(__dirname, '../fixtures/sample.pdf');

describe('Shipment API', () => {
  const uploadedFiles = [];

  afterAll(() => {
    uploadedFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  it('handles shipment lifecycle endpoints', async () => {
    const { user: merchant, token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/shipments')
      .set(authHeaders(token, csrfToken))
      .send({
        origin: { address: 'Cairo', country: 'EG' },
        destination: { address: 'Riyadh', country: 'SA' },
        cargoDetails: { description: 'Textiles', weight: 1000 },
      })
      .expect(201);

    const shipmentId = createResponse.body.data.shipment._id;

    await agent
      .get('/api/shipments')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/shipments/${shipmentId}`)
      .set(authHeaders(token, csrfToken))
      .send({ notes: 'Updated notes' })
      .expect(200);

    await agent
      .patch(`/api/shipments/${shipmentId}/compliance`)
      .set(authHeaders(token, csrfToken))
      .send({ acidNumber: 'ACID-1234', gaftaRequested: true, incoterm: 'CIF' })
      .expect(200);

    await agent
      .get(`/api/shipments/${shipmentId}/compliance`)
      .set(authHeaders(token))
      .expect(200);

    const complianceUpload = await agent
      .post(`/api/shipments/${shipmentId}/compliance/documents`)
      .set(authHeaders(token, csrfToken))
      .field('documentType', DocumentType.COMMERCIAL_INVOICE)
      .field('name', 'Commercial Invoice')
      .attach('document', SAMPLE_PDF)
      .expect(201);

    if (complianceUpload.body?.data?.document?.filePath) {
      uploadedFiles.push(path.join(process.cwd(), 'uploads', complianceUpload.body.data.document.filePath));
    }

    const paymentUpload = await agent
      .post(`/api/shipments/${shipmentId}/payment-proof`)
      .set(authHeaders(token, csrfToken))
      .field('name', 'Payment Proof')
      .field('amount', '5000')
      .attach('document', SAMPLE_PDF)
      .expect(201);

    if (paymentUpload.body?.data?.document?.filePath) {
      uploadedFiles.push(path.join(process.cwd(), 'uploads', paymentUpload.body.data.document.filePath));
    }

    await Shipment.findByIdAndUpdate(shipmentId, { status: ShipmentStatus.REQUESTED });

    await agent
      .post(`/api/shipments/${shipmentId}/timeline`)
      .set(authHeaders(token, csrfToken))
      .send({ status: ShipmentStatus.IN_TRANSIT, note: 'Left origin' })
      .expect(200);

    await agent
      .get(`/api/shipments/${shipmentId}/tracking`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get(`/api/shipments/${shipmentId}/tracking/history`)
      .set(authHeaders(token))
      .expect(200);
  });

  it('allows merchant to cancel a pending shipment', async () => {
    const { token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/shipments')
      .set(authHeaders(token, csrfToken))
      .send({
        origin: { address: 'Alexandria' },
        destination: { address: 'Dubai' },
        cargoDetails: { description: 'Machinery', weight: 2000 },
      })
      .expect(201);

    const shipmentId = createResponse.body.data.shipment._id;

    const cancelResponse = await agent
      .patch(`/api/shipments/${shipmentId}/cancel`)
      .set(authHeaders(token, csrfToken))
      .send({ reason: 'Customer request' })
      .expect(200);

    expect(cancelResponse.body.data.shipment.status).toBe(ShipmentStatus.CANCELLED);
  });
});
