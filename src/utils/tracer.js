const { AsyncLocalStorage } = require('async_hooks');

const { v4: uuidv4 } = require('uuid');

const logger = require('./logger');

// Create a new async local storage instance
const traceStorage = new AsyncLocalStorage();

/**
 * Generate a new trace ID (correlation ID)
 * @returns {string} A unique trace ID
 */
const generateTraceId = () => {
  return uuidv4();
};

/**
 * Get the current trace ID from context
 * @returns {string|null} The current trace ID or null if not in context
 */
const getCurrentTraceId = () => {
  const store = traceStorage.getStore();
  return store ? store.traceId : null;
};

/**
 * Get the current span ID from context
 * @returns {string|null} The current span ID or null if not in context
 */
const getCurrentSpanId = () => {
  const store = traceStorage.getStore();
  return store ? store.spanId : null;
};

/**
 * Get full trace context
 * @returns {Object|null} The current trace context or null
 */
const getTraceContext = () => {
  return traceStorage.getStore();
};

/**
 * Create a middleware for initializing trace for each request
 * @returns {Function} Express middleware
 */
const tracingMiddleware = () => {
  return (req, res, next) => {
    // Check for existing trace ID from headers or generate a new one
    const traceId = req.headers['x-trace-id'] || generateTraceId();
    const parentSpanId = req.headers['x-span-id'];

    // Generate a new span ID for this service
    const spanId = generateTraceId();

    // Create a trace context
    const traceContext = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
    };

    // Add trace context to the request object
    req.traceContext = traceContext;

    // Set response headers for trace propagation
    res.set('X-Trace-ID', traceId);
    res.set('X-Span-ID', spanId);

    // Log the incoming request with trace context
    logger.info(`Request received: ${req.method} ${req.originalUrl}`, {
      type: 'TRACE',
      traceId,
      spanId,
      parentSpanId,
      requestId: req.requestId || null,
    });

    // Run the request handler in the trace context
    traceStorage.run(traceContext, () => {
      // Capture response finish event for tracing
      res.on('finish', () => {
        const duration = Date.now() - traceContext.startTime;

        // Log the response with trace context and duration
        logger.info(`Request completed: ${req.method} ${req.originalUrl}`, {
          type: 'TRACE',
          traceId,
          spanId,
          parentSpanId,
          duration,
          statusCode: res.statusCode,
          requestId: req.requestId || null,
        });
      });

      next();
    });
  };
};

/**
 * Create a child span in the current trace
 * @param {string} name - Name of the operation
 * @param {Object} attributes - Additional attributes for the span
 * @returns {Object} Span object with methods to end the span
 */
const createChildSpan = (name, attributes = {}) => {
  const parentContext = getTraceContext();

  if (!parentContext) {
    return {
      end: () => {},
      addAttribute: () => {},
    };
  }

  const spanId = generateTraceId();
  const startTime = Date.now();

  // Log span start
  logger.debug(`Span started: ${name}`, {
    type: 'TRACE',
    event: 'span_start',
    name,
    traceId: parentContext.traceId,
    spanId,
    parentSpanId: parentContext.spanId,
    attributes,
  });

  return {
    spanId,
    traceId: parentContext.traceId,
    parentSpanId: parentContext.spanId,
    name,
    attributes,
    startTime,

    // Method to add attributes to the span
    addAttribute: (key, value) => {
      attributes[key] = value;
    },

    // Method to end the span
    end: (error) => {
      const duration = Date.now() - startTime;

      // Create span data object
      const spanData = {
        type: 'TRACE',
        event: 'span_end',
        name,
        traceId: parentContext.traceId,
        spanId,
        parentSpanId: parentContext.spanId,
        duration,
        attributes,
      };

      // Add error information if provided
      if (error) {
        spanData.error = true;
        spanData.errorMessage = error.message;
        spanData.errorType = error.name;
        spanData.errorStack = error.stack;

        logger.error(`Span ended with error: ${name}`, spanData);
      } else {
        logger.debug(`Span ended successfully: ${name}`, spanData);
      }
    },
  };
};

/**
 * Wrap functions with tracing
 * @param {Function} fn - Function to wrap
 * @param {string} name - Name of the operation
 * @param {Object} attributes - Additional attributes
 * @returns {Function} Wrapped function with tracing
 */
const traceFunction = (fn, name, attributes = {}) => {
  return async (...args) => {
    const span = createChildSpan(name, attributes);
    try {
      const result = await fn(...args);
      span.end();
      return result;
    } catch (error) {
      span.addAttribute('error', true);
      span.end(error);
      throw error;
    }
  };
};

module.exports = {
  generateTraceId,
  getCurrentTraceId,
  getCurrentSpanId,
  getTraceContext,
  tracingMiddleware,
  createChildSpan,
  traceFunction,
};
