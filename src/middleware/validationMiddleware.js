const { validationResult } = require('express-validator');

/**
 * Validates the request against the validation rules
 * Used with express-validator to check if there are any validation errors
 * If errors exist, returns a 400 response with the errors
 * If no errors, passes to the next middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateRequest
}; 