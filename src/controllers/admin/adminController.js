const User = require('../../models/User');
const { Application } = require('../../models/Application');
const Truck = require('../../models/Truck');
const { Shipment } = require('../../models/Shipment');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');
const {
  UserRegistrationRequest,
  UserRegistrationState,
} = require('../../models/UserRegistrationRequest');
const db = require('../../utils/db');
const logger = require('../../utils/logger');
const {
  sendRegistrationApprovedEmail,
  sendRejectionEmail,
  maskEmail,
} = require('../../services/email/emailService');

/**
 * Get all users in the system
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const { role } = req.query;

  const filter = {};
  if (role) filter.role = role;

  const users = await User.find(filter).select('-password').skip(skip).limit(limit);

  const total = await User.countDocuments(filter);

  return ApiSuccess(res, {
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

/**
 * Get user by ID
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  return ApiSuccess(res, { user });
});

/**
 * Update user by ID
 * @route PUT /api/admin/users/:id
 * @access Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, role, adminPermissions, active } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Update basic fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (typeof active === 'boolean') user.active = active;

  // Only update role and permissions if they are provided and valid
  if (role && ['Admin', 'Merchant', 'TruckOwner', 'Driver'].includes(role)) {
    user.role = role;
  }

  if (role === 'Admin' && adminPermissions && Array.isArray(adminPermissions)) {
    // Validate permissions
    const validPermissions = [
      'FULL_ACCESS',
      'USER_MANAGEMENT',
      'SHIPMENT_MANAGEMENT',
      'TRUCK_MANAGEMENT',
      'APPLICATION_MANAGEMENT',
    ];
    const filteredPermissions = adminPermissions.filter((permission) =>
      validPermissions.includes(permission)
    );

    user.adminPermissions = filteredPermissions;
  }

  await user.save();

  return ApiSuccess(res, {
    message: 'User updated successfully',
    user: user.toObject({ getters: true, virtuals: true, versionKey: false }),
  });
});

/**
 * Delete user by ID
 * @route DELETE /api/admin/users/:id
 * @access Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  await user.deleteOne();

  return ApiSuccess(res, { message: 'User deleted successfully' });
});

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard
 * @access Private (Admin only)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  // User statistics
  const totalUsers = await User.countDocuments();
  const totalMerchants = await User.countDocuments({ role: 'Merchant' });
  const totalTruckOwners = await User.countDocuments({ role: 'TruckOwner' });
  const totalDrivers = await User.countDocuments({ role: 'Driver' });

  // Calculate user count increase from last month
  const currentDate = new Date();
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(currentDate.getMonth() - 1);

  const thisMonthUsers = await User.countDocuments({
    createdAt: { $gte: lastMonthDate },
  });

  const twoMonthsAgoDate = new Date();
  twoMonthsAgoDate.setMonth(currentDate.getMonth() - 2);

  const lastMonthUsers = await User.countDocuments({
    createdAt: {
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate,
    },
  });

  const userIncrease =
    lastMonthUsers === 0
      ? 100
      : Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100);

  // Truck statistics
  const totalTrucks = await Truck.countDocuments();
  const availableTrucks = await Truck.countDocuments({ status: 'Available' });

  // Calculate truck count increase from last month
  const thisMonthTrucks = await Truck.countDocuments({
    createdAt: { $gte: lastMonthDate },
  });

  const lastMonthTrucks = await Truck.countDocuments({
    createdAt: {
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate,
    },
  });

  const truckIncrease =
    lastMonthTrucks === 0
      ? 100
      : Math.round(((thisMonthTrucks - lastMonthTrucks) / lastMonthTrucks) * 100);

  // Shipment statistics
  const totalShipments = await Shipment.countDocuments();
  const pendingShipments = await Shipment.countDocuments({ status: 'REQUESTED' });
  const inTransitShipments = await Shipment.countDocuments({ status: 'IN_TRANSIT' });
  const deliveredShipments = await Shipment.countDocuments({ status: 'DELIVERED' });
  const confirmedShipments = await Shipment.countDocuments({ status: 'CONFIRMED' });
  const cancelledShipments = await Shipment.countDocuments({ status: 'CANCELLED' });

  // Calculate shipment count increase from last month
  const thisMonthShipments = await Shipment.countDocuments({
    createdAt: { $gte: lastMonthDate },
  });

  const lastMonthShipments = await Shipment.countDocuments({
    createdAt: {
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate,
    },
  });

  const shipmentIncrease =
    lastMonthShipments === 0
      ? 100
      : Math.round(((thisMonthShipments - lastMonthShipments) / lastMonthShipments) * 100);

  // Application statistics
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({ status: 'PENDING' });
  const approvedApplications = await Application.countDocuments({ status: 'APPROVED' });
  const rejectedApplications = await Application.countDocuments({ status: 'REJECTED' });

  // Calculate application count increase from last month
  const thisMonthApplications = await Application.countDocuments({
    createdAt: { $gte: lastMonthDate },
  });

  const lastMonthApplications = await Application.countDocuments({
    createdAt: {
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate,
    },
  });

  const applicationIncrease =
    lastMonthApplications === 0
      ? 100
      : Math.round(((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100);

  // Recent shipments
  const recentShipments = await Shipment.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('merchantId', 'name email')
    .populate('assignedTruckId');

  // Get shipment status distribution for pie chart
  const statusDistribution = [
    { status: 'REQUESTED', count: pendingShipments },
    { status: 'CONFIRMED', count: confirmedShipments },
    { status: 'IN_TRANSIT', count: inTransitShipments },
    { status: 'DELIVERED', count: deliveredShipments },
    { status: 'CANCELLED', count: cancelledShipments },
  ];

  // Get monthly data for line chart (last 6 months)
  const monthlyShipmentData = [];
  const monthlyUserData = [];

  // Month names for display
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get data for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - i);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Count shipments for this month
    const shipmentCount = await Shipment.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Count users registered this month
    const userCount = await User.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    // Add data points
    monthlyShipmentData.push({
      month: monthNames[startDate.getMonth()],
      count: shipmentCount,
    });

    monthlyUserData.push({
      month: monthNames[startDate.getMonth()],
      count: userCount,
    });
  }

  // Recent activity
  const recentActivity = [];

  // Get recent user registrations
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3).select('name createdAt');

  recentUsers.forEach((user) => {
    recentActivity.push({
      id: `user-${user._id}`,
      type: 'user',
      action: 'registered',
      user: user.name,
      time: getTimeAgo(user.createdAt),
    });
  });

  // Get recent shipment updates
  const recentShipmentUpdates = await Shipment.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('merchantId', 'name')
    .select('status updatedAt merchantId');

  recentShipmentUpdates.forEach((shipment) => {
    recentActivity.push({
      id: `shipment-${shipment._id}`,
      type: 'shipment',
      action: getActionFromStatus(shipment.status),
      user: shipment.merchantId ? shipment.merchantId.name : 'System',
      time: getTimeAgo(shipment.updatedAt),
    });
  });

  // Sort by date (most recent first)
  recentActivity.sort((a, b) => {
    return new Date(b.time) - new Date(a.time);
  });

  // Limit to 5 most recent activities
  recentActivity.splice(5);

  return ApiSuccess(res, {
    users: {
      total: totalUsers,
      merchants: totalMerchants,
      truckOwners: totalTruckOwners,
      drivers: totalDrivers,
      increase: userIncrease,
    },
    trucks: {
      total: totalTrucks,
      available: availableTrucks,
      increase: truckIncrease,
    },
    shipments: {
      total: totalShipments,
      pending: pendingShipments,
      inTransit: inTransitShipments,
      delivered: deliveredShipments,
      increase: shipmentIncrease,
      recent: recentShipments,
      statusDistribution,
      monthlyData: monthlyShipmentData,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      increase: applicationIncrease,
    },
    monthlyUserData,
    recentActivity,
  });
});

/**
 * Get all user registration requests
 * @route GET /api/admin/registration-requests
 * @access Private (Admin only)
 */
const getUserRegistrationRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.state) {
    filter.state = req.query.state;
  }
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const requests = await UserRegistrationRequest.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email role');

  const total = await UserRegistrationRequest.countDocuments(filter);

  return ApiSuccess(res, {
    requests,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

/**
 * Approve a user registration request
 * @route PUT /api/admin/registration-requests/:id/approve
 * @access Private (Admin only)
 */
const approveUserRegistrationRequest = asyncHandler(async (req, res, next) => {
  const request = await UserRegistrationRequest.findById(req.params.id);

  if (!request) {
    return next(new ApiError('User registration request not found', 404));
  }

  if (request.state !== UserRegistrationState.PENDING) {
    return next(new ApiError('Registration request is not pending', 400));
  }

  const { payload, role } = request;

  const userExists = await User.findOne({ email: payload.email });
  if (userExists) {
    return next(new ApiError('User with this email already exists', 400));
  }

  const userData = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    phone: payload.phone,
    role,
    approvalStatus: 'APPROVED',
  };

  if (role === 'TruckOwner') {
    userData.companyName = payload.companyName;
    userData.companyAddress = payload.companyAddress;
  }

  if (role === 'Driver') {
    userData.licenseNumber = payload.licenseNumber;
    userData.ownerId = payload.ownerId;
  }
  const transactionsSupported = await db.supportsTransactions();

  const adminId = req.user._id;

  try {
    const result = transactionsSupported
      ? await approveRegistrationWithTransaction({ request, userData, adminId })
      : await approveRegistrationWithoutTransaction({ request, userData, adminId });

    // Send registration approved email
    try {
      await sendRegistrationApprovedEmail(result.user);
      logger.info(`Registration approval email sent to: ${maskEmail(result.user.email)}`);
    } catch (emailError) {
      // Log email error but don't fail the request
      logger.error(
        `Failed to send registration approval email to: ${maskEmail(result.user.email)}`,
        {
          error: emailError.message,
          userId: result.user._id,
        }
      );
    }

    return ApiSuccess(res, {
      message: 'Registration request approved successfully',
      user: result.user.toObject({ getters: true, virtuals: true, versionKey: false }),
      fallback: result.fallback,
    });
  } catch (error) {
    return next(error);
  }
});

const approveRegistrationWithTransaction = async ({ request, userData, adminId }) => {
  const session = await User.startSession();

  try {
    session.startTransaction();

    const [user] = await User.create([userData], { session });

    await updateApprovedRequest({ request, adminId, session });

    await session.commitTransaction();
    session.endSession();

    return { user, fallback: false };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const approveRegistrationWithoutTransaction = async ({ request, userData, adminId }) => {
  const user = await User.create(userData);

  try {
    await updateApprovedRequest({ request, adminId });
  } catch (error) {
    logger.warn(
      `Failed to update registration request ${request._id} after creating user ${user._id}. Rolling back user creation.`
    );
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  return { user, fallback: true };
};

const updateApprovedRequest = async ({ request, adminId, session }) => {
  const reviewedAt = new Date();

  const updateOperations = {
    $set: {
      state: UserRegistrationState.APPROVED,
      reviewedBy: adminId,
      reviewedAt,
    },
    $unset: {
      'payload.password': '',
    },
  };

  const options = {};
  if (session) {
    options.session = session;
  }

  await UserRegistrationRequest.updateOne({ _id: request._id }, updateOperations, options);

  request.state = UserRegistrationState.APPROVED;
  request.reviewedBy = adminId;
  request.reviewedAt = reviewedAt;
  if (request.payload) {
    delete request.payload.password;
  }
};

/**
 * Reject a user registration request
 * @route PUT /api/admin/registration-requests/:id/reject
 * @access Private (Admin only)
 */
const rejectUserRegistrationRequest = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const request = await UserRegistrationRequest.findById(req.params.id);

  if (!request) {
    return next(new ApiError('User registration request not found', 404));
  }

  if (request.state !== UserRegistrationState.PENDING) {
    return next(new ApiError('Registration request is not pending', 400));
  }

  request.state = UserRegistrationState.REJECTED;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.rejectionReason = reason;

  await request.save();

  // Send registration rejection email
  try {
    await sendRejectionEmail(request.payload.email, request.payload.name, reason);
    logger.info(`Registration rejection email sent to: ${maskEmail(request.payload.email)}`);
  } catch (emailError) {
    // Log email error but don't fail the request
    logger.error(
      `Failed to send registration rejection email to: ${maskEmail(request.payload.email)}`,
      {
        error: emailError.message,
        requestId: request._id,
      }
    );
  }

  return ApiSuccess(res, {
    message: 'Registration request rejected successfully',
    request,
  });
});

// Helper function to convert timestamp to "X time ago" format
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
};

// Helper function to get action text from status
const getActionFromStatus = (status) => {
  switch (status) {
    case 'REQUESTED':
      return 'requested';
    case 'CONFIRMED':
      return 'confirmed';
    case 'IN_TRANSIT':
      return 'moved';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'updated';
  }
};

/**
 * Create a new user (by Admin)
 * @route POST /api/admin/users
 * @access Private (Admin only)
 */
const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role, adminPermissions } = req.body;

  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError('User with this email already exists', 400));
  }

  // User data
  const userData = {
    name,
    email,
    password,
    phone,
    role,
  };

  // Add role-specific fields
  if (role === 'TruckOwner') {
    const { companyName, companyAddress } = req.body;
    if (!companyName || !companyAddress) {
      return next(new ApiError('Company name and address are required for Truck Owner', 400));
    }
    userData.companyName = companyName;
    userData.companyAddress = companyAddress;
  } else if (role === 'Driver') {
    const { licenseNumber, ownerId } = req.body;
    if (!licenseNumber || !ownerId) {
      return next(new ApiError('License number and owner ID are required for Driver', 400));
    }
    userData.licenseNumber = licenseNumber;
    userData.ownerId = ownerId;
  } else if (role === 'Admin' && adminPermissions) {
    userData.adminPermissions = adminPermissions;
  }

  // Create user
  const user = await User.create(userData);

  return ApiSuccess(
    res,
    {
      message: 'User created successfully',
      user: user.toObject({ getters: true, virtuals: true, versionKey: false }),
    },
    201
  );
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  createUser,
  getUserRegistrationRequests,
  approveUserRegistrationRequest,
  rejectUserRegistrationRequest,
};
