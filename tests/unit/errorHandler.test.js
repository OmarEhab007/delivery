jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

const logger = require('../../src/utils/logger');
const { errorHandler } = require('../../src/middleware/errorHandler');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs server errors at error level', () => {
    const err = new Error('boom');
    err.statusCode = 500;
    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('logs client errors at warn level', () => {
    const err = new Error('bad request');
    err.statusCode = 400;
    const req = { method: 'POST', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(logger.warn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('logs non-error status at info level', () => {
    const err = new Error('info');
    err.statusCode = 200;
    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(logger.info).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles validation errors', () => {
    const err = new Error('validation');
    err.name = 'ValidationError';
    err.errors = {
      fieldA: { message: 'Field A is required' },
      fieldB: { message: 'Field B is invalid' },
    };

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Field A is required, Field B is invalid' })
    );
  });

  it('handles duplicate key errors', () => {
    const err = new Error('duplicate');
    err.code = 11000;
    err.keyValue = { email: 'dup@example.com' };

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Duplicate value entered for email' })
    );
  });

  it('handles cast errors', () => {
    const err = new Error('cast');
    err.name = 'CastError';
    err.path = 'id';
    err.value = 'bad';

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid id: bad' })
    );
  });

  it('handles jwt errors', () => {
    const err = new Error('jwt');
    err.name = 'JsonWebTokenError';

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid token. Please log in again.' })
    );
  });

  it('handles token expiry errors', () => {
    const err = new Error('expired');
    err.name = 'TokenExpiredError';

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Your token has expired. Please log in again.' })
    );
  });

  it('includes stack in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('dev');
    err.statusCode = 500;

    const req = { method: 'GET', url: '/api/test', ip: '127.0.0.1', connection: {} };
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ stack: expect.any(String) })
    );

    process.env.NODE_ENV = originalEnv;
  });
});
