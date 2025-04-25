/**
 * Utility for sending WhatsApp messages via Twilio
 */
const twilio = require('twilio');
const logger = require('./logger');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a WhatsApp message using Twilio
 * @param {string} to - The recipient phone number (with country code)
 * @param {string} body - Message content
 * @param {Array} [mediaUrls] - Optional array of media URLs to include
 * @returns {Promise<object>} - Message response from Twilio
 */
const sendWhatsAppMessage = async (to, body, mediaUrls = []) => {
  try {
    // Format phone number for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Create message payload
    const messagePayload = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo,
      body
    };
    
    // Add media URLs if provided
    if (mediaUrls && mediaUrls.length > 0) {
      messagePayload.mediaUrl = mediaUrls;
    }
    
    // Send the message
    const message = await client.messages.create(messagePayload);
    
    logger.info(`WhatsApp message sent to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp message to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send a template WhatsApp message
 * @param {string} to - The recipient phone number
 * @param {string} templateName - Name of the approved template
 * @param {Array} parameters - Parameters to fill in the template
 * @returns {Promise<object>} - Message response from Twilio
 */
const sendTemplateMessage = async (to, templateName, parameters = []) => {
  try {
    // Format variables for the template
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Create the message
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo,
      body: templateName, // This will be replaced by the template
      contentSid: templateName,
      contentVariables: JSON.stringify(parameters)
    });
    
    logger.info(`WhatsApp template message sent to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error(`Error sending WhatsApp template to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendTemplateMessage
};
