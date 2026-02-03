const crypto = require('crypto');

const logger = require('../../utils/logger');
const { sendWhatsAppMessage } = require('../../utils/sendWhatsApp');

const OTP_CODE_LENGTH = parseInt(process.env.OTP_CODE_LENGTH, 10) || 6;
const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5) * 60 * 1000;
const OTP_RESEND_INTERVAL_MS = (parseInt(process.env.OTP_RESEND_INTERVAL_SECONDS, 10) || 60) * 1000;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

const getSecret = () => {
  if (process.env.OTP_SECRET) {
    return process.env.OTP_SECRET;
  }

  // SEC-012: Require OTP_SECRET in production, no hardcoded fallback
  // OWASP A02:2021 - Cryptographic Failures
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP_SECRET environment variable must be set in production');
  }

  if (process.env.JWT_SECRET) {
    logger.warn('OTP_SECRET is not set. Falling back to JWT_SECRET for OTP hashing.');
    return process.env.JWT_SECRET;
  }

  const fallbackSecret = 'delivery-app-otp-secret';
  logger.warn('OTP_SECRET and JWT_SECRET are not set. Using fallback OTP secret.');
  return fallbackSecret;
};

const generateOtp = () => {
  const max = 10 ** OTP_CODE_LENGTH;
  const code = crypto.randomInt(0, max).toString().padStart(OTP_CODE_LENGTH, '0');

  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`Generated OTP code: ${code}`);
  }

  return code;
};

const hashOtp = (code) => {
  return crypto.createHmac('sha256', getSecret()).update(code).digest('hex');
};

const verifyOtp = (code, hash) => {
  if (!hash) {
    return false;
  }

  const hashedBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = Buffer.from(hashOtp(code), 'hex');

  if (hashedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashedBuffer, candidateBuffer);
};

const canSendNewOtp = (otpState, now = new Date()) => {
  if (!otpState || !otpState.lastSentAt) {
    return true;
  }

  const elapsed = now.getTime() - new Date(otpState.lastSentAt).getTime();
  return elapsed >= OTP_RESEND_INTERVAL_MS;
};

const hasAttemptsRemaining = (otpState) => {
  const attempts = otpState?.attemptCount || 0;
  return attempts < OTP_MAX_ATTEMPTS;
};

const deliverOtp = async (phone, code) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`OTP for ${phone}: ${code}`);
    }

    await sendWhatsAppMessage(phone, `Your Delivery App verification code is ${code}`);
    logger.info(`OTP delivered via WhatsApp to ${phone}`);
    return { channel: 'whatsapp' };
  } catch (error) {
    if (error.code === 'TWILIO_CONFIG_MISSING' || error.code === 'TWILIO_DISABLED') {
      logger.warn(
        `Twilio WhatsApp messaging not configured. Using logged OTP for ${phone}: ${code}`
      );
      return { channel: 'log', simulated: true };
    }

    logger.error(`Failed to deliver OTP to ${phone}: ${error.message}`);
    throw error;
  }
};

const getExpiryMs = () => OTP_EXPIRY_MS;
const getResendIntervalMs = () => OTP_RESEND_INTERVAL_MS;
const getMaxAttempts = () => OTP_MAX_ATTEMPTS;
const getCodeLength = () => OTP_CODE_LENGTH;

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  canSendNewOtp,
  hasAttemptsRemaining,
  deliverOtp,
  getExpiryMs,
  getResendIntervalMs,
  getMaxAttempts,
  getCodeLength,
};
