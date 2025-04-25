const { validationResult } = require('express-validator');
const { Shipment, ShipmentStatus } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

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
    
    // Set merchantId to current user id
    req.body.merchantId = req.user.id;
    
    // Set initial status
    req.body.status = ShipmentStatus.REQUESTED;
    
    // Add initial timeline entry
    const initialTimeline = {
      status: ShipmentStatus.REQUESTED,
      note: 'Shipment request created'
    };
    
    if (!req.body.timeline) {
      req.body.timeline = [initialTimeline];
    } else {
      req.body.timeline.unshift(initialTimeline);
    }
    
    // Create new shipment
    const shipment = await Shipment.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        shipment
      }
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
      active: true 
    });
    
    res.status(200).json({
      status: 'success',
      results: shipments.length,
      data: {
        shipments
      }
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
    if (
      req.user.role === 'Merchant' && 
      shipment.merchantId.toString() !== req.user.id
    ) {
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
    if (
      req.user.role === 'Driver' && 
      shipment.assignedDriverId.toString() !== req.user.id
    ) {
      return next(new ApiError('You do not have permission to access this shipment', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
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
    
    // Check if shipment status allows updates
    if (
      ![
        ShipmentStatus.REQUESTED,
        ShipmentStatus.CANCELLED
      ].includes(shipment.status)
    ) {
      return next(new ApiError(`Cannot update shipment with status: ${shipment.status}`, 400));
    }
    
    // Update shipment
    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        shipment: updatedShipment
      }
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
        ShipmentStatus.REQUESTED,
        ShipmentStatus.CONFIRMED
      ].includes(shipment.status)
    ) {
      return next(new ApiError(`Cannot cancel shipment with status: ${shipment.status}`, 400));
    }
    
    // Add timeline entry and update status
    await shipment.addTimelineEntry({
      status: ShipmentStatus.CANCELLED,
      note: req.body.reason || 'Cancelled by merchant'
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
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
      active: true 
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
    
    const shipments = await Shipment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Shipment.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: shipments.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        shipments
      }
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
    
    // For TruckOwner, check if one of their trucks is assigned
    if (req.user.role === 'TruckOwner') {
      // Get the ownerId from the assignedTruckId
      const truck = await Truck.findById(shipment.assignedTruckId);
      if (!truck || truck.ownerId.toString() !== req.user.id) {
        return next(new ApiError('You do not have permission to update this shipment', 403));
      }
    }
    
    // For Driver, check if they are assigned
    if (
      req.user.role === 'Driver' && 
      shipment.assignedDriverId.toString() !== req.user.id
    ) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }
    
    // Add timeline entry
    await shipment.addTimelineEntry({
      status: req.body.status,
      note: req.body.note,
      location: req.body.location,
      documents: req.body.documents
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
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
}; 