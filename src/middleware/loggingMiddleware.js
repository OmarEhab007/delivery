const logger = require('../utils/logger');

/**
 * Middleware for detailed request and response logging
 * Logs important information about each request and its response
 */
const requestLogger = (req, res, next) => {
  // Generate a unique request ID
  const requestId = Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;

  // Log request details
  const requestLog = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || 'unknown',
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
  };

  // Add user info if authenticated
  if (req.user) {
    requestLog.userId = req.user.id;
    requestLog.userRole = req.user.role;
  }

  logger.info(`API Request: ${req.method} ${req.originalUrl || req.url}`, requestLog);

  // Intercept response to log it
  const originalSend = res.send;
  res.send = function (body) {
    res.responseBody = body;

    // Log response when sending (with some delay to ensure it's after the controller logs)
    const responseLog = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: new Date() - new Date(requestLog.timestamp),
      timestamp: new Date().toISOString(),
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error(
        `API Response: ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
        responseLog
      );
    } else if (res.statusCode >= 400) {
      logger.warn(
        `API Response: ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
        responseLog
      );
    } else {
      logger.info(
        `API Response: ${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
        responseLog
      );
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Sanitizes request body to avoid logging sensitive information like passwords
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'token',
    'refreshToken',
    'apiKey',
    'secret',
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

module.exports = { requestLogger };
