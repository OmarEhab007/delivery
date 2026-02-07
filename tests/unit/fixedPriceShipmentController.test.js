jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
  ShipmentStatus: {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    REQUESTED: 'REQUESTED',
    ASSIGNED: 'ASSIGNED',
  },
  ShipmentApprovalState: {
    PENDING: 'PENDING',
  },
}));

jest.mock('../../src/models/Application', () => ({
  Application: {
    findOne: jest.fn(),
  },
  ApplicationStatus: {
    PENDING: 'PENDING',
  },
}));

jest.mock('../../src/models/Truck', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../src/utils/db', () => ({
  supportsTransactions: jest.fn(),
}));

jest.mock('../../src/services/notification/notificationService', () => ({
  sendNotification: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('mongoose', () => ({
  startSession: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');
const Truck = require('../../src/models/Truck');
const User = require('../../src/models/User');
const db = require('../../src/utils/db');
const mongoose = require('mongoose');
const notificationService = require('../../src/services/notification/notificationService');
const controller = require('../../src/controllers/shipment/fixedPriceShipmentController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => {
  const query = Promise.resolve(result);
  query.populate = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.sort = jest.fn().mockReturnValue(query);
  return query;
};

describe('fixedPriceShipmentController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  it('requires fixed price details on create', async () => {
    const res = makeRes();
    const next = jest.fn();

    await controller.createFixedPriceShipment(
      { body: {}, user: { id: 'm1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('creates fixed price shipment and handles notification errors', async () => {
    Shipment.create.mockResolvedValue({
      _id: 's1',
      origin: { address: 'A' },
      destination: { address: 'B' },
      fixedPriceDetails: { amount: 100, currency: 'USD' },
      cargoDetails: { description: 'Cargo' },
    });
    User.find.mockResolvedValue([{ _id: 'o1' }]);
    notificationService.sendNotification.mockRejectedValue(new Error('notify fail'));
    const res = makeRes();

    await controller.createFixedPriceShipment(
      { body: { fixedPriceDetails: { amount: 100 }, timeline: [] }, user: { id: 'm1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns available fixed price shipments with filters', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    Shipment.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getAvailableFixedPriceShipments(
      { query: { minPrice: '10', maxPrice: '50', origin: 'US', destination: 'CA', truckCapacity: '5' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns available fixed price shipments with maxPrice only', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    Shipment.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getAvailableFixedPriceShipments(
      { query: { maxPrice: '50' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when shipment is missing on accept', async () => {
    Shipment.findById.mockResolvedValue(null);

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when shipment is not fixed price', async () => {
    Shipment.findById.mockResolvedValue({ pricingType: 'BIDDING', status: ShipmentStatus.REQUESTED });

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when truck is not owned', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: {},
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'other' }, available: true });

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when shipment status is not requested', async () => {
    Shipment.findById.mockResolvedValue({ pricingType: 'FIXED_PRICE', status: 'ASSIGNED', fixedPriceDetails: {} });
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when truck capacity requirement not met', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: { requirements: { minTruckCapacity: 10 } },
    });
    Truck.findById.mockResolvedValue({
      ownerId: { toString: () => 'o1' },
      available: true,
      capacity: 5,
    });

    const next = jest.fn();
    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when driver is missing or wrong role', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: {},
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'o1' }, available: true });
    User.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    User.findById.mockResolvedValue({ role: 'Merchant' });
    const nextRole = jest.fn();
    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      nextRole
    );
    expect(nextRole).toHaveBeenCalled();
  });

  it('returns error when driver does not belong to owner', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: {},
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'o1' }, available: true });
    User.findById.mockResolvedValue({
      role: 'Driver',
      ownerId: { toString: () => 'other' },
      isAvailable: true,
    });

    const next = jest.fn();
    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when truck missing required features', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: { requirements: { requiredFeatures: ['GPS'] } },
    });
    Truck.findById.mockResolvedValue({
      ownerId: { toString: () => 'o1' },
      available: true,
      features: [],
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when driver is unavailable', async () => {
    Shipment.findById.mockResolvedValue({
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: {},
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'o1' }, available: true });
    User.findById.mockResolvedValue({
      role: 'Driver',
      ownerId: { toString: () => 'o1' },
      isAvailable: false,
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptFixedPriceShipment(
      { params: { id: 's1' }, body: { truckId: 't1', driverId: 'd1' }, user: { id: 'o1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('accepts fixed-price shipment with transactions', async () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession.mockResolvedValue(session);
    db.supportsTransactions.mockResolvedValue(true);

    const shipment = {
      _id: 's1',
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: { amount: 5000, currency: 'USD' },
      origin: { address: 'A' },
      destination: { address: 'B' },
      cargoDetails: { description: 'Cargo' },
      merchantId: 'm1',
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };

    const truck = {
      _id: 't1',
      ownerId: { toString: () => 'o1' },
      available: true,
      model: 'Model',
      plateNumber: 'PLATE',
      save: jest.fn(),
    };

    const driver = {
      _id: 'd1',
      role: 'Driver',
      ownerId: { toString: () => 'o1' },
      isAvailable: true,
      name: 'Driver',
      save: jest.fn(),
    };

    Shipment.findById.mockResolvedValue(shipment);
    Truck.findById.mockResolvedValue(truck);
    User.findById.mockResolvedValue(driver);
    notificationService.sendNotification.mockResolvedValue(null);

    const res = makeRes();

    await controller.acceptFixedPriceShipment(
      {
        params: { id: 's1' },
        body: { truckId: 't1', driverId: 'd1', acceptanceNote: 'ok' },
        user: { id: 'o1', _id: 'o1', name: 'Owner' },
      },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(session.commitTransaction).toHaveBeenCalled();
  });

  it('accepts fixed-price shipment without transactions', async () => {
    db.supportsTransactions.mockResolvedValue(false);

    const shipment = {
      _id: 's1',
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: { amount: 5000, currency: 'USD' },
      origin: { address: 'A' },
      destination: { address: 'B' },
      cargoDetails: { description: 'Cargo' },
      merchantId: 'm1',
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };

    const truck = {
      _id: 't1',
      ownerId: { toString: () => 'o1' },
      available: true,
      model: 'Model',
      plateNumber: 'PLATE',
      save: jest.fn(),
    };

    const driver = {
      _id: 'd1',
      role: 'Driver',
      ownerId: { toString: () => 'o1' },
      isAvailable: true,
      name: 'Driver',
      save: jest.fn(),
    };

    Shipment.findById.mockResolvedValue(shipment);
    Truck.findById.mockResolvedValue(truck);
    User.findById.mockResolvedValue(driver);

    const res = makeRes();
    await controller.acceptFixedPriceShipment(
      {
        params: { id: 's1' },
        body: { truckId: 't1', driverId: 'd1' },
        user: { id: 'o1', _id: 'o1', name: 'Owner' },
      },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns my fixed price shipments with status filter', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    const res = makeRes();

    await controller.getMyFixedPriceShipments(
      { query: { status: ShipmentStatus.REQUESTED }, user: { id: 'm1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns accepted fixed price shipments with status filter', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    const res = makeRes();

    await controller.getMyAcceptedFixedPriceShipments(
      { query: { status: ShipmentStatus.REQUESTED }, user: { id: 'o1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('converts fixed price shipment to bidding', async () => {
    const shipment = {
      merchantId: { toString: () => 'm1' },
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.convertToBidding(
      { params: { id: 's1' }, user: { id: 'm1' } },
      res,
      jest.fn()
    );

    expect(shipment.pricingType).toBe('BIDDING');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects convert to bidding when shipment invalid', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();
    await controller.convertToBidding(
      { params: { id: 's1' }, user: { id: 'm1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('updates fixed price details', async () => {
    const shipment = {
      merchantId: { toString: () => 'm1' },
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      fixedPriceDetails: { amount: 100, currency: 'USD', requirements: {} },
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateFixedPriceDetails(
      { params: { id: 's1' }, body: { amount: 200, currency: 'EUR', requirements: { minTruckCapacity: 2 } }, user: { id: 'm1' } },
      res,
      jest.fn()
    );

    expect(shipment.fixedPriceDetails.amount).toBe(200);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
