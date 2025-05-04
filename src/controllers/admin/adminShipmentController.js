const { Shipment } = require('../../models/Shipment');
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
  if (req.query.merchantId) filter.merchantId = req.query.merchantId;
  if (req.query.truckId) filter.truckId = req.query.truckId;
  if (req.query.driverId) filter.driverId = req.query.driverId;
  
  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }
  
  const shipments = await Shipment.find(filter)
    .populate('merchantId', 'name email')
    .populate('truckId')
    .populate('driverId', 'name email phone')
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
      limit
    }
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
    .populate('truckId')
    .populate('driverId', 'name email phone');
  
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
    pickupLocation,
    deliveryLocation,
    cargo,
    price,
    notes,
    merchantId,
    truckId,
    driverId
  } = req.body;
  
  const shipment = await Shipment.findById(req.params.id);
  
  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }
  
  // Update fields if provided
  if (status) shipment.status = status;
  if (pickupLocation) shipment.pickupLocation = pickupLocation;
  if (deliveryLocation) shipment.deliveryLocation = deliveryLocation;
  if (cargo) shipment.cargo = cargo;
  if (price) shipment.price = price;
  if (notes) shipment.notes = notes;
  if (merchantId) shipment.merchantId = merchantId;
  if (truckId) shipment.truckId = truckId;
  if (driverId) shipment.driverId = driverId;
  
  await shipment.save();
  
  return ApiSuccess(res, { 
    message: 'Shipment updated successfully', 
    shipment
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
  
  const validStatuses = ['REQUESTED', 'CONFIRMED', 'IN_TRANSIT', 'AT_BORDER', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return next(new ApiError('Invalid status', 400));
  }
  
  const shipment = await Shipment.findById(req.params.id);
  
  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }
  
  shipment.status = status;
  
  // Add timeline entry
  await shipment.addTimelineEntry({
    status,
    note: `Status updated to ${status} by admin`,
    location: shipment.currentLocation
  });
  
  await shipment.save();
  
  return ApiSuccess(res, { 
    message: 'Shipment status updated successfully', 
    shipment
  });
});

module.exports = {
  getAllShipments,
  getShipmentById,
  updateShipment,
  deleteShipment,
  changeShipmentStatus
}; 