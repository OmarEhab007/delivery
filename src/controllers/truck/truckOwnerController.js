const { asyncHandler } = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { Shipment } = require('../../models/Shipment');
const { Application } = require('../../models/Application');

// Debug logs
console.log('Before importing User module');
try {
  const User = require('../../models/User');
  console.log('User model imported successfully:', User !== undefined);
  
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
      status: 'ACCEPTED'
    });
    
    // Get all shipment IDs from these applications
    const shipmentIds = acceptedApplications.map(app => app.shipmentId);
    
    // Find all these shipments
    const shipments = await Shipment.find({
      _id: { $in: shipmentIds }
    })
    .populate('merchantId', 'name email phone')
    .populate('assignedTruckId')
    .populate('assignedDriverId', 'name email phone');
    
    return ApiSuccess(res, {
      count: shipments.length,
      shipments
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
      status: 'ACCEPTED'
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
      ownerId: req.user.id
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
        ownerId: req.user.id
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
      note: `Shipment assigned to driver by truck owner`,
      location: shipment.currentLocation
    });
    
    await shipment.save();
    
    return ApiSuccess(res, {
      message: 'Shipment successfully assigned to driver',
      shipment
    });
  });

  /**
   * Get available drivers owned by the truck owner
   * @route GET /api/v1/truck-owner/drivers/available
   * @access Private (TruckOwner only)
   */
  const getAvailableDrivers = asyncHandler(async (req, res, next) => {
    console.log('getAvailableDrivers called');
    console.log('User model:', User);
    console.log('User.find exists:', typeof User.find === 'function');
    
    const drivers = await User.find({
      role: 'Driver',
      ownerId: req.user.id,
      isAvailable: true,
      driverStatus: 'ACTIVE'
    })
    .select('name email phone licenseNumber currentLocation');
    
    return ApiSuccess(res, {
      count: drivers.length,
      drivers
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
      status: 'Available'
    });
    
    return ApiSuccess(res, {
      count: trucks.length,
      trucks
    });
  });

  module.exports = {
    getMyShipments,
    assignShipmentToDriver,
    getAvailableDrivers,
    getAvailableTrucks
  };
} catch (error) {
  console.error('Error importing User model:', error);
  throw error;
}