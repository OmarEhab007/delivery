/**
 * Custom Error Response Utility
 * Provides standardized error handling functions for the application
 */

/**
 * Creates a custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Custom error object with status code
 */
const createCustomError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Formats an error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} [data] - Optional additional error data
 * @returns {Object} Formatted error response object
 */
const formatErrorResponse = (message, statusCode, data = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      ...(data && { data }),
    },
  };
};

module.exports = {
  createCustomError,
  formatErrorResponse,
};
