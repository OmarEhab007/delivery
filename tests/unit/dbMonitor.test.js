jest.mock('../../src/utils/metrics', () => ({
  startDbTimer: jest.fn(() => jest.fn()),
}));

jest.mock('../../src/utils/tracer', () => ({
  createChildSpan: jest.fn(() => ({
    addAttribute: jest.fn(),
    end: jest.fn(),
  })),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  performance: jest.fn(),
  error: jest.fn(),
}));

jest.mock('mongoose', () => ({
  models: {},
  model: jest.fn(),
  connection: { db: {} },
}));

const mongoose = require('mongoose');
const metrics = require('../../src/utils/metrics');
const tracer = require('../../src/utils/tracer');
const logger = require('../../src/utils/logger');
const dbMonitor = require('../../src/utils/dbMonitor');

describe('dbMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    metrics.startDbTimer.mockImplementation(() => jest.fn());
    tracer.createChildSpan.mockImplementation(() => ({
      addAttribute: jest.fn(),
      end: jest.fn(),
    }));
  });

  it('wraps find and findOne with monitoring and logs slow queries', async () => {
    const execFind = jest.fn().mockResolvedValue([{ id: 1 }]);
    const execFindOne = jest.fn().mockResolvedValue({ id: 1 });
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(() => ({ exec: execFind })),
      findOne: jest.fn(() => ({ exec: execFindOne })),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn(),
    };

    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(10);

    const wrapped = dbMonitor.wrapModel(model);

    await wrapped.find({ status: 'IN_TRANSIT' }).exec();
    await wrapped.findOne({ status: 'IN_TRANSIT' }).exec();

    expect(metrics.startDbTimer).toHaveBeenCalled();
    expect(tracer.createChildSpan).toHaveBeenCalled();
    expect(logger.performance).toHaveBeenCalled();

    Date.now.mockRestore();
  });

  it('wraps create and logs slow creates', async () => {
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn(),
    };

    jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(300);

    const wrapped = dbMonitor.wrapModel(model);
    await wrapped.create({});

    expect(logger.performance).toHaveBeenCalled();

    Date.now.mockRestore();
  });

  it('wraps aggregate and always logs performance', async () => {
    const execAggregate = jest.fn().mockResolvedValue([{ id: 1 }]);
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: execAggregate })),
      countDocuments: jest.fn(),
    };

    const wrapped = dbMonitor.wrapModel(model);
    await wrapped.aggregate([{ $match: { status: 'IN_TRANSIT' } }]).exec();

    expect(logger.performance).toHaveBeenCalled();
  });

  it('propagates errors from exec and ends spans', async () => {
    const execFind = jest.fn().mockRejectedValue(new Error('boom'));
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(() => ({ exec: execFind })),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn(),
    };

    const wrapped = dbMonitor.wrapModel(model);

    await expect(wrapped.find({}).exec()).rejects.toThrow('boom');

    const span = tracer.createChildSpan.mock.results[0].value;
    expect(span.end).toHaveBeenCalledWith(expect.any(Error));
  });

  it('propagates errors when original find throws', () => {
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(() => {
        throw new Error('find fail');
      }),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn(),
    };

    const wrapped = dbMonitor.wrapModel(model);

    expect(() => wrapped.find({})).toThrow('find fail');

    const span = tracer.createChildSpan.mock.results[0].value;
    expect(span.end).toHaveBeenCalledWith(expect.any(Error));
  });

  it('propagates errors from create and ends spans', async () => {
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockRejectedValue(new Error('create fail')),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue([]) })),
      countDocuments: jest.fn(),
    };

    const wrapped = dbMonitor.wrapModel(model);

    await expect(wrapped.create({})).rejects.toThrow('create fail');

    const span = tracer.createChildSpan.mock.results[0].value;
    expect(span.end).toHaveBeenCalledWith(expect.any(Error));
  });

  it('propagates errors from aggregate exec and ends spans', async () => {
    const execAggregate = jest.fn().mockRejectedValue(new Error('agg fail'));
    const model = {
      collection: { name: 'shipments' },
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(() => ({ exec: execAggregate })),
      countDocuments: jest.fn(),
    };

    const wrapped = dbMonitor.wrapModel(model);

    await expect(wrapped.aggregate([]).exec()).rejects.toThrow('agg fail');

    const span = tracer.createChildSpan.mock.results[0].value;
    expect(span.end).toHaveBeenCalledWith(expect.any(Error));
  });

  it('initializes db monitoring and wraps new models', () => {
    const modelA = { collection: { name: 'A' }, find: jest.fn(), findOne: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), updateOne: jest.fn(), updateMany: jest.fn(), deleteOne: jest.fn(), deleteMany: jest.fn(), aggregate: jest.fn(() => ({ exec: jest.fn() })), countDocuments: jest.fn() };
    const modelB = { collection: { name: 'B' }, find: jest.fn(), findOne: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), updateOne: jest.fn(), updateMany: jest.fn(), deleteOne: jest.fn(), deleteMany: jest.fn(), aggregate: jest.fn(() => ({ exec: jest.fn() })), countDocuments: jest.fn() };
    mongoose.models = { A: modelA, B: modelB };

    const originalModel = jest.fn(() => modelA);
    mongoose.model = originalModel;
    const originalFind = modelA.find;

    dbMonitor.initDbMonitoring();

    expect(logger.info).toHaveBeenCalled();
    expect(mongoose.models.A.find).not.toBe(originalFind);

    const wrappedNew = mongoose.model('C', {});
    expect(originalModel).toHaveBeenCalled();
    expect(wrappedNew.find).not.toBe(originalFind);
  });

  it('collects mongo db stats and handles errors', async () => {
    mongoose.connection.db = {
      stats: jest.fn().mockResolvedValue({
        collections: 1,
        objects: 2,
        dataSize: 3,
        storageSize: 4,
        indexes: 5,
        indexSize: 6,
      }),
      listCollections: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([{ name: 'shipments' }]) })),
      collection: jest.fn(() => ({ stats: jest.fn().mockResolvedValue({ count: 1, size: 2, avgObjSize: 3, storageSize: 4, indexSizes: {} }) })),
      admin: jest.fn(() => ({ serverStatus: jest.fn().mockResolvedValue({ connections: { active: 1, available: 2 } }) })),
    };

    const result = await dbMonitor.collectMongoDBStats();

    expect(result).toHaveProperty('collections', 1);
    expect(result).toHaveProperty('collectionStats.shipments');

    mongoose.connection.db.stats.mockRejectedValue(new Error('fail'));
    const errorResult = await dbMonitor.collectMongoDBStats();
    expect(errorResult).toHaveProperty('error', 'fail');
  });
});
