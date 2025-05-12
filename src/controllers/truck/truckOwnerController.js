const { asyncHandler } = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { Shipment } = require('../../models/Shipment');
const { Application } = require('../../models/Application');
const User = require('../../models/User');
const { Truck } = require('../../models/Truck');

/**
 * Get all shipments assigned to a truck owner (via accepted applications)
 * @route GET /api/v1/truck-owner/shipments
 * @access Private (TruckOwner only)
 */
const getMyShipments = asyncHandler(async (req, res, next) => {
  // Find all accepted applications from this truck owner
  const acceptedApplications = await Application.find({
    ownerId: req.user.id,
    status: 'ACCEPTED',
  });

  // Get all shipment IDs from these applications
  const shipmentIds = acceptedApplications.map((app) => app.shipmentId);

  // Find all these shipments
  const shipments = await Shipment.find({
    _id: { $in: shipmentIds },
  })
    .populate('merchantId', 'name email phone')
    .populate('assignedTruckId')
    .populate('assignedDriverId', 'name email phone');

  return ApiSuccess(res, {
    count: shipments.length,
    shipments,
  });
});

/**
 * Assign a shipment to a driver (owned by the truck owner)
 * @route PATCH /api/v1/truck-owner/shipments/:shipmentId/assign
 * @access Private (TruckOwner only)
 */
const assignShipmentToDriver = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { driverId, truckId } = req.body;

  if (!driverId) {
    return next(new ApiError('Driver ID is required', 400));
  }

  // Check if this shipment is assigned to the truck owner via an accepted application
  const application = await Application.findOne({
    shipmentId,
    ownerId: req.user.id,
    status: 'ACCEPTED',
  });

  if (!application) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  // Find the shipment
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  // Check if the shipment is in an assignable status
  const assignableStatuses = ['CONFIRMED', 'ASSIGNED'];
  if (!assignableStatuses.includes(shipment.status)) {
    return next(new ApiError(`Cannot assign shipment with status: ${shipment.status}`, 400));
  }

  // Verify the driver belongs to this truck owner
  const driver = await User.findOne({
    _id: driverId,
    role: 'Driver',
    ownerId: req.user.id,
  });

  if (!driver) {
    return next(new ApiError('Driver not found or not assigned to you', 404));
  }

  // Check if driver is available
  if (!driver.isAvailable) {
    return next(new ApiError('Driver is not available for assignment', 400));
  }

  // If truck ID is provided, verify it exists and belongs to this truck owner
  if (truckId) {
    const truck = await Truck.findOne({
      _id: truckId,
      ownerId: req.user.id,
    });

    if (!truck) {
      return next(new ApiError('Truck not found or not owned by you', 404));
    }

    // Check if truck is available
    if (truck.status !== 'Available') {
      return next(new ApiError('Truck is not available for assignment', 400));
    }

    // Assign the truck
    shipment.assignedTruckId = truckId;
  } else {
    // If no truck provided, use the one from the application
    shipment.assignedTruckId = application.truckId;
  }

  // Assign the driver and update the shipment status
  shipment.assignedDriverId = driverId;
  shipment.status = 'ASSIGNED';

  // Add timeline entry for the assignment
  await shipment.addTimelineEntry({
    status: 'ASSIGNED',
    note: 'Shipment assigned to driver by truck owner',
    location: shipment.currentLocation,
  });

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment successfully assigned to driver',
    shipment,
  });
});

/**
 * Get available drivers owned by the truck owner
 * @route GET /api/v1/truck-owner/drivers/available
 * @access Private (TruckOwner only)
 */
const getAvailableDrivers = asyncHandler(async (req, res, next) => {
  const drivers = await User.find({
    role: 'Driver',
    ownerId: req.user.id,
    isAvailable: true,
    driverStatus: 'ACTIVE',
  }).select('name email phone licenseNumber currentLocation');

  return ApiSuccess(res, {
    count: drivers.length,
    drivers,
  });
});

/**
 * Get available trucks owned by the truck owner
 * @route GET /api/v1/truck-owner/trucks/available
 * @access Private (TruckOwner only)
 */
const getAvailableTrucks = asyncHandler(async (req, res, next) => {
  const trucks = await Truck.find({
    ownerId: req.user.id,
    status: 'Available',
  });

  return ApiSuccess(res, {
    count: trucks.length,
    trucks,
  });
});

/**
 * Get available shipments that truck owners can apply for
 * @route GET /api/truck-owner/shipments/available
 * @access Private (TruckOwner only)
 */
const getAvailableShipments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Get filter parameters
  const { originCountry, destinationCountry, minWeight, maxWeight } = req.query;

  // Build filter query
  const filter = {
    status: 'REQUESTED', // Only shipments in REQUESTED status are available for applications
    active: true,
  };

  if (originCountry) {
    filter['origin.country'] = originCountry;
  }

  if (destinationCountry) {
    filter['destination.country'] = destinationCountry;
  }

  if (minWeight) {
    filter['cargoDetails.weight'] = { $gte: parseFloat(minWeight) };
  }

  if (maxWeight && !minWeight) {
    filter['cargoDetails.weight'] = { $lte: parseFloat(maxWeight) };
  } else if (maxWeight) {
    filter['cargoDetails.weight'].$lte = parseFloat(maxWeight);
  }

  // Find shipments matching criteria
  const shipments = await Shipment.find(filter)
    .populate('merchantId', 'name company')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Shipment.countDocuments(filter);

  return ApiSuccess(res, {
    count: shipments.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    shipments,
  });
});

/**
 * Get all drivers managed by the truck owner
 * @route GET /api/truck-owner/drivers
 * @access Private (TruckOwner only)
 */
const getAllDrivers = asyncHandler(async (req, res, next) => {
  const { isAvailable } = req.query;

  // Build filter query
  const filter = {
    role: 'Driver',
    ownerId: req.user.id,
  };

  if (isAvailable === 'true') {
    filter.isAvailable = true;
  } else if (isAvailable === 'false') {
    filter.isAvailable = false;
  }

  const drivers = await User.find(filter).select(
    'name email phone licenseNumber isAvailable driverStatus currentLocation'
  );

  return ApiSuccess(res, {
    count: drivers.length,
    drivers,
  });
});

/**
 * Update driver details
 * @route PATCH /api/truck-owner/drivers/:id
 * @access Private (TruckOwner only)
 */
const updateDriver = asyncHandler(async (req, res, next) => {
  const driverId = req.params.id;

  // Find the driver
  const driver = await User.findOne({
    _id: driverId,
    role: 'Driver',
    ownerId: req.user.id,
  });

  if (!driver) {
    return next(new ApiError('Driver not found or not managed by you', 404));
  }

  // Update allowed fields
  const allowedFields = ['isAvailable', 'driverStatus', 'licenseNumber', 'phone'];
  const updateData = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  if (Object.keys(updateData).length === 0) {
    return next(new ApiError('No valid fields to update', 400));
  }

  // Update the driver
  const updatedDriver = await User.findByIdAndUpdate(driverId, updateData, {
    new: true,
    runValidators: true,
  }).select('name email phone licenseNumber isAvailable driverStatus');

  return ApiSuccess(res, {
    message: 'Driver updated successfully',
    driver: updatedDriver,
  });
});

module.exports = {
  getMyShipments,
  assignShipmentToDriver,
  getAvailableDrivers,
  getAvailableTrucks,
  getAvailableShipments,
  getAllDrivers,
  updateDriver,
};
