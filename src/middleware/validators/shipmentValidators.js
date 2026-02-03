/**
 * Shipment Validators
 *
 * Validation middleware for shipment-related endpoints.
 * Implements whitelisting to prevent mass assignment attacks.
 *
 * IMPORTANT: These validators explicitly whitelist allowed fields.
 * Fields like status, assignedTruckId, merchantId, isApproved are NOT allowed
 * to be set directly by users to prevent workflow bypass.
 */
const { body, validationResult } = require('express-validator');

/**
 * Allowed fields for shipment creation
 * These are the ONLY fields that can be set by the user when creating a shipment
 */
const ALLOWED_CREATE_FIELDS = [
  'origin',
  'destination',
  'cargoDetails',
  'pricing',
  'notes',
  'scheduledDate',
  'pricingType',
  'specialRequirements',
];

/**
 * Fields that are NEVER allowed to be set by users
 * These fields are controlled by the system/admins only
 */
const FORBIDDEN_FIELDS = [
  'status',
  'assignedTruckId',
  'merchantId',
  'isApproved',
  'approval',
  'timeline',
  'selectedApplicationId',
  'assignedDriverId',
  'actualPickupDate',
  'actualDeliveryDate',
  'active',
  'createdAt',
  'updatedAt',
];

/**
 * Middleware to sanitize request body by removing forbidden fields
 * and keeping only whitelisted fields
 *
 * @returns {Function} Express middleware function
 */
const sanitizeShipmentBody = (req, res, next) => {
  const sanitizedBody = {};

  // Only copy allowed fields
  ALLOWED_CREATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      sanitizedBody[field] = req.body[field];
    }
  });

  // Replace req.body with sanitized version
  req.body = sanitizedBody;
  next();
};

/**
 * Validation rules for creating a shipment
 * Validates required fields and their formats
 */
const createShipmentValidation = [
  // Sanitize body first to remove forbidden fields
  sanitizeShipmentBody,

  // Origin validation
  body('origin').notEmpty().withMessage('Origin is required'),
  body('origin.address')
    .notEmpty()
    .withMessage('Origin address is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Origin address cannot exceed 500 characters'),
  body('origin.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Origin country cannot exceed 100 characters'),
  body('origin.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Origin city cannot exceed 100 characters'),
  body('origin.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('origin.coordinates.0')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('origin.coordinates.1')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  // Destination validation
  body('destination').notEmpty().withMessage('Destination is required'),
  body('destination.address')
    .notEmpty()
    .withMessage('Destination address is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Destination address cannot exceed 500 characters'),
  body('destination.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination country cannot exceed 100 characters'),
  body('destination.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination city cannot exceed 100 characters'),
  body('destination.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('destination.coordinates.0')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('destination.coordinates.1')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  // Cargo details validation
  body('cargoDetails').notEmpty().withMessage('Cargo details are required'),
  body('cargoDetails.description')
    .notEmpty()
    .withMessage('Cargo description is required')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Cargo description cannot exceed 1000 characters'),
  body('cargoDetails.weight')
    .notEmpty()
    .withMessage('Cargo weight is required')
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Cargo weight must be between 0.01 and 100000 (tons)'),
  body('cargoDetails.dimensions.length')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number'),
  body('cargoDetails.dimensions.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number'),
  body('cargoDetails.dimensions.height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('cargoDetails.cargoType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cargo type cannot exceed 100 characters'),

  // Pricing validation (optional)
  body('pricing.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'EGP'])
    .withMessage('Currency must be one of: USD, EUR, GBP, EGP'),
  body('pricing.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pricing amount must be a positive number'),

  // Pricing type validation
  body('pricingType')
    .optional()
    .isIn(['BIDDING', 'FIXED_PRICE'])
    .withMessage('Pricing type must be BIDDING or FIXED_PRICE'),

  // Notes validation
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),

  // Scheduled date validation
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),

  // Special requirements validation
  body('specialRequirements')
    .optional()
    .isArray()
    .withMessage('Special requirements must be an array'),
  body('specialRequirements.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each special requirement cannot exceed 200 characters'),
];

/**
 * Allowed fields for shipment updates
 * More restrictive than creation - cannot change origin/destination after creation
 */
const ALLOWED_UPDATE_FIELDS = [
  'cargoDetails',
  'pricing',
  'notes',
  'scheduledDate',
  'specialRequirements',
];

/**
 * Middleware to sanitize request body for updates
 *
 * @returns {Function} Express middleware function
 */
const sanitizeShipmentUpdateBody = (req, res, next) => {
  const sanitizedBody = {};

  // Only copy allowed fields for updates
  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      sanitizedBody[field] = req.body[field];
    }
  });

  // Also allow origin/destination updates for non-confirmed shipments
  // (The controller will check the status)
  if (req.body.origin !== undefined) {
    sanitizedBody.origin = req.body.origin;
  }
  if (req.body.destination !== undefined) {
    sanitizedBody.destination = req.body.destination;
  }

  // Replace req.body with sanitized version
  req.body = sanitizedBody;
  next();
};

/**
 * Validation rules for updating a shipment
 */
const updateShipmentValidation = [
  // Sanitize body first
  sanitizeShipmentUpdateBody,

  // Origin validation (optional for updates)
  body('origin.address')
    .optional()
    .notEmpty()
    .withMessage('Origin address cannot be empty')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Origin address cannot exceed 500 characters'),

  // Destination validation (optional for updates)
  body('destination.address')
    .optional()
    .notEmpty()
    .withMessage('Destination address cannot be empty')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Destination address cannot exceed 500 characters'),

  // Cargo details validation (optional for updates)
  body('cargoDetails.description')
    .optional()
    .notEmpty()
    .withMessage('Cargo description cannot be empty')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Cargo description cannot exceed 1000 characters'),
  body('cargoDetails.weight')
    .optional()
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Cargo weight must be between 0.01 and 100000 (tons)'),

  // Notes validation
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),

  // Scheduled date validation
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
];

/**
 * Handle validation errors and return 400 response
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
  createShipmentValidation,
  updateShipmentValidation,
  sanitizeShipmentBody,
  sanitizeShipmentUpdateBody,
  handleValidationErrors,
  ALLOWED_CREATE_FIELDS,
  ALLOWED_UPDATE_FIELDS,
  FORBIDDEN_FIELDS,
};
