const { validationResult } = require('express-validator');

const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const metricScheduler = require('../../utils/metricScheduler');

/**
 * Allowed fields for shipment creation
 * SEC-002: Whitelist approach prevents mass assignment attacks
 * Fields like status, assignedTruckId, merchantId, isApproved are NOT allowed
 */
const ALLOWED_CREATE_FIELDS = [
  'origin',
  'destination',
  'cargoDetails',
  'pricing',
  'notes',
  'scheduledDate',
  'pricingType',
  'specialRequirements',
];

/**
 * Allowed fields for shipment updates
 */
const ALLOWED_UPDATE_FIELDS = [
  'origin',
  'destination',
  'cargoDetails',
  'pricing',
  'notes',
  'scheduledDate',
  'specialRequirements',
];

/**
 * Helper function to pick only allowed fields from an object
 * @param {Object} source - Source object to pick from
 * @param {Array} allowedFields - Array of allowed field names
 * @returns {Object} Object containing only allowed fields
 */
const pickAllowedFields = (source, allowedFields) => {
  const result = {};
  allowedFields.forEach((field) => {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  });
  return result;
};

/**
 * Create a new shipment
 * @route POST /api/v1/shipments
 * @access Private/Merchant
 */
exports.createShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // SEC-002: Pick only allowed fields from request body
    // This prevents mass assignment attacks where users try to set
    // fields like status, assignedTruckId, merchantId, isApproved
    const shipmentData = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);

    // Set merchantId to current user id (server-controlled, not from request)
    shipmentData.merchantId = req.user.id;

    // Set initial status and approval metadata (server-controlled)
    shipmentData.status = ShipmentStatus.PENDING_APPROVAL;
    shipmentData.approval = {
      state: ShipmentApprovalState.PENDING,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    };

    // Default to BIDDING if pricingType not specified
    if (!shipmentData.pricingType) {
      shipmentData.pricingType = 'BIDDING';
    }

    // Add initial timeline entry (server-controlled)
    shipmentData.timeline = [
      {
        status: ShipmentStatus.PENDING_APPROVAL,
        note: 'Shipment submitted for admin approval',
      },
    ];

    // Create new shipment with sanitized data
    const shipment = await Shipment.create(shipmentData);

    try {
      await metricScheduler.updateShipmentStatusMetrics();
    } catch (metricsError) {
      logger.warn(
        `Failed to refresh shipment status metrics after creation: ${metricsError.message}`
      );
    }

    res.status(201).json({
      status: 'success',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments for the current merchant
 * @route GET /api/v1/shipments
 * @access Private/Merchant
 */
exports.getMyShipments = async (req, res, next) => {
  try {
    // Find all shipments belonging to the current merchant
    const shipments = await Shipment.find({
      merchantId: req.user.id,
      active: true,
    });

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      data: {
        shipments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single shipment by ID
 * @route GET /api/v1/shipments/:id
 * @access Private/Merchant
 */
exports.getShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('selectedApplicationId')
      .populate('assignedTruckId')
      .populate('assignedDriverId');

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    // Check if shipment belongs to the current merchant (unless truck owner or driver)
    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to access this shipment', 403));
    }

    // For TruckOwner, check if one of their trucks is assigned
    if (req.user.role === 'TruckOwner') {
      // Get the ownerId from the assignedTruckId
      const truck = await Truck.findById(shipment.assignedTruckId);
      if (!truck || truck.ownerId.toString() !== req.user.id) {
        return next(new ApiError('You do not have permission to access this shipment', 403));
      }
    }

    // For Driver, check if they are assigned
    if (req.user.role === 'Driver' && shipment.assignedDriverId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to access this shipment', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a shipment
 * @route PATCH /api/v1/shipments/:id
 * @access Private/Merchant
 */
exports.updateShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find shipment
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    // Check if shipment belongs to the current merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }

    // Check if shipment status allows updates (CANCELLED shipments cannot be updated)
    if (![ShipmentStatus.PENDING_APPROVAL, ShipmentStatus.REQUESTED].includes(shipment.status)) {
      return next(new ApiError(`Cannot update shipment with status: ${shipment.status}`, 400));
    }

    // SEC-002: Pick only allowed fields from request body for update
    const updateData = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);

    // Update shipment with sanitized data
    const updatedShipment = await Shipment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    try {
      await metricScheduler.updateShipmentStatusMetrics();
    } catch (metricsError) {
      logger.warn(
        `Failed to refresh shipment status metrics after update: ${metricsError.message}`
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment: updatedShipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a shipment
 * @route PATCH /api/v1/shipments/:id/cancel
 * @access Private/Merchant
 */
exports.cancelShipment = async (req, res, next) => {
  try {
    // Find shipment
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    // Check if shipment belongs to the current merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to cancel this shipment', 403));
    }

    // Check if shipment status allows cancellation
    if (
      ![
        ShipmentStatus.PENDING_APPROVAL,
        ShipmentStatus.REQUESTED,
        ShipmentStatus.CONFIRMED,
      ].includes(shipment.status)
    ) {
      return next(new ApiError(`Cannot cancel shipment with status: ${shipment.status}`, 400));
    }

    // Add timeline entry and update status
    await shipment.addTimelineEntry({
      status: ShipmentStatus.CANCELLED,
      note: req.body.reason || 'Cancelled by merchant',
    });

    try {
      await metricScheduler.updateShipmentStatusMetrics();
    } catch (metricsError) {
      logger.warn(
        `Failed to refresh shipment status metrics after cancellation: ${metricsError.message}`
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search for shipments with filters
 * @route GET /api/v1/shipments/search
 * @access Private/Merchant
 */
exports.searchShipments = async (req, res, next) => {
  try {
    // Build query
    const query = {
      merchantId: req.user.id,
      active: true,
    };

    // Add optional filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.origin) {
      query['origin.country'] = req.query.origin;
    }

    if (req.query.destination) {
      query['destination.country'] = req.query.destination;
    }

    // Date range filters
    if (req.query.fromDate) {
      query.createdAt = { $gte: new Date(req.query.fromDate) };
    }

    if (req.query.toDate) {
      if (query.createdAt) {
        query.createdAt.$lte = new Date(req.query.toDate);
      } else {
        query.createdAt = { $lte: new Date(req.query.toDate) };
      }
    }

    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const shipments = await Shipment.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    // Get total count
    const total = await Shipment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: {
        shipments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a timeline entry to a shipment
 * @route POST /api/v1/shipments/:id/timeline
 * @access Private (varies based on role)
 */
exports.addTimelineEntry = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find shipment
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    // Shipments pending approval cannot be updated via timeline
    if (shipment.status === ShipmentStatus.PENDING_APPROVAL) {
      return next(
        new ApiError('Shipment is pending admin approval and cannot be updated yet', 400)
      );
    }

    // For TruckOwner, check if one of their trucks is assigned
    if (req.user.role === 'TruckOwner') {
      // Get the ownerId from the assignedTruckId
      const truck = await Truck.findById(shipment.assignedTruckId);
      if (!truck || truck.ownerId.toString() !== req.user.id) {
        return next(new ApiError('You do not have permission to update this shipment', 403));
      }
    }

    // For Driver, check if they are assigned
    if (req.user.role === 'Driver' && shipment.assignedDriverId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }

    // Add timeline entry
    await shipment.addTimelineEntry({
      status: req.body.status,
      note: req.body.note,
      location: req.body.location,
      documents: req.body.documents,
    });

    // Handle special status changes
    if (req.body.status === ShipmentStatus.DELIVERED) {
      shipment.actualDeliveryDate = new Date();
      await shipment.save();
    } else if (req.body.status === ShipmentStatus.IN_TRANSIT && !shipment.actualPickupDate) {
      shipment.actualPickupDate = new Date();
      await shipment.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};
