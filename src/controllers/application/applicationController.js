const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Application, ApplicationStatus } = require('../../models/Application');
const { Shipment, ShipmentStatus } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const db = require('../../utils/db');

/**
 * Create a new application/bid for a shipment
 * @route POST /api/v1/applications
 * @access Private/TruckOwner
 */
exports.createApplication = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { shipmentId, truckId, driverId, bidDetails } = req.body;
    
    // Set ownerId to current user id
    const ownerId = req.user.id;
    
    // Check if shipment exists and is in REQUESTED state
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      return next(new ApiError('Shipment not found', 404));
    }
    
    if (shipment.status !== ShipmentStatus.REQUESTED) {
      return next(new ApiError(`Cannot apply for shipment with status: ${shipment.status}`, 400));
    }
    
    // Check if truck belongs to the truck owner
    const truck = await Truck.findById(truckId);
    
    if (!truck) {
      return next(new ApiError('Truck not found', 404));
    }
    
    if (truck.ownerId.toString() !== ownerId) {
      return next(new ApiError('You do not own this truck', 403));
    }
    
    // Check if truck is available
    if (!truck.available) {
      return next(new ApiError('The selected truck is not available', 400));
    }
    
    // Check if driver exists and belongs to the truck owner
    const driver = await User.findById(driverId);
    
    if (!driver) {
      return next(new ApiError('Driver not found', 404));
    }
    
    if (driver.role !== 'Driver') {
      return next(new ApiError('Selected user is not a driver', 400));
    }
    
    if (driver.ownerId && driver.ownerId.toString() !== ownerId) {
      return next(new ApiError('This driver does not work for you', 403));
    }
    
    // Check if already applied for this shipment
    const existingApplication = await Application.findOne({
      shipmentId,
      ownerId
    });
    
    if (existingApplication) {
      return next(new ApiError('You have already applied for this shipment', 400));
    }
    
    // Create the application
    const application = await Application.create({
      shipmentId,
      ownerId,
      truckId,
      driverId,
      bidDetails,
      status: ApplicationStatus.PENDING
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications for the current truck owner
 * @route GET /api/v1/applications
 * @access Private/TruckOwner
 */
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      ownerId: req.user.id
    })
    .populate('shipmentId')
    .populate('truckId')
    .populate('driverId');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications for a specific shipment
 * @route GET /api/v1/shipments/:shipmentId/applications
 * @access Private/Merchant
 */
exports.getShipmentApplications = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    
    // Check if shipment exists and belongs to merchant
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      return next(new ApiError('Shipment not found', 404));
    }
    
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to view applications for this shipment', 403));
    }
    
    // Get all applications for this shipment
    const applications = await Application.find({
      shipmentId
    })
    .populate('ownerId', 'name email phone companyName')
    .populate('truckId')
    .populate('driverId', 'name email phone licenseNumber');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single application by ID
 * @route GET /api/v1/applications/:id
 * @access Private
 */
exports.getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('shipmentId')
      .populate('ownerId', 'name email phone companyName')
      .populate('truckId')
      .populate('driverId', 'name email phone licenseNumber');
    
    if (!application) {
      return next(new ApiError('Application not found', 404));
    }
    
    // Check permissions
    const isTruckOwner = application.ownerId._id.toString() === req.user.id;
    const shipment = application.shipmentId;
    const isMerchant = shipment.merchantId.toString() === req.user.id;
    
    if (!isTruckOwner && !isMerchant) {
      return next(new ApiError('You do not have permission to view this application', 403));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an application (only if pending)
 * @route PATCH /api/v1/applications/:id
 * @access Private/TruckOwner
 */
exports.updateApplication = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Find application
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return next(new ApiError('Application not found', 404));
    }
    
    // Check if application belongs to the truck owner
    if (application.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this application', 403));
    }
    
    // Check if application is still pending
    if (application.status !== ApplicationStatus.PENDING) {
      return next(new ApiError(`Cannot update application with status: ${application.status}`, 400));
    }
    
    // Only allow updating bidDetails
    if (req.body.bidDetails) {
      application.bidDetails = {
        ...application.bidDetails,
        ...req.body.bidDetails
      };
    }
    
    // If truck or driver is being updated, validate them
    if (req.body.truckId) {
      const truck = await Truck.findById(req.body.truckId);
      
      if (!truck) {
        return next(new ApiError('Truck not found', 404));
      }
      
      if (truck.ownerId.toString() !== req.user.id) {
        return next(new ApiError('You do not own this truck', 403));
      }
      
      if (!truck.available) {
        return next(new ApiError('The selected truck is not available', 400));
      }
      
      application.truckId = req.body.truckId;
    }
    
    if (req.body.driverId) {
      const driver = await User.findById(req.body.driverId);
      
      if (!driver) {
        return next(new ApiError('Driver not found', 404));
      }
      
      if (driver.role !== 'Driver') {
        return next(new ApiError('Selected user is not a driver', 400));
      }
      
      if (driver.ownerId && driver.ownerId.toString() !== req.user.id) {
        return next(new ApiError('This driver does not work for you', 403));
      }
      
      application.driverId = req.body.driverId;
    }
    
    await application.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an application (only if pending)
 * @route PATCH /api/v1/applications/:id/cancel
 * @access Private/TruckOwner
 */
exports.cancelApplication = async (req, res, next) => {
  try {
    // Find application
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return next(new ApiError('Application not found', 404));
    }
    
    // Check if application belongs to the truck owner
    if (application.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to cancel this application', 403));
    }
    
    // Check if application is still pending
    if (application.status !== ApplicationStatus.PENDING) {
      return next(new ApiError(`Cannot cancel application with status: ${application.status}`, 400));
    }
    
    // Cancel the application
    await application.cancel();
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an application (Merchant only)
 * @route PATCH /api/v1/applications/:id/accept
 * @access Private/Merchant
 */
exports.acceptApplication = async (req, res, next) => {
  try {
    // Find application
    const application = await Application.findById(req.params.id)
      .populate('shipmentId');
    
    if (!application) {
      return next(new ApiError('Application not found', 404));
    }
    
    const shipment = application.shipmentId;
    
    // Check if shipment belongs to the merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to accept this application', 403));
    }
    
    // Check if application is still pending
    if (application.status !== ApplicationStatus.PENDING) {
      return next(new ApiError(`Cannot accept application with status: ${application.status}`, 400));
    }
    
    // Check if shipment is still in REQUESTED state
    if (shipment.status !== ShipmentStatus.REQUESTED) {
      return next(new ApiError(`Cannot accept application for shipment with status: ${shipment.status}`, 400));
    }
    
    // Check if transactions are supported
    const transactionsSupported = await db.supportsTransactions();
    
    if (transactionsSupported) {
      // With transactions
      return await acceptWithTransaction(application, shipment, res, next);
    } else {
      // Without transactions (fallback mode)
      return await acceptWithoutTransaction(application, shipment, res, next);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Accept application using MongoDB transactions
 * @private
 */
const acceptWithTransaction = async (application, shipment, res, next) => {
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Accept the application
    application.status = ApplicationStatus.ACCEPTED;
    await application.save({ session });
    
    // Reject all other applications for this shipment
    await Application.rejectOthers(shipment._id, application._id);
    
    // Update the shipment
    shipment.status = ShipmentStatus.CONFIRMED;
    shipment.selectedApplicationId = application._id;
    shipment.assignedTruckId = application.truckId;
    shipment.assignedDriverId = application.driverId;
    
    // Add timeline entry
    await shipment.addTimelineEntry({
      status: ShipmentStatus.CONFIRMED,
      note: 'Application accepted and shipment confirmed'
    });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      status: 'success',
      data: {
        application,
        shipment
      }
    });
  } catch (error) {
    // Abort transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Accept application without using transactions (fallback mode)
 * @private
 */
const acceptWithoutTransaction = async (application, shipment, res, next) => {
  try {
    // Accept the application
    application.status = ApplicationStatus.ACCEPTED;
    await application.save();
    
    // Reject all other applications for this shipment
    // Use a non-transaction version
    await Application.updateMany(
      { 
        shipmentId: shipment._id, 
        _id: { $ne: application._id },
        status: ApplicationStatus.PENDING 
      },
      { 
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Another application was selected'
      }
    );
    
    // Update the shipment
    shipment.status = ShipmentStatus.CONFIRMED;
    shipment.selectedApplicationId = application._id;
    shipment.assignedTruckId = application.truckId;
    shipment.assignedDriverId = application.driverId;
    
    // Add timeline entry
    await shipment.addTimelineEntry({
      status: ShipmentStatus.CONFIRMED,
      note: 'Application accepted and shipment confirmed'
    });
    
    await shipment.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        application,
        shipment
      }
    });
  } catch (error) {
    // If any operation fails, we don't have transaction rollback
    // Log the error and propagate it up
    logger.error('Error in non-transaction mode:', error);
    throw error;
  }
};

/**
 * Reject an application (Merchant only)
 * @route PATCH /api/v1/applications/:id/reject
 * @access Private/Merchant
 */
exports.rejectApplication = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Find application
    const application = await Application.findById(req.params.id)
      .populate('shipmentId');
    
    if (!application) {
      return next(new ApiError('Application not found', 404));
    }
    
    const shipment = application.shipmentId;
    
    // Check if shipment belongs to the merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to reject this application', 403));
    }
    
    // Check if application is still pending
    if (application.status !== ApplicationStatus.PENDING) {
      return next(new ApiError(`Cannot reject application with status: ${application.status}`, 400));
    }
    
    // Reject the application
    await application.reject(req.body.reason);
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
}; 