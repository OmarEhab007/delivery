const logger = require('../utils/logger');

/**
 * Custom error class for API errors with status code
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Formats and returns error responses, logs errors appropriately
 */
const errorHandler = (err, req, res, next) => {
  // Get request ID if available
  const requestId = req.requestId || 'unknown-req';
  
  // Default error values
  let error = { ...err };
  error.message = err.message || 'Server Error';
  error.statusCode = err.statusCode || 500;
  
  // Log the error with details
  const errorLog = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    statusCode: error.statusCode,
    errorName: err.name,
    errorMessage: error.message,
    stack: err.stack,
    errorDetails: error.errors || err.details || null,
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  };
  
  // Different log levels based on status code
  if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl || req.url} - ${req.method} - ${req.ip}`, errorLog);
  } else if (error.statusCode >= 400) {
    logger.warn(`${error.statusCode} - ${error.message} - ${req.originalUrl || req.url} - ${req.method} - ${req.ip}`, errorLog);
  } else {
    logger.info(`${error.statusCode} - ${error.message} - ${req.originalUrl || req.url} - ${req.method} - ${req.ip}`, errorLog);
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error.statusCode = 400;
  }
  
  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const keyField = Object.keys(err.keyValue || {})[0] || 'field';
    error.message = `Duplicate value entered for ${keyField}`;
    error.statusCode = 400;
  }
  
  // Handle Mongoose CastError (invalid IDs)
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = 401;
  }
  
  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    error.message = 'Your token has expired. Please log in again.';
    error.statusCode = 401;
  }
  
  // Determine the status text
  const statusText = error.statusCode >= 500 ? 'error' : 'fail';
  
  // Send response
  res.status(error.statusCode).json({
    success: false,
    status: statusText,
    message: error.message,
    requestId,
    // Include stack trace in development but not in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Helper function to create custom errors with status codes
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error with status code set
 */
const createCustomError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  ApiError,
  errorHandler,
  createCustomError
};
