jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
}));

const logger = require('../../src/utils/logger');
const {
  cacheControl,
  noCache,
  staticCache,
  CACHE_DURATIONS,
} = require('../../src/middleware/cacheControlMiddleware');

const makeRes = () => {
  const res = {};
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('cacheControlMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CACHE_DEBUG;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.CACHE_DEBUG;
  });

  it('sets cache control header for named duration', () => {
    const req = { originalUrl: '/test' };
    const res = makeRes();
    const next = jest.fn();

    cacheControl('short')(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      `public, max-age=${CACHE_DURATIONS.short}`
    );
    expect(next).toHaveBeenCalled();
  });

  it('sets cache control header with must-revalidate', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    cacheControl(120, false, true)(req, res, next);

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, max-age=120, must-revalidate');
  });

  it('logs cache control when debug is enabled', () => {
    process.env.CACHE_DEBUG = 'true';
    const req = { originalUrl: '/debug' };
    const res = makeRes();
    const next = jest.fn();

    cacheControl('medium')(req, res, next);

    expect(logger.debug).toHaveBeenCalled();
  });

  it('sets no-cache headers', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    noCache()(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(res.set).toHaveBeenCalledWith('Expires', '0');
  });

  it('sets static cache headers', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    staticCache()(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      `public, max-age=${CACHE_DURATIONS.static}`
    );
  });
});
