const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Import admin controllers
const adminController = require('../controllers/admin/adminController');
const adminShipmentController = require('../controllers/admin/adminShipmentController');
const adminApplicationController = require('../controllers/admin/adminApplicationController');
const adminTruckController = require('../controllers/admin/adminTruckController');

// All routes in this file are protected and restricted to Admin role
router.use(protect);
router.use(restrictTo('Admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management routes
router.route('/users')
  .get(adminController.getAllUsers)
  .post([
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role').isIn(['Admin', 'Merchant', 'TruckOwner', 'Driver']).withMessage('Invalid user role')
  ], adminController.createUser);

router.route('/users/:id')
  .get(adminController.getUserById)
  .put(adminController.updateUser)
  .delete(adminController.deleteUser);

// Shipment management routes
router.route('/shipments')
  .get(adminShipmentController.getAllShipments);

router.route('/shipments/:id')
  .get(adminShipmentController.getShipmentById)
  .put(adminShipmentController.updateShipment)
  .delete(adminShipmentController.deleteShipment);

router.patch('/shipments/:id/status', 
  [
    body('status').isIn(['REQUESTED', 'CONFIRMED', 'IN_TRANSIT', 'AT_BORDER', 'DELIVERED', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid shipment status')
  ],
  adminShipmentController.changeShipmentStatus
);

// Application management routes
router.route('/applications')
  .get(adminApplicationController.getAllApplications);

router.route('/applications/:id')
  .get(adminApplicationController.getApplicationById)
  .delete(adminApplicationController.deleteApplication);

router.patch('/applications/:id/status',
  [
    body('status').isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'])
      .withMessage('Invalid application status')
  ],
  adminApplicationController.updateApplicationStatus
);

router.get('/applications/stats', adminApplicationController.getApplicationStats);

// Truck management routes
router.route('/trucks')
  .get(adminTruckController.getAllTrucks)
  .post([
    body('licensePlate').notEmpty().withMessage('License plate is required'),
    body('truckType').notEmpty().withMessage('Truck type is required'),
    body('capacity').notEmpty().withMessage('Capacity is required'),
    body('ownerId').notEmpty().withMessage('Owner ID is required')
  ], adminTruckController.createTruck);

router.route('/trucks/:id')
  .get(adminTruckController.getTruckById)
  .put(adminTruckController.updateTruck)
  .delete(adminTruckController.deleteTruck);

router.patch('/trucks/:id/status',
  [
    body('status').isIn(['Available', 'Unavailable', 'InMaintenance', 'OnRoute'])
      .withMessage('Invalid truck status')
  ],
  adminTruckController.changeTruckStatus
);

module.exports = router; 