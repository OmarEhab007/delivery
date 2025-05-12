/**
 * @class ApiError
 * @description Custom error class for API error handling
 * @extends Error
 */
class ApiError extends Error {
  /**
   * @constructor
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Is this an operational error?
   * @param {Error} originalError - The original error object if applicable
   */
  constructor(message, statusCode = 500, isOperational = true, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.originalError = originalError;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { ApiError }; 