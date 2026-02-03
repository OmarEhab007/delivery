/**
 * Common Validators
 *
 * Reusable validation middleware for common patterns:
 * - ObjectId validation for URL parameters
 * - Pagination validation for query parameters
 */
const mongoose = require('mongoose');
const { query, param, validationResult } = require('express-validator');

/**
 * Validates that a given parameter is a valid MongoDB ObjectId
 * Returns 400 Bad Request if invalid, not 500
 *
 * @param {string} paramName - The URL parameter name to validate (default: 'id')
 * @returns {Array} Array of middleware functions
 */
const isValidObjectId = (paramName = 'id') => {
  return [
    param(paramName)
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error(`Invalid ${paramName} format`);
        }
        return true;
      })
      .withMessage(`Invalid ${paramName} format - must be a valid ObjectId`),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array(),
        });
      }
      next();
    },
  ];
};

/**
 * Validates pagination query parameters
 * - page: must be a positive integer (default: 1)
 * - limit: must be a positive integer between 1 and 100 (default: 10)
 *
 * @returns {Array} Array of middleware functions
 */
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    // Set defaults if not provided
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 10;
    next();
  },
];

/**
 * Generic validation result handler middleware
 * Use this after validation chains to handle validation errors
 *
 * @returns {Function} Express middleware function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  isValidObjectId,
  paginationValidation,
  handleValidationErrors,
};
