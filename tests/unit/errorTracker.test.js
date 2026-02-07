jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../src/utils/metrics', () => ({
  recordError: jest.fn(),
}));

jest.mock('../../src/utils/tracer', () => ({
  getCurrentTraceId: jest.fn(() => 'trace-1'),
  getCurrentSpanId: jest.fn(() => 'span-1'),
}));

const logger = require('../../src/utils/logger');
const metrics = require('../../src/utils/metrics');
const tracer = require('../../src/utils/tracer');
const { trackError, errorHandlerMiddleware, getErrorStats } = require('../../src/utils/errorTracker');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks new errors and records metrics', () => {
    const error = new Error('boom');
    const req = {
      method: 'GET',
      url: '/api/test',
      headers: { authorization: 'secret' },
      ip: '127.0.0.1',
      body: { password: 'secret' },
      query: { q: '1' },
      params: { id: '1' },
      user: { id: 'u1', role: 'Admin' },
      route: { path: '/api/test' },
    };

    const result = trackError(error, { req, context: 'http', userId: 'u1' });

    expect(result.isNewError).toBe(true);
    expect(metrics.recordError).toHaveBeenCalledWith('http', '/api/test');
    expect(tracer.getCurrentTraceId).toHaveBeenCalled();
  });

  it('logs every 10th repeated error', () => {
    const error = new Error('repeat');
    for (let i = 0; i < 10; i += 1) {
      trackError(error, { context: 'application' });
    }

    expect(logger.warn).toHaveBeenCalled();
  });

  it('logs repeated errors at debug level', () => {
    const error = new Error('repeat-2');
    trackError(error, { context: 'application' });
    trackError(error, { context: 'application' });

    expect(logger.debug).toHaveBeenCalled();
  });

  it('handles tracer failures gracefully', () => {
    tracer.getCurrentTraceId.mockImplementationOnce(() => {
      throw new Error('trace fail');
    });

    const error = new Error('trace');
    trackError(error, { context: 'application' });

    expect(logger.warn).toHaveBeenCalled();
  });

  it('handles metrics recording errors', () => {
    metrics.recordError.mockImplementationOnce(() => {
      throw new Error('metrics fail');
    });

    const error = new Error('metrics');
    trackError(error, { context: 'application' });

    expect(logger.warn).toHaveBeenCalled();
  });

  it('handles missing request headers gracefully', () => {
    const error = new Error('no-headers');
    const req = { method: 'GET', url: '/api/no-headers' };

    const result = trackError(error, { req, context: 'http' });

    expect(result.isNewError).toBe(true);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('stores additional data when provided', () => {
    const error = new Error('extra');
    const req = { method: 'POST', url: '/api/extra', headers: {} };

    const result = trackError(error, {
      req,
      context: 'http',
      additionalData: { key: 'value' },
    });

    expect(result.fingerprint).toBeDefined();
  });

  it('sanitizes sensitive headers and body fields', () => {
    tracer.getCurrentTraceId.mockReturnValueOnce(null);
    tracer.getCurrentSpanId.mockReturnValueOnce(null);

    const error = new Error('secure');
    const req = {
      method: 'POST',
      originalUrl: '/api/secure',
      headers: {
        authorization: 'secret',
        cookie: 'cookie',
        'x-auth-token': 'token',
        'x-api-key': 'key',
        'user-agent': 'agent',
      },
      body: {
        password: 'p',
        confirmPassword: 'cp',
        currentPassword: 'cur',
        token: 't',
        refreshToken: 'rt',
        apiKey: 'ak',
        secret: 's',
        safe: 'ok',
      },
      user: { _id: 'u1', role: 'Admin' },
      path: '/api/secure',
    };

    trackError(error, { req, context: 'http' });

    const [, errorInfo] = logger.error.mock.calls[0];
    expect(errorInfo.request.headers.authorization).toBe('[REDACTED]');
    expect(errorInfo.request.headers.cookie).toBe('[REDACTED]');
    expect(errorInfo.request.headers['x-auth-token']).toBe('[REDACTED]');
    expect(errorInfo.request.headers['x-api-key']).toBe('[REDACTED]');
    expect(errorInfo.request.body.password).toBe('[REDACTED]');
    expect(errorInfo.request.body.confirmPassword).toBe('[REDACTED]');
    expect(errorInfo.request.body.currentPassword).toBe('[REDACTED]');
    expect(errorInfo.request.body.token).toBe('[REDACTED]');
    expect(errorInfo.request.body.refreshToken).toBe('[REDACTED]');
    expect(errorInfo.request.body.apiKey).toBe('[REDACTED]');
    expect(errorInfo.request.body.secret).toBe('[REDACTED]');
    expect(errorInfo.request.body.safe).toBe('ok');
    expect(errorInfo.user).toEqual({ id: 'u1', role: 'Admin' });
    expect(errorInfo.traceId).toBeUndefined();
  });

  it('trims occurrences and cleans cache when max size is reached', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const ttl = 60 * 60 * 1000;
    nowSpy.mockImplementation(() => 0);

    for (let i = 0; i < 1000; i += 1) {
      trackError(new Error(`bulk-${i}`), { context: 'bulk' });
    }

    nowSpy.mockImplementation(() => ttl + 1);
    trackError(new Error('bulk-final'), { context: 'bulk' });

    const repeatError = new Error('repeat');
    for (let i = 0; i < 11; i += 1) {
      trackError(repeatError, { context: 'bulk' });
    }

    expect(logger.debug).toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it('handles errors without stack traces', () => {
    const error = { name: 'Error', message: 'plain error' };
    const result = trackError(error, { context: 'app' });

    expect(result.isNewError).toBe(true);
  });

  it('generates error stats', () => {
    const error = new Error('stats');
    trackError(error, { context: 'http' });

    const stats = getErrorStats();

    expect(stats.totalTracked).toBeGreaterThan(0);
    expect(stats.errorsByContext.http).toBeGreaterThan(0);
    expect(stats.recentErrors.length).toBeGreaterThan(0);
  });

  it('error handler sanitizes response in production', () => {
    const handler = errorHandlerMiddleware();
    const err = new Error('internal');
    err.statusCode = 500;
    const req = { user: { id: 'u1' } };
    const res = mockRes();

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    handler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('server error') })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('error handler includes stack in non-production', () => {
    const handler = errorHandlerMiddleware();
    const err = new Error('bad input');
    err.statusCode = 400;
    const req = {};
    const res = mockRes();

    handler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ stack: expect.any(String), name: 'Error' })
    );
  });

  it('error handler includes validation errors in non-production', () => {
    const handler = errorHandlerMiddleware();
    const err = new Error('bad input');
    err.statusCode = 400;
    err.errors = { field: { message: 'missing' } };
    const res = mockRes();

    handler(err, {}, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: err.errors })
    );
  });

  it('error handler maps production messages', () => {
    const handler = errorHandlerMiddleware();
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res404 = mockRes();
    handler({ statusCode: 404, message: 'Missing' }, {}, res404, jest.fn());
    expect(res404.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'The requested resource was not found.' })
    );

    const res401 = mockRes();
    handler({ statusCode: 401, message: 'Auth' }, {}, res401, jest.fn());
    expect(res401.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication required. Please log in.' })
    );

    const res403 = mockRes();
    handler({ statusCode: 403, message: 'Forbidden' }, {}, res403, jest.fn());
    expect(res403.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "You don't have permission to access this resource." })
    );

    const res400Validation = mockRes();
    handler(
      { statusCode: 400, name: 'ValidationError', message: 'Bad input' },
      {},
      res400Validation,
      jest.fn()
    );
    expect(res400Validation.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Bad input' })
    );

    const res400Cast = mockRes();
    handler({ statusCode: 422, name: 'CastError', path: 'id' }, {}, res400Cast, jest.fn());
    expect(res400Cast.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid id provided.' })
    );

    const res400Dup = mockRes();
    handler({ statusCode: 409, code: 11000, keyValue: { email: 'x' } }, {}, res400Dup, jest.fn());
    expect(res400Dup.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'This email already exists.' })
    );

    const res418 = mockRes();
    handler({ statusCode: 418, message: 'teapot' }, {}, res418, jest.fn());
    expect(res418.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An error occurred with your request. Please check your input and try again.',
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('falls back when error handler itself fails', () => {
    const handler = errorHandlerMiddleware();
    let calls = 0;
    const res = {};
    res.status = jest.fn(() => {
      calls += 1;
      if (calls === 1) {
        throw new Error('status fail');
      }
      return res;
    });
    res.json = jest.fn().mockReturnValue(res);

    handler(new Error('boom'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'An unexpected error occurred in error handling' })
    );
  });
});
