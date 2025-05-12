/**
 * Cache control middleware
 * Adds cache-control headers to reduce redundant requests
 */

const logger = require('../utils/logger');

/**
 * Default cache durations (in seconds)
 * Uses environment variables if available, falls back to defaults
 */
const CACHE_DURATIONS = {
  // Short-lived cache
  short: parseInt(process.env.CACHE_DURATION_SHORT) || 60, // 1 minute
  // Medium-lived cache
  medium: parseInt(process.env.CACHE_DURATION_MEDIUM) || 300, // 5 minutes
  // Long-lived cache
  long: parseInt(process.env.CACHE_DURATION_LONG) || 3600, // 1 hour
  // Very long-lived cache for rarely changing content
  veryLong: parseInt(process.env.CACHE_DURATION_VERY_LONG) || 86400, // 1 day
  // Static assets (images, CSS, JS)
  static: parseInt(process.env.CACHE_DURATION_STATIC) || 604800, // 7 days
};

/**
 * Generate cache control directive
 * @param {number} maxAge - Maximum age in seconds
 * @param {boolean} isPublic - Whether the response is cacheable by shared caches
 * @param {boolean} mustRevalidate - Whether the client must revalidate with server
 * @returns {string} - Cache control directive
 */
const generateCacheControl = (maxAge, isPublic = true, mustRevalidate = false) => {
  const directives = [];

  // Cache visibility
  directives.push(isPublic ? 'public' : 'private');

  // Max age
  directives.push(`max-age=${maxAge}`);

  // Revalidation
  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
};

/**
 * Create cache control middleware
 * @param {string|number} duration - Duration name or seconds
 * @param {boolean} isPublic - Whether the response is cacheable by shared caches
 * @param {boolean} mustRevalidate - Whether the client must revalidate with server
 * @returns {function} - Express middleware function
 */
const cacheControl = (duration = 'medium', isPublic = true, mustRevalidate = false) => {
  // Convert duration name to seconds if needed
  const maxAge =
    typeof duration === 'string' ? CACHE_DURATIONS[duration] || CACHE_DURATIONS.medium : duration;

  // Generate cache control header value
  const cacheControlValue = generateCacheControl(maxAge, isPublic, mustRevalidate);

  // Return middleware function
  return (req, res, next) => {
    // Debug log - ADDED FOR TROUBLESHOOTING
    console.log(
      `[DEBUG] Setting Cache-Control: ${cacheControlValue} for ${req.originalUrl || req.url}`
    );

    // Set cache control header
    res.set('Cache-Control', cacheControlValue);

    // Log if in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Cache-Control header set', {
        path: req.originalUrl || req.url,
        cacheControl: cacheControlValue,
        maxAge: `${maxAge} seconds`,
      });
    }

    next();
  };
};

/**
 * No-cache middleware for dynamic content
 * @returns {function} - Express middleware function
 */
const noCache = () => {
  return (req, res, next) => {
    // Debug log - ADDED FOR TROUBLESHOOTING
    console.log(`[DEBUG] Setting no-cache headers for ${req.originalUrl || req.url}`);

    // Set no-cache headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    next();
  };
};

/**
 * Static assets caching middleware
 * @returns {function} - Express middleware function
 */
const staticCache = () => {
  return cacheControl('static', true, false);
};

// Export middleware
module.exports = {
  cacheControl,
  noCache,
  staticCache,
  CACHE_DURATIONS,
};
