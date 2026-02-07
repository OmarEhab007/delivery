jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
}));

const originalEnv = { ...process.env };

const loadSecurityHeaders = (env = {}) => {
  jest.resetModules();
  Object.assign(process.env, env);
  return require('../../src/middleware/securityHeaders');
};

const makeRes = () => {
  const res = {};
  res.setHeader = jest.fn();
  res.getHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  return res;
};

describe('securityHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('removes null CSP directives in production', () => {
    const { configureSecurityHeaders } = loadSecurityHeaders({ NODE_ENV: 'production' });
    const helmetMock = require('helmet');

    const cspDirectives = { defaultSrc: ["'self'"], upgradeInsecureRequests: null };
    configureSecurityHeaders({ cspDirectives });

    const helmetConfig = helmetMock.mock.calls[0][0];
    expect(helmetConfig.contentSecurityPolicy.directives.upgradeInsecureRequests).toBeUndefined();
  });

  it('adds CSP report-only header when configured', () => {
    const { configureSecurityHeaders } = loadSecurityHeaders({
      NODE_ENV: 'development',
      CSP_REPORT_URI: 'https://csp.example/report',
    });
    const middlewares = configureSecurityHeaders({ logHeaders: false });
    const reportMiddleware = middlewares[1];

    const req = { path: '/api/test' };
    const res = makeRes();
    const next = jest.fn();

    reportMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy-Report-Only',
      'report-uri https://csp.example/report'
    );
    expect(next).toHaveBeenCalled();
  });

  it('skips CSP report header for static assets', () => {
    const { configureSecurityHeaders } = loadSecurityHeaders({
      NODE_ENV: 'development',
      CSP_REPORT_URI: 'https://csp.example/report',
    });
    const middlewares = configureSecurityHeaders({ logHeaders: false });
    const reportMiddleware = middlewares[1];

    const req = { path: '/assets/app.js' };
    const res = makeRes();
    const next = jest.fn();

    reportMiddleware(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('logs security headers in development when enabled', () => {
    const { configureSecurityHeaders } = loadSecurityHeaders({
      NODE_ENV: 'development',
    });
    const loggerMock = require('../../src/utils/logger');
    const middlewares = configureSecurityHeaders({ logHeaders: true });
    const loggingMiddleware = middlewares[2];

    const req = { originalUrl: '/api/test' };
    const res = makeRes();
    res.getHeader.mockReturnValue('value');
    const next = jest.fn();

    loggingMiddleware(req, res, next);
    res.end();

    expect(loggerMock.debug).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('handles CSP reports', () => {
    const { handleCSPReports } = loadSecurityHeaders({ NODE_ENV: 'development' });
    const loggerMock = require('../../src/utils/logger');
    const handler = handleCSPReports();
    const req = {
      body: { 'csp-report': { 'document-uri': 'doc', 'blocked-uri': 'block' } },
      headers: { 'user-agent': 'jest' },
    };
    const res = makeRes();

    handler(req, res);

    expect(loggerMock.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
