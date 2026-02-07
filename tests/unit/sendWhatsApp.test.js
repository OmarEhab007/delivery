jest.mock('twilio', () => jest.fn());
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const baseEnv = {
  TWILIO_ACCOUNT_SID: 'sid-123',
  TWILIO_AUTH_TOKEN: 'token-123',
  TWILIO_WHATSAPP_NUMBER: '+15551230000',
};

const setEnv = (overrides = {}) => {
  Object.assign(process.env, baseEnv, overrides);
};

const clearEnv = () => {
  for (const key of Object.keys(baseEnv)) {
    delete process.env[key];
  }
  delete process.env.TWILIO_WHATSAPP_DISABLED;
};

const setupModule = () => {
  jest.resetModules();
  const twilio = require('twilio');
  const module = require('../../src/utils/sendWhatsApp');
  return { twilio, ...module };
};

describe('sendWhatsApp utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEnv();
  });

  afterEach(() => {
    clearEnv();
  });

  it('sends a message with filtered media urls', async () => {
    setEnv();
    const { twilio, sendWhatsAppMessage } = setupModule();
    const mockCreate = jest.fn().mockResolvedValue({ sid: 'SM123' });
    twilio.mockReturnValue({ messages: { create: mockCreate } });

    const result = await sendWhatsAppMessage('15550001111', 'Hello', [
      'https://example.com/a.png',
      '   ',
      null,
    ]);

    expect(mockCreate).toHaveBeenCalledWith({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: 'whatsapp:15550001111',
      body: 'Hello',
      mediaUrl: ['https://example.com/a.png'],
    });
    expect(result.sid).toBe('SM123');
  });

  it('throws when messaging is disabled', async () => {
    setEnv({ TWILIO_WHATSAPP_DISABLED: 'true' });
    const { sendWhatsAppMessage } = setupModule();

    await expect(sendWhatsAppMessage('15550001111', 'Hello')).rejects.toHaveProperty(
      'code',
      'TWILIO_DISABLED'
    );
  });

  it('throws when credentials are missing', async () => {
    setEnv({ TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '' });
    const { sendWhatsAppMessage } = setupModule();

    await expect(sendWhatsAppMessage('15550001111', 'Hello')).rejects.toHaveProperty(
      'code',
      'TWILIO_CONFIG_MISSING'
    );
  });

  it('throws on invalid media url input', async () => {
    setEnv();
    const { twilio, sendWhatsAppMessage } = setupModule();
    const mockCreate = jest.fn().mockResolvedValue({ sid: 'SM999' });
    twilio.mockReturnValue({ messages: { create: mockCreate } });

    await expect(sendWhatsAppMessage('15550001111', 'Hello', 'bad')).rejects.toThrow(
      'mediaUrls must be an array'
    );
  });

  it('sends a template message', async () => {
    setEnv();
    const { twilio, sendTemplateMessage } = setupModule();
    const mockCreate = jest.fn().mockResolvedValue({ sid: 'SMT1' });
    twilio.mockReturnValue({ messages: { create: mockCreate } });

    const result = await sendTemplateMessage('15550001111', 'template-name', [
      { key: 'name', value: 'Test' },
    ]);

    expect(mockCreate).toHaveBeenCalledWith({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: 'whatsapp:15550001111',
      body: 'template-name',
      contentSid: 'template-name',
      contentVariables: JSON.stringify([{ key: 'name', value: 'Test' }]),
    });
    expect(result.sid).toBe('SMT1');
  });

  it('throws when template name is missing', async () => {
    setEnv();
    const { twilio, sendTemplateMessage } = setupModule();
    const mockCreate = jest.fn().mockResolvedValue({ sid: 'SMT1' });
    twilio.mockReturnValue({ messages: { create: mockCreate } });

    await expect(sendTemplateMessage('15550001111')).rejects.toThrow(
      'Template name is required'
    );
  });
});
