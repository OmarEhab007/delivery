/**
 * CSRF Protection Middleware
 * Provides protection against Cross-Site Request Forgery attacks
 */

const csrf = require('csurf');

const logger = require('../utils/logger');

// Initialize CSRF protection with options
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 1000, // 1 hour
  },
});

/**
 * CSRF error handler middleware
 * Handles CSRF token validation errors gracefully
 */
const handleCSRFError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log the CSRF attempt
  logger.warn('CSRF attempt detected', {
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
    userId: req.user?.id || 'unauthenticated',
  });

  // Send forbidden response
  res.status(403).json({
    success: false,
    message: 'Invalid or expired CSRF token. Please refresh the page and try again.',
  });
};

/**
 * Generate CSRF token and attach to response locals
 * Use this middleware for routes that render forms in views
 */
const generateCSRFToken = (req, res, next) => {
  // Add CSRF token to response locals for template rendering
  res.locals.csrfToken = req.csrfToken();

  // Also add as a header for API clients
  res.set('X-CSRF-Token', req.csrfToken());

  next();
};

/**
 * Add security headers related to CSRF protection
 */
const addCSRFHeaders = (req, res, next) => {
  // Prevent embedding in frames (helps prevent clickjacking)
  res.set('X-Frame-Options', 'DENY');

  // Instructs browser to only send the referrer header when navigating to same origin
  res.set('Referrer-Policy', 'same-origin');

  next();
};

module.exports = {
  csrfProtection,
  handleCSRFError,
  generateCSRFToken,
  addCSRFHeaders,
};
