jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  ShipmentStatus: {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    REQUESTED: 'REQUESTED',
    CONFIRMED: 'CONFIRMED',
    ASSIGNED: 'ASSIGNED',
    LOADING: 'LOADING',
    IN_TRANSIT: 'IN_TRANSIT',
    REJECTED: 'REJECTED',
  },
  ShipmentApprovalState: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
}));

jest.mock('../../src/models/Broker', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/Truck', () => ({
  findById: jest.fn(),
}));

const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../src/models/Shipment');
const Broker = require('../../src/models/Broker');
const User = require('../../src/models/User');
const Truck = require('../../src/models/Truck');
const controller = require('../../src/controllers/admin/adminShipmentController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => {
  const query = {
    populate: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('adminShipmentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets all shipments with filters and pagination', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 1 }]));
    Shipment.countDocuments.mockResolvedValue(1);

    const req = { query: { status: 'REQUESTED', page: '2', limit: '5' } };
    const res = makeRes();

    await controller.getAllShipments(req, res, jest.fn());

    expect(Shipment.find).toHaveBeenCalledWith({ status: 'REQUESTED' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('gets all shipments with date range and assignment filters', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 1 }]));
    Shipment.countDocuments.mockResolvedValue(1);

    const req = {
      query: {
        approvalState: 'PENDING',
        merchantId: 'm1',
        assignedTruckId: 't1',
        assignedDriverId: 'd1',
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      },
    };
    const res = makeRes();

    await controller.getAllShipments(req, res, jest.fn());

    expect(Shipment.find).toHaveBeenCalledWith(
      expect.objectContaining({
        'approval.state': 'PENDING',
        merchantId: 'm1',
        assignedTruckId: 't1',
        assignedDriverId: 'd1',
        createdAt: expect.any(Object),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when shipment not found', async () => {
    Shipment.findById.mockReturnValue(makeQuery(null));
    const req = { params: { id: 's1' } };
    const res = makeRes();
    const next = jest.fn();

    await controller.getShipmentById(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns shipment by id', async () => {
    Shipment.findById.mockReturnValue(makeQuery({ _id: 's1' }));
    const res = makeRes();

    await controller.getShipmentById({ params: { id: 's1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates shipment fields', async () => {
    const save = jest.fn();
    const shipment = { save };
    Shipment.findById.mockResolvedValue(shipment);

    const req = { params: { id: 's1' }, body: { status: 'REQUESTED', notes: 'note' } };
    const res = makeRes();

    await controller.updateShipment(req, res, jest.fn());

    expect(shipment.status).toBe('REQUESTED');
    expect(shipment.notes).toBe('note');
    expect(save).toHaveBeenCalled();
  });

  it('updates shipment with all provided fields', async () => {
    const save = jest.fn();
    const shipment = { save };
    Shipment.findById.mockResolvedValue(shipment);

    const req = {
      params: { id: 's1' },
      body: {
        status: 'REQUESTED',
        origin: { country: 'US' },
        destination: { country: 'CA' },
        cargoDetails: { weight: 1 },
        pricing: { total: 100 },
        notes: 'note',
        merchantId: 'm1',
        assignedTruckId: 't1',
        assignedDriverId: 'd1',
      },
    };

    await controller.updateShipment(req, makeRes(), jest.fn());

    expect(shipment.origin).toEqual({ country: 'US' });
    expect(shipment.destination).toEqual({ country: 'CA' });
    expect(shipment.cargoDetails).toEqual({ weight: 1 });
    expect(shipment.pricing).toEqual({ total: 100 });
    expect(shipment.merchantId).toBe('m1');
    expect(shipment.assignedTruckId).toBe('t1');
    expect(shipment.assignedDriverId).toBe('d1');
    expect(save).toHaveBeenCalled();
  });

  it('deletes shipment', async () => {
    const deleteOne = jest.fn();
    Shipment.findById.mockResolvedValue({ deleteOne });

    const req = { params: { id: 's1' } };
    const res = makeRes();

    await controller.deleteShipment(req, res, jest.fn());

    expect(deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('validates status changes', async () => {
    const res = makeRes();
    const next = jest.fn();

    await controller.changeShipmentStatus({ body: {}, params: { id: 's1' } }, res, next);
    expect(next).toHaveBeenCalled();

    next.mockClear();
    await controller.changeShipmentStatus(
      { body: { status: 'INVALID' }, params: { id: 's1' } },
      res,
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('blocks status change when compliance incomplete', async () => {
    Shipment.findById.mockResolvedValue({ isComplianceReady: () => false });
    const res = makeRes();
    const next = jest.fn();

    await controller.changeShipmentStatus(
      { body: { status: ShipmentStatus.LOADING }, params: { id: 's1' } },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns error when shipment missing for status change', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.changeShipmentStatus(
      { body: { status: ShipmentStatus.REQUESTED }, params: { id: 's1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('changes shipment status and adds timeline', async () => {
    const shipment = {
      status: 'REQUESTED',
      currentLocation: {},
      isComplianceReady: () => true,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);

    const res = makeRes();
    await controller.changeShipmentStatus(
      { body: { status: ShipmentStatus.IN_TRANSIT }, params: { id: 's1' } },
      res,
      jest.fn()
    );

    expect(shipment.addTimelineEntry).toHaveBeenCalled();
    expect(shipment.save).toHaveBeenCalled();
  });

  it('approves shipment when pending', async () => {
    const shipment = {
      approval: { state: ShipmentApprovalState.PENDING },
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);

    const req = { params: { id: 's1' }, user: { _id: 'u1' } };
    const res = makeRes();

    await controller.approveShipment(req, res, jest.fn());

    expect(shipment.approval.state).toBe(ShipmentApprovalState.APPROVED);
  });

  it('rejects approval when shipment not pending', async () => {
    const shipment = { approval: { state: ShipmentApprovalState.APPROVED } };
    Shipment.findById.mockResolvedValue(shipment);
    const next = jest.fn();

    await controller.approveShipment({ params: { id: 's1' }, user: { _id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects shipment with reason', async () => {
    const shipment = {
      approval: { state: ShipmentApprovalState.PENDING },
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);

    const req = { params: { id: 's1' }, body: { reason: 'bad' }, user: { _id: 'u1' } };
    const res = makeRes();

    await controller.rejectShipment(req, res, jest.fn());

    expect(shipment.approval.state).toBe(ShipmentApprovalState.REJECTED);
  });

  it('rejects shipment when not pending', async () => {
    const shipment = { approval: { state: ShipmentApprovalState.APPROVED } };
    Shipment.findById.mockResolvedValue(shipment);
    const next = jest.fn();

    await controller.rejectShipment({ params: { id: 's1' }, body: {}, user: { _id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('assigns broker when active', async () => {
    const shipment = {
      compliance: {},
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    Broker.findById.mockResolvedValue({ _id: 'b1', status: 'ACTIVE' });

    const req = { params: { id: 's1' }, body: { brokerId: 'b1' } };
    const res = makeRes();

    await controller.assignBroker(req, res, jest.fn());

    expect(shipment.compliance.brokerId).toBe('b1');
  });

  it('rejects broker assignment when brokerId missing', async () => {
    const next = jest.fn();

    await controller.assignBroker({ params: { id: 's1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects broker assignment when shipment missing', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.assignBroker({ params: { id: 's1' }, body: { brokerId: 'b1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects broker assignment when broker missing or inactive', async () => {
    Shipment.findById.mockResolvedValue({ compliance: {}, refreshComplianceStatus: jest.fn(), save: jest.fn() });
    Broker.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.assignBroker({ params: { id: 's1' }, body: { brokerId: 'b1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    Broker.findById.mockResolvedValue({ _id: 'b1', status: 'INACTIVE' });
    const nextInactive = jest.fn();
    await controller.assignBroker({ params: { id: 's1' }, body: { brokerId: 'b1' } }, makeRes(), nextInactive);
    expect(nextInactive).toHaveBeenCalled();
  });

  it('assigns shipment to driver and truck', async () => {
    const shipment = {
      status: ShipmentStatus.REQUESTED,
      currentLocation: {},
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    User.findById.mockResolvedValue({ role: 'Driver', isAvailable: true });
    Truck.findById.mockResolvedValue({ status: 'AVAILABLE' });

    const req = {
      params: { id: 's1' },
      body: { driverId: 'd1', assignedTruckId: 't1' },
    };
    const res = makeRes();

    await controller.assignShipmentToDriver(req, res, jest.fn());

    expect(shipment.assignedDriverId).toBe('d1');
    expect(shipment.assignedTruckId).toBe('t1');
  });

  it('rejects shipment assignment when driverId missing', async () => {
    const next = jest.fn();

    await controller.assignShipmentToDriver({ params: { id: 's1' }, body: {} }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects shipment assignment when shipment missing or status invalid', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    Shipment.findById.mockResolvedValue({ status: 'DELIVERED' });
    const nextInvalid = jest.fn();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      makeRes(),
      nextInvalid
    );
    expect(nextInvalid).toHaveBeenCalled();
  });

  it('rejects shipment assignment when driver invalid or unavailable', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.REQUESTED });
    User.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    User.findById.mockResolvedValue({ role: 'Merchant' });
    const nextRole = jest.fn();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      makeRes(),
      nextRole
    );
    expect(nextRole).toHaveBeenCalled();

    User.findById.mockResolvedValue({ role: 'Driver', isAvailable: false });
    const nextAvail = jest.fn();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      makeRes(),
      nextAvail
    );
    expect(nextAvail).toHaveBeenCalled();
  });

  it('rejects shipment assignment when truck missing or unavailable', async () => {
    const shipment = { status: ShipmentStatus.REQUESTED, addTimelineEntry: jest.fn(), save: jest.fn() };
    Shipment.findById.mockResolvedValue(shipment);
    User.findById.mockResolvedValue({ role: 'Driver', isAvailable: true });
    Truck.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1', assignedTruckId: 't1' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    Truck.findById.mockResolvedValue({ status: 'IN_USE' });
    const nextUnavailable = jest.fn();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1', assignedTruckId: 't1' } },
      makeRes(),
      nextUnavailable
    );
    expect(nextUnavailable).toHaveBeenCalled();
  });

  it('assigns shipment to driver without truck', async () => {
    const shipment = {
      status: ShipmentStatus.REQUESTED,
      currentLocation: {},
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    User.findById.mockResolvedValue({ role: 'Driver', isAvailable: true });

    const res = makeRes();
    await controller.assignShipmentToDriver(
      { params: { id: 's1' }, body: { driverId: 'd1' } },
      res,
      jest.fn()
    );

    expect(shipment.assignedDriverId).toBe('d1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
