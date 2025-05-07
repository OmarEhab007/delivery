/**
 * Rate limiting middleware configurations
 * Protects the API from abuse and potential DoS attacks
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Default values if environment variables are not set
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_AUTH_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_AUTH_MAX_REQUESTS = 100; // Increased from 10 to 100 for development
const DEFAULT_SENSITIVE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_SENSITIVE_MAX_REQUESTS = 5;

/**
 * General API rate limiter
 * Applied to all API routes by default
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || DEFAULT_MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      requestId: req.requestId
    });
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Authentication rate limiter
 * Stricter limits for authentication endpoints to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || DEFAULT_AUTH_WINDOW_MS,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || DEFAULT_AUTH_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Authentication rate limit exceeded for IP: ${req.ip}`, {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      requestId: req.requestId,
      email: req.body.email // Log the email being used for failed attempts
    });
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Sensitive operations rate limiter
 * For operations that should be performed infrequently
 */
const sensitiveOpLimiter = rateLimit({
  windowMs: parseInt(process.env.SENSITIVE_OPS_RATE_LIMIT_WINDOW_MS) || DEFAULT_SENSITIVE_WINDOW_MS,
  max: parseInt(process.env.SENSITIVE_OPS_RATE_LIMIT_MAX_REQUESTS) || DEFAULT_SENSITIVE_MAX_REQUESTS,
  message: {
    status: 'error',
    message: 'Too many attempts for sensitive operations, please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Sensitive operation rate limit exceeded for IP: ${req.ip}`, {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      requestId: req.requestId,
      userId: req.user?.id // Log user ID if authenticated
    });
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveOpLimiter
}; 