jest.mock('../../src/models/Application', () => ({
  Application: {
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../src/models/User', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../src/models/Truck', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../src/utils/metricScheduler', () => ({
  updateTruckStatusMetrics: jest.fn(),
  updateShipmentStatusMetrics: jest.fn(),
}));

const { Application } = require('../../src/models/Application');
const { Shipment } = require('../../src/models/Shipment');
const User = require('../../src/models/User');
const Truck = require('../../src/models/Truck');
const controller = require('../../src/controllers/truck/truckOwnerController');

const flushPromises = () => new Promise(setImmediate);

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('truckOwnerController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires driverId for assignment', async () => {
    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails when accepted application is missing', async () => {
    Application.findOne.mockResolvedValue(null);

    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: { driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails when shipment is missing', async () => {
    Application.findOne.mockResolvedValue({});
    Shipment.findById.mockResolvedValue(null);

    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: { driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails when shipment status is not assignable', async () => {
    Application.findOne.mockResolvedValue({});
    Shipment.findById.mockResolvedValue({ status: 'REQUESTED' });

    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: { driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails when driver is not available', async () => {
    Application.findOne.mockResolvedValue({});
    Shipment.findById.mockResolvedValue({ status: 'CONFIRMED' });
    User.findOne.mockResolvedValue({ isAvailable: false });

    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: { driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails when truck is unavailable', async () => {
    Application.findOne.mockResolvedValue({});
    Shipment.findById.mockResolvedValue({ status: 'CONFIRMED' });
    User.findOne.mockResolvedValue({ isAvailable: true });
    Truck.findOne.mockResolvedValue({ status: 'IN_SERVICE' });

    const next = jest.fn();
    controller.assignShipmentToDriver(
      { params: { shipmentId: 's1' }, body: { driverId: 'd1', truckId: 't1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });
});
