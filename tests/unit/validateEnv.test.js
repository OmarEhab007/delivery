jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const validateEnv = require('../../src/utils/validateEnv');
const logger = require('../../src/utils/logger');

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when required env vars are missing', () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.COOKIE_SECRET;

    expect(() => validateEnv()).toThrow(/Missing required environment variables/);
    expect(logger.error).toHaveBeenCalled();
  });

  it('throws when production-only vars are missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'secure-secret';
    process.env.COOKIE_SECRET = 'cookie-secret';

    delete process.env.FRONTEND_URL;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PHONE;

    expect(() => validateEnv()).toThrow(/Missing required environment variables/);
  });

  it('throws when insecure defaults are used in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'your_jwt_secret_key_here';
    process.env.COOKIE_SECRET = 'cookie-secret';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin123456';
    process.env.ADMIN_PHONE = '+12025550123';

    expect(() => validateEnv()).toThrow(/insecure default value/);
  });

  it('passes when all required vars are provided', () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'secure-secret';
    process.env.COOKIE_SECRET = 'cookie-secret';

    expect(() => validateEnv()).not.toThrow();
  });
});
