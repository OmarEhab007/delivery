jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/Truck', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/utils/metricScheduler', () => ({
  updateTruckStatusMetrics: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const { validationResult } = require('express-validator');
const Truck = require('../../src/models/Truck');
const User = require('../../src/models/User');
const metricScheduler = require('../../src/utils/metricScheduler');
const controller = require('../../src/controllers/truck/truckController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('truckController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  it('rejects truck creation on validation errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.createTruck(
      { body: {}, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects duplicate plate numbers', async () => {
    Truck.findOne.mockResolvedValue({ id: 't1' });
    const res = makeRes();

    await controller.createTruck(
      { body: { plateNumber: 'ABC' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates truck and handles metrics errors', async () => {
    Truck.findOne.mockResolvedValue(null);
    Truck.create.mockResolvedValue({ id: 't1' });
    metricScheduler.updateTruckStatusMetrics.mockRejectedValue(new Error('metrics'));
    const res = makeRes();

    await controller.createTruck(
      { body: { plateNumber: 'ABC' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(Truck.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'u1' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns trucks for owner', async () => {
    Truck.find.mockResolvedValue([{ id: 't1' }]);
    const res = makeRes();

    await controller.getMyTrucks({ user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when truck not found', async () => {
    Truck.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const next = jest.fn();

    await controller.getTruck({ params: { id: 't1' }, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects truck access when owner mismatch', async () => {
    Truck.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ ownerId: { toString: () => 'other' } }),
    });
    const next = jest.fn();

    await controller.getTruck({ params: { id: 't1' }, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns truck by id', async () => {
    Truck.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ ownerId: { toString: () => 'u1' } }),
    });
    const res = makeRes();

    await controller.getTruck({ params: { id: 't1' }, user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects update on validation errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.updateTruck({ params: { id: 't1' }, body: {}, user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects update when truck missing', async () => {
    Truck.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateTruck({ params: { id: 't1' }, body: {}, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects update when owner mismatch', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.updateTruck({ params: { id: 't1' }, body: {}, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects update when plate number exists', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' }, plateNumber: 'A' });
    Truck.findOne.mockResolvedValue({ id: 't2' });
    const res = makeRes();

    await controller.updateTruck(
      { params: { id: 't1' }, body: { plateNumber: 'B' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates truck and handles metrics errors', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' }, plateNumber: 'A' });
    Truck.findOne.mockResolvedValue(null);
    Truck.findByIdAndUpdate.mockResolvedValue({ id: 't1' });
    metricScheduler.updateTruckStatusMetrics.mockRejectedValue(new Error('metrics'));
    const res = makeRes();

    await controller.updateTruck(
      { params: { id: 't1' }, body: { plateNumber: 'A' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects delete when truck missing', async () => {
    Truck.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.deleteTruck({ params: { id: 't1' }, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects delete when owner mismatch', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.deleteTruck({ params: { id: 't1' }, user: { id: 'u1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('deletes truck and handles metrics errors', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });
    metricScheduler.updateTruckStatusMetrics.mockRejectedValue(new Error('metrics'));
    const res = makeRes();

    await controller.deleteTruck({ params: { id: 't1' }, user: { id: 'u1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('searches trucks with filters', async () => {
    Truck.find.mockReturnValue(makeQuery([{ id: 't1' }]));
    Truck.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.searchTrucks(
      {
        query: { available: 'true', capacity: '10', year: '2020' },
        user: { id: 'u1' },
      },
      res,
      jest.fn()
    );

    const query = Truck.find.mock.calls[0][0];
    expect(query.available).toBe(true);
    expect(query.capacity.$gte).toBe(10);
    expect(query.year.$gte).toBe(2020);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('assigns driver to truck and handles metrics errors', async () => {
    const truck = { ownerId: { toString: () => 'u1' }, save: jest.fn() };
    Truck.findById.mockResolvedValue(truck);
    User.findById.mockResolvedValue({ role: 'Driver', ownerId: { toString: () => 'u1' } });
    metricScheduler.updateTruckStatusMetrics.mockRejectedValue(new Error('metrics'));
    const res = makeRes();

    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(truck.driverId).toBe('d1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects driver assignment when truck missing or unauthorized', async () => {
    Truck.findById.mockResolvedValueOnce(null);
    const nextMissing = jest.fn();
    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      makeRes(),
      nextMissing
    );
    expect(nextMissing).toHaveBeenCalled();

    Truck.findById.mockResolvedValueOnce({ ownerId: { toString: () => 'other' } });
    const nextForbidden = jest.fn();
    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      makeRes(),
      nextForbidden
    );
    expect(nextForbidden).toHaveBeenCalled();
  });

  it('rejects driver assignment when driver missing or invalid', async () => {
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });
    User.findById.mockResolvedValueOnce(null);
    const nextMissing = jest.fn();

    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      makeRes(),
      nextMissing
    );
    expect(nextMissing).toHaveBeenCalled();

    User.findById.mockResolvedValueOnce({ role: 'Driver', ownerId: { toString: () => 'other' } });
    const nextForbidden = jest.fn();
    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      makeRes(),
      nextForbidden
    );
    expect(nextForbidden).toHaveBeenCalled();

    User.findById.mockResolvedValueOnce({ role: 'Merchant', ownerId: { toString: () => 'u1' } });
    const nextRole = jest.fn();
    await controller.assignDriver(
      { params: { truckId: 't1', driverId: 'd1' }, user: { id: 'u1' } },
      makeRes(),
      nextRole
    );
    expect(nextRole).toHaveBeenCalled();
  });
});
