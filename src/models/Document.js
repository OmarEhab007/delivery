const mongoose = require('mongoose');

// Document types enum
const DocumentType = {
  SHIPPING_INVOICE: 'SHIPPING_INVOICE',
  BILL_OF_LADING: 'BILL_OF_LADING',
  CUSTOMS_DECLARATION: 'CUSTOMS_DECLARATION',
  PROOF_OF_DELIVERY: 'PROOF_OF_DELIVERY',
  DRIVER_LICENSE: 'DRIVER_LICENSE',
  VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
  INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
  HAZARDOUS_MATERIALS_CERT: 'HAZARDOUS_MATERIALS_CERT',
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  REGISTRATION: 'REGISTRATION',
  OTHER: 'OTHER'
};

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document name is required']
    },
    description: String,
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    fileSize: Number,
    mimeType: String,
    fileExtension: String,
    originalName: String,
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document must have an uploader']
    },
    // References to entities this document is linked to
    entityType: {
      type: String,
      enum: ['Shipment', 'Application', 'Truck', 'User'],
      required: [true, 'Entity type is required']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String,
    expiryDate: Date,
    metadata: {
      type: Map,
      of: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for faster queries
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ entityType: 1, entityId: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ isVerified: 1 });
documentSchema.index({ createdAt: -1 });

// Virtual properties
documentSchema.virtual('entity', {
  ref: doc => doc.entityType,
  localField: 'entityId',
  foreignField: '_id',
  justOne: true
});

// Methods
documentSchema.methods.verify = function(verifierId, notes) {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verificationDate = new Date();
  if (notes) {
    this.verificationNotes = notes;
  }
  return this.save();
};

documentSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

const Document = mongoose.model('Document', documentSchema);

module.exports = {
  Document,
  DocumentType
}; 