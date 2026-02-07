jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/Application', () => ({
  Application: {
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    rejectOthers: jest.fn(),
  },
  ApplicationStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  },
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    findById: jest.fn(),
  },
  ShipmentStatus: {
    REQUESTED: 'REQUESTED',
    ASSIGNED: 'ASSIGNED',
  },
}));

jest.mock('../../src/models/Truck', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/utils/db', () => ({
  supportsTransactions: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock('mongoose', () => ({
  startSession: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { Application, ApplicationStatus } = require('../../src/models/Application');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');
const Truck = require('../../src/models/Truck');
const User = require('../../src/models/User');
const db = require('../../src/utils/db');
const mongoose = require('mongoose');
const controller = require('../../src/controllers/application/applicationController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('applicationController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  it('returns validation errors on create', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'invalid' }],
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication({ body: {}, user: { id: 'owner1' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('fails when shipment is not found', async () => {
    Shipment.findById.mockResolvedValue(null);

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('fails when truck is not owned by user', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue({
      ownerId: { toString: () => 'other' },
      available: true,
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('fails when shipment status is not requested', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.ASSIGNED });

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('fails when truck is not found or unavailable', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue(null);

    const next = jest.fn();
    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, available: false });
    const nextUnavailable = jest.fn();
    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      makeRes(),
      nextUnavailable
    );
    expect(nextUnavailable).toHaveBeenCalled();
  });

  it('fails when driver role or ownership is invalid', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, available: true });
    User.findById.mockResolvedValue({ role: 'Merchant' });

    const next = jest.fn();
    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    User.findById.mockResolvedValue({ role: 'Driver', ownerId: { toString: () => 'other' } });
    const nextOwner = jest.fn();
    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      makeRes(),
      nextOwner
    );
    expect(nextOwner).toHaveBeenCalled();
  });

  it('creates application successfully', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, available: true });
    User.findById.mockResolvedValue({ role: 'Driver', ownerId: { toString: () => 'owner1' } });
    Application.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue({ _id: 'a1' });

    const res = makeRes();
    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1', bidDetails: {} }, user: { id: 'owner1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('fails when driver is missing', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner1' },
      available: true,
    });
    User.findById.mockResolvedValue(null);

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('fails when application already exists', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    Truck.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner1' },
      available: true,
    });
    User.findById.mockResolvedValue({ role: 'Driver', ownerId: { toString: () => 'owner1' } });
    Application.findOne.mockResolvedValue({ _id: 'a1' });

    const res = makeRes();
    const next = jest.fn();

    await controller.createApplication(
      { body: { shipmentId: 's1', assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('blocks update when application owner mismatches', async () => {
    Application.findById.mockResolvedValue({ ownerId: { toString: () => 'other' } });

    const res = makeRes();
    const next = jest.fn();

    await controller.updateApplication(
      { params: { id: 'a1' }, body: {}, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects update when application missing or not pending', async () => {
    Application.findById.mockResolvedValue(null);
    const next = jest.fn();
    await controller.updateApplication(
      { params: { id: 'a1' }, body: {}, user: { id: 'owner1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    Application.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, status: ApplicationStatus.ACCEPTED });
    const nextStatus = jest.fn();
    await controller.updateApplication(
      { params: { id: 'a1' }, body: {}, user: { id: 'owner1' } },
      makeRes(),
      nextStatus
    );
    expect(nextStatus).toHaveBeenCalled();
  });

  it('updates application bid details and assignments', async () => {
    const application = {
      ownerId: { toString: () => 'owner1' },
      status: ApplicationStatus.PENDING,
      bidDetails: { price: 100 },
      save: jest.fn(),
    };
    Application.findById.mockResolvedValue(application);
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, available: true });
    User.findById.mockResolvedValue({ role: 'Driver', ownerId: { toString: () => 'owner1' } });
    const res = makeRes();

    await controller.updateApplication(
      { params: { id: 'a1' }, body: { bidDetails: { price: 120 }, assignedTruckId: 't1', driverId: 'd1' }, user: { id: 'owner1' } },
      res,
      jest.fn()
    );

    expect(application.bidDetails.price).toBe(120);
    expect(application.assignedTruckId).toBe('t1');
    expect(application.driverId).toBe('d1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects update when truck or driver invalid', async () => {
    const application = {
      ownerId: { toString: () => 'owner1' },
      status: ApplicationStatus.PENDING,
      bidDetails: {},
      save: jest.fn(),
    };
    Application.findById.mockResolvedValue(application);
    Truck.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateApplication(
      { params: { id: 'a1' }, body: { assignedTruckId: 't1' }, user: { id: 'owner1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'owner1' }, available: true });
    User.findById.mockResolvedValue(null);
    const nextDriver = jest.fn();
    await controller.updateApplication(
      { params: { id: 'a1' }, body: { driverId: 'd1' }, user: { id: 'owner1' } },
      makeRes(),
      nextDriver
    );
    expect(nextDriver).toHaveBeenCalled();
  });

  it('returns my applications with status filter', async () => {
    Application.find.mockReturnValue(makeQuery([{ id: 'a1' }]));
    const res = makeRes();

    await controller.getMyApplications(
      { query: { status: ApplicationStatus.PENDING }, user: { id: 'owner1' } },
      res,
      jest.fn()
    );

    expect(Application.find).toHaveBeenCalledWith({ ownerId: 'owner1', status: ApplicationStatus.PENDING });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns shipment applications for merchant', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'merchant1' } });
    Application.find.mockReturnValue(makeQuery([{ id: 'a1' }]));
    const res = makeRes();

    await controller.getShipmentApplications(
      { params: { shipmentId: 's1' }, user: { id: 'merchant1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks shipment applications for non-owner', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.getShipmentApplications(
      { params: { shipmentId: 's1' }, user: { id: 'merchant1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns application when user is owner', async () => {
    Application.findById.mockReturnValue(
      makeQuery({ ownerId: { _id: { toString: () => 'owner1' } }, shipmentId: { merchantId: { toString: () => 'merchant2' } } })
    );
    const res = makeRes();

    await controller.getApplication({ params: { id: 'a1' }, user: { id: 'owner1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks application access for unauthorized user', async () => {
    Application.findById.mockReturnValue(
      makeQuery({ ownerId: { _id: { toString: () => 'owner1' } }, shipmentId: { merchantId: { toString: () => 'merchant2' } } })
    );
    const next = jest.fn();

    await controller.getApplication({ params: { id: 'a1' }, user: { id: 'other' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks cancel when application status is not pending', async () => {
    Application.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner1' },
      status: ApplicationStatus.ACCEPTED,
      cancel: jest.fn(),
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.cancelApplication(
      { params: { id: 'a1' }, user: { id: 'owner1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('cancels application when pending', async () => {
    const application = {
      ownerId: { toString: () => 'owner1' },
      status: ApplicationStatus.PENDING,
      cancel: jest.fn(),
    };
    Application.findById.mockResolvedValue(application);
    const res = makeRes();

    await controller.cancelApplication({ params: { id: 'a1' }, user: { id: 'owner1' } }, res, jest.fn());

    expect(application.cancel).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks accept when truck is unavailable', async () => {
    const application = {
      status: ApplicationStatus.PENDING,
      shipmentId: {
        merchantId: { toString: () => 'merchant1' },
        status: ShipmentStatus.REQUESTED,
      },
      assignedTruckId: { available: false },
      driverId: { _id: 'd1' },
    };
    Application.findById.mockReturnValue(makeQuery(application));

    const res = makeRes();
    const next = jest.fn();

    await controller.acceptApplication(
      { params: { id: 'a1' }, user: { id: 'merchant1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('blocks accept when application is missing or merchant mismatch', async () => {
    Application.findById.mockReturnValue(makeQuery(null));
    const next = jest.fn();

    await controller.acceptApplication({ params: { id: 'a1' }, user: { id: 'merchant1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    const application = {
      status: ApplicationStatus.PENDING,
      shipmentId: { merchantId: { toString: () => 'other' }, status: ShipmentStatus.REQUESTED },
      assignedTruckId: { available: true },
      driverId: { _id: 'd1' },
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const nextMismatch = jest.fn();
    await controller.acceptApplication({ params: { id: 'a1' }, user: { id: 'merchant1' } }, makeRes(), nextMismatch);
    expect(nextMismatch).toHaveBeenCalled();
  });

  it('blocks accept when application status or shipment status invalid', async () => {
    const application = {
      status: ApplicationStatus.ACCEPTED,
      shipmentId: { merchantId: { toString: () => 'merchant1' }, status: ShipmentStatus.REQUESTED },
      assignedTruckId: { available: true },
      driverId: { _id: 'd1' },
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const next = jest.fn();
    await controller.acceptApplication({ params: { id: 'a1' }, user: { id: 'merchant1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    application.status = ApplicationStatus.PENDING;
    application.shipmentId.status = ShipmentStatus.ASSIGNED;
    const nextShipment = jest.fn();
    await controller.acceptApplication({ params: { id: 'a1' }, user: { id: 'merchant1' } }, makeRes(), nextShipment);
    expect(nextShipment).toHaveBeenCalled();
  });

  it('blocks accept when driver missing', async () => {
    const application = {
      status: ApplicationStatus.PENDING,
      shipmentId: { merchantId: { toString: () => 'merchant1' }, status: ShipmentStatus.REQUESTED },
      assignedTruckId: { available: true },
      driverId: null,
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const next = jest.fn();

    await controller.acceptApplication({ params: { id: 'a1' }, user: { id: 'merchant1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('returns validation errors on reject', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'invalid' }],
    });

    const res = makeRes();
    const next = jest.fn();

    await controller.rejectApplication(
      { params: { id: 'a1' }, body: {}, user: { id: 'merchant1' } },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects application when not found or unauthorized', async () => {
    Application.findById.mockReturnValue(makeQuery(null));
    const next = jest.fn();
    await controller.rejectApplication({ params: { id: 'a1' }, body: { reason: 'no' }, user: { id: 'merchant1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    const application = {
      status: ApplicationStatus.PENDING,
      shipmentId: { merchantId: { toString: () => 'other' } },
      reject: jest.fn(),
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const nextUnauthorized = jest.fn();
    await controller.rejectApplication({ params: { id: 'a1' }, body: { reason: 'no' }, user: { id: 'merchant1' } }, makeRes(), nextUnauthorized);
    expect(nextUnauthorized).toHaveBeenCalled();
  });

  it('rejects application when status is not pending', async () => {
    const application = {
      status: ApplicationStatus.ACCEPTED,
      shipmentId: { merchantId: { toString: () => 'merchant1' } },
      reject: jest.fn(),
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const next = jest.fn();

    await controller.rejectApplication({ params: { id: 'a1' }, body: { reason: 'no' }, user: { id: 'merchant1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects application successfully', async () => {
    const application = {
      status: ApplicationStatus.PENDING,
      shipmentId: { merchantId: { toString: () => 'merchant1' } },
      reject: jest.fn(),
    };
    Application.findById.mockReturnValue(makeQuery(application));
    const res = makeRes();

    await controller.rejectApplication({ params: { id: 'a1' }, body: { reason: 'no' }, user: { id: 'merchant1' } }, res, jest.fn());

    expect(application.reject).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('accepts application using transaction when supported', async () => {
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
      merchantId: { toString: () => 'merchant1' },
      status: ShipmentStatus.REQUESTED,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };

    const application = {
      _id: 'a1',
      status: ApplicationStatus.PENDING,
      shipmentId: shipment,
      assignedTruckId: { _id: 't1', available: true },
      driverId: 'd1',
      statusHistory: [],
      save: jest.fn(),
    };

    const truckToUpdate = {
      available: true,
      status: 'AVAILABLE',
      save: jest.fn(),
    };

    const truckQuery = {
      session: jest.fn().mockResolvedValue(truckToUpdate),
    };

    Application.findById.mockReturnValue(makeQuery(application));
    Application.rejectOthers.mockResolvedValue(null);
    Truck.findById.mockReturnValue(truckQuery);

    const res = makeRes();

    await controller.acceptApplication(
      { params: { id: 'a1' }, user: { id: 'merchant1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(session.commitTransaction).toHaveBeenCalled();
  });

  it('accepts application without transactions', async () => {
    db.supportsTransactions.mockResolvedValue(false);

    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'merchant1' },
      status: ShipmentStatus.REQUESTED,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };

    const application = {
      _id: 'a1',
      status: ApplicationStatus.PENDING,
      shipmentId: shipment,
      assignedTruckId: { _id: 't1', available: true },
      driverId: 'd1',
      statusHistory: [],
      save: jest.fn(),
    };

    const truck = {
      assignToShipment: jest.fn(),
    };

    Application.findById.mockReturnValue(makeQuery(application));
    Application.updateMany.mockResolvedValue({});
    Truck.findById.mockResolvedValue(truck);

    const res = makeRes();
    await controller.acceptApplication(
      { params: { id: 'a1' }, user: { id: 'merchant1' } },
      res,
      jest.fn()
    );

    expect(truck.assignToShipment).toHaveBeenCalledWith('d1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects accept without transaction when truck missing', async () => {
    db.supportsTransactions.mockResolvedValue(false);

    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'merchant1' },
      status: ShipmentStatus.REQUESTED,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };

    const application = {
      _id: 'a1',
      status: ApplicationStatus.PENDING,
      shipmentId: shipment,
      assignedTruckId: 't1',
      driverId: 'd1',
      statusHistory: [],
      save: jest.fn(),
    };

    Application.findById.mockReturnValue(makeQuery(application));
    Application.updateMany.mockResolvedValue({});
    Truck.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.acceptApplication(
      { params: { id: 'a1' }, user: { id: 'merchant1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });
});
