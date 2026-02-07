const flushPromises = () => new Promise(setImmediate);

const loadApp = async (supported) => {
  jest.resetModules();
  const logger = { info: jest.fn(), warn: jest.fn() };
  jest.doMock('../../src/utils/logger', () => logger);
  jest.doMock('../../src/utils/db', () => ({
    supportsTransactions: jest.fn().mockResolvedValue(supported),
  }));

  require('../../src/app');
  await flushPromises();
  return logger;
};

describe('app startup', () => {
  it('logs when transactions are supported', async () => {
    const logger = await loadApp(true);

    expect(logger.info).toHaveBeenCalled();
  });

  it('logs when transactions are not supported', async () => {
    const logger = await loadApp(false);

    expect(logger.warn).toHaveBeenCalled();
  });
});
