jest.mock('mongoose', () => ({
  set: jest.fn(),
  connect: jest.fn(),
  connection: {
    host: 'localhost',
    name: 'test',
    replica: null,
    collections: {},
    on: jest.fn(),
    client: {
      topology: {
        s: {
          pool: {
            totalConnectionCount: 4,
            availableConnectionCount: 2,
          },
        },
      },
    },
    close: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  database: jest.fn(),
}));

jest.mock('../../src/utils/metrics', () => ({
  updateMongoConnectionMetrics: jest.fn(),
}));

const mongoose = require('mongoose');
const connectDB = require('../../src/config/database');
const metrics = require('../../src/utils/metrics');

const { checkMissingIndexes } = connectDB;

describe('database config (unit)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('checks missing indexes for existing collections', async () => {
    mongoose.connection.collections = {
      users: {
        indexes: jest.fn().mockResolvedValue([{ name: 'email_1' }]),
      },
    };

    const result = await checkMissingIndexes();

    expect(result.users.indexCount).toBe(1);
    expect(result.users.indexes).toContain('email_1');
  });

  it('handles errors while checking indexes', async () => {
    mongoose.connection.collections = {
      users: {
        indexes: jest.fn().mockRejectedValue(new Error('boom')),
      },
    };

    const result = await checkMissingIndexes();

    expect(result.error).toBe('boom');
  });

  it('connects with replica set when transactions enabled', async () => {
    process.env.NODE_ENV = 'development';
    process.env.USE_MONGODB_TRANSACTIONS = 'true';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    mongoose.connection.collections = {
      users: {
        indexes: jest.fn().mockResolvedValue([{ name: 'email_1' }]),
      },
    };

    const connectResult = {
      connection: mongoose.connection,
    };

    mongoose.connect.mockResolvedValue(connectResult);

    const setIntervalSpy = jest.spyOn(global, 'setInterval').mockReturnValue(123);

    const conn = await connectDB();

    expect(conn).toBe(connectResult);
    expect(mongoose.connect).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
  });

  it('connects without index checks in test environment', async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    const connectResult = {
      connection: mongoose.connection,
    };

    mongoose.connect.mockResolvedValue(connectResult);

    const conn = await connectDB();

    expect(conn).toBe(connectResult);
    expect(mongoose.connect).toHaveBeenCalled();
  });

  it('enables debug logging in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    mongoose.connect.mockResolvedValue({ connection: mongoose.connection });

    await connectDB();

    expect(mongoose.set).toHaveBeenCalledWith('debug', expect.any(Function));
  });

  it('invokes index checks outside test env', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    const indexesSpy = jest.fn().mockResolvedValue([{ name: 'email_1' }]);
    mongoose.connection.collections = {
      users: {
        indexes: indexesSpy,
      },
    };
    mongoose.connect.mockResolvedValue({ connection: mongoose.connection });

    await connectDB();

    expect(indexesSpy).toHaveBeenCalled();
  });

  it('collects pool metrics when available', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    mongoose.connect.mockResolvedValue({ connection: mongoose.connection });

    const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
      cb();
      return 123;
    });

    await connectDB();

    expect(metrics.updateMongoConnectionMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ total: 4, available: 2, inUse: 2 })
    );

    setIntervalSpy.mockRestore();
  });

  it('handles pool metrics when pool is missing', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';
    const originalPool = mongoose.connection.client.topology.s.pool;
    mongoose.connection.client.topology.s.pool = null;

    mongoose.connect.mockResolvedValue({ connection: mongoose.connection });

    const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
      cb();
      return 123;
    });

    await connectDB();

    expect(metrics.updateMongoConnectionMetrics).not.toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    mongoose.connection.client.topology.s.pool = originalPool;
  });

  it('handles SIGINT shutdown success and error', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    mongoose.connect.mockResolvedValue({ connection: mongoose.connection });

    const handlers = {};
    const onSpy = jest.spyOn(process, 'on').mockImplementation((signal, handler) => {
      handlers[signal] = handler;
      return process;
    });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await connectDB();

    mongoose.connection.close.mockResolvedValueOnce();
    await handlers.SIGINT();
    expect(exitSpy).toHaveBeenCalledWith(0);

    mongoose.connection.close.mockRejectedValueOnce(new Error('close fail'));
    await handlers.SIGINT();
    expect(exitSpy).toHaveBeenCalledWith(1);

    onSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('retries connection and exits after max retries', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27018/test';

    mongoose.connect.mockRejectedValue(new Error('connect fail'));

    const timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      cb();
      return 0;
    });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await connectDB();

    expect(exitSpy).toHaveBeenCalledWith(1);

    timeoutSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
