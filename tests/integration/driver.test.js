const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { app } = require('../../src/server');
const { ShipmentStatus } = require('../../src/models/Shipment');
const { createAuthenticatedUser, createTestUser } = require('../utils/authHelpers');
const { createTestShipment, createTestTruck } = require('../utils/dataFactories');
const { authHeaders } = require('../utils/requestHelpers');

const SAMPLE_PDF = path.join(__dirname, '../fixtures/sample.pdf');

describe('Driver API', () => {
  const uploadedFiles = [];

  afterAll(() => {
    uploadedFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        // ignore cleanup errors
      }
    });
  });

  it('supports driver workflow endpoints', async () => {
    const owner = await createTestUser('TruckOwner');
    const merchant = await createTestUser('Merchant');
    const { user: driver, token } = await createAuthenticatedUser('Driver', { ownerId: owner._id });

    const truck = await createTestTruck(owner._id, { driverId: driver._id });

    const activeShipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.ASSIGNED,
      assignedDriverId: driver._id,
      assignedTruckId: truck._id,
    });

    const completedShipment = await createTestShipment(merchant._id, {
      status: ShipmentStatus.DELIVERED,
      assignedDriverId: driver._id,
      assignedTruckId: truck._id,
      actualDeliveryDate: new Date(),
    });

    await activeShipment.updateOne({
      compliance: {
        acidNumber: 'ACID-READY',
        aciProofDocumentId: activeShipment._id,
        brokerId: owner._id,
        documents: {
          commercialInvoiceDocumentId: activeShipment._id,
          packingListDocumentId: activeShipment._id,
          billOfLadingDocumentId: activeShipment._id,
        },
        gaftaRequested: false,
        insuranceRequired: false,
      },
    });

    await request(app)
      .get('/api/driver/profile')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/driver/truck')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/driver/shipments/active')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/driver/shipments/history')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .patch('/api/driver/availability')
      .set(authHeaders(token))
      .send({ isAvailable: false })
      .expect(200);

    await request(app)
      .patch('/api/driver/location')
      .set(authHeaders(token))
      .send({ latitude: 30.0444, longitude: 31.2357, shipmentId: activeShipment._id.toString() })
      .expect(200);

    await request(app)
      .post(`/api/driver/shipments/${activeShipment._id}/start`)
      .set(authHeaders(token))
      .send({ startOdometer: 1000, notes: 'Starting delivery' })
      .expect(200);

    await request(app)
      .post(`/api/driver/shipments/${activeShipment._id}/issues`)
      .set(authHeaders(token))
      .send({ issueType: 'WEATHER', description: 'Minor delay' })
      .expect(200);

    const proofResponse = await request(app)
      .post(`/api/driver/shipments/${activeShipment._id}/proof`)
      .set(authHeaders(token))
      .attach('proof', SAMPLE_PDF)
      .expect(200);

    if (proofResponse.body?.data?.proof?.filePath) {
      uploadedFiles.push(proofResponse.body.data.proof.filePath);
    }

    await request(app)
      .post(`/api/driver/shipments/${activeShipment._id}/complete`)
      .set(authHeaders(token))
      .send({ endOdometer: 1200, recipientName: 'Receiver' })
      .expect(200);

    await request(app)
      .get(`/api/driver/route/${activeShipment._id}`)
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .get('/api/driver/dashboard')
      .set(authHeaders(token))
      .expect(200);

    await request(app)
      .post('/api/driver/checkin')
      .set(authHeaders(token))
      .send({ latitude: 30.05, longitude: 31.2, fuelLevel: 75, truckCondition: 'OK' })
      .expect(200);

    await request(app)
      .post('/api/driver/checkout')
      .set(authHeaders(token))
      .send({ latitude: 30.05, longitude: 31.2, fuelLevel: 65, totalMiles: 40 })
      .expect(200);

    await request(app)
      .patch('/api/driver/status')
      .set(authHeaders(token))
      .send({ status: 'ON_BREAK' })
      .expect(200);
  });
});
