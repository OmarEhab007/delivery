const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../models/Shipment');
const Broker = require('../../models/Broker');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

/**
 * Get all shipments with filtering and pagination
 * @route GET /api/admin/shipments
 * @access Private (Admin only)
 */
const getAllShipments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter object from query params
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.approvalState) filter['approval.state'] = req.query.approvalState;
  if (req.query.merchantId) filter.merchantId = req.query.merchantId;
  if (req.query.assignedTruckId) filter.assignedTruckId = req.query.assignedTruckId;
  if (req.query.assignedDriverId) filter.assignedDriverId = req.query.assignedDriverId;

  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }

  const shipments = await Shipment.find(filter)
    .populate('merchantId', 'name email')
    .populate('assignedTruckId')
    .populate('assignedDriverId', 'name email phone')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Shipment.countDocuments(filter);

  return ApiSuccess(res, {
    shipments,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

/**
 * Get shipment by ID
 * @route GET /api/admin/shipments/:id
 * @access Private (Admin only)
 */
const getShipmentById = asyncHandler(async (req, res, next) => {
  const shipment = await Shipment.findById(req.params.id)
    .populate('merchantId', 'name email phone')
    .populate('assignedTruckId')
    .populate('assignedDriverId', 'name email phone');

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  return ApiSuccess(res, { shipment });
});

/**
 * Update shipment details
 * @route PUT /api/admin/shipments/:id
 * @access Private (Admin only)
 */
const updateShipment = asyncHandler(async (req, res, next) => {
  const {
    status,
    origin,
    destination,
    cargoDetails,
    pricing,
    notes,
    merchantId,
    assignedTruckId,
    assignedDriverId,
  } = req.body;

  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  // Update fields if provided
  if (status) shipment.status = status;
  if (origin) shipment.origin = origin;
  if (destination) shipment.destination = destination;
  if (cargoDetails) shipment.cargoDetails = cargoDetails;
  if (pricing) shipment.pricing = pricing;
  if (notes) shipment.notes = notes;
  if (merchantId) shipment.merchantId = merchantId;
  if (assignedTruckId) shipment.assignedTruckId = assignedTruckId;
  if (assignedDriverId) shipment.assignedDriverId = assignedDriverId;

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment updated successfully',
    shipment,
  });
});

/**
 * Delete shipment
 * @route DELETE /api/admin/shipments/:id
 * @access Private (Admin only)
 */
const deleteShipment = asyncHandler(async (req, res, next) => {
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  await shipment.deleteOne();

  return ApiSuccess(res, { message: 'Shipment deleted successfully' });
});

/**
 * Change shipment status
 * @route PATCH /api/admin/shipments/:id/status
 * @access Private (Admin only)
 */
const changeShipmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ApiError('Status is required', 400));
  }

  if (!Object.values(ShipmentStatus).includes(status)) {
    return next(new ApiError('Invalid status', 400));
  }

  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  if (
    [ShipmentStatus.LOADING, ShipmentStatus.IN_TRANSIT].includes(status) &&
    !shipment.isComplianceReady()
  ) {
    return next(new ApiError('Shipment compliance is incomplete. Cannot dispatch.', 400));
  }

  shipment.status = status;

  // Add timeline entry
  await shipment.addTimelineEntry({
    status,
    note: `Status updated to ${status} by admin`,
    location: shipment.currentLocation,
  });

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment status updated successfully',
    shipment,
  });
});

const approveShipment = asyncHandler(async (req, res, next) => {
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  if (shipment.approval.state !== ShipmentApprovalState.PENDING) {
    return next(new ApiError('Shipment is not pending approval', 400));
  }

  shipment.status = ShipmentStatus.REQUESTED;
  shipment.approval.state = ShipmentApprovalState.APPROVED;
  shipment.approval.reviewedBy = req.user._id;
  shipment.approval.reviewedAt = new Date();
  shipment.approval.rejectionReason = undefined;

  await shipment.addTimelineEntry({
    status: ShipmentStatus.REQUESTED,
    note: 'Shipment approved by admin',
  });

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment approved successfully',
    shipment,
  });
});

const rejectShipment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  if (shipment.approval.state !== ShipmentApprovalState.PENDING) {
    return next(new ApiError('Shipment is not pending approval', 400));
  }

  shipment.status = ShipmentStatus.REJECTED;
  shipment.approval.state = ShipmentApprovalState.REJECTED;
  shipment.approval.reviewedBy = req.user._id;
  shipment.approval.reviewedAt = new Date();
  shipment.approval.rejectionReason = reason;

  await shipment.addTimelineEntry({
    status: ShipmentStatus.REJECTED,
    note: reason ? `Shipment rejected by admin: ${reason}` : 'Shipment rejected by admin',
  });

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment rejected successfully',
    shipment,
  });
});

const assignBroker = asyncHandler(async (req, res, next) => {
  const { brokerId } = req.body;

  if (!brokerId) {
    return next(new ApiError('Broker ID is required', 400));
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  const broker = await Broker.findById(brokerId);
  if (!broker) {
    return next(new ApiError('Broker not found', 404));
  }
  if (broker.status !== 'ACTIVE') {
    return next(new ApiError('Broker is not active', 400));
  }

  shipment.compliance = shipment.compliance || {};
  shipment.compliance.brokerId = broker._id;
  shipment.refreshComplianceStatus();

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Broker assigned successfully',
    shipment,
  });
});

/**
 * Assign shipment to driver
 * @route PATCH /api/admin/shipments/:id/assign
 * @access Private (Admin only)
 */
const assignShipmentToDriver = asyncHandler(async (req, res, next) => {
  const { driverId, assignedTruckId } = req.body;

  if (!driverId) {
    return next(new ApiError('Driver ID is required', 400));
  }

  // Find the shipment
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  // Check if the shipment is in a status that can be assigned
  const assignableStatuses = ['REQUESTED', 'CONFIRMED'];
  if (!assignableStatuses.includes(shipment.status)) {
    return next(
      new ApiError(
        `Cannot assign shipment with status: ${shipment.status}. Shipment must be in REQUESTED or CONFIRMED status.`,
        400
      )
    );
  }

  // Find the driver to ensure they exist and are a driver
  const User = require('../../models/User');
  const driver = await User.findById(driverId);

  if (!driver) {
    return next(new ApiError('Driver not found', 404));
  }

  if (driver.role !== 'Driver') {
    return next(new ApiError('Selected user is not a driver', 400));
  }

  // Check if driver is available
  if (!driver.isAvailable) {
    return next(new ApiError('Driver is not available for assignment', 400));
  }

  // If truck ID is provided, verify it exists
  if (assignedTruckId) {
    const Truck = require('../../models/Truck');
    const truck = await Truck.findById(assignedTruckId);

    if (!truck) {
      return next(new ApiError('Truck not found', 404));
    }

    // Check if truck is available
    if (truck.status !== 'AVAILABLE') {
      return next(new ApiError('Truck is not available for assignment', 400));
    }

    // Set the assigned truck ID
    shipment.assignedTruckId = assignedTruckId;
  }

  // Assign the driver and update the shipment status
  shipment.assignedDriverId = driverId;
  shipment.status = 'ASSIGNED';

  // Add a timeline entry for the assignment
  await shipment.addTimelineEntry({
    status: 'ASSIGNED',
    note: 'Shipment assigned to driver by admin',
    location: shipment.currentLocation,
  });

  await shipment.save();

  return ApiSuccess(res, {
    message: 'Shipment successfully assigned to driver',
    shipment,
  });
});

module.exports = {
  getAllShipments,
  getShipmentById,
  updateShipment,
  deleteShipment,
  changeShipmentStatus,
  assignShipmentToDriver,
  approveShipment,
  rejectShipment,
  assignBroker,
};
