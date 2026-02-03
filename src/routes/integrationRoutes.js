const express = require('express');
const { body } = require('express-validator');

const integrationController = require('../controllers/integration/integrationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  authenticateIntegration,
  requireIntegrationScope,
} = require('../middleware/integrationAuth');

const router = express.Router();

// Credential management (JWT-protected)
router.post(
  '/credentials',
  protect,
  restrictTo('Merchant', 'Admin'),
  integrationController.createCredential
);
router.get(
  '/credentials',
  protect,
  restrictTo('Merchant', 'Admin'),
  integrationController.listCredentials
);

// Webhook management (JWT-protected)
router.post(
  '/webhooks',
  protect,
  restrictTo('Merchant', 'Admin'),
  body('endpointUrl')
    .isURL({ require_protocol: true })
    .withMessage('Valid endpoint URL is required'),
  body('eventTypes').optional().isArray().withMessage('Event types must be an array'),
  integrationController.createWebhook
);

router.get(
  '/webhooks',
  protect,
  restrictTo('Merchant', 'Admin'),
  integrationController.listWebhooks
);

// External shipment API (API key protected)
router.post(
  '/shipments',
  authenticateIntegration,
  requireIntegrationScope('shipments:write'),
  // Required fields
  body('origin.address').notEmpty().withMessage('Origin address is required'),
  body('destination.address').notEmpty().withMessage('Destination address is required'),
  body('cargoDetails.description').notEmpty().withMessage('Cargo description is required'),
  body('cargoDetails.weight')
    .notEmpty()
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Cargo weight must be between 0.01 and 100000'),
  // Optional pricing validation
  body('pricing.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'EGP'])
    .withMessage('Currency must be one of: USD, EUR, GBP, EGP'),
  body('pricing.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pricing amount must be a non-negative number'),
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
  // Pricing type validation
  body('pricingType')
    .optional()
    .isIn(['BIDDING', 'FIXED_PRICE'])
    .withMessage('Pricing type must be BIDDING or FIXED_PRICE'),
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
  // Estimated dates validation
  body('estimatedPickupDate')
    .optional()
    .isISO8601()
    .withMessage('Estimated pickup date must be a valid ISO 8601 date'),
  body('estimatedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery date must be a valid ISO 8601 date'),
  integrationController.createShipmentViaIntegration
);

router.get(
  '/shipments/:id',
  authenticateIntegration,
  requireIntegrationScope('shipments:read'),
  integrationController.getShipmentStatusViaIntegration
);

module.exports = router;
