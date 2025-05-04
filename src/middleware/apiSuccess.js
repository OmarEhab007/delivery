/**
 * Standardized API success response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send in the response
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Response with standard format
 */
exports.ApiSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data
  });
}; 