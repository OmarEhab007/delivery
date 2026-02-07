jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const logger = require('../../src/utils/logger');
const {
  handleCSRFError,
  generateCSRFToken,
  addCSRFHeaders,
} = require('../../src/middleware/csrfProtection');

const makeRes = () => {
  const res = {};
  res.locals = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('csrfProtection middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes non-CSRF errors to next', () => {
    const err = new Error('boom');
    const next = jest.fn();

    handleCSRFError(err, {}, makeRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('handles CSRF token errors with 403 response', () => {
    const err = new Error('bad token');
    err.code = 'EBADCSRFTOKEN';

    const req = {
      originalUrl: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
      requestId: 'req-1',
      user: { id: 'u1' },
    };
    const res = makeRes();

    handleCSRFError(err, req, res, jest.fn());

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired CSRF token. Please refresh the page and try again.',
    });
  });

  it('generates CSRF token and sets locals and header', () => {
    const req = {
      csrfToken: jest.fn(() => 'token-123'),
    };
    const res = makeRes();
    const next = jest.fn();

    generateCSRFToken(req, res, next);

    expect(req.csrfToken).toHaveBeenCalledTimes(2);
    expect(res.locals.csrfToken).toBe('token-123');
    expect(res.set).toHaveBeenCalledWith('X-CSRF-Token', 'token-123');
    expect(next).toHaveBeenCalled();
  });

  it('adds CSRF-related headers', () => {
    const res = makeRes();
    const next = jest.fn();

    addCSRFHeaders({}, res, next);

    expect(res.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.set).toHaveBeenCalledWith('Referrer-Policy', 'same-origin');
    expect(next).toHaveBeenCalled();
  });
});
