jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { protect, restrictTo, authorizeRoles } = require('../../src/middleware/authMiddleware');

describe('authMiddleware', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('protect', () => {
    it('rejects requests without a token', async () => {
      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
    });

    it('rejects invalid tokens', async () => {
      jwt.verify.mockImplementation(() => {
        const err = new Error('invalid');
        err.name = 'JsonWebTokenError';
        throw err;
      });

      const req = {
        headers: { authorization: 'Bearer badtoken' },
      };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/Invalid token/i);
    });

    it('rejects expired tokens', async () => {
      jwt.verify.mockImplementation(() => {
        const err = new Error('expired');
        err.name = 'TokenExpiredError';
        throw err;
      });

      const req = {
        headers: { authorization: 'Bearer expiredtoken' },
      };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/expired/i);
    });

    it('rejects tokens for missing users', async () => {
      jwt.verify.mockReturnValue({ id: 'user-id' });
      User.findById.mockResolvedValue(null);

      const req = {
        headers: { authorization: 'Bearer validtoken' },
      };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toMatch(/no longer exists/i);
    });

    it('attaches user to request when token is valid', async () => {
      const user = { id: 'user-id', role: 'Merchant' };
      jwt.verify.mockReturnValue({ id: 'user-id' });
      User.findById.mockResolvedValue(user);

      const req = {
        headers: { authorization: 'Bearer validtoken' },
      };
      const res = {};
      const next = jest.fn();

      await protect(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('restrictTo', () => {
    it('allows access for matching roles', () => {
      const middleware = restrictTo('Admin', 'Merchant');
      const req = { user: { role: 'Merchant' } };
      const next = jest.fn();

      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('blocks access for non-matching roles', () => {
      const middleware = restrictTo('Admin');
      const req = { user: { role: 'Merchant' } };
      const next = jest.fn();

      middleware(req, {}, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  describe('authorizeRoles', () => {
    it('supports array input', () => {
      const middleware = authorizeRoles(['Driver']);
      const req = { user: { role: 'Driver' } };
      const next = jest.fn();

      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
