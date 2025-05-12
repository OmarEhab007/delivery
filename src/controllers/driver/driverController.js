const path = require('path');
const fs = require('fs');

const { validationResult } = require('express-validator');
const multer = require('multer');

const User = require('../../models/User');
const Truck = require('../../models/Truck');
const { Shipment, ShipmentStatus } = require('../../models/Shipment');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/delivery-proof';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

/**
 * Get driver profile
 * @route GET /api/v1/driver/profile
 * @access Private (Driver only)
 */
const getProfile = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user.id)
    .select('-password')
    .populate('ownerId', 'name companyName email phone');

  return ApiSuccess(res, { driver });
});

/**
 * Get driver's current truck assignment
 * @route GET /api/v1/driver/truck
 * @access Private (Driver only)
 */
const getCurrentTruck = asyncHandler(async (req, res, next) => {
  const truck = await Truck.findOne({ driverId: req.user.id }).populate(
    'ownerId',
    'name companyName email phone'
  );

  if (!truck) {
    return next(new ApiError('No truck currently assigned', 404));
  }

  return ApiSuccess(res, { truck });
});

/**
 * Get driver's active shipments
 * @route GET /api/v1/driver/shipments
 * @access Private (Driver only)
 */
const getActiveShipments = asyncHandler(async (req, res, next) => {
  const shipments = await Shipment.find({
    assignedDriverId: req.user.id,
    status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'LOADING', 'UNLOADING'] },
  }).populate('merchantId', 'name email phone');

  return ApiSuccess(res, {
    results: shipments.length,
    shipments,
  });
});

/**
 * Update driver's availability status
 * @route PATCH /api/v1/driver/availability
 * @access Private (Driver only)
 */
const updateAvailability = asyncHandler(async (req, res, next) => {
  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    return next(new ApiError('Availability status must be a boolean', 400));
  }

  const driver = await User.findById(req.user.id);
  driver.isAvailable = isAvailable;
  await driver.save();

  return ApiSuccess(res, {
    message: `Availability status updated to ${isAvailable ? 'available' : 'unavailable'}`,
    driver,
  });
});

/**
 * Get driver's assigned shipments
 * @route GET /api/v1/driver/shipments/assigned
 * @access Private (Driver only)
 */
const getAssignedShipments = asyncHandler(async (req, res, next) => {
  // Find all shipments assigned to this driver that are not completed or cancelled
  const shipments = await Shipment.find({
    assignedDriverId: req.user.id,
    status: {
      $nin: ['COMPLETED', 'CANCELLED', 'DELIVERED'],
    },
  })
    .populate('merchantId', 'name email phone')
    .populate('assignedTruckId')
    .sort({ createdAt: -1 });

  return ApiSuccess(res, {
    count: shipments.length,
    shipments,
  });
});

/**
 * Get driver's shipment history (completed shipments)
 * @route GET /api/v1/driver/shipments/history
 * @access Private (Driver only)
 */
const getShipmentHistory = asyncHandler(async (req, res, next) => {
  // Find all completed or delivered shipments for this driver
  const shipments = await Shipment.find({
    assignedDriverId: req.user.id,
    status: { $in: ['COMPLETED', 'DELIVERED'] },
  })
    .populate('merchantId', 'name email phone')
    .populate('assignedTruckId')
    .sort({ createdAt: -1 });

  return ApiSuccess(res, {
    count: shipments.length,
    shipments,
  });
});

/**
 * Update driver's location
 * @route PATCH /api/v1/driver/location
 * @access Private (Driver only)
 */
const updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return next(new ApiError('Both latitude and longitude are required', 400));
  }

  const driver = await User.findById(req.user.id);
  driver.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  await driver.save();

  return ApiSuccess(res, {
    message: 'Location updated successfully',
    location: driver.currentLocation,
  });
});

/**
 * Update shipment status
 * @route PATCH /api/v1/driver/shipments/:shipmentId/status
 * @access Private (Driver only)
 */
const updateShipmentStatus = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return next(new ApiError('Status is required', 400));
  }

  // Validate the status is a valid enum value
  if (!Object.values(ShipmentStatus).includes(status)) {
    return next(new ApiError('Invalid status value', 400));
  }

  // Find the shipment that belongs to this driver
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriverId: req.user.id,
  });

  if (!shipment) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  // Add timeline entry with the new status
  const timelineEntry = {
    status,
    note: notes || `Status updated to ${status}`,
    location: req.body.location,
  };

  await shipment.addTimelineEntry(timelineEntry);

  // Update specific fields based on status
  if (status === ShipmentStatus.IN_TRANSIT) {
    shipment.actualPickupDate = new Date();
  } else if (status === ShipmentStatus.DELIVERED) {
    shipment.actualDeliveryDate = new Date();
  }

  await shipment.save();

  return ApiSuccess(res, {
    message: `Shipment status updated to ${status}`,
    shipment,
  });
});

/**
 * Start a delivery
 * @route POST /api/v1/driver/shipments/:shipmentId/start
 * @access Private (Driver only)
 */
const startDelivery = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { notes, startOdometer } = req.body;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriverId: req.user.id,
  });

  if (!shipment) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  if (shipment.status !== ShipmentStatus.ASSIGNED && shipment.status !== ShipmentStatus.LOADING) {
    return next(
      new ApiError(`Cannot start delivery for shipment with status: ${shipment.status}`, 400)
    );
  }

  // Update shipment
  shipment.status = ShipmentStatus.IN_TRANSIT;
  shipment.startOdometer = startOdometer;
  shipment.actualPickupDate = new Date();

  // Add timeline entry
  const timelineEntry = {
    status: ShipmentStatus.IN_TRANSIT,
    note: notes || 'Delivery started, cargo picked up from origin',
    location: req.user.currentLocation,
  };

  await shipment.addTimelineEntry(timelineEntry);
  await shipment.save();

  return ApiSuccess(res, {
    message: 'Delivery started successfully',
    shipment,
  });
});

/**
 * Complete a delivery
 * @route POST /api/v1/driver/shipments/:shipmentId/complete
 * @access Private (Driver only)
 */
const completeDelivery = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { notes, endOdometer, recipientName, recipientSignature } = req.body;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriverId: req.user.id,
  });

  if (!shipment) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  if (
    shipment.status !== ShipmentStatus.IN_TRANSIT &&
    shipment.status !== ShipmentStatus.UNLOADING
  ) {
    return next(
      new ApiError(`Cannot complete delivery for shipment with status: ${shipment.status}`, 400)
    );
  }

  // Update shipment
  shipment.status = ShipmentStatus.DELIVERED;
  shipment.endOdometer = endOdometer;
  shipment.actualDeliveryDate = new Date();
  shipment.recipient = {
    name: recipientName,
    signature: recipientSignature || null,
  };

  // Calculate distance if start and end odometer readings are available
  if (shipment.startOdometer && endOdometer) {
    shipment.distanceTraveled = endOdometer - shipment.startOdometer;
  }

  // Add timeline entry
  const timelineEntry = {
    status: ShipmentStatus.DELIVERED,
    note: notes || `Delivery completed, received by ${recipientName}`,
    location: req.user.currentLocation,
  };

  await shipment.addTimelineEntry(timelineEntry);
  await shipment.save();

  return ApiSuccess(res, {
    message: 'Delivery completed successfully',
    shipment,
  });
});

/**
 * Report an issue with a shipment
 * @route POST /api/v1/driver/shipments/:shipmentId/issues
 * @access Private (Driver only)
 */
const reportIssue = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;
  const { issueType, description, latitude, longitude } = req.body;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriverId: req.user.id,
  });

  if (!shipment) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  // Create issue object
  const issue = {
    type: issueType,
    description,
    reportedBy: req.user.id,
    reportedAt: new Date(),
    location: {
      type: 'Point',
      coordinates: [
        longitude || req.user.currentLocation?.coordinates[0],
        latitude || req.user.currentLocation?.coordinates[1],
      ],
    },
    status: 'OPEN',
  };

  // Add issue to shipment
  if (!shipment.issues) {
    shipment.issues = [];
  }
  shipment.issues.push(issue);

  // Add timeline entry
  const timelineEntry = {
    status: 'ISSUE_REPORTED',
    note: `Issue reported: ${issueType} - ${description}`,
    location: issue.location,
  };

  await shipment.addTimelineEntry(timelineEntry);

  // If issue is severe, update shipment status
  if (['ACCIDENT', 'CARGO_DAMAGED', 'VEHICLE_BREAKDOWN'].includes(issueType)) {
    shipment.status = 'DELAYED';
  }

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Issue reported successfully',
    issue: shipment.issues[shipment.issues.length - 1],
    shipment,
  });
});

/**
 * Upload proof of delivery
 * @route POST /api/v1/driver/shipments/:shipmentId/proof
 * @access Private (Driver only)
 */
const uploadProofOfDelivery = asyncHandler(async (req, res, next) => {
  // Multer middleware for single file upload
  const uploadMiddleware = upload.single('proof');

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return next(new ApiError(err.message, 400));
    }

    if (!req.file) {
      return next(new ApiError('Please upload an image or document', 400));
    }

    const { shipmentId } = req.params;
    const { type, notes } = req.body;

    const shipment = await Shipment.findOne({
      _id: shipmentId,
      assignedDriverId: req.user.id,
    });

    if (!shipment) {
      // Remove uploaded file if shipment not found
      fs.unlinkSync(req.file.path);
      return next(new ApiError('Shipment not found or not assigned to you', 404));
    }

    // Create proof document object
    const proofDocument = {
      type: type || 'PHOTO',
      filePath: req.file.path,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      notes: notes || 'Proof of delivery',
    };

    // Add proof to shipment
    if (!shipment.deliveryProofs) {
      shipment.deliveryProofs = [];
    }
    shipment.deliveryProofs.push(proofDocument);

    // Add timeline entry
    const timelineEntry = {
      status: shipment.status,
      note: `Delivery proof uploaded: ${type || 'PHOTO'}`,
      location: req.user.currentLocation,
    };

    await shipment.addTimelineEntry(timelineEntry);
    await shipment.save();

    return ApiSuccess(res, {
      message: 'Proof of delivery uploaded successfully',
      proof: proofDocument,
      shipment,
    });
  });
});

/**
 * Get delivery route
 * @route GET /api/v1/driver/route/:shipmentId
 * @access Private (Driver only)
 */
const getDeliveryRoute = asyncHandler(async (req, res, next) => {
  const { shipmentId } = req.params;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    assignedDriverId: req.user.id,
  });

  if (!shipment) {
    return next(new ApiError('Shipment not found or not assigned to you', 404));
  }

  // In a real implementation, this would integrate with a mapping service
  // For now, returning a simple route with origin and destination
  const route = {
    shipmentId: shipment._id,
    origin: shipment.origin,
    destination: shipment.destination,
    // In a real app, you would calculate and provide waypoints, distance, ETA, etc.
    waypoints: [],
    estimatedDistance: 'N/A',
    estimatedDuration: 'N/A',
    routePolyline: null,
  };

  return ApiSuccess(res, {
    route,
  });
});

/**
 * Update driver status (more detailed than availability)
 * @route PATCH /api/v1/driver/status
 * @access Private (Driver only)
 */
const updateDriverStatus = asyncHandler(async (req, res, next) => {
  const { status, reason } = req.body;

  if (!status) {
    return next(new ApiError('Status is required', 400));
  }

  // Validate status is a valid value
  const validStatuses = ['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'];
  if (!validStatuses.includes(status)) {
    return next(new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const driver = await User.findById(req.user.id);
  driver.driverStatus = status;

  // Update availability based on status
  if (status === 'ACTIVE') {
    driver.isAvailable = true;
  } else {
    driver.isAvailable = false;
  }

  // Log status change in history
  if (!driver.statusHistory) {
    driver.statusHistory = [];
  }

  driver.statusHistory.push({
    status,
    reason: reason || `Status changed to ${status}`,
    timestamp: new Date(),
  });

  await driver.save();

  return ApiSuccess(res, {
    message: `Driver status updated to ${status}`,
    driver,
  });
});

/**
 * Daily driver check-in
 * @route POST /api/v1/driver/checkin
 * @access Private (Driver only)
 */
const driverCheckin = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, truckCondition, fuelLevel, notes } = req.body;

  // Find the driver's assigned truck
  const truck = await Truck.findOne({ driverId: req.user.id });
  if (!truck) {
    return next(new ApiError('No truck assigned to this driver', 404));
  }

  // Create check-in log
  const checkin = {
    driverId: req.user.id,
    truckId: truck._id,
    timestamp: new Date(),
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    truckCondition,
    fuelLevel,
    notes: notes || 'Daily check-in',
    type: 'CHECK_IN',
  };

  // Update driver status
  const driver = await User.findById(req.user.id);
  driver.driverStatus = 'ACTIVE';
  driver.isAvailable = true;
  driver.currentLocation = checkin.location;

  // Add to driver logs if the field exists
  if (!driver.driverLogs) {
    driver.driverLogs = [];
  }
  driver.driverLogs.push(checkin);

  // Update truck status
  truck.status = 'IN_SERVICE';
  truck.currentFuelLevel = fuelLevel;
  truck.lastCheckin = new Date();

  await driver.save();
  await truck.save();

  return ApiSuccess(res, {
    message: 'Driver checked in successfully',
    checkin,
    driver,
    truck,
  });
});

/**
 * End of day driver check-out
 * @route POST /api/v1/driver/checkout
 * @access Private (Driver only)
 */
const driverCheckout = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, totalMiles, fuelLevel, notes } = req.body;

  // Find the driver's assigned truck
  const truck = await Truck.findOne({ driverId: req.user.id });
  if (!truck) {
    return next(new ApiError('No truck assigned to this driver', 404));
  }

  // Create check-out log
  const checkout = {
    driverId: req.user.id,
    truckId: truck._id,
    timestamp: new Date(),
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    totalMiles,
    fuelLevel,
    notes: notes || 'Daily check-out',
    type: 'CHECK_OUT',
  };

  // Update driver status
  const driver = await User.findById(req.user.id);
  driver.driverStatus = 'OFF_DUTY';
  driver.isAvailable = false;
  driver.currentLocation = checkout.location;

  // Add to driver logs
  if (!driver.driverLogs) {
    driver.driverLogs = [];
  }
  driver.driverLogs.push(checkout);

  // Update truck
  truck.currentFuelLevel = fuelLevel;
  truck.lastCheckout = new Date();
  truck.odometer = (truck.odometer || 0) + totalMiles;

  await driver.save();
  await truck.save();

  return ApiSuccess(res, {
    message: 'Driver checked out successfully',
    checkout,
    driver,
    truck,
  });
});

/**
 * Get driver dashboard
 * @route GET /api/v1/driver/dashboard
 * @access Private (Driver only)
 */
const getDriverDashboard = asyncHandler(async (req, res, next) => {
  const driver = await User.findById(req.user.id)
    .select('-password')
    .populate('ownerId', 'name companyName email phone');

  // Get assigned truck
  const truck = await Truck.findOne({ driverId: req.user.id });

  // Get active shipments
  const activeShipments = await Shipment.find({
    assignedDriverId: req.user.id,
    status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'LOADING', 'UNLOADING'] },
  }).populate('merchantId', 'name email phone');

  // Get completed shipments count
  const completedCount = await Shipment.countDocuments({
    assignedDriverId: req.user.id,
    status: 'DELIVERED',
  });

  // Get today's completed shipments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCompletedCount = await Shipment.countDocuments({
    assignedDriverId: req.user.id,
    status: 'DELIVERED',
    actualDeliveryDate: { $gte: today },
  });

  // Get issues that need attention
  const openIssues = await Shipment.find({
    assignedDriverId: req.user.id,
    'issues.status': 'OPEN',
  }).select('_id origin destination issues');

  // Calculate efficiency metrics if available
  const metrics = {
    totalDeliveriesCompleted: completedCount,
    todayDeliveriesCompleted: todayCompletedCount,
    activeShipmentCount: activeShipments.length,
    openIssuesCount: openIssues.length,
  };

  // Get next delivery
  const nextDelivery =
    activeShipments.length > 0
      ? activeShipments.sort((a, b) => {
          // Sort by status priority first (ASSIGNED before IN_TRANSIT)
          const statusOrder = { ASSIGNED: 1, LOADING: 2, IN_TRANSIT: 3, UNLOADING: 4 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          // Then sort by expected delivery date
          return a.expectedDeliveryDate - b.expectedDeliveryDate;
        })[0]
      : null;

  return ApiSuccess(res, {
    driver,
    truck,
    activeShipments,
    nextDelivery,
    metrics,
    openIssues,
  });
});

module.exports = {
  getProfile,
  getCurrentTruck,
  getActiveShipments,
  updateAvailability,
  getAssignedShipments,
  getShipmentHistory,
  updateLocation,
  updateShipmentStatus,
  startDelivery,
  completeDelivery,
  reportIssue,
  uploadProofOfDelivery,
  getDeliveryRoute,
  updateDriverStatus,
  driverCheckin,
  driverCheckout,
  getDriverDashboard,
};
