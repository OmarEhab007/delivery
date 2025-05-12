const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const { ApiSuccess } = require('../../middleware/apiSuccess');

/**
 * Generate JWT token
 * @param {string} id User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Use a valid expiration time (30 days)
  });
};

/**
 * Register a merchant
 * @route POST /api/v1/auth/register/merchant
 * @access Public
 */
exports.registerMerchant = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'Merchant',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a truck owner
 * @route POST /api/v1/auth/register/truckOwner
 * @access Public
 */
exports.registerTruckOwner = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, companyName, companyAddress } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'TruckOwner',
      companyName,
      companyAddress,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a driver (by truck owner)
 * @route POST /api/v1/auth/register/driver
 * @access Private/TruckOwner
 */
exports.registerDriver = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, licenseNumber } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError('User already exists', 400));
    }

    // Create driver with reference to truck owner
    const driver = await User.create({
      name,
      email,
      password,
      phone,
      role: 'Driver',
      ownerId: req.user._id, // This comes from the protect middleware
      licenseNumber,
    });

    res.status(201).json({
      status: 'success',
      data: {
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: driver.role,
          licenseNumber: driver.licenseNumber,
          ownerId: driver.ownerId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user
 * @route GET /api/v1/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already available in req (from protect middleware)
    const { user } = req;

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - Send password reset token
 * @route POST /api/v1/auth/forgotPassword
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError('There is no user with that email address', 404));
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before saving to database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to database with expiry time (10 minutes)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token (implement email service)
    // For now, returning token in response (only for development)

    logger.info(`Password reset token generated for user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      // Remove in production:
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * @route PATCH /api/v1/auth/resetPassword/:token
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError('Token is invalid or has expired', 400));
    }

    // Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT token
    const newToken = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      token: newToken,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user password
 * @route PATCH /api/v1/auth/updatePassword
 * @access Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new admin user
 * @route POST /api/auth/register/admin
 * @access Private (Admin only)
 */
const registerAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, adminPermissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError('User with this email already exists', 400));
  }

  // Create a new admin user
  const admin = await User.create({
    name,
    email,
    password,
    phone,
    role: 'Admin',
    adminPermissions: adminPermissions || ['FULL_ACCESS'],
  });

  // Generate JWT token
  const token = generateToken(admin._id);

  // Return success response with token
  return ApiSuccess(
    res,
    {
      message: 'Admin registered successfully',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminPermissions: admin.adminPermissions,
      },
      token,
    },
    201
  );
});

/**
 * Register an admin (for testing purposes only)
 * @route POST /api/auth/register/testadmin
 * @access Public
 */
exports.registerTestAdmin = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError('User already exists', 400));
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'Admin',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a CSRF token for the client
 * @route GET /api/auth/csrf-token
 * @access Public
 */
exports.getCsrfToken = (req, res) => {
  // The csrfToken() function is added to the request object by the csurf middleware
  const token = req.csrfToken();

  // Set the token in the response header
  res.set('X-CSRF-Token', token);

  // Send a 200 OK response
  res.status(200).json({
    success: true,
    message: 'CSRF token generated',
  });
};

// Export all controller functions
exports.registerAdmin = registerAdmin;
