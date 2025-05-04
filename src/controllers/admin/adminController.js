const User = require('../../models/User');
const { Application } = require('../../models/Application');
const Truck = require('../../models/Truck');
const { Shipment } = require('../../models/Shipment');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

/**
 * Get all users in the system
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const role = req.query.role;
  
  const filter = {};
  if (role) filter.role = role;
  
  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(limit);
  
  const total = await User.countDocuments(filter);
  
  return ApiSuccess(res, {
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
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
    const validPermissions = ['FULL_ACCESS', 'USER_MANAGEMENT', 'SHIPMENT_MANAGEMENT', 'TRUCK_MANAGEMENT', 'APPLICATION_MANAGEMENT'];
    const filteredPermissions = adminPermissions.filter(permission => 
      validPermissions.includes(permission)
    );
    
    user.adminPermissions = filteredPermissions;
  }
  
  await user.save();
  
  return ApiSuccess(res, { 
    message: 'User updated successfully',
    user: user.toObject({ getters: true, virtuals: true, versionKey: false })
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
    createdAt: { $gte: lastMonthDate }
  });
  
  const twoMonthsAgoDate = new Date();
  twoMonthsAgoDate.setMonth(currentDate.getMonth() - 2);
  
  const lastMonthUsers = await User.countDocuments({
    createdAt: { 
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate
    }
  });
  
  const userIncrease = lastMonthUsers === 0 
    ? 100 
    : Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100);
  
  // Truck statistics
  const totalTrucks = await Truck.countDocuments();
  const availableTrucks = await Truck.countDocuments({ status: 'Available' });
  
  // Calculate truck count increase from last month
  const thisMonthTrucks = await Truck.countDocuments({
    createdAt: { $gte: lastMonthDate }
  });
  
  const lastMonthTrucks = await Truck.countDocuments({
    createdAt: { 
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate
    }
  });
  
  const truckIncrease = lastMonthTrucks === 0 
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
    createdAt: { $gte: lastMonthDate }
  });
  
  const lastMonthShipments = await Shipment.countDocuments({
    createdAt: { 
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate
    }
  });
  
  const shipmentIncrease = lastMonthShipments === 0 
    ? 100 
    : Math.round(((thisMonthShipments - lastMonthShipments) / lastMonthShipments) * 100);
  
  // Application statistics
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({ status: 'PENDING' });
  const approvedApplications = await Application.countDocuments({ status: 'APPROVED' });
  const rejectedApplications = await Application.countDocuments({ status: 'REJECTED' });
  
  // Calculate application count increase from last month
  const thisMonthApplications = await Application.countDocuments({
    createdAt: { $gte: lastMonthDate }
  });
  
  const lastMonthApplications = await Application.countDocuments({
    createdAt: { 
      $gte: twoMonthsAgoDate,
      $lt: lastMonthDate
    }
  });
  
  const applicationIncrease = lastMonthApplications === 0 
    ? 100 
    : Math.round(((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100);
  
  // Recent shipments
  const recentShipments = await Shipment.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('merchantId', 'name email')
    .populate('truckId');
  
  // Get shipment status distribution for pie chart
  const statusDistribution = [
    { status: 'REQUESTED', count: pendingShipments },
    { status: 'CONFIRMED', count: confirmedShipments },
    { status: 'IN_TRANSIT', count: inTransitShipments },
    { status: 'DELIVERED', count: deliveredShipments },
    { status: 'CANCELLED', count: cancelledShipments }
  ];
  
  // Get monthly data for line chart (last 6 months)
  const monthlyShipmentData = [];
  const monthlyUserData = [];
  
  // Month names for display
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
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
        $lt: endDate
      }
    });
    
    // Count users registered this month
    const userCount = await User.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    });
    
    // Add data points
    monthlyShipmentData.push({
      month: monthNames[startDate.getMonth()],
      count: shipmentCount
    });
    
    monthlyUserData.push({
      month: monthNames[startDate.getMonth()],
      count: userCount
    });
  }
  
  // Recent activity
  const recentActivity = [];
  
  // Get recent user registrations
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select('name createdAt');
    
  recentUsers.forEach(user => {
    recentActivity.push({
      id: `user-${user._id}`,
      type: 'user',
      action: 'registered',
      user: user.name,
      time: getTimeAgo(user.createdAt)
    });
  });
  
  // Get recent shipment updates
  const recentShipmentUpdates = await Shipment.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('merchantId', 'name')
    .select('status updatedAt merchantId');
    
  recentShipmentUpdates.forEach(shipment => {
    recentActivity.push({
      id: `shipment-${shipment._id}`,
      type: 'shipment',
      action: getActionFromStatus(shipment.status),
      user: shipment.merchantId ? shipment.merchantId.name : 'System',
      time: getTimeAgo(shipment.updatedAt)
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
      increase: userIncrease
    },
    trucks: {
      total: totalTrucks,
      available: availableTrucks,
      increase: truckIncrease
    },
    shipments: {
      total: totalShipments,
      pending: pendingShipments,
      inTransit: inTransitShipments,
      delivered: deliveredShipments,
      increase: shipmentIncrease,
      recent: recentShipments,
      statusDistribution: statusDistribution,
      monthlyData: monthlyShipmentData
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      increase: applicationIncrease
    },
    monthlyUserData: monthlyUserData,
    recentActivity: recentActivity
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
    role
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
  
  return ApiSuccess(res, { 
    message: 'User created successfully',
    user: user.toObject({ getters: true, virtuals: true, versionKey: false })
  }, 201);
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  createUser
}; 