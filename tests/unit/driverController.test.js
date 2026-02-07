require('../../src/utils/polyfills');

jest.mock('multer', () => {
  const multer = jest.fn((opts) => {
    multer._opts = opts;
    return {
      single: () => (req, res, cb) => cb(multer._err || null),
    };
  });
  multer.diskStorage = jest.fn((opts) => opts);
  multer._opts = null;
  multer._err = null;
  return multer;
});

jest.mock('../../src/services/tracking/trackingService', () => ({
  updateShipmentLocation: jest.fn(),
  getShipmentLocation: jest.fn(),
  recordLocationHistory: jest.fn(),
  calculateETA: jest.fn(),
  isWithinGeofence: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/Truck', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  },
  ShipmentStatus: {
    ASSIGNED: 'ASSIGNED',
    IN_TRANSIT: 'IN_TRANSIT',
    LOADING: 'LOADING',
    UNLOADING: 'UNLOADING',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

jest.mock('../../src/utils/metricScheduler', () => ({
  updateShipmentStatusMetrics: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const User = require('../../src/models/User');
const Truck = require('../../src/models/Truck');
const { Shipment } = require('../../src/models/Shipment');
const fs = require('fs');
const multer = require('multer');
const controller = require('../../src/controllers/driver/driverController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => {
  const query = Promise.resolve(result);
  query.populate = jest.fn().mockReturnValue(query);
  query.sort = jest.fn().mockReturnValue(query);
  query.select = jest.fn().mockReturnValue(query);
  return query;
};

describe('driverController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when no truck assigned', async () => {
    Truck.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const next = jest.fn();

    await controller.getCurrentTruck({ user: { id: 'd1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('returns assigned truck', async () => {
    const truck = { id: 't1' };
    Truck.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(truck) });
    const res = makeRes();

    await controller.getCurrentTruck({ user: { id: 'd1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects invalid availability updates', async () => {
    const next = jest.fn();

    await controller.updateAvailability({ body: { isAvailable: 'yes' }, user: { id: 'd1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('updates availability', async () => {
    const driver = { save: jest.fn() };
    User.findById.mockResolvedValue(driver);
    const res = makeRes();

    await controller.updateAvailability({ body: { isAvailable: true }, user: { id: 'd1' } }, res, jest.fn());

    expect(driver.isAvailable).toBe(true);
    expect(driver.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects missing coordinates', async () => {
    const next = jest.fn();

    await controller.updateLocation({ body: {}, user: { id: 'd1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid coordinates', async () => {
    const next = jest.fn();

    await controller.updateLocation({ body: { latitude: 'x', longitude: 'y' }, user: { id: 'd1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects when shipment not assigned to driver', async () => {
    const driver = { save: jest.fn() };
    User.findById.mockResolvedValue(driver);
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateLocation(
      { body: { latitude: 1, longitude: 2, shipmentId: 's1' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('updates location without shipmentId', async () => {
    const driver = { save: jest.fn() };
    User.findById.mockResolvedValue(driver);
    const res = makeRes();

    await controller.updateLocation(
      { body: { latitude: 1, longitude: 2 }, user: { id: 'd1' } },
      res,
      jest.fn()
    );

    expect(driver.currentLocation).toEqual({ type: 'Point', coordinates: [2, 1] });
    expect(driver.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects delivery route when shipment is not assigned', async () => {
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getDeliveryRoute(
      { params: { shipmentId: 's1' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns assigned shipments', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    const res = makeRes();

    await controller.getAssignedShipments({ user: { id: 'd1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns shipment history', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    const res = makeRes();

    await controller.getShipmentHistory({ user: { id: 'd1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects shipment status updates without status', async () => {
    const next = jest.fn();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects shipment status updates with invalid status', async () => {
    const next = jest.fn();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: { status: 'BAD' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects dispatch when compliance is incomplete', async () => {
    Shipment.findOne.mockResolvedValue({
      isComplianceReady: jest.fn(() => false),
    });
    const next = jest.fn();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: { status: 'IN_TRANSIT' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('updates shipment status to delivered', async () => {
    const shipment = {
      isComplianceReady: jest.fn(() => true),
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: { status: 'DELIVERED' }, user: { id: 'd1' } },
      res,
      jest.fn()
    );

    expect(shipment.actualDeliveryDate).toBeInstanceOf(Date);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects start delivery for invalid status', async () => {
    Shipment.findOne.mockResolvedValue({ status: 'DELIVERED' });
    const next = jest.fn();

    await controller.startDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('starts delivery for assigned shipment', async () => {
    const shipment = {
      status: 'ASSIGNED',
      isComplianceReady: jest.fn(() => true),
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.startDelivery(
      {
        params: { shipmentId: 's1' },
        body: { startOdometer: 100 },
        user: { id: 'd1', currentLocation: { coordinates: [1, 2] } },
      },
      res,
      jest.fn()
    );

    expect(shipment.status).toBe('IN_TRANSIT');
    expect(shipment.startOdometer).toBe(100);
    expect(shipment.actualPickupDate).toBeInstanceOf(Date);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('completes delivery and calculates distance traveled', async () => {
    const shipment = {
      status: 'IN_TRANSIT',
      startOdometer: 100,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.completeDelivery(
      {
        params: { shipmentId: 's1' },
        body: { endOdometer: 150, recipientName: 'Receiver' },
        user: { id: 'd1', currentLocation: { coordinates: [1, 2] } },
      },
      res,
      jest.fn()
    );

    expect(shipment.distanceTraveled).toBe(50);
    expect(shipment.actualDeliveryDate).toBeInstanceOf(Date);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('reports a severe issue and delays shipment', async () => {
    const shipment = {
      issues: null,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.reportIssue(
      {
        params: { shipmentId: 's1' },
        body: { issueType: 'ACCIDENT', description: 'Crash' },
        user: { id: 'd1', currentLocation: { coordinates: [1, 2] } },
      },
      res,
      jest.fn()
    );

    expect(shipment.status).toBe('DELAYED');
    expect(shipment.issues).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects driver status update when status is missing', async () => {
    const next = jest.fn();

    await controller.updateDriverStatus(
      { body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid driver status', async () => {
    const next = jest.fn();

    await controller.updateDriverStatus(
      { body: { status: 'BAD' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('updates driver status to active', async () => {
    const driver = { save: jest.fn(), statusHistory: null };
    User.findById.mockResolvedValue(driver);
    const res = makeRes();

    await controller.updateDriverStatus(
      { body: { status: 'ACTIVE' }, user: { id: 'd1' } },
      res,
      jest.fn()
    );

    expect(driver.isAvailable).toBe(true);
    expect(driver.statusHistory).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects checkin when no truck assigned', async () => {
    Truck.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.driverCheckin(
      { body: { latitude: 1, longitude: 2 }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('checks in driver and updates truck', async () => {
    const truck = { save: jest.fn() };
    Truck.findOne.mockResolvedValue(truck);
    const driver = { save: jest.fn(), driverLogs: null };
    User.findById.mockResolvedValue(driver);
    const res = makeRes();

    await controller.driverCheckin(
      {
        body: { latitude: 1, longitude: 2, fuelLevel: 50 },
        user: { id: 'd1' },
      },
      res,
      jest.fn()
    );

    expect(driver.driverStatus).toBe('ACTIVE');
    expect(truck.status).toBe('IN_SERVICE');
    expect(driver.save).toHaveBeenCalled();
    expect(truck.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects checkout when no truck assigned', async () => {
    Truck.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.driverCheckout(
      { body: { latitude: 1, longitude: 2, totalMiles: 10, fuelLevel: 20 }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('checks out driver and updates truck odometer', async () => {
    const truck = { save: jest.fn(), odometer: 10 };
    Truck.findOne.mockResolvedValue(truck);
    const driver = { save: jest.fn(), driverLogs: null };
    User.findById.mockResolvedValue(driver);
    const res = makeRes();

    await controller.driverCheckout(
      {
        body: { latitude: 1, longitude: 2, totalMiles: 15, fuelLevel: 40 },
        user: { id: 'd1' },
      },
      res,
      jest.fn()
    );

    expect(truck.odometer).toBe(25);
    expect(driver.driverStatus).toBe('OFF_DUTY');
    expect(driver.save).toHaveBeenCalled();
    expect(truck.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('invokes storage destination and fileFilter branches', () => {
    const destination = multer._opts.storage.destination;
    const fileFilter = multer._opts.fileFilter;
    const cb = jest.fn();
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false).mockReturnValueOnce(true);

    destination({}, { originalname: 'file.pdf' }, cb);
    destination({}, { originalname: 'file.pdf' }, cb);

    const acceptCb = jest.fn();
    fileFilter({}, { mimetype: 'image/png' }, acceptCb);
    const rejectCb = jest.fn();
    fileFilter({}, { mimetype: 'text/plain' }, rejectCb);

    expect(mkdirSpy).toHaveBeenCalled();
    expect(acceptCb).toHaveBeenCalledWith(null, true);
    expect(rejectCb.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('rejects shipment status update when shipment is missing', async () => {
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: { status: 'ASSIGNED' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('sets pickup date when moving to in transit', async () => {
    const shipment = {
      isComplianceReady: jest.fn(() => true),
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateShipmentStatus(
      { params: { shipmentId: 's1' }, body: { status: 'IN_TRANSIT' }, user: { id: 'd1' } },
      res,
      jest.fn()
    );

    expect(shipment.actualPickupDate).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects start delivery when shipment is missing', async () => {
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.startDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects start delivery when compliance is incomplete', async () => {
    Shipment.findOne.mockResolvedValue({
      status: 'ASSIGNED',
      isComplianceReady: jest.fn(() => false),
    });
    const next = jest.fn();

    await controller.startDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects complete delivery when shipment is missing', async () => {
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.completeDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects complete delivery for invalid status', async () => {
    Shipment.findOne.mockResolvedValue({ status: 'ASSIGNED' });
    const next = jest.fn();

    await controller.completeDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('skips distance calculation when start odometer missing', async () => {
    const shipment = {
      status: 'IN_TRANSIT',
      startOdometer: 0,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);

    await controller.completeDelivery(
      {
        params: { shipmentId: 's1' },
        body: { endOdometer: 150, recipientName: 'Receiver' },
        user: { id: 'd1', currentLocation: { coordinates: [1, 2] } },
      },
      makeRes(),
      jest.fn()
    );

    expect(shipment.distanceTraveled).toBeUndefined();
  });

  it('rejects reporting issue when shipment missing', async () => {
    Shipment.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.reportIssue(
      { params: { shipmentId: 's1' }, body: { issueType: 'DELAY' }, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('handles upload proof errors and missing file', async () => {
    const next = jest.fn();
    multer._err = new Error('upload failed');

    await controller.uploadProofOfDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
    multer._err = null;

    const nextMissing = jest.fn();
    await controller.uploadProofOfDelivery(
      { params: { shipmentId: 's1' }, body: {}, user: { id: 'd1' } },
      makeRes(),
      nextMissing
    );

    expect(nextMissing).toHaveBeenCalled();
  });

  it('removes uploaded file when shipment not found for proof', async () => {
    Shipment.findOne.mockResolvedValue(null);
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    const next = jest.fn();

    await controller.uploadProofOfDelivery(
      {
        params: { shipmentId: 's1' },
        body: {},
        file: { path: 'proof.pdf', filename: 'proof.pdf', mimetype: 'application/pdf' },
        user: { id: 'd1' },
      },
      makeRes(),
      next
    );

    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('uploads delivery proof successfully', async () => {
    const shipment = {
      status: 'IN_TRANSIT',
      deliveryProofs: null,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findOne.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.uploadProofOfDelivery(
      {
        params: { shipmentId: 's1' },
        body: {},
        file: { path: 'proof.pdf', filename: 'proof.pdf', mimetype: 'application/pdf' },
        user: { id: 'd1', currentLocation: { coordinates: [1, 2] } },
      },
      res,
      jest.fn()
    );
    await new Promise(setImmediate);

    expect(shipment.deliveryProofs).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('builds driver dashboard with next delivery sorting', async () => {
    const driver = { id: 'd1' };
    User.findById.mockReturnValue(makeQuery(driver));
    Truck.findOne.mockResolvedValue({ id: 't1' });

    const activeShipments = [
      { status: 'IN_TRANSIT', expectedDeliveryDate: new Date('2024-02-10') },
      { status: 'ASSIGNED', expectedDeliveryDate: new Date('2024-02-08') },
      { status: 'IN_TRANSIT', expectedDeliveryDate: new Date('2024-02-05') },
    ];
    Shipment.find
      .mockReturnValueOnce(makeQuery(activeShipments))
      .mockReturnValueOnce(makeQuery([{ id: 'issue1' }]));
    Shipment.countDocuments.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

    const res = makeRes();
    await controller.getDriverDashboard({ user: { id: 'd1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
