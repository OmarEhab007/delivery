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

module.exports = router; 