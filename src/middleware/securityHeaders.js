/**
 * Security Headers Middleware
 * Enhances application security through HTTP response headers
 */

const helmet = require('helmet');

const logger = require('../utils/logger');

/**
 * Default CSP directives that provide strong security while allowing common functionality
 */
const defaultCSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Consider removing unsafe options for stricter security
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https:'], // Allow connections to same origin and HTTPS resources
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"], // Prevents embedding in frames (alternative to X-Frame-Options)
  upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  blockAllMixedContent: process.env.NODE_ENV === 'production' ? [] : null,
};

/**
 * Configure enhanced security headers for the application
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware function
 */
const configureSecurityHeaders = (options = {}) => {
  const cspDirectives = options.cspDirectives || defaultCSPDirectives;

  // Clean up null values in directives for production
  if (process.env.NODE_ENV === 'production') {
    Object.keys(cspDirectives).forEach((key) => {
      if (cspDirectives[key] === null) {
        delete cspDirectives[key];
      }
    });
  }

  // Create helmet configuration with enhanced CSP
  const helmetConfig = {
    contentSecurityPolicy: {
      directives: cspDirectives,
      reportOnly: process.env.CSP_REPORT_ONLY === 'true',
    },
    // Strict transport security (HSTS) configuration
    // Only enable in production to avoid HTTPS requirement during development
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : false,
    // X-Content-Type-Options to prevent MIME type sniffing
    noSniff: true,
    // X-XSS-Protection header, although modern browsers use CSP instead
    xssFilter: true,
    // Disable browser's DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },
    // Add this setting to prevent Helmet from clearing/overriding our cache headers
    noCache: false,
  };

  // Create custom middleware to log CSP violations if reporting is enabled
  return [
    // Apply Helmet middleware with enhanced configuration
    helmet(helmetConfig),

    // Add CSP violation reporting if enabled
    (req, res, next) => {
      // Skip for non-HTML responses and when not in report mode
      if (
        !process.env.CSP_REPORT_URI ||
        req.path.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)
      ) {
        return next();
      }

      // Add CSP reporting URI for violation reports
      res.setHeader(
        'Content-Security-Policy-Report-Only',
        `report-uri ${process.env.CSP_REPORT_URI}`
      );

      next();
    },

    // Add security headers logging in development
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development' && options.logHeaders) {
        const originalEnd = res.end;

        res.end = function (chunk, encoding) {
          // Log relevant security headers
          const securityHeaders = {
            'content-security-policy': res.getHeader('Content-Security-Policy'),
            'strict-transport-security': res.getHeader('Strict-Transport-Security'),
            'x-content-type-options': res.getHeader('X-Content-Type-Options'),
            'x-frame-options': res.getHeader('X-Frame-Options'),
            'x-xss-protection': res.getHeader('X-XSS-Protection'),
          };

          logger.debug('Security headers set', {
            path: req.originalUrl || req.url,
            headers: securityHeaders,
          });

          return originalEnd.apply(this, arguments);
        };
      }

      next();
    },
  ];
};

/**
 * Handle CSP reports sent by browsers
 * @returns {Function} - Express route handler for CSP reports
 */
const handleCSPReports = () => {
  return (req, res) => {
    if (req.body && req.body['csp-report']) {
      const report = req.body['csp-report'];

      logger.warn('CSP violation', {
        documentUri: report['document-uri'],
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        originalPolicy: report['original-policy'],
        referrer: report.referrer,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(204).end();
  };
};

module.exports = {
  configureSecurityHeaders,
  handleCSPReports,
  defaultCSPDirectives,
};
