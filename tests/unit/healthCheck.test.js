let mockExec;
let mockExistsSync;
let mockReaddirSync;
let mockStatSync;
let mockStatfsSync;

const mockMongoose = {
  connection: {
    readyState: 1,
    host: 'localhost',
    name: 'delivery-test',
    db: {
      stats: jest.fn(),
      admin: jest.fn(),
      command: jest.fn(),
      listCollections: jest.fn(),
      collection: jest.fn(),
    },
  },
};

const mockConnectDB = jest.fn();
mockConnectDB.checkMissingIndexes = jest.fn();

jest.mock('child_process', () => ({
  exec: (...args) => mockExec(...args),
}));

jest.mock('fs', () => ({
  existsSync: (...args) => mockExistsSync(...args),
  readdirSync: (...args) => mockReaddirSync(...args),
  statSync: (...args) => mockStatSync(...args),
  statfsSync: (...args) => mockStatfsSync(...args),
}));

jest.mock('os', () => ({
  totalmem: jest.fn(),
  freemem: jest.fn(),
  cpus: jest.fn(),
  loadavg: jest.fn(),
  platform: jest.fn(),
  arch: jest.fn(),
  release: jest.fn(),
  uptime: jest.fn(),
}));

jest.mock('mongoose', () => mockMongoose);

jest.mock('../../src/config/database', () => mockConnectDB);

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const os = require('os');
const { promisify } = require('util');

const loadHealthCheck = () => require('../../src/utils/healthCheck');

describe('healthCheck', () => {
  beforeEach(() => {
    mockExec = jest.fn();
    mockExistsSync = jest.fn();
    mockReaddirSync = jest.fn();
    mockStatSync = jest.fn();
    mockStatfsSync = jest.fn();
    const childProcess = require('child_process');
    childProcess.exec[promisify.custom] = (...args) =>
      new Promise((resolve, reject) => {
        mockExec(...args, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

    jest.clearAllMocks();

    mockMongoose.connection.readyState = 1;
    mockMongoose.connection.db.stats.mockResolvedValue({
      collections: 1,
      objects: 2,
      dataSize: 1024,
      storageSize: 2048,
      indexes: 1,
      indexSize: 512,
    });

    mockMongoose.connection.db.admin.mockReturnValue({
      serverStatus: jest.fn().mockResolvedValue({
        connections: { active: 1, available: 2 },
      }),
      command: jest.fn().mockResolvedValue({ inprog: [] }),
    });

    mockMongoose.connection.db.command.mockResolvedValue({ inprog: [] });

    mockConnectDB.mockResolvedValue();
    mockConnectDB.checkMissingIndexes.mockResolvedValue({ missing: [] });

    os.totalmem.mockReturnValue(100);
    os.freemem.mockReturnValue(5);
    os.cpus.mockReturnValue([{ model: 'TestCPU' }, { model: 'TestCPU' }]);
    os.loadavg.mockReturnValue([4, 0, 0]);
    os.platform.mockReturnValue('darwin');
    os.arch.mockReturnValue('x64');
    os.release.mockReturnValue('test');
    os.uptime.mockReturnValue(3600);
  });

  it('checks database connection and returns healthy status', async () => {
    const { checkDatabaseConnection } = loadHealthCheck();

    const result = await checkDatabaseConnection();

    expect(result.status).toBe('healthy');
    expect(mockConnectDB).not.toHaveBeenCalled();
  });

  it('attempts to connect when not connected', async () => {
    mockMongoose.connection.readyState = 0;

    const { checkDatabaseConnection } = loadHealthCheck();

    await checkDatabaseConnection();

    expect(mockConnectDB).toHaveBeenCalled();
  });

  it('returns unhealthy when database check fails', async () => {
    mockMongoose.connection.db.stats.mockRejectedValue(new Error('fail'));

    const { checkDatabaseConnection } = loadHealthCheck();

    const result = await checkDatabaseConnection();

    expect(result.status).toBe('unhealthy');
  });

  it('returns unknown connection state when readyState is out of range', async () => {
    mockMongoose.connection.readyState = 9;

    const { checkDatabaseConnection } = loadHealthCheck();

    const result = await checkDatabaseConnection();

    expect(result.connection.connectionState).toBe('unknown');
    expect(mockConnectDB).toHaveBeenCalled();
  });

  it('returns unknown connection state when database check errors', async () => {
    mockMongoose.connection.readyState = 9;
    mockMongoose.connection.db.stats.mockRejectedValue(new Error('fail'));

    const { checkDatabaseConnection } = loadHealthCheck();

    const result = await checkDatabaseConnection();

    expect(result.status).toBe('unhealthy');
    expect(result.connection.connectionState).toBe('unknown');
  });

  it('checks storage using df output', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('healthy');
  });

  it('normalizes df output with mounted on header', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted on\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.diskSpace).toBeDefined();
    expect(result.status).toBe('healthy');
  });

  it('handles directory size errors', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 10G 90G 10% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockImplementation(() => {
      throw new Error('read failed');
    });

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('healthy');
  });

  it('falls back to statfs when df fails', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(new Error('df failed'));
    });
    mockExistsSync.mockReturnValue(false);
    mockStatfsSync.mockReturnValue({
      blocks: 100,
      bsize: 1,
      bfree: 4,
    });

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('critical');
  });

  it('uses diskSpace.use when use% header is missing', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use Mounted\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('healthy');
    expect(result.diskSpace.use).toBe('80%');
  });

  it('defaults disk usage when no use column exists', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Mounted\n/dev/disk1 100G 80G 20G /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(false);

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('healthy');
    expect(result.diskSpace['use%']).toBeUndefined();
    expect(result.diskSpace.use).toBeUndefined();
  });

  it('handles df output with extra headers but no mounted on pair', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted Extra\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(false);

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.diskSpace.mounted).toBe('/');
  });

  it('returns zero sizes when directory does not exist during size calculation', async () => {
    let callCount = 0;
    mockExistsSync.mockImplementation(() => {
      callCount += 1;
      return callCount <= 2;
    });
    mockReaddirSync.mockReturnValue([]);
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.directories.uploads.size).toBe('0.00 MB');
    expect(result.directories.logs.size).toBe('0.00 MB');
  });

  it('returns error status when storage check throws', async () => {
    mockExistsSync.mockImplementation(() => {
      throw new Error('fs fail');
    });

    const { checkStorage } = loadHealthCheck();

    const result = await checkStorage();

    expect(result.status).toBe('error');
  });

  it('checks system resources and marks critical when thresholds exceeded', () => {
    const { checkSystemResources } = loadHealthCheck();

    const result = checkSystemResources();

    expect(result.status).toBe('critical');
    expect(result.cpu.critical).toBe(true);
    expect(result.memory.critical).toBe(true);
  });

  it('returns healthy system resources when thresholds are ok', () => {
    os.freemem.mockReturnValue(90);
    os.loadavg.mockReturnValue([0.1, 0, 0]);

    const { checkSystemResources } = loadHealthCheck();

    const result = checkSystemResources();

    expect(result.status).toBe('healthy');
    expect(result.cpu.critical).toBe(false);
    expect(result.memory.critical).toBe(false);
  });

  it('returns error when system resource check throws', () => {
    os.totalmem.mockImplementation(() => {
      throw new Error('os fail');
    });

    const { checkSystemResources } = loadHealthCheck();

    const result = checkSystemResources();

    expect(result.status).toBe('error');
  });

  it('skips external API checks when none configured', async () => {
    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([]);

    expect(result.status).toBe('skipped');
  });

  it('skips external API checks when called without endpoints', async () => {
    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis();

    expect(result.status).toBe('skipped');
  });

  it('checks external APIs and reports health', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([
      { name: 'Test', url: 'https://example.com', maxResponseTime: 5000 },
    ]);

    expect(result.status).toBe('healthy');
    expect(result.endpoints.Test.status).toBe('healthy');
  });

  it('uses default maxResponseTime when not provided', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([{ name: 'Default', url: 'https://example.com' }]);

    expect(result.status).toBe('healthy');
    expect(result.endpoints.Default.status).toBe('healthy');
  });

  it('marks external APIs degraded on slow response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(5000);

    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([
      { name: 'Slow', url: 'https://example.com', maxResponseTime: 1000 },
    ]);

    expect(result.status).toBe('degraded');
    expect(result.endpoints.Slow.status).toBe('unhealthy');
    nowSpy.mockRestore();
  });

  it('marks external api status degraded on errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));

    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([
      { name: 'Test', url: 'https://example.com', maxResponseTime: 5000 },
    ]);

    expect(result.status).toBe('degraded');
    expect(result.endpoints.Test.status).toBe('error');
  });

  it('marks external api unhealthy when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    const { checkExternalApis } = loadHealthCheck();

    const result = await checkExternalApis([
      { name: 'Down', url: 'https://example.com', maxResponseTime: 5000 },
    ]);

    expect(result.status).toBe('degraded');
    expect(result.endpoints.Down.status).toBe('unhealthy');
  });

  it('runs health checks and marks degraded for unhealthy APIs', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const healthCheck = loadHealthCheck();

    const result = await healthCheck.runHealthChecks({
      includeSystem: false,
      includeStorage: false,
      includeDatabase: false,
      includeApis: true,
      apiEndpoints: [{ name: 'Down', url: 'https://example.com' }],
    });

    expect(result.status).toBe('degraded');
    expect(result.checks.externalApis.status).toBe('degraded');
  });

  it('runs health checks and marks error for storage failures', async () => {
    mockExistsSync.mockImplementation(() => {
      throw new Error('fs fail');
    });
    const healthCheck = loadHealthCheck();

    const result = await healthCheck.runHealthChecks({
      includeSystem: false,
      includeStorage: true,
      includeDatabase: false,
      includeApis: false,
    });

    expect(result.status).toBe('error');
    expect(result.checks.storage.status).toBe('error');
  });

  it('returns error status when database is unhealthy', async () => {
    mockMongoose.connection.db.stats.mockRejectedValue(new Error('db down'));
    const healthCheck = loadHealthCheck();

    const result = await healthCheck.runHealthChecks({
      includeSystem: false,
      includeStorage: false,
      includeDatabase: true,
      includeApis: false,
    });

    expect(result.status).toBe('error');
    expect(result.checks.database.status).toBe('unhealthy');
  });

  it('runs health checks and aggregates status', async () => {
    const healthCheck = loadHealthCheck();
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 80G 20G 80% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);

    const result = await healthCheck.runHealthChecks({
      includeSystem: true,
      includeStorage: true,
      includeDatabase: true,
      includeApis: false,
    });

    expect(result.status).toBe('critical');
    expect(result.checks.system.status).toBe('critical');
  });

  it('runs health checks with default options', async () => {
    const healthCheck = loadHealthCheck();
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 10G 90G 10% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(false);

    const result = await healthCheck.runHealthChecks();

    expect(result.checks.system).toBeDefined();
    expect(result.checks.storage).toBeDefined();
    expect(result.checks.database).toBeDefined();
  });

  it('sets overall status to error when system check errors', async () => {
    const originalTotalMem = os.totalmem;
    os.totalmem = jest.fn(() => {
      throw new Error('os fail');
    });

    const healthCheck = loadHealthCheck();
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 10G 90G 10% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(false);

    const result = await healthCheck.runHealthChecks({
      includeStorage: false,
      includeDatabase: false,
      includeApis: false,
    });

    expect(result.status).toBe('error');

    os.totalmem = originalTotalMem;
  });

  it('sets overall status to critical when storage is critical', async () => {
    const healthCheck = loadHealthCheck();
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        null,
        'Filesystem Size Used Avail Use% Mounted\n/dev/disk1 100G 96G 4G 96% /',
        ''
      );
    });
    mockExistsSync.mockReturnValue(false);

    const result = await healthCheck.runHealthChecks({
      includeSystem: false,
      includeDatabase: false,
      includeApis: false,
    });

    expect(result.status).toBe('critical');
    expect(result.checks.storage.status).toBe('critical');
  });
});
