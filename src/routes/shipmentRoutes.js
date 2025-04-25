const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipment/shipmentController');
const applicationController = require('../controllers/application/applicationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply protection middleware to all routes
router.use(protect);

// Create a new shipment (Merchant only)
router.post(
  '/',
  restrictTo('Merchant'),
  [
    body('origin.address').notEmpty().withMessage('Origin address is required'),
    body('destination.address').notEmpty().withMessage('Destination address is required'),
    body('cargoDetails.description').notEmpty().withMessage('Cargo description is required'),
    body('cargoDetails.weight').isNumeric().withMessage('Cargo weight must be a number')
  ],
  shipmentController.createShipment
);

// Get all shipments for the current merchant
router.get('/', restrictTo('Merchant'), shipmentController.getMyShipments);

// Search for shipments with filters
router.get('/search', restrictTo('Merchant'), shipmentController.searchShipments);

// Get all applications for a specific shipment
router.get('/:shipmentId/applications', restrictTo('Merchant'), applicationController.getShipmentApplications);

// Get a single shipment by ID (accessible by Merchant, TruckOwner, or assigned Driver)
router.get('/:id', shipmentController.getShipment);

// Update a shipment (Merchant only, and only if status is REQUESTED)
router.patch(
  '/:id',
  restrictTo('Merchant'),
  [
    body('origin.address').optional().notEmpty().withMessage('Origin address cannot be empty'),
    body('destination.address').optional().notEmpty().withMessage('Destination address cannot be empty'),
    body('cargoDetails.description').optional().notEmpty().withMessage('Cargo description cannot be empty'),
    body('cargoDetails.weight').optional().isNumeric().withMessage('Cargo weight must be a number')
  ],
  shipmentController.updateShipment
);

// Cancel a shipment (Merchant only)
router.patch(
  '/:id/cancel',
  restrictTo('Merchant'),
  [
    body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
  ],
  shipmentController.cancelShipment
);

// Add timeline entry to a shipment (accessible by TruckOwner or assigned Driver)
router.post(
  '/:id/timeline',
  [
    body('status').notEmpty().withMessage('Status is required'),
    body('note').optional().notEmpty().withMessage('Note cannot be empty')
  ],
  shipmentController.addTimelineEntry
);

module.exports = router; 