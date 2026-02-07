const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { app } = require('../../src/server');
const { DocumentType } = require('../../src/models/Document');
const { createAuthenticatedUser } = require('../utils/authHelpers');
const { createTestShipment } = require('../utils/dataFactories');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

const SAMPLE_TEXT = path.join(__dirname, '../fixtures/sample-document.txt');
const SAMPLE_PDF = path.join(__dirname, '../fixtures/sample.pdf');

describe('Document API', () => {
  const uploadedFiles = [];

  afterAll(() => {
    uploadedFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        // ignore
      }
    });
  });

  it('uploads and retrieves documents', async () => {
    const { user, token } = await createAuthenticatedUser('Merchant');
    const { token: adminToken } = await createAuthenticatedUser('Admin');
    const shipment = await createTestShipment(user._id);

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const uploadResponse = await agent
      .post('/api/documents/upload')
      .set(authHeaders(token, csrfToken))
      .field('documentType', DocumentType.SHIPPING_INVOICE)
      .field('entityType', 'Shipment')
      .field('entityId', shipment._id.toString())
      .field('name', 'Shipping Invoice')
      .attach('document', SAMPLE_TEXT)
      .expect(201);

    const documentId = uploadResponse.body.data.document._id;
    const filePath = uploadResponse.body.data.document.filePath;

    if (filePath) {
      uploadedFiles.push(path.join(process.cwd(), 'uploads', filePath));
    }

    await agent
      .get(`/api/documents/${documentId}`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get(`/api/documents/${documentId}/download`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get(`/api/documents/entity/Shipment/${shipment._id}`)
      .set(authHeaders(token))
      .expect(200);

    await agent
      .patch(`/api/documents/${documentId}`)
      .set(authHeaders(token, csrfToken))
      .send({ description: 'Updated description' })
      .expect(200);

    await agent
      .patch(`/api/documents/${documentId}/verify`)
      .set(authHeaders(adminToken, csrfToken))
      .send({ notes: 'Verified for testing' })
      .expect(200);

    await agent
      .delete(`/api/documents/${documentId}`)
      .set(authHeaders(token, csrfToken))
      .expect(200);
  });

  it('uploads multiple documents for an entity', async () => {
    const { user, token } = await createAuthenticatedUser('Merchant');
    const shipment = await createTestShipment(user._id);

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post('/api/documents/upload-multiple')
      .set(authHeaders(token, csrfToken))
      .field('entityType', 'Shipment')
      .field('entityId', shipment._id.toString())
      .field(
        `fileData_${path.basename(SAMPLE_TEXT)}`,
        JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE, name: 'Invoice' })
      )
      .field(
        `fileData_${path.basename(SAMPLE_PDF)}`,
        JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE, name: 'Packing List' })
      )
      .attach('documents', SAMPLE_TEXT)
      .attach('documents', SAMPLE_PDF)
      .expect(201);

    expect(response.body.count).toBe(2);

    response.body.data.forEach((doc) => {
      if (doc.filePath) {
        uploadedFiles.push(path.join(process.cwd(), 'uploads', doc.filePath));
      }
    });
  });

  it('exposes debug route in non-production', async () => {
    const response = await request(app).get('/api/documents/debug').expect(200);
    expect(response.body.success).toBe(true);
  });
});
