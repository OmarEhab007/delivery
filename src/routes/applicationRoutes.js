const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const applicationController = require('../controllers/application/applicationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply protection middleware to all routes
router.use(protect);

// ===== IMPORTANT: Define static routes BEFORE dynamic routes =====

// Create a new application (TruckOwner only)
router.post(
  '/',
  restrictTo('TruckOwner'),
  [
    body('shipmentId').notEmpty().withMessage('Shipment ID is required'),
    body('truckId').notEmpty().withMessage('Truck ID is required'),
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('bidDetails.price').isNumeric().withMessage('Bid price must be a number'),
    body('bidDetails.currency').optional().isString().withMessage('Currency must be a string'),
    body('bidDetails.notes').optional().isString().withMessage('Notes must be a string'),
    body('bidDetails.validUntil').optional().isISO8601().withMessage('Valid until date must be a valid date')
  ],
  applicationController.createApplication
);

// Get all applications for the current truck owner
router.get('/', restrictTo('TruckOwner'), applicationController.getMyApplications);

// Get my applications (with optional status filter)
// IMPORTANT: This must be defined BEFORE the /:id route
router.get('/my', restrictTo('TruckOwner'), applicationController.getMyApplications);

// ===== Dynamic routes with parameters below =====

// Get a single application by ID
router.get('/:id', applicationController.getApplication);

// Update an application (TruckOwner only, and only if status is PENDING)
router.patch(
  '/:id',
  restrictTo('TruckOwner'),
  [
    body('truckId').optional().notEmpty().withMessage('Truck ID cannot be empty'),
    body('driverId').optional().notEmpty().withMessage('Driver ID cannot be empty'),
    body('bidDetails.price').optional().isNumeric().withMessage('Bid price must be a number'),
    body('bidDetails.currency').optional().isString().withMessage('Currency must be a string'),
    body('bidDetails.notes').optional().isString().withMessage('Notes must be a string'),
    body('bidDetails.validUntil').optional().isISO8601().withMessage('Valid until date must be a valid date')
  ],
  applicationController.updateApplication
);

// Cancel an application (TruckOwner only)
router.patch(
  '/:id/cancel',
  restrictTo('TruckOwner'),
  applicationController.cancelApplication
);

// Accept an application (Merchant only)
router.patch(
  '/:id/accept',
  restrictTo('Merchant'),
  applicationController.acceptApplication
);

// Reject an application (Merchant only)
router.patch(
  '/:id/reject',
  restrictTo('Merchant'),
  [
    body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
  ],
  applicationController.rejectApplication
);

module.exports = router; 