const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const otpService = require('../../services/auth/otpService');
const {
  UserRegistrationRequest,
  UserRegistrationState,
} = require('../../models/UserRegistrationRequest');

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

    const request = await UserRegistrationRequest.create({
      role: 'Merchant',
      payload: {
        name,
        email,
        password,
        phone,
      },
    });

    res.status(202).json({
      status: 'success',
      message: 'Registration submitted for admin approval',
      data: {
        requestId: request._id,
        state: request.state,
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

    const request = await UserRegistrationRequest.create({
      role: 'TruckOwner',
      payload: {
        name,
        email,
        password,
        phone,
        companyName,
        companyAddress,
      },
    });

    res.status(202).json({
      status: 'success',
      message: 'Registration submitted for admin approval',
      data: {
        requestId: request._id,
        state: request.state,
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

    const request = await UserRegistrationRequest.create({
      role: 'Driver',
      submittedBy: req.user._id,
      payload: {
        name,
        email,
        password,
        phone,
        licenseNumber,
        ownerId: req.user._id,
      },
    });

    res.status(202).json({
      status: 'success',
      message: 'Driver registration submitted for admin approval',
      data: {
        requestId: request._id,
        state: request.state,
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

    // SEC-011: Check if user account is active
    // OWASP A01:2021 - Broken Access Control
    if (user.active === false) {
      return next(new ApiError('Your account has been deactivated. Please contact support.', 403));
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
 * Request OTP login code
 * @route POST /api/auth/otp/request
 * @access Public
 */
exports.requestOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    if (user.active === false) {
      return next(new ApiError('User account is inactive', 403));
    }

    const now = new Date();

    if (!otpService.canSendNewOtp(user.otp, now)) {
      const retryAfter =
        otpService.getResendIntervalMs() -
        (now.getTime() - new Date(user.otp.lastSentAt).getTime());
      res.setHeader('Retry-After', Math.ceil(retryAfter / 1000));
      return next(new ApiError('OTP recently sent. Please wait before requesting again.', 429));
    }

    const code = otpService.generateOtp();
    const codeHash = otpService.hashOtp(code);

    user.otp = {
      codeHash,
      expiresAt: new Date(now.getTime() + otpService.getExpiryMs()),
      attemptCount: 0,
      lastSentAt: now,
      resendCount: user.otp?.resendCount ? user.otp.resendCount + 1 : 1,
    };

    await user.save({ validateBeforeSave: false });

    await otpService.deliverOtp(user.phone, code);

    logger.info(`OTP requested for user ${user._id}`);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login
 * @route POST /api/auth/otp/verify
 * @access Public
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp } = req.body;
    const user = await User.findOne({ phone }).select('+otp.codeHash');

    if (!user || !user.otp || !user.otp.codeHash) {
      return next(new ApiError('Invalid or expired OTP', 400));
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      user.otp = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ApiError('OTP has expired. Please request a new one.', 400));
    }

    if (!otpService.hasAttemptsRemaining(user.otp)) {
      return next(new ApiError('Maximum OTP attempts exceeded. Please request a new code.', 423));
    }

    const isValid = otpService.verifyOtp(otp, user.otp.codeHash);

    if (!isValid) {
      user.otp.attemptCount += 1;
      await user.save({ validateBeforeSave: false });
      return next(new ApiError('Invalid OTP. Please try again.', 400));
    }

    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

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

    // SEC-008: Only return reset token in development environment
    // OWASP A01:2021 - Broken Access Control
    const response = {
      status: 'success',
      message: 'Token sent to email',
    };

    // Only include token in development for testing purposes
    if (process.env.NODE_ENV === 'development') {
      response.resetToken = resetToken;
    }

    res.status(200).json(response);
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
