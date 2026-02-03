/**
 * Shipment Model
 *
 * Represents cargo transportation from origin to destination.
 * Manages shipment status, timeline, assignments, and payment details.
 *
 * @module models/Shipment
 * @requires mongoose
 */
const mongoose = require('mongoose');

/**
 * Shipment Status Enumeration
 * @enum {string}
 */
const ShipmentStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  LOADING: 'LOADING',
  IN_TRANSIT: 'IN_TRANSIT',
  UNLOADING: 'UNLOADING',
  AT_BORDER: 'AT_BORDER',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED',
  REJECTED: 'REJECTED',
};

/**
 * Shipment Approval State Enumeration
 * @enum {string}
 */
const ShipmentApprovalState = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * Timeline Entry Schema
 * Tracks the history of status changes and events for a shipment
 * @type {mongoose.Schema}
 */
const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [...Object.values(ShipmentStatus), 'ISSUE_REPORTED'],
      required: true,
    },
    note: String,
    documents: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        name: String,
        type: String,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

const shipmentSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipment must belong to a merchant'],
    },
    pricingType: {
      type: String,
      enum: ['BIDDING', 'FIXED_PRICE'],
      default: 'BIDDING',
      required: true,
    },
    incoterm: {
      type: String,
      trim: true,
      uppercase: true,
    },
    fixedPriceDetails: {
      amount: {
        type: Number,
        required: function () {
          return this.pricingType === 'FIXED_PRICE';
        },
        min: [0, 'Price must be a positive number'],
      },
      currency: {
        type: String,
        default: 'USD',
      },
      autoAssign: {
        type: Boolean,
        default: true,
      },
      requirements: {
        minTruckCapacity: {
          type: Number,
          min: 0,
        },
        requiredFeatures: [String],
        maxDeliveryDays: {
          type: Number,
          min: 1,
        },
      },
    },
    autoAssignedAt: Date,
    autoAssignmentDetails: {
      truckOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      assignedAt: Date,
      acceptanceNote: String,
    },
    origin: {
      address: {
        type: String,
        required: [true, 'Origin address is required'],
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      country: String,
    },
    destination: {
      address: {
        type: String,
        required: [true, 'Destination address is required'],
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      country: String,
    },
    cargoDetails: {
      description: {
        type: String,
        required: [true, 'Cargo description is required'],
      },
      weight: {
        type: Number,
        required: [true, 'Cargo weight is required'],
      },
      volume: Number,
      category: String,
      hazardous: {
        type: Boolean,
        default: false,
      },
      specialInstructions: String,
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.PENDING_APPROVAL,
    },
    approval: {
      state: {
        type: String,
        enum: Object.values(ShipmentApprovalState),
        default: ShipmentApprovalState.PENDING,
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
      rejectionReason: String,
    },
    compliance: {
      status: {
        type: String,
        enum: ['PENDING', 'READY'],
        default: 'PENDING',
      },
      acidNumber: {
        type: String,
        trim: true,
      },
      aciProofDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
      brokerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Broker',
      },
      documents: {
        commercialInvoiceDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        packingListDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        billOfLadingDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        waybillDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        certificateOfOriginDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        insuranceDocumentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
      },
      gaftaRequested: {
        type: Boolean,
        default: false,
      },
      insuranceRequired: {
        type: Boolean,
        default: false,
      },
      saberStatus: {
        type: String,
        enum: ['NOT_APPLICABLE', 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'],
        default: 'NOT_APPLICABLE',
      },
      completedAt: Date,
    },
    selectedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    assignedTruckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timeline: [timelineEntrySchema],
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      timestamp: Date,
      address: String,
    },
    trackingHistory: [
      {
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
            default: [0, 0],
          },
          address: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        source: {
          type: String,
          enum: ['DRIVER', 'SYSTEM', 'IMPORT'],
          default: 'DRIVER',
        },
      },
    ],
    paymentDetails: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      paymentReceiptUrl: String,
      paymentVerified: {
        type: Boolean,
        default: false,
      },
      paymentDate: Date,
      paymentReceiptDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    },
    documents: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        name: String,
        documentType: String,
        required: {
          type: Boolean,
          default: false,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        uploadDate: Date,
      },
    ],
    requiredDocuments: [
      {
        name: String,
        documentType: String,
        description: String,
        isProvided: {
          type: Boolean,
          default: false,
        },
      },
    ],
    integrationReference: {
      credentialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IntegrationCredential',
      },
      referenceId: {
        type: String,
        trim: true,
      },
      receivedAt: Date,
    },
    // Driver-related fields
    startOdometer: Number,
    endOdometer: Number,
    distanceTraveled: Number,
    recipient: {
      name: String,
      signature: String, // Base64 encoded signature
    },
    deliveryProofs: [
      {
        type: {
          type: String,
          enum: ['PHOTO', 'SIGNATURE', 'DOCUMENT', 'OTHER'],
          default: 'PHOTO',
        },
        filePath: String,
        fileName: String,
        mimeType: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    issues: [
      {
        type: {
          type: String,
          enum: [
            'DELIVERY_FAILED',
            'ACCIDENT',
            'CARGO_DAMAGED',
            'VEHICLE_BREAKDOWN',
            'TRAFFIC',
            'WEATHER',
            'OTHER',
          ],
          required: true,
        },
        description: String,
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
            default: [0, 0],
          },
        },
        status: {
          type: String,
          enum: ['OPEN', 'RESOLVED', 'CLOSED'],
          default: 'OPEN',
        },
        resolution: {
          description: String,
          resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          resolvedAt: Date,
        },
      },
    ],
    estimatedPickupDate: Date,
    estimatedDeliveryDate: Date,
    actualPickupDate: Date,
    actualDeliveryDate: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shipmentSchema.pre('validate', function (next) {
  if (
    this.status === ShipmentStatus.PENDING_APPROVAL &&
    this.approval.state !== ShipmentApprovalState.PENDING
  ) {
    this.approval.state = ShipmentApprovalState.PENDING;
  }
  if (this.status === ShipmentStatus.REJECTED) {
    this.approval.state = ShipmentApprovalState.REJECTED;
  }
  next();
});

shipmentSchema.pre('save', async function (next) {
  if (this.isNew || !this.isModified('status')) {
    return next();
  }

  try {
    const previous = await this.constructor.findById(this._id).select('status');
    this.$locals.previousStatus = previous ? previous.status : null;
    return next();
  } catch (error) {
    return next(error);
  }
});

shipmentSchema.post('save', function (doc) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const previousStatus = doc?.$locals?.previousStatus;
  if (!previousStatus || previousStatus === doc.status) {
    return;
  }

  const { emitShipmentStatusEvent } = require('../services/integration/webhookService');
  const { evaluateAutomationRules } = require('../services/automation/automationService');
  const logger = require('../utils/logger');

  emitShipmentStatusEvent({ shipment: doc, previousStatus }).catch((error) => {
    logger.error('Failed to emit webhook event for shipment status change', {
      shipmentId: doc._id,
      error: error.message,
      stack: error.stack,
    });
  });

  evaluateAutomationRules(doc, { previousStatus }).catch((error) => {
    logger.error('Failed to evaluate automation rules for shipment', {
      shipmentId: doc._id,
      error: error.message,
      stack: error.stack,
    });
  });
});

// Indexes
shipmentSchema.index({ merchantId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ assignedTruckId: 1 });
shipmentSchema.index({ assignedDriverId: 1 });
shipmentSchema.index({ 'origin.country': 1, 'destination.country': 1 });
shipmentSchema.index({ currentLocation: '2dsphere' });
shipmentSchema.index({ pricingType: 1, status: 1 }); // For filtering fixed-price shipments
shipmentSchema.index({ 'fixedPriceDetails.amount': 1 }); // For price range queries
shipmentSchema.index(
  { 'integrationReference.credentialId': 1, 'integrationReference.referenceId': 1 },
  { unique: true, sparse: true }
);

// Helper method to add timeline entry
shipmentSchema.methods.addTimelineEntry = function (entry) {
  this.timeline.push(entry);

  // Update the shipment status if provided in the entry and is a valid shipment status
  if (entry.status && Object.values(ShipmentStatus).includes(entry.status)) {
    this.status = entry.status;
  }

  // Update location if provided
  if (entry.location) {
    this.currentLocation = {
      ...entry.location,
      timestamp: new Date(),
    };
  }

  return this.save();
};

shipmentSchema.methods.isComplianceReady = function () {
  const compliance = this.compliance || {};
  const documents = compliance.documents || {};

  const hasAcid = Boolean(compliance.acidNumber && compliance.aciProofDocumentId);
  const hasBroker = Boolean(compliance.brokerId);
  const hasInvoice = Boolean(documents.commercialInvoiceDocumentId);
  const hasPackingList = Boolean(documents.packingListDocumentId);
  const hasBillOrWaybill = Boolean(
    documents.billOfLadingDocumentId || documents.waybillDocumentId
  );
  const requiresCoo = Boolean(compliance.gaftaRequested);
  const hasCoo = Boolean(documents.certificateOfOriginDocumentId);
  const requiresInsurance = Boolean(compliance.insuranceRequired);
  const hasInsurance = Boolean(documents.insuranceDocumentId);

  if (!hasAcid || !hasBroker || !hasInvoice || !hasPackingList || !hasBillOrWaybill) {
    return false;
  }

  if (requiresCoo && !hasCoo) {
    return false;
  }

  if (requiresInsurance && !hasInsurance) {
    return false;
  }

  return true;
};

shipmentSchema.methods.refreshComplianceStatus = function () {
  this.compliance = this.compliance || {};
  const ready = this.isComplianceReady();
  this.compliance.status = ready ? 'READY' : 'PENDING';
  if (ready && !this.compliance.completedAt) {
    this.compliance.completedAt = new Date();
  }
  if (!ready) {
    this.compliance.completedAt = null;
  }
  return ready;
};

shipmentSchema.methods.addTrackingPoint = function (location, source = 'DRIVER') {
  if (!location) {
    return this;
  }

  this.trackingHistory.push({
    location: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
      address: location.address,
    },
    timestamp: new Date(),
    source,
  });

  this.currentLocation = {
    type: 'Point',
    coordinates: [location.lng, location.lat],
    timestamp: new Date(),
    address: location.address,
  };

  return this.save();
};

// Helper method to add a document to shipment
shipmentSchema.methods.addDocument = function (document) {
  // Check if document already exists
  const exists = this.documents.some(
    (doc) => doc.documentId && doc.documentId.toString() === document._id.toString()
  );

  if (!exists) {
    this.documents.push({
      documentId: document._id,
      name: document.name,
      documentType: document.documentType,
      uploadDate: new Date(),
    });

    // Mark required document as provided if it matches
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      this.requiredDocuments.forEach((reqDoc) => {
        if (reqDoc.documentType === document.documentType && !reqDoc.isProvided) {
          reqDoc.isProvided = true;
        }
      });
    }

    return this.save();
  }

  return this;
};

// Helper method to add a document to a timeline entry
shipmentSchema.methods.addDocumentToTimelineEntry = function (entryIndex, document) {
  if (this.timeline[entryIndex]) {
    const exists = this.timeline[entryIndex].documents.some(
      (doc) => doc.documentId && doc.documentId.toString() === document._id.toString()
    );

    if (!exists) {
      this.timeline[entryIndex].documents.push({
        documentId: document._id,
        name: document.name,
        type: document.documentType,
      });

      return this.save();
    }
  }

  return this;
};

// Helper method to report an issue
shipmentSchema.methods.reportIssue = function (issue) {
  if (!this.issues) {
    this.issues = [];
  }

  this.issues.push(issue);

  // Update shipment status if it's a severe issue
  if (['ACCIDENT', 'CARGO_DAMAGED', 'VEHICLE_BREAKDOWN'].includes(issue.type)) {
    this.status = ShipmentStatus.DELAYED;
  }

  return this.save();
};

// Helper method to resolve an issue
shipmentSchema.methods.resolveIssue = function (issueIndex, resolution) {
  if (this.issues && this.issues[issueIndex]) {
    this.issues[issueIndex].status = 'RESOLVED';
    this.issues[issueIndex].resolution = resolution;

    return this.save();
  }

  return this;
};

// Virtual for applications
shipmentSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'shipmentId',
  justOne: false,
});

// Virtual for all related documents
shipmentSchema.virtual('allDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'entityId',
  justOne: false,
  match: { entityType: 'Shipment', isActive: true },
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = {
  Shipment,
  ShipmentStatus,
  ShipmentApprovalState,
};
