const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Truck must belong to a truck owner']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
      // Not required as it may be assigned later
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Truck model is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Truck capacity is required (in tons)']
    },
    year: {
      type: Number,
      required: [true, 'Truck manufacturing year is required']
    },
    available: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'IN_SERVICE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE'
    },
    currentFuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    odometer: {
      type: Number,
      default: 0
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceHistory: [{
      type: {
        type: String,
        enum: ['REGULAR', 'REPAIR', 'EMERGENCY'],
        required: true
      },
      description: String,
      cost: Number,
      date: {
        type: Date,
        default: Date.now
      },
      odometer: Number,
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      }
    }],
    lastCheckin: Date,
    lastCheckout: Date,
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    registrationInfo: {
      issuedBy: String,
      registrationNumber: String,
      expiryDate: Date,
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    technicalInspection: {
      lastInspectionDate: Date,
      nextInspectionDate: Date,
      status: {
        type: String,
        enum: ['PASSED', 'PENDING', 'FAILED', 'EXPIRED'],
        default: 'PENDING'
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    features: [String],
    photos: [String],
    documents: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document'
        },
        name: String,
        documentType: String,
        required: {
          type: Boolean,
          default: false
        },
        verified: {
          type: Boolean,
          default: false
        },
        uploadDate: Date
      }
    ],
    requiredDocuments: [
      {
        name: String,
        documentType: String,
        description: String,
        isProvided: {
          type: Boolean,
          default: false
        }
      }
    ],
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED'
    },
    active: {
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

// Indexes
truckSchema.index({ ownerId: 1 });
truckSchema.index({ plateNumber: 1 });
truckSchema.index({ driverId: 1 });
truckSchema.index({ verificationStatus: 1 });
truckSchema.index({ status: 1 });

// Virtual for current shipment (if assigned)
truckSchema.virtual('currentShipment', {
  ref: 'Shipment',
  localField: '_id',
  foreignField: 'assignedTruckId',
  justOne: true,
  match: { status: { $in: ['CONFIRMED', 'ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'AT_BORDER'] } }
});

// Virtual for all related documents
truckSchema.virtual('allDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'entityId',
  justOne: false,
  match: { entityType: 'Truck', isActive: true }
});

// Helper method to add a document to truck
truckSchema.methods.addDocument = function(document) {
  // Check if document already exists
  const exists = this.documents.some(doc => 
    doc.documentId && doc.documentId.toString() === document._id.toString()
  );
  
  if (!exists) {
    this.documents.push({
      documentId: document._id,
      name: document.name,
      documentType: document.documentType,
      uploadDate: new Date()
    });
    
    // Mark required document as provided if it matches
    if (this.requiredDocuments && this.requiredDocuments.length > 0) {
      this.requiredDocuments.forEach(reqDoc => {
        if (reqDoc.documentType === document.documentType && !reqDoc.isProvided) {
          reqDoc.isProvided = true;
        }
      });
    }
    
    // Update specific document fields based on type
    if (document.documentType === 'INSURANCE_CERTIFICATE') {
      this.insuranceInfo.documentId = document._id;
    } else if (document.documentType === 'VEHICLE_REGISTRATION') {
      this.registrationInfo.documentId = document._id;
    } else if (document.documentType === 'TECHNICAL_INSPECTION') {
      this.technicalInspection.documentId = document._id;
    }
    
    return this.save();
  }
  
  return this;
};

// Helper method to record maintenance
truckSchema.methods.recordMaintenance = function(maintenance) {
  if (!this.maintenanceHistory) {
    this.maintenanceHistory = [];
  }
  
  this.maintenanceHistory.push(maintenance);
  this.lastMaintenanceDate = maintenance.date || new Date();
  
  // Calculate next maintenance date based on truck type
  const maintenanceInterval = 90; // 90 days or 3 months
  this.nextMaintenanceDate = new Date(this.lastMaintenanceDate);
  this.nextMaintenanceDate.setDate(this.nextMaintenanceDate.getDate() + maintenanceInterval);
  
  return this.save();
};

// Helper method to mark truck as assigned to a shipment
truckSchema.methods.assignToShipment = function(driverId) {
  this.available = false;
  this.status = 'IN_SERVICE';
  
  // If driver is provided, assign the driver to this truck
  if (driverId) {
    this.driverId = driverId;
  }
  
  return this.save();
};

// Helper method to mark truck as available after a shipment is completed
truckSchema.methods.markAsAvailable = function() {
  this.available = true;
  this.status = 'AVAILABLE';
  
  return this.save();
};

// Populate driver info when querying
truckSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'driverId',
    select: 'name email phone licenseNumber'
  });
  next();
});

const Truck = mongoose.model('Truck', truckSchema);

module.exports = Truck;
