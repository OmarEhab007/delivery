const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const truckOwnerController = require('../controllers/truck/truckOwnerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply middleware to all routes - only TruckOwner can access
router.use(protect);
router.use(restrictTo('TruckOwner'));

// Get all shipments assigned to this truck owner
router.get('/shipments', truckOwnerController.getMyShipments);

// Get available shipments for bidding
router.get('/shipments/available', truckOwnerController.getAvailableShipments);

// Assign shipment to driver
router.patch(
  '/shipments/:shipmentId/assign',
  [
    body('driverId').notEmpty().withMessage('Driver ID is required')
  ],
  truckOwnerController.assignShipmentToDriver
);

// Get available drivers and trucks for assignment
router.get('/drivers/available', truckOwnerController.getAvailableDrivers);
router.get('/trucks/available', truckOwnerController.getAvailableTrucks);

// Get all drivers (with optional isAvailable filter)
router.get('/drivers', truckOwnerController.getAllDrivers);

// Update driver details
router.patch(
  '/drivers/:id',
  [
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('driverStatus').optional().isString().withMessage('driverStatus must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('licenseNumber').optional().isString().withMessage('License number must be a string')
  ],
  truckOwnerController.updateDriver
);

module.exports = router; 