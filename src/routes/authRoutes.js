const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Validation middleware for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

// Merchant registration
router.post(
  '/register/merchant',
  [
    ...registerValidation,
    body('role').equals('Merchant').withMessage('Role must be Merchant')
  ],
  authController.registerMerchant
);

// Truck Owner registration
router.post(
  '/register/truckOwner',
  [
    ...registerValidation,
    body('role').equals('TruckOwner').withMessage('Role must be TruckOwner'),
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('companyAddress').notEmpty().withMessage('Company address is required')
  ],
  authController.registerTruckOwner
);

// Driver registration (by Truck Owner)
router.post(
  '/register/driver',
  protect,
  restrictTo('TruckOwner'),
  [
    ...registerValidation,
    body('role').equals('Driver').withMessage('Role must be Driver'),
    body('licenseNumber').notEmpty().withMessage('License number is required')
  ],
  authController.registerDriver
);

// Login for all user types
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Get current user
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
