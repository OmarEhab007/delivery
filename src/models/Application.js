const mongoose = require('mongoose');

// Application status enum
const ApplicationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

const applicationSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Application must be for a shipment'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must be from a truck owner'],
    },
    assignedTruckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Application must specify a truck'],
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must specify a driver'],
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
    bidDetails: {
      price: {
        type: Number,
        required: [true, 'Bid price is required'],
      },
      currency: {
        type: String,
        default: 'USD',
      },
      notes: String,
      validUntil: Date,
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
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(ApplicationStatus),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    rejectionReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
applicationSchema.index({ shipmentId: 1, ownerId: 1 }, { unique: true });
applicationSchema.index({ ownerId: 1 });
applicationSchema.index({ status: 1 });

// Compound index for efficient queries
applicationSchema.index({ shipmentId: 1, status: 1 });

// Methods
applicationSchema.methods.accept = async function (userId) {
  this.status = ApplicationStatus.ACCEPTED;

  // Add to status history
  this.statusHistory.push({
    status: ApplicationStatus.ACCEPTED,
    timestamp: new Date(),
    changedBy: userId,
  });

  return this.save();
};

applicationSchema.methods.reject = async function (reason, userId) {
  this.status = ApplicationStatus.REJECTED;
  if (reason) {
    this.rejectionReason = reason;
  }

  // Add to status history
  this.statusHistory.push({
    status: ApplicationStatus.REJECTED,
    timestamp: new Date(),
    note: reason,
    changedBy: userId,
  });

  return this.save();
};

applicationSchema.methods.cancel = async function (userId) {
  this.status = ApplicationStatus.CANCELLED;

  // Add to status history
  this.statusHistory.push({
    status: ApplicationStatus.CANCELLED,
    timestamp: new Date(),
    changedBy: userId,
  });

  return this.save();
};

// Helper method to add a document to application
applicationSchema.methods.addDocument = function (document) {
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

// Static method to reject all other applications for a shipment
applicationSchema.statics.rejectOthers = async function (shipmentId, acceptedAppId, userId) {
  return this.updateMany(
    {
      shipmentId,
      _id: { $ne: acceptedAppId },
      status: ApplicationStatus.PENDING,
    },
    {
      status: ApplicationStatus.REJECTED,
      rejectionReason: 'Another application was accepted',
      $push: {
        statusHistory: {
          status: ApplicationStatus.REJECTED,
          timestamp: new Date(),
          note: 'Another application was accepted',
          changedBy: userId,
        },
      },
    }
  );
};

// Virtual for all related documents
applicationSchema.virtual('allDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'entityId',
  justOne: false,
  match: { entityType: 'Application', isActive: true },
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = {
  Application,
  ApplicationStatus,
};
