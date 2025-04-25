const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// User profile management
router.patch(
  '/updateMe',
  protect,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
    // TruckOwner specific validations
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('companyAddress').optional().notEmpty().withMessage('Company address cannot be empty'),
    // Driver specific validations
    body('licenseNumber').optional().notEmpty().withMessage('License number cannot be empty')
  ],
  userController.updateMe
);

// Delete user profile (soft delete)
router.delete('/deleteMe', protect, userController.deleteMe);

// Get all users (future: for admin only)
router.get('/', protect, userController.getAllUsers);

// Get all drivers for a truck owner
router.get('/myDrivers', protect, restrictTo('TruckOwner'), userController.getMyDrivers);

module.exports = router; 