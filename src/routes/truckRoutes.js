const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const truckController = require('../controllers/truck/truckController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply middleware to all routes - only TruckOwner can access
router.use(protect);
router.use(restrictTo('TruckOwner'));

// Create a new truck
router.post(
  '/',
  [
    body('plateNumber').notEmpty().withMessage('Plate number is required'),
    body('model').notEmpty().withMessage('Truck model is required'),
    body('capacity').isNumeric().withMessage('Capacity must be a number'),
    body('year').isNumeric().withMessage('Year must be a number')
  ],
  truckController.createTruck
);

// Get all trucks for the current truck owner
router.get('/', truckController.getMyTrucks);

// Search for trucks with filters
router.get('/search', truckController.searchTrucks);

// Get, update, and delete a truck by ID
router.get('/:id', truckController.getTruck);

router.patch(
  '/:id',
  [
    body('plateNumber').optional().notEmpty().withMessage('Plate number cannot be empty'),
    body('model').optional().notEmpty().withMessage('Truck model cannot be empty'),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
    body('year').optional().isNumeric().withMessage('Year must be a number')
  ],
  truckController.updateTruck
);

router.delete('/:id', truckController.deleteTruck);

// Assign driver to truck
router.patch('/:truckId/assign/:driverId', truckController.assignDriver);

module.exports = router; 