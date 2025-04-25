const { validationResult } = require('express-validator');
const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

/**
 * Update user profile (except password)
 * @route PATCH /api/v1/users/updateMe
 * @access Private
 */
exports.updateMe = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if user is trying to update password
    if (req.body.password) {
      return next(new ApiError('This route is not for password updates. Please use /auth/updatePassword', 400));
    }
    
    // Filter out fields that should not be updated
    const filteredBody = {};
    const allowedFields = ['name', 'email', 'phone'];
    
    // Add role-specific allowed fields
    if (req.user.role === 'TruckOwner') {
      allowedFields.push('companyName', 'companyAddress');
    } else if (req.user.role === 'Driver') {
      allowedFields.push('licenseNumber');
    }
    
    // Create filtered body with only allowed fields
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        filteredBody[field] = req.body[field];
      }
    });
    
    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account (soft delete)
 * @route DELETE /api/v1/users/deleteMe
 * @access Private
 */
exports.deleteMe = async (req, res, next) => {
  try {
    // Soft delete the user (set active to false)
    await User.findByIdAndUpdate(req.user.id, { active: false });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Admin only)
 * @route GET /api/v1/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Get all active users
    const users = await User.find({ active: true });
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get drivers for a truck owner
 * @route GET /api/v1/users/myDrivers
 * @access Private/TruckOwner
 */
exports.getMyDrivers = async (req, res, next) => {
  try {
    // Get all drivers for the truck owner
    const drivers = await User.find({
      role: 'Driver',
      ownerId: req.user.id,
      active: true
    });
    
    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: {
        drivers
      }
    });
  } catch (error) {
    next(error);
  }
}; 