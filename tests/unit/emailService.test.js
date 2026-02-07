jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const originalEnv = process.env;

const loadEmailService = (envOverrides = {}) => {
  jest.resetModules();
  process.env = { ...originalEnv, ...envOverrides };
  const nodemailer = require('nodemailer');
  const logger = require('../../src/utils/logger');
  const service = require('../../src/services/email/emailService');
  return { service, nodemailer, logger };
};

describe('emailService', () => {
  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('masks email addresses safely', () => {
    const { service } = loadEmailService();
    const { maskEmail } = service;
    expect(maskEmail()).toBe('[no-email]');
    expect(maskEmail('invalid-email')).toBe('[invalid-email]');
    expect(maskEmail('user@example.com')).toBe('u***@example.com');
  });

  it('returns false when credentials are missing', async () => {
    const { service, logger } = loadEmailService({
      EMAIL_USER: '',
      EMAIL_PASS: '',
    });

    const result = await service.verifyConnection();

    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns false when verification fails', async () => {
    const { service, nodemailer, logger } = loadEmailService({
      NODE_ENV: 'production',
      EMAIL_USER: 'user',
      EMAIL_PASS: 'pass',
    });
    nodemailer.createTransport.mockReturnValue({
      verify: jest.fn().mockRejectedValue(new Error('fail')),
    });

    const result = await service.verifyConnection();

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it('logs and skips sending email in development mode', async () => {
    const { service, logger, nodemailer } = loadEmailService({
      NODE_ENV: 'development',
      EMAIL_ENABLED: 'true',
    });

    const result = await service.sendEmail('test@example.com', 'Hello', '<p>Test</p>');

    expect(result.preview).toBe(true);
    expect(logger.info).toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('sends email in production mode', async () => {
    const { service, nodemailer, logger } = loadEmailService({
      NODE_ENV: 'production',
      EMAIL_ENABLED: 'true',
      EMAIL_USER: 'user',
      EMAIL_PASS: 'pass',
    });
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
    });

    const result = await service.sendEmail('test@example.com', 'Hello', '<p>Test</p>');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-1');
    expect(logger.info).toHaveBeenCalled();
  });

  it('throws when sendMail fails', async () => {
    const { service, nodemailer, logger } = loadEmailService({
      NODE_ENV: 'production',
      EMAIL_ENABLED: 'true',
      EMAIL_USER: 'user',
      EMAIL_PASS: 'pass',
    });
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('send fail')),
    });

    await expect(
      service.sendEmail('test@example.com', 'Hello', '<p>Test</p>')
    ).rejects.toThrow('send fail');
    expect(logger.error).toHaveBeenCalled();
  });
});
