/**
 * Authentication Middleware
 *
 * Provides JWT-based authentication and role-based authorization.
 * Verifies access tokens and checks user permissions.
 *
 * @module middleware/authMiddleware
 * @requires jsonwebtoken
 * @requires ../models/User
 * @requires ./errorHandler
 */
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const { ApiError } = require('./errorHandler');

/**
 * Protect routes - Verify JWT token and attach user to request
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {ApiError} 401 - If token is missing, invalid, or expired
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new ApiError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError('The user belonging to this token no longer exists.', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT-specific errors with proper 401 status
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

/**
 * Restrict routes to specific roles
 * @function
 * @param {...string} roles - Array of allowed roles (Admin, Merchant, TruckOwner, Driver)
 * @returns {Function} Express middleware function
 * @throws {ApiError} 403 - If user's role is not in the allowed roles list
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * Alias for restrictTo with backward compatibility
 * Accepts either array or rest parameters
 * @function
 * @param {string[]|string} roles - Array of roles or single role
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (roles) => {
  // Convert array to rest parameters if an array is passed
  return restrictTo(...(Array.isArray(roles) ? roles : [roles]));
};

/**
 * Alias for protect for backward compatibility
 * @function
 */
const authenticateToken = protect;

module.exports = {
  protect,
  restrictTo,
  authenticateToken, // Alias for protect
  authorizeRoles, // Alias for restrictTo
};
