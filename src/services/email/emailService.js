/**
 * Email Service
 *
 * Handles all email sending functionality using nodemailer.
 * Supports development mode logging and configurable email settings.
 *
 * @module services/email/emailService
 * @requires nodemailer
 * @requires ../../utils/logger
 * @requires ./emailTemplates
 */

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');
const {
  passwordResetTemplate,
  registrationApprovedTemplate,
  registrationRejectionTemplate,
  notificationTemplate,
} = require('./emailTemplates');

/** @type {boolean} Whether we're in development mode */
const isDevelopment = process.env.NODE_ENV !== 'production';
/** @type {boolean} Whether email sending is enabled */
const emailEnabled = process.env.EMAIL_ENABLED !== 'false';

/** @type {Object} Email configuration from environment variables */
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
};

/** @type {string} Default from email address */
const emailFrom = process.env.EMAIL_FROM || 'noreply@deliveryapp.com';
/** @type {string} Frontend URL for email links */
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
/** @type {string} Support email address */
const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM;

/**
 * Mask email address for privacy-safe logging (GDPR/CCPA compliant)
 * @function
 * @param {string} email - Email address to mask
 * @returns {string} Masked email (e.g., "u***@example.com")
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '[no-email]';
  const [localPart, domain] = email.split('@');
  if (!domain) return '[invalid-email]';
  const maskedLocal = localPart.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
};

// Create transporter (lazy initialization)
let transporter = null;

/**
 * Get or create the email transporter
 * @returns {Object} Nodemailer transporter
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
};

/**
 * Verify email transporter connection
 * @returns {Promise<boolean>} True if connection is valid
 */
const verifyConnection = async () => {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      logger.warn('Email credentials not configured');
      return false;
    }

    const transport = getTransporter();
    await transport.verify();
    logger.info('Email service connection verified successfully');
    return true;
  } catch (error) {
    logger.error('Email service connection failed', { error: error.message });
    return false;
  }
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @param {Object} options - Additional options (cc, bcc, attachments)
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (to, subject, html, options = {}) => {
  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Delivery App'}" <${emailFrom}>`,
    to,
    subject,
    html,
    ...options,
  };

  // In development mode or if email is disabled, log instead of sending
  if (isDevelopment || !emailEnabled) {
    logger.info('Email would be sent (development mode)', {
      type: 'EMAIL_DEBUG',
      to: maskEmail(to),
      subject,
      preview: html ? html.substring(0, 200) + '...' : '[no content]',
    });

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      preview: true,
    };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      type: 'EMAIL_SENT',
      to: maskEmail(to),
      subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error('Failed to send email', {
      type: 'EMAIL_ERROR',
      to: maskEmail(to),
      subject,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object with name and email
 * @param {string} resetToken - The unhashed reset token
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const { subject, html } = passwordResetTemplate(resetUrl, user.name);

  return sendEmail(user.email, subject, html);
};

/**
 * Send registration approved email (after admin approval)
 * @param {Object} user - User object with name, email, and role
 * @returns {Promise<Object>} Send result
 */
const sendRegistrationApprovedEmail = async (user) => {
  const { subject, html } = registrationApprovedTemplate(user.name);

  return sendEmail(user.email, subject, html);
};

/**
 * Send registration rejection email
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Send result
 */
const sendRejectionEmail = async (email, name, reason) => {
  const { subject, html } = registrationRejectionTemplate({
    name,
    reason,
    supportEmail,
  });

  return sendEmail(email, subject, html);
};

/**
 * Send a generic notification email
 * @param {string} to - Recipient email
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} action - Optional action button { url, text }
 * @returns {Promise<Object>} Send result
 */
const sendNotificationEmail = async (to, title, message, action = null) => {
  const { subject, html } = notificationTemplate({
    title,
    message,
    actionUrl: action?.url,
    actionText: action?.text,
  });

  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendRegistrationApprovedEmail,
  sendRejectionEmail,
  sendNotificationEmail,
  verifyConnection,
  maskEmail,
};
