const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token and attach user to request
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
    next(error);
  }
};

/**
 * Restrict routes to specific roles
 * @param  {...string} roles Array of allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
