/**
 * Utility for sending WhatsApp messages via Twilio
 */
const twilio = require('twilio');

const logger = require('./logger');

const REQUIRED_TWILIO_KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];

let client = null;

const maskPhoneNumber = (phone) => {
  if (!phone || phone.length <= 4) {
    return phone || 'unknown';
  }

  const digits = phone.replace(/[^0-9+]/g, '');
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
  }

  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
};

const isMessagingDisabled = () => process.env.TWILIO_WHATSAPP_DISABLED === 'true';

const ensureClient = () => {
  if (isMessagingDisabled()) {
    const error = new Error('Twilio WhatsApp messaging disabled via environment flag.');
    error.code = 'TWILIO_DISABLED';
    throw error;
  }

  if (!client) {
    const missingKeys = REQUIRED_TWILIO_KEYS.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      logger.warn(
        `Twilio credentials missing (${missingKeys.join(', ')}); WhatsApp messaging is disabled.`
      );
      const error = new Error('Twilio WhatsApp messaging is not configured.');
      error.code = 'TWILIO_CONFIG_MISSING';
      throw error;
    }

    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  return client;
};

const buildMediaUrls = (mediaUrls) => {
  if (!mediaUrls) {
    return [];
  }

  if (!Array.isArray(mediaUrls)) {
    throw new TypeError('mediaUrls must be an array when provided.');
  }

  return mediaUrls.filter((url) => typeof url === 'string' && url.trim().length > 0);
};

const normalizeRecipient = (to) => {
  if (!to || typeof to !== 'string') {
    throw new TypeError('Recipient phone number is required.');
  }

  const trimmed = to.trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
};

const normalizeBody = (body) => {
  if (!body || typeof body !== 'string') {
    throw new TypeError('Message body is required.');
  }

  return body.trim();
};

const sendWhatsAppMessage = async (to, body, mediaUrls = []) => {
  try {
    const twilioClient = ensureClient();
    const normalizedTo = normalizeRecipient(to);
    const normalizedBody = normalizeBody(body);
    const attachments = buildMediaUrls(mediaUrls);

    const messagePayload = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: normalizedTo,
      body: normalizedBody,
    };

    if (attachments.length > 0) {
      messagePayload.mediaUrl = attachments;
    }

    const message = await twilioClient.messages.create(messagePayload);

    logger.info(`WhatsApp message sent to ${maskPhoneNumber(to)}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp message to ${maskPhoneNumber(to)}: ${error.message}`);
    throw error;
  }
};

const sendTemplateMessage = async (to, templateName, parameters = []) => {
  try {
    const twilioClient = ensureClient();
    const normalizedTo = normalizeRecipient(to);

    if (!templateName || typeof templateName !== 'string') {
      throw new TypeError('Template name is required for template messaging.');
    }

    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: normalizedTo,
      body: templateName,
      contentSid: templateName,
      contentVariables: JSON.stringify(parameters),
    });

    logger.info(`WhatsApp template message sent to ${maskPhoneNumber(to)}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp template to ${maskPhoneNumber(to)}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendTemplateMessage,
};
