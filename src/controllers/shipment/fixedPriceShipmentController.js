const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../models/Shipment');
const { Application, ApplicationStatus } = require('../../models/Application');
const Truck = require('../../models/Truck');
const User = require('../../models/User');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const db = require('../../utils/db');
const notificationService = require('../../services/notification/notificationService');

/**
 * Create a fixed-price shipment
 * @route POST /api/v1/shipments/fixed-price
 * @access Private/Merchant
 */
exports.createFixedPriceShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Set merchantId to current user id
    req.body.merchantId = req.user.id;

    // Set initial status
    req.body.status = ShipmentStatus.PENDING_APPROVAL;

    // Ensure approval metadata is present to satisfy schema requirements
    req.body.approval = {
      state: ShipmentApprovalState.PENDING,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    };

    // Set pricing type to FIXED_PRICE
    req.body.pricingType = 'FIXED_PRICE';

    // Ensure fixed price details are provided
    if (!req.body.fixedPriceDetails || !req.body.fixedPriceDetails.amount) {
      return next(new ApiError('Fixed price amount is required for fixed-price shipments', 400));
    }

    // Add initial timeline entry
    const initialTimeline = {
      status: ShipmentStatus.PENDING_APPROVAL,
      note: 'Shipment submitted for admin approval',
    };

    if (!req.body.timeline) {
      req.body.timeline = [initialTimeline];
    } else {
      req.body.timeline.unshift(initialTimeline);
    }

    // Create new shipment
    const shipment = await Shipment.create(req.body);

    // Notify truck owners about the new fixed-price shipment
    try {
      // Find all active truck owners
      const truckOwners = await User.find({
        role: 'TruckOwner',
        active: true,
      });

      // Send notifications to truck owners
      for (const owner of truckOwners) {
        await notificationService.sendNotification(
          'FIXED_PRICE_SHIPMENT_AVAILABLE',
          {
            shipmentId: shipment._id,
            origin: shipment.origin.address,
            destination: shipment.destination.address,
            price: shipment.fixedPriceDetails.amount,
            currency: shipment.fixedPriceDetails.currency,
            cargo: shipment.cargoDetails.description,
          },
          { truckOwner: owner }
        );
      }
    } catch (notificationError) {
      logger.error('Error sending notifications for fixed-price shipment:', notificationError);
      // Continue execution even if notifications fail
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
 * Get all available fixed-price shipments for truck owners
 * @route GET /api/v1/shipments/available-fixed-price
 * @access Private/TruckOwner
 */
exports.getAvailableFixedPriceShipments = async (req, res, next) => {
  try {
    // Build query for available fixed-price shipments
    const query = {
      pricingType: 'FIXED_PRICE',
      status: ShipmentStatus.REQUESTED,
      active: true,
    };

    // Add optional filters
    if (req.query.minPrice) {
      query['fixedPriceDetails.amount'] = {
        $gte: parseFloat(req.query.minPrice),
      };
    }

    if (req.query.maxPrice) {
      if (query['fixedPriceDetails.amount']) {
        query['fixedPriceDetails.amount'].$lte = parseFloat(req.query.maxPrice);
      } else {
        query['fixedPriceDetails.amount'] = {
          $lte: parseFloat(req.query.maxPrice),
        };
      }
    }

    if (req.query.origin) {
      query['origin.country'] = req.query.origin;
    }

    if (req.query.destination) {
      query['destination.country'] = req.query.destination;
    }

    // Check truck capacity requirements if provided
    if (req.query.truckCapacity) {
      query['fixedPriceDetails.requirements.minTruckCapacity'] = {
        $lte: parseFloat(req.query.truckCapacity),
      };
    }

    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const shipments = await Shipment.find(query)
      .populate('merchantId', 'name email phone')
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
 * Accept a fixed-price shipment (TruckOwner)
 * @route POST /api/v1/shipments/:id/accept-fixed-price
 * @access Private/TruckOwner
 */
exports.acceptFixedPriceShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { truckId, driverId, acceptanceNote } = req.body;
    const shipmentId = req.params.id;

    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return next(new ApiError('Shipment not found', 404));
    }

    // Verify it's a fixed-price shipment
    if (shipment.pricingType !== 'FIXED_PRICE') {
      return next(new ApiError('This is not a fixed-price shipment', 400));
    }

    // Check if shipment is still available
    if (shipment.status !== ShipmentStatus.REQUESTED) {
      return next(
        new ApiError(
          `Shipment is not available for acceptance. Current status: ${shipment.status}`,
          400
        )
      );
    }

    // Verify truck ownership and availability
    const truck = await Truck.findById(truckId);

    if (!truck) {
      return next(new ApiError('Truck not found', 404));
    }

    if (truck.ownerId.toString() !== req.user.id) {
      return next(new ApiError('You do not own this truck', 403));
    }

    if (!truck.available) {
      return next(new ApiError('The selected truck is not available', 400));
    }

    // Check if truck meets requirements
    if (shipment.fixedPriceDetails.requirements) {
      const requirements = shipment.fixedPriceDetails.requirements;

      if (requirements.minTruckCapacity && truck.capacity < requirements.minTruckCapacity) {
        return next(
          new ApiError(
            `Truck capacity (${truck.capacity} tons) does not meet minimum requirement (${requirements.minTruckCapacity} tons)`,
            400
          )
        );
      }

      if (requirements.requiredFeatures && requirements.requiredFeatures.length > 0) {
        const missingFeatures = requirements.requiredFeatures.filter(
          (feature) => !truck.features || !truck.features.includes(feature)
        );

        if (missingFeatures.length > 0) {
          return next(
            new ApiError(`Truck is missing required features: ${missingFeatures.join(', ')}`, 400)
          );
        }
      }
    }

    // Verify driver
    const driver = await User.findById(driverId);

    if (!driver) {
      return next(new ApiError('Driver not found', 404));
    }

    if (driver.role !== 'Driver') {
      return next(new ApiError('Selected user is not a driver', 400));
    }

    if (driver.ownerId && driver.ownerId.toString() !== req.user.id) {
      return next(new ApiError('This driver does not work for you', 403));
    }

    // Check if driver is available
    if (!driver.isAvailable) {
      return next(new ApiError('The selected driver is not available', 400));
    }

    // Check if transactions are supported
    const transactionsSupported = await db.supportsTransactions();

    if (transactionsSupported) {
      // With transactions
      return await acceptWithTransaction(
        shipment,
        truck,
        driver,
        req.user,
        acceptanceNote,
        res,
        next
      );
    }
    // Without transactions (fallback mode)
    return await acceptWithoutTransaction(
      shipment,
      truck,
      driver,
      req.user,
      acceptanceNote,
      res,
      next
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Accept fixed-price shipment using MongoDB transactions
 * @private
 */
const acceptWithTransaction = async (
  shipment,
  truck,
  driver,
  truckOwner,
  acceptanceNote,
  res,
  next
) => {
  // Start a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update shipment
    shipment.status = ShipmentStatus.ASSIGNED;
    shipment.assignedTruckId = truck._id;
    shipment.assignedDriverId = driver._id;
    shipment.autoAssignedAt = new Date();
    shipment.autoAssignmentDetails = {
      truckOwnerId: truckOwner._id,
      assignedAt: new Date(),
      acceptanceNote: acceptanceNote || 'Fixed-price shipment accepted',
    };

    // Add timeline entry
    await shipment.addTimelineEntry({
      status: ShipmentStatus.ASSIGNED,
      note: `Fixed-price shipment accepted by ${truckOwner.name}. Truck: ${truck.model} (${truck.plateNumber}), Driver: ${driver.name}`,
    });

    await shipment.save({ session });

    // Mark truck as unavailable
    truck.available = false;
    truck.status = 'IN_SERVICE';
    truck.driverId = driver._id;
    await truck.save({ session });

    // Update driver status
    driver.isAvailable = false;
    driver.driverStatus = 'ACTIVE';
    await driver.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send notifications
    try {
      // Notify merchant
      const merchant = await User.findById(shipment.merchantId);
      if (merchant) {
        await notificationService.sendNotification(
          'FIXED_PRICE_SHIPMENT_ACCEPTED',
          {
            shipmentId: shipment._id,
            truckOwnerName: truckOwner.name,
            truckDetails: `${truck.model} (${truck.plateNumber})`,
            driverName: driver.name,
            price: shipment.fixedPriceDetails.amount,
            currency: shipment.fixedPriceDetails.currency,
          },
          { merchant }
        );
      }

      // Notify driver
      await notificationService.sendNotification(
        'ASSIGNED_TO_SHIPMENT',
        {
          shipmentId: shipment._id,
          origin: shipment.origin.address,
          destination: shipment.destination.address,
          cargo: shipment.cargoDetails.description,
        },
        { driver }
      );
    } catch (notificationError) {
      logger.error('Error sending notifications:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Fixed-price shipment accepted successfully',
      data: {
        shipment,
        assignedTruck: truck,
        assignedDriver: driver,
      },
    });
  } catch (error) {
    // Abort transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Accept fixed-price shipment without using transactions (fallback mode)
 * @private
 */
const acceptWithoutTransaction = async (
  shipment,
  truck,
  driver,
  truckOwner,
  acceptanceNote,
  res,
  next
) => {
  try {
    // Update shipment
    shipment.status = ShipmentStatus.ASSIGNED;
    shipment.assignedTruckId = truck._id;
    shipment.assignedDriverId = driver._id;
    shipment.autoAssignedAt = new Date();
    shipment.autoAssignmentDetails = {
      truckOwnerId: truckOwner._id,
      assignedAt: new Date(),
      acceptanceNote: acceptanceNote || 'Fixed-price shipment accepted',
    };

    // Add timeline entry
    await shipment.addTimelineEntry({
      status: ShipmentStatus.ASSIGNED,
      note: `Fixed-price shipment accepted by ${truckOwner.name}. Truck: ${truck.model} (${truck.plateNumber}), Driver: ${driver.name}`,
    });

    await shipment.save();

    // Mark truck as unavailable
    truck.available = false;
    truck.status = 'IN_SERVICE';
    truck.driverId = driver._id;
    await truck.save();

    // Update driver status
    driver.isAvailable = false;
    driver.driverStatus = 'ACTIVE';
    await driver.save();

    // Send notifications
    try {
      // Notify merchant
      const merchant = await User.findById(shipment.merchantId);
      if (merchant) {
        await notificationService.sendNotification(
          'FIXED_PRICE_SHIPMENT_ACCEPTED',
          {
            shipmentId: shipment._id,
            truckOwnerName: truckOwner.name,
            truckDetails: `${truck.model} (${truck.plateNumber})`,
            driverName: driver.name,
            price: shipment.fixedPriceDetails.amount,
            currency: shipment.fixedPriceDetails.currency,
          },
          { merchant }
        );
      }

      // Notify driver
      await notificationService.sendNotification(
        'ASSIGNED_TO_SHIPMENT',
        {
          shipmentId: shipment._id,
          origin: shipment.origin.address,
          destination: shipment.destination.address,
          cargo: shipment.cargoDetails.description,
        },
        { driver }
      );
    } catch (notificationError) {
      logger.error('Error sending notifications:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Fixed-price shipment accepted successfully',
      data: {
        shipment,
        assignedTruck: truck,
        assignedDriver: driver,
      },
    });
  } catch (error) {
    // If any operation fails, we don't have transaction rollback
    // Log the error and propagate it up
    logger.error('Error in non-transaction mode:', error);
    throw error;
  }
};

/**
 * Get my fixed-price shipments (Merchant)
 * @route GET /api/v1/shipments/fixed-price/my
 * @access Private/Merchant
 */
exports.getMyFixedPriceShipments = async (req, res, next) => {
  try {
    // Find all fixed-price shipments belonging to the current merchant
    const query = {
      merchantId: req.user.id,
      pricingType: 'FIXED_PRICE',
      active: true,
    };

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const shipments = await Shipment.find(query)
      .populate('assignedTruckId')
      .populate('assignedDriverId', 'name email phone')
      .sort({ createdAt: -1 });

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
 * Get my accepted fixed-price shipments (TruckOwner)
 * @route GET /api/v1/truck-owner/fixed-price-shipments
 * @access Private/TruckOwner
 */
exports.getMyAcceptedFixedPriceShipments = async (req, res, next) => {
  try {
    // Find all fixed-price shipments assigned to this truck owner
    const query = {
      'autoAssignmentDetails.truckOwnerId': req.user.id,
      pricingType: 'FIXED_PRICE',
      active: true,
    };

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const shipments = await Shipment.find(query)
      .populate('merchantId', 'name email phone')
      .populate('assignedTruckId')
      .populate('assignedDriverId', 'name email phone')
      .sort({ autoAssignedAt: -1 });

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
 * Convert a fixed-price shipment to bidding (Merchant)
 * @route PATCH /api/v1/shipments/:id/convert-to-bidding
 * @access Private/Merchant
 */
exports.convertToBidding = async (req, res, next) => {
  try {
    const shipmentId = req.params.id;

    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return next(new ApiError('Shipment not found', 404));
    }

    // Check if shipment belongs to the current merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to modify this shipment', 403));
    }

    // Check if it's a fixed-price shipment
    if (shipment.pricingType !== 'FIXED_PRICE') {
      return next(new ApiError('This shipment is already set for bidding', 400));
    }

    // Check if shipment status allows conversion
    if (shipment.status !== ShipmentStatus.REQUESTED) {
      return next(new ApiError(`Cannot convert shipment with status: ${shipment.status}`, 400));
    }

    // Convert to bidding
    shipment.pricingType = 'BIDDING';
    shipment.fixedPriceDetails = undefined;

    // Add timeline entry
    await shipment.addTimelineEntry({
      status: shipment.status,
      note: 'Shipment converted from fixed-price to bidding',
    });

    await shipment.save();

    res.status(200).json({
      status: 'success',
      message: 'Shipment successfully converted to bidding',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update fixed-price details (Merchant)
 * @route PATCH /api/v1/shipments/:id/fixed-price-details
 * @access Private/Merchant
 */
exports.updateFixedPriceDetails = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shipmentId = req.params.id;
    const { amount, currency, requirements } = req.body;

    // Find the shipment
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return next(new ApiError('Shipment not found', 404));
    }

    // Check if shipment belongs to the current merchant
    if (shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to modify this shipment', 403));
    }

    // Check if it's a fixed-price shipment
    if (shipment.pricingType !== 'FIXED_PRICE') {
      return next(new ApiError('This is not a fixed-price shipment', 400));
    }

    // Check if shipment status allows updates
    if (shipment.status !== ShipmentStatus.REQUESTED) {
      return next(new ApiError(`Cannot update shipment with status: ${shipment.status}`, 400));
    }

    // Update fixed-price details
    if (amount !== undefined) {
      shipment.fixedPriceDetails.amount = amount;
    }
    if (currency !== undefined) {
      shipment.fixedPriceDetails.currency = currency;
    }
    if (requirements !== undefined) {
      shipment.fixedPriceDetails.requirements = {
        ...shipment.fixedPriceDetails.requirements,
        ...requirements,
      };
    }

    await shipment.save();

    res.status(200).json({
      status: 'success',
      message: 'Fixed-price details updated successfully',
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};
