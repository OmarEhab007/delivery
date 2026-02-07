jest.mock('../../src/models/Broker', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

const Broker = require('../../src/models/Broker');
const controller = require('../../src/controllers/admin/adminBrokerController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  sort: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('adminBrokerController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists brokers with status filter', async () => {
    Broker.find.mockReturnValue(makeQuery([{ id: 'b1' }]));
    const res = makeRes();

    await controller.listBrokers({ query: { status: 'ACTIVE' } }, res, jest.fn());

    expect(Broker.find).toHaveBeenCalledWith({ status: 'ACTIVE' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('creates broker and requires fields', async () => {
    const next = jest.fn();

    await controller.createBroker({ body: { name: 'Broker' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();

    Broker.create.mockResolvedValue({ id: 'b1' });
    const res = makeRes();
    await controller.createBroker(
      { body: { name: 'Broker', licenseNumber: 'LIC' } },
      res,
      jest.fn()
    );

    expect(Broker.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('gets broker by id', async () => {
    Broker.findById.mockResolvedValue({ id: 'b1' });
    const res = makeRes();

    await controller.getBrokerById({ params: { id: 'b1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when broker not found', async () => {
    Broker.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getBrokerById({ params: { id: 'b1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('updates broker fields', async () => {
    const broker = { save: jest.fn() };
    Broker.findById.mockResolvedValue(broker);
    const res = makeRes();

    await controller.updateBroker(
      { params: { id: 'b1' }, body: { name: 'New', status: 'ACTIVE' } },
      res,
      jest.fn()
    );

    expect(broker.name).toBe('New');
    expect(broker.status).toBe('ACTIVE');
    expect(broker.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects update when broker missing', async () => {
    Broker.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateBroker({ params: { id: 'b1' }, body: {} }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('deactivates broker', async () => {
    const broker = { save: jest.fn() };
    Broker.findById.mockResolvedValue(broker);
    const res = makeRes();

    await controller.deactivateBroker({ params: { id: 'b1' } }, res, jest.fn());

    expect(broker.status).toBe('INACTIVE');
    expect(broker.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects deactivate when broker missing', async () => {
    Broker.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.deactivateBroker({ params: { id: 'b1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
