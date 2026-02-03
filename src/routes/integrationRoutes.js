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
router.post('/credentials', protect, restrictTo('Merchant', 'Admin'), integrationController.createCredential);
router.get('/credentials', protect, restrictTo('Merchant', 'Admin'), integrationController.listCredentials);

// Webhook management (JWT-protected)
router.post(
  '/webhooks',
  protect,
  restrictTo('Merchant', 'Admin'),
  body('endpointUrl').isURL({ require_protocol: true }).withMessage('Valid endpoint URL is required'),
  body('eventTypes').optional().isArray().withMessage('Event types must be an array'),
  integrationController.createWebhook
);

router.get('/webhooks', protect, restrictTo('Merchant', 'Admin'), integrationController.listWebhooks);

// External shipment API (API key protected)
router.post(
  '/shipments',
  authenticateIntegration,
  requireIntegrationScope('shipments:write'),
  body('origin.address').notEmpty().withMessage('Origin address is required'),
  body('destination.address').notEmpty().withMessage('Destination address is required'),
  body('cargoDetails.description').notEmpty().withMessage('Cargo description is required'),
  body('cargoDetails.weight')
    .notEmpty()
    .isFloat({ min: 0.01 })
    .withMessage('Cargo weight is required'),
  integrationController.createShipmentViaIntegration
);

router.get(
  '/shipments/:id',
  authenticateIntegration,
  requireIntegrationScope('shipments:read'),
  integrationController.getShipmentStatusViaIntegration
);

module.exports = router;
