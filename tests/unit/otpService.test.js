jest.mock('../../src/utils/sendWhatsApp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const { sendWhatsAppMessage } = require('../../src/utils/sendWhatsApp');
const otpService = require('../../src/services/auth/otpService');

describe('otpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    delete process.env.OTP_SECRET;
    process.env.NODE_ENV = 'test';
  });

  it('generates OTP of configured length', () => {
    const code = otpService.generateOtp();
    expect(code).toHaveLength(otpService.getCodeLength());
  });

  it('hashes and verifies OTP', () => {
    const code = '123456';
    const hash = otpService.hashOtp(code);
    expect(otpService.verifyOtp(code, hash)).toBe(true);
    expect(otpService.verifyOtp('000000', hash)).toBe(false);
  });

  it('returns false for missing or invalid hash', () => {
    expect(otpService.verifyOtp('123456')).toBe(false);
    expect(otpService.verifyOtp('123456', 'short')).toBe(false);
  });

  it('checks resend interval and attempts remaining', () => {
    expect(otpService.canSendNewOtp(null)).toBe(true);
    expect(otpService.hasAttemptsRemaining({ attemptCount: 0 })).toBe(true);
  });

  it('delivers OTP via WhatsApp', async () => {
    sendWhatsAppMessage.mockResolvedValue({ sid: 'SM1' });

    const result = await otpService.deliverOtp('+15550001111', '123456');

    expect(result.channel).toBe('whatsapp');
    expect(sendWhatsAppMessage).toHaveBeenCalled();
  });

  it('falls back when Twilio config missing', async () => {
    const error = new Error('missing');
    error.code = 'TWILIO_CONFIG_MISSING';
    sendWhatsAppMessage.mockRejectedValue(error);

    const result = await otpService.deliverOtp('+15550001111', '123456');

    expect(result.channel).toBe('log');
  });
});
