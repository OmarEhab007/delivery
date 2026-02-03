const path = require('path');
const { validationResult } = require('express-validator');

const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const { Document, DocumentType } = require('../../models/Document');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const metricScheduler = require('../../utils/metricScheduler');
const trackingService = require('../../services/tracking/trackingService');

const INSURANCE_REQUIRED_INCOTERMS = new Set(['CIF', 'CIP']);

const buildComplianceSummary = (shipment) => {
  const compliance = shipment.compliance || {};
  const documents = compliance.documents || {};
  const missing = [];

  if (!compliance.acidNumber) missing.push('ACID_NUMBER');
  if (!compliance.aciProofDocumentId) missing.push('ACI_PROOF');
  if (!compliance.brokerId) missing.push('BROKER');
  if (!documents.commercialInvoiceDocumentId) missing.push('COMMERCIAL_INVOICE');
  if (!documents.packingListDocumentId) missing.push('PACKING_LIST');
  if (!documents.billOfLadingDocumentId && !documents.waybillDocumentId) {
    missing.push('BILL_OF_LADING_OR_WAYBILL');
  }
  if (compliance.gaftaRequested && !documents.certificateOfOriginDocumentId) {
    missing.push('CERTIFICATE_OF_ORIGIN');
  }
  if (compliance.insuranceRequired && !documents.insuranceDocumentId) {
    missing.push('INSURANCE_CERTIFICATE');
  }

  return {
    ready: shipment.isComplianceReady(),
    missing,
  };
};

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {
      merchantId: req.user.id,
      active: true,
    };

    const [shipments, total] = await Promise.all([
      Shipment.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Shipment.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      data: {
        shipments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
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

/**
 * Update shipment compliance details
 * @route PATCH /api/shipments/:id/compliance
 * @access Private/Merchant
 */
exports.updateComplianceDetails = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }

    const { acidNumber, gaftaRequested, incoterm, saberStatus } = req.body;

    shipment.compliance = shipment.compliance || {};

    if (acidNumber !== undefined) {
      shipment.compliance.acidNumber = String(acidNumber).trim();
    }

    if (gaftaRequested !== undefined) {
      shipment.compliance.gaftaRequested = Boolean(gaftaRequested);
    }

    if (incoterm !== undefined) {
      const normalizedIncoterm = String(incoterm).trim().toUpperCase();
      shipment.incoterm = normalizedIncoterm;
      shipment.compliance.insuranceRequired = INSURANCE_REQUIRED_INCOTERMS.has(normalizedIncoterm);
    }

    if (saberStatus !== undefined) {
      shipment.compliance.saberStatus = saberStatus;
    }

    shipment.refreshComplianceStatus();
    await shipment.save();

    return res.status(200).json({
      status: 'success',
      data: {
        compliance: shipment.compliance,
        summary: buildComplianceSummary(shipment),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment compliance status
 * @route GET /api/shipments/:id/compliance
 * @access Private/Merchant
 */
exports.getComplianceStatus = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to view this shipment', 403));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        compliance: shipment.compliance,
        summary: buildComplianceSummary(shipment),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload shipment compliance document
 * @route POST /api/shipments/:id/compliance/documents
 * @access Private/Merchant
 */
exports.uploadComplianceDocument = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }

    const { documentType, name, description } = req.body;

    if (!req.file) {
      return next(new ApiError('No file was uploaded', 400));
    }

    // Validate file MIME type for security
    const ALLOWED_COMPLIANCE_MIME_TYPES = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);

    if (!ALLOWED_COMPLIANCE_MIME_TYPES.has(req.file.mimetype)) {
      return next(
        new ApiError('Invalid file type. Only PDF, images, and documents are allowed', 400)
      );
    }

    const allowedComplianceTypes = new Set([
      DocumentType.COMMERCIAL_INVOICE,
      DocumentType.SHIPPING_INVOICE,
      DocumentType.PACKING_LIST,
      DocumentType.BILL_OF_LADING,
      DocumentType.WAYBILL,
      DocumentType.CERTIFICATE_OF_ORIGIN,
      DocumentType.ACID_PROOF,
      DocumentType.INSURANCE_CERTIFICATE,
    ]);

    if (!documentType || !allowedComplianceTypes.has(documentType)) {
      return next(new ApiError('Invalid document type for compliance upload', 400));
    }

    const filePath = req.file.relativePath
      ? req.file.relativePath
      : req.file.path.replace(`${process.cwd()}/uploads/`, '');

    const document = new Document({
      name: name || req.file.originalname,
      description,
      filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      originalName: req.file.originalname,
      documentType,
      uploadedBy: req.user.id,
      entityType: 'Shipment',
      entityId: shipment._id,
    });

    await document.save();

    await shipment.addDocument(document);

    shipment.compliance = shipment.compliance || {};
    shipment.compliance.documents = shipment.compliance.documents || {};

    const complianceDocMap = {
      [DocumentType.COMMERCIAL_INVOICE]: 'commercialInvoiceDocumentId',
      [DocumentType.SHIPPING_INVOICE]: 'commercialInvoiceDocumentId',
      [DocumentType.PACKING_LIST]: 'packingListDocumentId',
      [DocumentType.BILL_OF_LADING]: 'billOfLadingDocumentId',
      [DocumentType.WAYBILL]: 'waybillDocumentId',
      [DocumentType.CERTIFICATE_OF_ORIGIN]: 'certificateOfOriginDocumentId',
      [DocumentType.INSURANCE_CERTIFICATE]: 'insuranceDocumentId',
    };

    if (documentType === DocumentType.ACID_PROOF) {
      shipment.compliance.aciProofDocumentId = document._id;
    } else if (complianceDocMap[documentType]) {
      shipment.compliance.documents[complianceDocMap[documentType]] = document._id;
    }

    shipment.refreshComplianceStatus();
    await shipment.save();

    return res.status(201).json({
      status: 'success',
      data: {
        document,
        compliance: shipment.compliance,
        summary: buildComplianceSummary(shipment),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload payment proof
 * @route POST /api/shipments/:id/payment-proof
 * @access Private/Merchant
 */
exports.uploadPaymentProof = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to update this shipment', 403));
    }

    if (!req.file) {
      return next(new ApiError('No file was uploaded', 400));
    }

    // Validate file MIME type for payment proofs
    const ALLOWED_PAYMENT_PROOF_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

    if (!ALLOWED_PAYMENT_PROOF_TYPES.has(req.file.mimetype)) {
      return next(
        new ApiError('Invalid file type. Only PDF and images are allowed for payment proofs', 400)
      );
    }

    const { amount, currency } = req.body;
    const filePath = req.file.relativePath
      ? req.file.relativePath
      : req.file.path.replace(`${process.cwd()}/uploads/`, '');

    const document = new Document({
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      originalName: req.file.originalname,
      documentType: DocumentType.PAYMENT_RECEIPT,
      uploadedBy: req.user.id,
      entityType: 'Shipment',
      entityId: shipment._id,
    });

    await document.save();
    await shipment.addDocument(document);

    shipment.paymentDetails = shipment.paymentDetails || {};
    shipment.paymentDetails.paymentReceiptDocumentId = document._id;
    shipment.paymentDetails.paymentDate = new Date();
    shipment.paymentDetails.paymentVerified = false;
    shipment.paymentDetails.paymentReceiptUrl = `/uploads/${document.filePath}`;
    if (amount !== undefined && amount !== '') {
      const parsedAmount = Number(amount);
      if (!Number.isNaN(parsedAmount)) {
        shipment.paymentDetails.amount = parsedAmount;
      }
    }
    if (currency) {
      shipment.paymentDetails.currency = currency;
    }

    await shipment.save();

    await shipment.addTimelineEntry({
      status: shipment.status,
      note: 'Payment proof uploaded by merchant',
    });

    return res.status(201).json({
      status: 'success',
      data: {
        document,
        paymentDetails: shipment.paymentDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment tracking info
 * @route GET /api/shipments/:id/tracking
 * @access Private/Merchant
 */
exports.getTracking = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to view this shipment', 403));
    }

    let eta = null;
    try {
      eta = await trackingService.calculateETA(shipment._id);
    } catch (etaError) {
      logger.warn(`Failed to calculate ETA: ${etaError.message}`);
    }

    return res.status(200).json({
      status: 'success',
      data: {
        currentLocation: shipment.currentLocation,
        lastUpdate: shipment.currentLocation?.timestamp || null,
        eta,
        status: shipment.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment tracking history
 * @route GET /api/shipments/:id/tracking/history
 * @access Private/Merchant
 */
exports.getTrackingHistory = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id, 'trackingHistory merchantId');

    if (!shipment) {
      return next(new ApiError('No shipment found with that ID', 404));
    }

    if (req.user.role === 'Merchant' && shipment.merchantId.toString() !== req.user.id) {
      return next(new ApiError('You do not have permission to view this shipment', 403));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        trackingHistory: shipment.trackingHistory || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
