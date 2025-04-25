const mongoose = require('mongoose');

// Application status enum
const ApplicationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

const applicationSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Application must be for a shipment']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must be from a truck owner']
    },
    truckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Application must specify a truck']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must specify a driver']
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING
    },
    bidDetails: {
      price: {
        type: Number,
        required: [true, 'Bid price is required']
      },
      currency: {
        type: String,
        default: 'USD'
      },
      notes: String,
      validUntil: Date
    },
    rejectionReason: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
applicationSchema.index({ shipmentId: 1, ownerId: 1 }, { unique: true });
applicationSchema.index({ ownerId: 1 });
applicationSchema.index({ status: 1 });

// Compound index for efficient queries
applicationSchema.index({ shipmentId: 1, status: 1 });

// Methods
applicationSchema.methods.accept = async function() {
  this.status = ApplicationStatus.ACCEPTED;
  return this.save();
};

applicationSchema.methods.reject = async function(reason) {
  this.status = ApplicationStatus.REJECTED;
  if (reason) {
    this.rejectionReason = reason;
  }
  return this.save();
};

applicationSchema.methods.cancel = async function() {
  this.status = ApplicationStatus.CANCELLED;
  return this.save();
};

// Static method to reject all other applications for a shipment
applicationSchema.statics.rejectOthers = async function(shipmentId, acceptedAppId) {
  return this.updateMany(
    { 
      shipmentId,
      _id: { $ne: acceptedAppId },
      status: ApplicationStatus.PENDING
    },
    {
      status: ApplicationStatus.REJECTED,
      rejectionReason: 'Another application was accepted'
    }
  );
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = {
  Application,
  ApplicationStatus
};
