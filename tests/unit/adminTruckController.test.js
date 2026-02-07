jest.mock('../../src/models/Truck', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
}));

const Truck = require('../../src/models/Truck');
const User = require('../../src/models/User');
const controller = require('../../src/controllers/admin/adminTruckController');

const flushPromises = () => new Promise(setImmediate);

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

describe('adminTruckController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when truck not found', async () => {
    Truck.findById.mockReturnValue(makeQuery(null));

    const next = jest.fn();
    await controller.getTruckById({ params: { id: 't1' } }, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('gets all trucks with filters', async () => {
    Truck.find.mockReturnValue(makeQuery([{ id: 't1' }]));
    Truck.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getAllTrucks(
      { query: { status: 'AVAILABLE', ownerId: 'o1', driverId: 'd1', truckType: 'FLATBED', licensePlate: 'ABC' } },
      res,
      jest.fn()
    );

    expect(Truck.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'AVAILABLE',
        ownerId: 'o1',
        driverId: 'd1',
        truckType: 'FLATBED',
        licensePlate: expect.any(Object),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns truck by id', async () => {
    Truck.findById.mockReturnValue(makeQuery({ _id: 't1' }));
    const res = makeRes();

    await controller.getTruckById({ params: { id: 't1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks update when duplicate plate exists', async () => {
    Truck.findById.mockResolvedValue({ plateNumber: 'OLD', save: jest.fn() });
    Truck.findOne.mockResolvedValue({ _id: 'other' });

    const next = jest.fn();
    controller.updateTruck(
      { params: { id: 't1' }, body: { plateNumber: 'NEW' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('blocks update with invalid owner id', async () => {
    Truck.findById.mockResolvedValue({ plateNumber: 'OLD', save: jest.fn() });
    Truck.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValue(null);

    const next = jest.fn();
    controller.updateTruck(
      { params: { id: 't1' }, body: { ownerId: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('blocks update with invalid driver id', async () => {
    Truck.findById.mockResolvedValue({ plateNumber: 'OLD', save: jest.fn() });
    Truck.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValueOnce({ _id: 'o1', role: 'TruckOwner' });
    User.findOne.mockResolvedValueOnce(null);

    const next = jest.fn();
    controller.updateTruck(
      { params: { id: 't1' }, body: { ownerId: 'o1', driverId: 'd1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('updates truck fields with valid owner and driver', async () => {
    const truck = { plateNumber: 'OLD', save: jest.fn() };
    Truck.findById.mockResolvedValue(truck);
    Truck.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValueOnce({ _id: 'o1', role: 'TruckOwner' });
    User.findOne.mockResolvedValueOnce({ _id: 'd1', role: 'Driver' });
    const res = makeRes();

    await controller.updateTruck(
      { params: { id: 't1' }, body: { licensePlate: 'NEW', truckType: 'VAN', capacity: 10, status: 'AVAILABLE', ownerId: 'o1', driverId: 'd1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.plateNumber).toBe('NEW');
    expect(truck.truckType).toBe('VAN');
    expect(truck.capacity).toBe(10);
    expect(truck.status).toBe('AVAILABLE');
    expect(truck.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes truck', async () => {
    const truck = { deleteOne: jest.fn() };
    Truck.findById.mockResolvedValue(truck);
    const res = makeRes();

    await controller.deleteTruck({ params: { id: 't1' } }, res, jest.fn());

    expect(truck.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blocks create when plate number exists', async () => {
    Truck.findOne.mockResolvedValue({ _id: 't1' });

    const next = jest.fn();
    controller.createTruck(
      { body: { plateNumber: 'DUP', ownerId: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('blocks create when owner is invalid', async () => {
    Truck.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValue(null);

    const next = jest.fn();
    controller.createTruck(
      { body: { plateNumber: 'NEW', ownerId: 'o1' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('creates truck when owner and driver are valid', async () => {
    Truck.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValueOnce({ _id: 'o1', role: 'TruckOwner' });
    User.findOne.mockResolvedValueOnce({ _id: 'd1', role: 'Driver' });
    Truck.create.mockResolvedValue({ _id: 't1' });
    const res = makeRes();

    await controller.createTruck(
      { body: { plateNumber: 'NEW', ownerId: 'o1', driverId: 'd1', truckType: 'VAN', capacity: 10 } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('changes truck status with validation', async () => {
    const next = jest.fn();
    await controller.changeTruckStatus({ body: {}, params: { id: 't1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    const nextInvalid = jest.fn();
    await controller.changeTruckStatus({ body: { status: 'BAD' }, params: { id: 't1' } }, makeRes(), nextInvalid);
    expect(nextInvalid).toHaveBeenCalled();

    Truck.findById.mockResolvedValue({ save: jest.fn() });
    const res = makeRes();
    await controller.changeTruckStatus({ body: { status: 'AVAILABLE' }, params: { id: 't1' } }, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
