const logger = require('./logger');
const metrics = require('./metrics');
const tracer = require('./tracer');

// In-memory error storage for tracking repeated errors
const errorCache = {
  errors: new Map(),
  maxSize: 1000,
  ttl: 60 * 60 * 1000 // 1 hour TTL
};

/**
 * Clean up old errors from the cache
 */
const cleanupErrorCache = () => {
  const now = Date.now();
  let count = 0;
  
  for (const [key, data] of errorCache.errors.entries()) {
    if (now - data.lastSeen > errorCache.ttl) {
      errorCache.errors.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    logger.debug(`Cleaned up ${count} expired errors from tracking cache`);
  }
};

// Set up periodic cleanup
setInterval(cleanupErrorCache, 15 * 60 * 1000); // Clean every 15 minutes

/**
 * Generate a fingerprint for an error to identify similar errors
 * @param {Error} error - The error to fingerprint
 * @param {string} context - Additional context
 * @returns {string} Error fingerprint
 */
const generateErrorFingerprint = (error, context = '') => {
  // Extract the error message
  const message = error.message || 'Unknown error';
  
  // Extract just the first two lines of the stack trace if available
  let stackTrace = '';
  if (error.stack) {
    const stackLines = error.stack.split('\n').slice(0, 3);
    stackTrace = stackLines.join('');
  }
  
  // Combine relevant info into a fingerprint
  return `${error.name || 'Error'}:${message.substring(0, 50)}:${stackTrace.substring(0, 100)}:${context}`;
};

/**
 * Track and log an error with detailed information
 * @param {Error} error - The error to track
 * @param {Object} options - Tracking options
 * @returns {Object} Tracking information
 */
const trackError = (error, options = {}) => {
  const {
    req = null,
    context = 'application',
    userId = null,
    tags = [],
    severity = 'error',
    source = 'server',
    additionalData = {}
  } = options;
  
  // Get trace information if available
  let traceId = null;
  let spanId = null;
  
  try {
    // Safely access tracer functions if available
    if (tracer && typeof tracer.getCurrentTraceId === 'function') {
      traceId = tracer.getCurrentTraceId();
      spanId = tracer.getCurrentSpanId();
    }
  } catch (traceError) {
    logger.warn(`Error getting trace context: ${traceError.message}`);
  }
  
  // Generate fingerprint for error grouping
  const fingerprint = generateErrorFingerprint(error, context);
  
  // Track error occurrence and frequency
  if (errorCache.errors.size >= errorCache.maxSize) {
    // If we've reached max size, clear out the oldest entries
    cleanupErrorCache();
    
    // If still full, just remove the oldest error
    if (errorCache.errors.size >= errorCache.maxSize) {
      const oldestKey = errorCache.errors.keys().next().value;
      errorCache.errors.delete(oldestKey);
    }
  }
  
  const now = Date.now();
  let errorData = errorCache.errors.get(fingerprint);
  
  if (errorData) {
    // Update existing error entry
    errorData.count++;
    errorData.lastSeen = now;
    errorData.occurrences.push(now);
    
    // Keep only the last 10 occurrences
    if (errorData.occurrences.length > 10) {
      errorData.occurrences = errorData.occurrences.slice(-10);
    }
  } else {
    // Create new error entry
    errorData = {
      fingerprint,
      error: {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack
      },
      context,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      occurrences: [now]
    };
    
    errorCache.errors.set(fingerprint, errorData);
  }
  
  // Determine if this is a new error or a repeat
  const isNewError = errorData.count === 1;
  
  // Build the error metadata
  const errorInfo = {
    error: {
      name: error.name || 'Error',
      message: error.message,
      stack: error.stack
    },
    context,
    fingerprint,
    count: errorData.count,
    firstSeen: new Date(errorData.firstSeen).toISOString(),
    isNewError,
    source,
    severity,
    tags
  };
  
  // Add trace context if available
  if (traceId) {
    errorInfo.traceId = traceId;
    errorInfo.spanId = spanId;
  }
  
  // Add request context if available
  if (req) {
    try {
      errorInfo.request = {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: sanitizeHeaders(req.headers),
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']
      };
      
      if (req.body) {
        errorInfo.request.body = sanitizeRequestBody(req.body);
      }
      
      if (req.query) {
        errorInfo.request.query = req.query;
      }
      
      if (req.params) {
        errorInfo.request.params = req.params;
      }
    } catch (reqError) {
      logger.warn(`Error processing request data for error tracking: ${reqError.message}`);
    }
  }
  
  // Add user context if available
  if (userId || (req && req.user)) {
    try {
      errorInfo.user = {
        id: userId || (req.user ? req.user.id || req.user._id : null),
        role: req.user ? req.user.role : null
      };
    } catch (userError) {
      logger.warn(`Error processing user data for error tracking: ${userError.message}`);
    }
  }
  
  // Add any additional data
  if (additionalData && Object.keys(additionalData).length > 0) {
    errorInfo.additionalData = additionalData;
  }
  
  // Log the error with all the collected information
  if (isNewError) {
    // Log new errors at error level
    logger.error(`New error in ${context}: ${error.message}`, errorInfo);
  } else if (errorData.count % 10 === 0) {
    // For repeat errors, only log every 10th occurrence to avoid log spam
    logger.warn(`Repeated error in ${context} (${errorData.count} occurrences): ${error.message}`, errorInfo);
  } else {
    // Log other occurrences at debug level
    logger.debug(`Repeat error in ${context}: ${error.message}`, errorInfo);
  }
  
  // Record the error in metrics
  try {
    if (metrics && typeof metrics.recordError === 'function') {
      metrics.recordError(context, req ? req.route?.path || req.path || 'unknown' : 'unknown');
    }
  } catch (metricsError) {
    logger.warn(`Error recording metrics: ${metricsError.message}`);
  }
  
  return {
    fingerprint,
    isNewError,
    count: errorData.count
  };
};

/**
 * Sanitize request headers to remove sensitive information
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return {};
  
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'token', 'refreshToken', 'apiKey', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Create an Express error handler middleware
 * @returns {Function} Express error handler middleware
 */
const errorHandlerMiddleware = () => {
  return (err, req, res, next) => {
    try {
      // Track the error
      const { fingerprint } = trackError(err, { 
        req,
        context: 'http',
        userId: req.user ? req.user.id || req.user._id : null
      });
      
      // Determine error status code
      const statusCode = err.statusCode || 500;
      
      // Generate a meaningful error message based on the type of error
      let userMessage = err.message;
      
      // In production, sanitize certain error types or provide better messages
      if (process.env.NODE_ENV === 'production') {
        if (statusCode >= 500) {
          // For server errors, don't expose internal details
          userMessage = 'A server error occurred. Our team has been notified.';
        } else if (statusCode === 404) {
          userMessage = 'The requested resource was not found.';
        } else if (statusCode === 401) {
          userMessage = 'Authentication required. Please log in.';
        } else if (statusCode === 403) {
          userMessage = 'You don\'t have permission to access this resource.';
        } else if (err.name === 'ValidationError' || statusCode === 400) {
          // For validation errors, keep the original message as it's helpful to users
          userMessage = err.message;
        } else if (err.name === 'CastError') {
          userMessage = `Invalid ${err.path || 'parameter'} provided.`;
        } else if (err.code === 11000) {
          // For duplicate key errors
          userMessage = `This ${Object.keys(err.keyValue || {})[0] || 'value'} already exists.`;
        } else {
          // For other errors, provide a meaningful but secure message
          userMessage = 'An error occurred with your request. Please check your input and try again.';
        }
      }
      
      // Create the error response
      const errorResponse = {
        status: statusCode >= 500 ? 'error' : 'fail',
        message: userMessage,
        errorId: fingerprint.substring(0, 8)
      };
      
      // Add detailed error info in development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
        errorResponse.name = err.name;
        if (err.errors) {
          errorResponse.errors = err.errors;
        }
      }
      
      // Send the error response
      res.status(statusCode).json(errorResponse);
    } catch (handlerError) {
      // Last resort fallback if error handling itself fails
      logger.error(`Error in error handler: ${handlerError.message}`, { error: handlerError });
      res.status(500).json({ 
        status: 'error', 
        message: 'An unexpected error occurred in error handling' 
      });
    }
  };
};

/**
 * Get error statistics
 * @returns {Object} Error statistics
 */
const getErrorStats = () => {
  try {
    const stats = {
      totalTracked: errorCache.errors.size,
      errorsByContext: {},
      recentErrors: []
    };
    
    // Group errors by context
    for (const [_, data] of errorCache.errors.entries()) {
      const context = data.context || 'unknown';
      
      if (!stats.errorsByContext[context]) {
        stats.errorsByContext[context] = 0;
      }
      
      stats.errorsByContext[context]++;
      
      // Add to recent errors if it occurred in the last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (data.lastSeen > oneHourAgo) {
        stats.recentErrors.push({
          fingerprint: data.fingerprint.substring(0, 8),
          message: data.error.message,
          context: data.context,
          count: data.count,
          lastSeen: new Date(data.lastSeen).toISOString()
        });
      }
    }
    
    // Sort recent errors by count (most frequent first)
    stats.recentErrors.sort((a, b) => b.count - a.count);
    
    // Limit to top 10
    stats.recentErrors = stats.recentErrors.slice(0, 10);
    
    return stats;
  } catch (statError) {
    logger.error(`Error generating error stats: ${statError.message}`, { error: statError });
    return { 
      error: 'Error generating statistics',
      totalTracked: 0,
      errorsByContext: {},
      recentErrors: []
    };
  }
};

module.exports = {
  trackError,
  errorHandlerMiddleware,
  getErrorStats
}; 