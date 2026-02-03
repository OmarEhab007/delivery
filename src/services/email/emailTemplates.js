/**
 * Email Templates
 *
 * HTML email templates for various notification types
 */

const appName = process.env.APP_NAME || 'Delivery App';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

/**
 * Base email template wrapper
 * @param {string} content - The main content of the email
 * @returns {string} Complete HTML email
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #2563eb;
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .content h2 {
      margin-top: 0;
      color: #1f2937;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    .info {
      background-color: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
    }
    .code {
      background-color: #f3f4f6;
      padding: 8px 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 16px;
      display: inline-block;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <h1>${appName}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>This email was sent by ${appName}.</p>
        <p>If you did not request this email, please ignore it.</p>
        <p><a href="${frontendUrl}">Visit our website</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Password Reset Email Template
 * @param {string} resetUrl - Password reset URL
 * @param {string} userName - User's name
 * @returns {Object} Subject and HTML content
 */
const passwordResetTemplate = (resetUrl, userName) => {
  const subject = `Reset Your Password - ${appName}`;
  const expiryMinutes = 10;

  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${userName || 'User'},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>

    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>

    <div class="warning">
      <strong>This link will expire in ${expiryMinutes} minutes.</strong>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return {
    subject,
    html: baseTemplate(content),
  };
};

/**
 * Registration Approved Email Template (sent after admin approval)
 * @param {string} userName - User's name
 * @returns {Object} Subject and HTML content
 */
const registrationApprovedTemplate = (userName) => {
  const subject = `Welcome to ${appName} - Registration Approved`;
  const loginUrl = `${frontendUrl}/login`;

  const content = `
    <h2>Welcome to ${appName}!</h2>
    <p>Hello ${userName || 'User'},</p>
    <p>Great news! Your registration has been approved by our admin team.</p>

    <div class="info">
      <strong>Your account is now active!</strong>
      <p style="margin: 8px 0 0 0;">You can now log in and start using all the features of our platform.</p>
    </div>

    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">Login to Your Account</a>
    </p>

    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return {
    subject,
    html: baseTemplate(content),
  };
};

/**
 * Registration Rejection Email Template
 * @param {Object} params - Template parameters
 * @param {string} params.name - User's name
 * @param {string} params.reason - Rejection reason
 * @param {string} params.supportEmail - Support email address
 * @returns {Object} Subject and HTML content
 */
const registrationRejectionTemplate = ({ name, reason, supportEmail }) => {
  const subject = `Registration Update - ${appName}`;

  const content = `
    <h2>Registration Status Update</h2>
    <p>Hello ${name || 'User'},</p>
    <p>Thank you for your interest in ${appName}. After reviewing your registration request, we were unable to approve your account at this time.</p>

    ${
      reason
        ? `
    <div class="warning">
      <strong>Reason:</strong>
      <p style="margin: 8px 0 0 0;">${reason}</p>
    </div>
    `
        : ''
    }

    <p>If you believe this decision was made in error, or if you would like more information, please contact our support team${supportEmail ? ` at <a href="mailto:${supportEmail}">${supportEmail}</a>` : ''}.</p>

    <p>You may also submit a new registration request with updated information if applicable.</p>

    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return {
    subject,
    html: baseTemplate(content),
  };
};

/**
 * Generic notification email template
 * @param {Object} params - Template parameters
 * @param {string} params.title - Email title
 * @param {string} params.message - Main message content
 * @param {string} params.actionUrl - Optional action button URL
 * @param {string} params.actionText - Optional action button text
 * @returns {Object} Subject and HTML content
 */
const notificationTemplate = ({ title, message, actionUrl, actionText }) => {
  const subject = `${title} - ${appName}`;

  const content = `
    <h2>${title}</h2>
    <p>${message}</p>

    ${
      actionUrl && actionText
        ? `
    <p style="text-align: center;">
      <a href="${actionUrl}" class="button">${actionText}</a>
    </p>
    `
        : ''
    }

    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return {
    subject,
    html: baseTemplate(content),
  };
};

module.exports = {
  passwordResetTemplate,
  registrationApprovedTemplate,
  registrationRejectionTemplate,
  notificationTemplate,
};
