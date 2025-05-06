const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const driverController = require('../controllers/driver/driverController');

// All routes in this router are protected and restricted to Driver role
router.use(protect);
router.use(restrictTo('Driver'));

// Get driver profile
router.get('/profile', driverController.getProfile);

// Get current truck assignment
router.get('/truck', driverController.getCurrentTruck);

// Shipment routes - organized by type
router.get('/shipments', driverController.getActiveShipments); // Legacy route - keep for backward compatibility
router.get('/shipments/active', driverController.getActiveShipments);
router.get('/shipments/assigned', driverController.getAssignedShipments);
router.get('/shipments/history', driverController.getShipmentHistory);

// Start delivery
router.post(
  '/shipments/:shipmentId/start',
  [
    body('notes').optional(),
    body('startOdometer').isNumeric().withMessage('Odometer reading must be a number')
  ],
  driverController.startDelivery
);

// Complete delivery
router.post(
  '/shipments/:shipmentId/complete',
  [
    body('notes').optional(),
    body('endOdometer').isNumeric().withMessage('Odometer reading must be a number'),
    body('recipientName').notEmpty().withMessage('Recipient name is required'),
    body('recipientSignature').optional()
  ],
  driverController.completeDelivery
);

// Report issue
router.post(
  '/shipments/:shipmentId/issues',
  [
    body('issueType').notEmpty().withMessage('Issue type is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 })
  ],
  driverController.reportIssue
);

// Upload proof of delivery
router.post(
  '/shipments/:shipmentId/proof',
  driverController.uploadProofOfDelivery
);

// Get delivery route
router.get('/route/:shipmentId', driverController.getDeliveryRoute);

// Update shipment status
router.patch(
  '/shipments/:shipmentId/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
  ],
  driverController.updateShipmentStatus
);

// Driver dashboard
router.get('/dashboard', driverController.getDriverDashboard);

// Driver check-in
router.post(
  '/checkin',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('truckCondition').notEmpty().withMessage('Truck condition is required'),
    body('fuelLevel').isInt({ min: 0, max: 100 }).withMessage('Fuel level must be between 0-100')
  ],
  driverController.driverCheckin
);

// Driver check-out
router.post(
  '/checkout',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('totalMiles').isNumeric().withMessage('Total miles must be a number'),
    body('fuelLevel').isInt({ min: 0, max: 100 }).withMessage('Fuel level must be between 0-100')
  ],
  driverController.driverCheckout
);

// Update availability status
router.patch(
  '/availability',
  [
    body('isAvailable')
      .isBoolean()
      .withMessage('Availability status must be a boolean')
  ],
  driverController.updateAvailability
);

// Update driver status (more detailed than availability)
router.patch(
  '/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
  ],
  driverController.updateDriverStatus
);

// Update location - support both PATCH and POST methods
const locationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude value'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude value')
];

router.patch('/location', locationValidation, driverController.updateLocation);
router.post('/location', locationValidation, driverController.updateLocation);

module.exports = router; 