const mongoose = require('mongoose');
const Truck = require('../../src/models/Truck');

const makeTruck = (overrides = {}) => {
  const truck = new Truck({
    plateNumber: `TEST-${Date.now()}`,
    model: 'Model',
    capacity: 1000,
    year: 2022,
    truckType: 'Flatbed',
    ownerId: new mongoose.Types.ObjectId(),
    ...overrides,
  });

  truck.save = jest.fn().mockResolvedValue(truck);
  return truck;
};

describe('Truck model helpers', () => {
  it('adds document and updates required docs', async () => {
    const truck = makeTruck({
      documents: [],
      requiredDocuments: [{ documentType: 'INSURANCE_CERTIFICATE', isProvided: false }],
      insuranceInfo: {},
      registrationInfo: {},
      technicalInspection: {},
    });

    await truck.addDocument({
      _id: new mongoose.Types.ObjectId(),
      name: 'Insurance',
      documentType: 'INSURANCE_CERTIFICATE',
    });

    expect(truck.documents.length).toBe(1);
    expect(truck.requiredDocuments[0].isProvided).toBe(true);
    expect(truck.insuranceInfo.documentId).toBeDefined();
    expect(truck.save).toHaveBeenCalled();
  });

  it('skips adding duplicate document', async () => {
    const docId = new mongoose.Types.ObjectId();
    const truck = makeTruck({
      documents: [{ documentId: docId }],
    });

    const result = await truck.addDocument({ _id: docId, name: 'Dup', documentType: 'X' });

    expect(result).toBe(truck);
  });

  it('records maintenance and sets next date', async () => {
    const truck = makeTruck();

    await truck.recordMaintenance({ type: 'REGULAR', date: new Date('2024-01-01') });

    expect(truck.maintenanceHistory.length).toBe(1);
    expect(truck.nextMaintenanceDate).toBeInstanceOf(Date);
    expect(truck.save).toHaveBeenCalled();
  });

  it('assigns truck to shipment with driver', async () => {
    const truck = makeTruck();
    const driverId = new mongoose.Types.ObjectId();

    await truck.assignToShipment(driverId);

    expect(truck.available).toBe(false);
    expect(truck.status).toBe('IN_SERVICE');
    expect(truck.driverId.toString()).toBe(driverId.toString());
    expect(truck.save).toHaveBeenCalled();
  });

  it('assigns truck to shipment without driver', async () => {
    const truck = makeTruck();

    await truck.assignToShipment();

    expect(truck.available).toBe(false);
    expect(truck.status).toBe('IN_SERVICE');
    expect(truck.save).toHaveBeenCalled();
  });

  it('marks truck as available', async () => {
    const truck = makeTruck({ available: false, status: 'IN_SERVICE' });

    await truck.markAsAvailable();

    expect(truck.available).toBe(true);
    expect(truck.status).toBe('AVAILABLE');
    expect(truck.save).toHaveBeenCalled();
  });
});
