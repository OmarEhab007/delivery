const mongoose = require('mongoose');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');

const makeShipment = (overrides = {}) => {
  const shipment = new Shipment({
    merchantId: new mongoose.Types.ObjectId(),
    origin: {
      address: 'Origin',
      coordinates: { lat: 1, lng: 2 },
      country: 'US',
    },
    destination: {
      address: 'Destination',
      coordinates: { lat: 3, lng: 4 },
      country: 'CA',
    },
    cargoDetails: {
      description: 'Cargo',
      weight: 1000,
      category: 'general',
    },
    ...overrides,
  });

  shipment.save = jest.fn().mockResolvedValue(shipment);
  return shipment;
};

describe('Shipment model helpers', () => {
  it('addTimelineEntry updates status and location', async () => {
    const shipment = makeShipment({ timeline: [] });

    await shipment.addTimelineEntry({
      status: ShipmentStatus.IN_TRANSIT,
      note: 'On the way',
      location: { type: 'Point', coordinates: [10, 20] },
    });

    expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
    expect(shipment.currentLocation.coordinates).toEqual([10, 20]);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('isComplianceReady returns false when required fields missing', () => {
    const shipment = makeShipment({ compliance: {} });
    expect(shipment.isComplianceReady()).toBe(false);
  });

  it('isComplianceReady respects CO and insurance requirements', () => {
    const shipment = makeShipment({
      compliance: {
        acidNumber: 'ACID',
        aciProofDocumentId: new mongoose.Types.ObjectId(),
        brokerId: new mongoose.Types.ObjectId(),
        gaftaRequested: true,
        insuranceRequired: true,
        documents: {
          commercialInvoiceDocumentId: new mongoose.Types.ObjectId(),
          packingListDocumentId: new mongoose.Types.ObjectId(),
          billOfLadingDocumentId: new mongoose.Types.ObjectId(),
        },
      },
    });

    expect(shipment.isComplianceReady()).toBe(false);

    shipment.compliance.documents.certificateOfOriginDocumentId = new mongoose.Types.ObjectId();
    shipment.compliance.documents.insuranceDocumentId = new mongoose.Types.ObjectId();

    expect(shipment.isComplianceReady()).toBe(true);
  });

  it('refreshComplianceStatus updates completedAt', () => {
    const shipment = makeShipment({ compliance: {} });
    const ready = shipment.refreshComplianceStatus();

    expect(ready).toBe(false);
    expect(shipment.compliance.status).toBe('PENDING');

    shipment.compliance = {
      acidNumber: 'ACID',
      aciProofDocumentId: new mongoose.Types.ObjectId(),
      brokerId: new mongoose.Types.ObjectId(),
      documents: {
        commercialInvoiceDocumentId: new mongoose.Types.ObjectId(),
        packingListDocumentId: new mongoose.Types.ObjectId(),
        billOfLadingDocumentId: new mongoose.Types.ObjectId(),
      },
    };

    const readyNow = shipment.refreshComplianceStatus();
    expect(readyNow).toBe(true);
    expect(shipment.compliance.status).toBe('READY');
    expect(shipment.compliance.completedAt).toBeInstanceOf(Date);
  });

  it('addTrackingPoint ignores invalid coordinates', async () => {
    const shipment = makeShipment({ trackingHistory: [] });

    await shipment.addTrackingPoint(null);
    expect(shipment.save).not.toHaveBeenCalled();

    await shipment.addTrackingPoint({ lng: 200, lat: 95 });
    expect(shipment.save).not.toHaveBeenCalled();
  });

  it('addTrackingPoint stores valid coordinates', async () => {
    const shipment = makeShipment({ trackingHistory: [] });

    await shipment.addTrackingPoint({ lng: 30, lat: 10, address: 'Loc' });

    expect(shipment.trackingHistory.length).toBe(1);
    expect(shipment.currentLocation.coordinates).toEqual([30, 10]);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('addDocument adds and marks required docs', async () => {
    const shipment = makeShipment({
      documents: [],
      requiredDocuments: [{ documentType: 'INVOICE', isProvided: false }],
    });

    await shipment.addDocument({
      _id: new mongoose.Types.ObjectId(),
      name: 'Invoice',
      documentType: 'INVOICE',
    });

    expect(shipment.documents.length).toBe(1);
    expect(shipment.requiredDocuments[0].isProvided).toBe(true);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('addDocument returns when document exists', async () => {
    const docId = new mongoose.Types.ObjectId();
    const shipment = makeShipment({
      documents: [{ documentId: docId }],
    });

    const result = await shipment.addDocument({ _id: docId, name: 'Dup', documentType: 'X' });

    expect(result).toBe(shipment);
  });

  it('addDocumentToTimelineEntry appends new document', async () => {
    const docId = new mongoose.Types.ObjectId();
    const shipment = makeShipment({
      timeline: [{ status: ShipmentStatus.REQUESTED, documents: [] }],
    });

    await shipment.addDocumentToTimelineEntry(0, {
      _id: docId,
      name: 'Proof',
      documentType: 'POD',
    });

    expect(shipment.timeline[0].documents.length).toBe(1);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('addDocumentToTimelineEntry skips existing document', async () => {
    const docId = new mongoose.Types.ObjectId();
    const shipment = makeShipment({
      timeline: [{ status: ShipmentStatus.REQUESTED, documents: [{ documentId: docId }] }],
    });

    const result = await shipment.addDocumentToTimelineEntry(0, {
      _id: docId,
      name: 'Proof',
      documentType: 'POD',
    });

    expect(result).toBe(shipment);
  });

  it('reportIssue updates status on severe issues', async () => {
    const shipment = makeShipment({ issues: [] });

    await shipment.reportIssue({ type: 'ACCIDENT', description: 'Crash' });

    expect(shipment.status).toBe(ShipmentStatus.DELAYED);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('resolveIssue updates resolution', async () => {
    const shipment = makeShipment({ issues: [{ status: 'OPEN' }] });

    await shipment.resolveIssue(0, { description: 'Fixed' });

    expect(shipment.issues[0].status).toBe('RESOLVED');
    expect(shipment.issues[0].resolution.description).toBe('Fixed');
    expect(shipment.save).toHaveBeenCalled();
  });

  it('resolveIssue returns shipment when index invalid', async () => {
    const shipment = makeShipment({ issues: [] });

    const result = await shipment.resolveIssue(2, 'Nope');

    expect(result).toBe(shipment);
  });
});
