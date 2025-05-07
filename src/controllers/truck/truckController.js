const { validationResult } = require('express-validator');
const Truck = require('../../models/Truck');
const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

/**
 * Create a new truck
 * @route POST /api/v1/trucks
 * @access Private/TruckOwner
 */
exports.createTruck = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if a truck with the same plate number already exists
    const existingTruck = await Truck.findOne({ plateNumber: req.body.plateNumber });
    if (existingTruck) {
      return res.status(400).json({
        status: 'error',
        message: `A truck with plate number ${req.body.plateNumber} already exists`
      });
    }
    
    // Set ownerId to the current user's id
    req.body.ownerId = req.user.id;
    
    // Create new truck
    const truck = await Truck.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        truck
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all trucks for the current truck owner
 * @route GET /api/v1/trucks
 * @access Private/TruckOwner
 */
exports.getMyTrucks = async (req, res, next) => {
  try {
    // Find all trucks belonging to the current user
    const trucks = await Truck.find({ 
      ownerId: req.user.id,
      active: true 
    });
    
    res.status(200).json({
      status: 'success',
      results: trucks.length,
      data: {
        trucks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single truck by ID
 * @route GET /api/v1/trucks/:id
 * @access Private/TruckOwner
 */
exports.getTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id).populate('currentShipment');
    
    if (!truck) {
      return next(new ApiError('No truck found with that ID', 404));
    }
    
    // Check if truck belongs to the current user
    if (truck.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to access this truck', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        truck
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a truck
 * @route PATCH /api/v1/trucks/:id
 * @access Private/TruckOwner
 */
exports.updateTruck = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Find truck
    const truck = await Truck.findById(req.params.id);
    
    if (!truck) {
      return next(new ApiError('No truck found with that ID', 404));
    }
    
    // Check if truck belongs to the current user
    if (truck.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this truck', 403));
    }
    
    // If plateNumber is being updated, check for duplicates
    if (req.body.plateNumber && req.body.plateNumber !== truck.plateNumber) {
      const existingTruck = await Truck.findOne({ plateNumber: req.body.plateNumber });
      if (existingTruck) {
        return res.status(400).json({
          status: 'error',
          message: `A truck with plate number ${req.body.plateNumber} already exists`
        });
      }
    }
    
    // Update truck
    const updatedTruck = await Truck.findByIdAndUpdate(
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
        truck: updatedTruck
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a truck (soft delete)
 * @route DELETE /api/v1/trucks/:id
 * @access Private/TruckOwner
 */
exports.deleteTruck = async (req, res, next) => {
  try {
    // Find truck
    const truck = await Truck.findById(req.params.id);
    
    if (!truck) {
      return next(new ApiError('No truck found with that ID', 404));
    }
    
    // Check if truck belongs to the current user
    if (truck.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to delete this truck', 403));
    }
    
    // Soft delete truck
    await Truck.findByIdAndUpdate(req.params.id, { active: false });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search for trucks with filters
 * @route GET /api/v1/trucks/search
 * @access Private/TruckOwner
 */
exports.searchTrucks = async (req, res, next) => {
  try {
    // Build query
    const query = { 
      ownerId: req.user.id,
      active: true 
    };
    
    // Add optional filters
    if (req.query.available) {
      query.available = req.query.available === 'true';
    }
    
    if (req.query.capacity) {
      query.capacity = { $gte: parseInt(req.query.capacity) };
    }
    
    if (req.query.year) {
      query.year = { $gte: parseInt(req.query.year) };
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const trucks = await Truck.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Truck.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: trucks.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        trucks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a driver to a truck
 * @route PATCH /api/v1/trucks/:truckId/assign/:driverId
 * @access Private/TruckOwner
 */
exports.assignDriver = async (req, res, next) => {
  try {
    const { truckId, driverId } = req.params;
    
    // Find truck
    const truck = await Truck.findById(truckId);
    
    if (!truck) {
      return next(new ApiError('No truck found with that ID', 404));
    }
    
    // Check if truck belongs to the current user
    if (truck.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this truck', 403));
    }
    
    // Find driver
    const driver = await User.findById(driverId);
    
    if (!driver) {
      return next(new ApiError('No driver found with that ID', 404));
    }
    
    // Check if driver belongs to the current user
    if (driver.ownerId && driver.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to assign this driver', 403));
    }
    
    // Check if driver role is Driver
    if (driver.role !== 'Driver') {
      return next(new ApiError('Selected user is not a driver', 400));
    }
    
    // Add driverId to truck
    truck.driverId = driverId;
    await truck.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        truck
      }
    });
  } catch (error) {
    next(error);
  }
}; 