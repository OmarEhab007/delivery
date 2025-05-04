const Truck = require('../../models/Truck');
const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

/**
 * Get all trucks with filtering and pagination
 * @route GET /api/admin/trucks
 * @access Private (Admin only)
 */
const getAllTrucks = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter object from query params
  const filter = {};
  
  if (req.query.status) filter.status = req.query.status;
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;
  if (req.query.driverId) filter.driverId = req.query.driverId;
  if (req.query.truckType) filter.truckType = req.query.truckType;
  if (req.query.licensePlate) filter.licensePlate = { $regex: req.query.licensePlate, $options: 'i' };
  
  const trucks = await Truck.find(filter)
    .populate('ownerId', 'name email phone companyName')
    .populate('driverId', 'name email phone')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await Truck.countDocuments(filter);
  
  return ApiSuccess(res, {
    trucks,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  });
});

/**
 * Get truck by ID
 * @route GET /api/admin/trucks/:id
 * @access Private (Admin only)
 */
const getTruckById = asyncHandler(async (req, res, next) => {
  const truck = await Truck.findById(req.params.id)
    .populate('ownerId', 'name email phone companyName companyAddress')
    .populate('driverId', 'name email phone licenseNumber');
  
  if (!truck) {
    return next(new ApiError('Truck not found', 404));
  }
  
  return ApiSuccess(res, { truck });
});

/**
 * Update truck details
 * @route PUT /api/admin/trucks/:id
 * @access Private (Admin only)
 */
const updateTruck = asyncHandler(async (req, res, next) => {
  const {
    licensePlate,
    truckType,
    capacity,
    status,
    driverId,
    ownerId,
    specifications,
    documents
  } = req.body;
  
  const truck = await Truck.findById(req.params.id);
  
  if (!truck) {
    return next(new ApiError('Truck not found', 404));
  }
  
  // Update fields if provided
  if (licensePlate) truck.licensePlate = licensePlate;
  if (truckType) truck.truckType = truckType;
  if (capacity) truck.capacity = capacity;
  if (status) truck.status = status;
  if (specifications) truck.specifications = specifications;
  if (documents) truck.documents = documents;
  
  // Validate ownerId
  if (ownerId) {
    const owner = await User.findOne({ _id: ownerId, role: 'TruckOwner' });
    if (!owner) {
      return next(new ApiError('Invalid truck owner ID', 400));
    }
    truck.ownerId = ownerId;
  }
  
  // Validate driverId
  if (driverId) {
    const driver = await User.findOne({ _id: driverId, role: 'Driver' });
    if (!driver) {
      return next(new ApiError('Invalid driver ID', 400));
    }
    truck.driverId = driverId;
  }
  
  await truck.save();
  
  return ApiSuccess(res, { 
    message: 'Truck updated successfully', 
    truck
  });
});

/**
 * Delete truck
 * @route DELETE /api/admin/trucks/:id
 * @access Private (Admin only)
 */
const deleteTruck = asyncHandler(async (req, res, next) => {
  const truck = await Truck.findById(req.params.id);
  
  if (!truck) {
    return next(new ApiError('Truck not found', 404));
  }
  
  await truck.deleteOne();
  
  return ApiSuccess(res, { message: 'Truck deleted successfully' });
});

/**
 * Create a new truck
 * @route POST /api/admin/trucks
 * @access Private (Admin only)
 */
const createTruck = asyncHandler(async (req, res, next) => {
  const {
    licensePlate,
    truckType,
    capacity,
    ownerId,
    driverId,
    specifications,
    documents
  } = req.body;
  
  // Validate truck owner
  const owner = await User.findOne({ _id: ownerId, role: 'TruckOwner' });
  if (!owner) {
    return next(new ApiError('Invalid truck owner ID', 400));
  }
  
  // Validate driver if provided
  if (driverId) {
    const driver = await User.findOne({ _id: driverId, role: 'Driver' });
    if (!driver) {
      return next(new ApiError('Invalid driver ID', 400));
    }
  }
  
  // Create truck
  const truck = await Truck.create({
    licensePlate,
    truckType,
    capacity,
    ownerId,
    driverId,
    specifications,
    documents,
    status: 'Available'
  });
  
  return ApiSuccess(res, { 
    message: 'Truck created successfully', 
    truck
  }, 201);
});

/**
 * Change truck status
 * @route PATCH /api/admin/trucks/:id/status
 * @access Private (Admin only)
 */
const changeTruckStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new ApiError('Status is required', 400));
  }
  
  const validStatuses = ['Available', 'Unavailable', 'InMaintenance', 'OnRoute'];
  if (!validStatuses.includes(status)) {
    return next(new ApiError('Invalid status', 400));
  }
  
  const truck = await Truck.findById(req.params.id);
  
  if (!truck) {
    return next(new ApiError('Truck not found', 404));
  }
  
  truck.status = status;
  await truck.save();
  
  return ApiSuccess(res, { 
    message: 'Truck status updated successfully', 
    truck
  });
});

module.exports = {
  getAllTrucks,
  getTruckById,
  updateTruck,
  deleteTruck,
  createTruck,
  changeTruckStatus
}; 