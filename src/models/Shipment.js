const mongoose = require('mongoose');

// Shipment status enum
const ShipmentStatus = {
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
  DELAYED: 'DELAYED'
};

// Timeline entry schema
const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [...Object.values(ShipmentStatus), 'ISSUE_REPORTED'],
      required: true
    },
    note: String,
    documents: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document'
        },
        name: String,
        type: String
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      address: String
    }
  },
  {
    timestamps: true
  }
);

const shipmentSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipment must belong to a merchant']
    },
    origin: {
      address: {
        type: String,
        required: [true, 'Origin address is required']
      },
      coordinates: {
        lat: Number,
        lng: Number
      },
      country: String
    },
    destination: {
      address: {
        type: String,
        required: [true, 'Destination address is required']
      },
      coordinates: {
        lat: Number,
        lng: Number
      },
      country: String
    },
    cargoDetails: {
      description: {
        type: String,
        required: [true, 'Cargo description is required']
      },
      weight: {
        type: Number,
        required: [true, 'Cargo weight is required']
      },
      volume: Number,
      category: String,
      hazardous: {
        type: Boolean,
        default: false
      },
      specialInstructions: String
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.REQUESTED
    },
    selectedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    assignedTruckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck'
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timeline: [timelineEntrySchema],
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      timestamp: Date,
      address: String
    },
    paymentDetails: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      paymentReceiptUrl: String,
      paymentVerified: {
        type: Boolean,
        default: false
      },
      paymentDate: Date,
      paymentReceiptDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      }
    },
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
    // Driver-related fields
    startOdometer: Number,
    endOdometer: Number,
    distanceTraveled: Number,
    recipient: {
      name: String,
      signature: String // Base64 encoded signature
    },
    deliveryProofs: [{
      type: {
        type: String,
        enum: ['PHOTO', 'SIGNATURE', 'DOCUMENT', 'OTHER'],
        default: 'PHOTO'
      },
      filePath: String,
      fileName: String,
      mimeType: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      notes: String
    }],
    issues: [{
      type: {
        type: String,
        enum: ['DELIVERY_FAILED', 'ACCIDENT', 'CARGO_DAMAGED', 'VEHICLE_BREAKDOWN', 'TRAFFIC', 'WEATHER', 'OTHER'],
        required: true
      },
      description: String,
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reportedAt: {
        type: Date,
        default: Date.now
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      },
      status: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
      },
      resolution: {
        description: String,
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        resolvedAt: Date
      }
    }],
    estimatedPickupDate: Date,
    estimatedDeliveryDate: Date,
    actualPickupDate: Date,
    actualDeliveryDate: Date,
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
shipmentSchema.index({ merchantId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ assignedTruckId: 1 });
shipmentSchema.index({ assignedDriverId: 1 });
shipmentSchema.index({ 'origin.country': 1, 'destination.country': 1 });
shipmentSchema.index({ currentLocation: '2dsphere' });

// Helper method to add timeline entry
shipmentSchema.methods.addTimelineEntry = function(entry) {
  this.timeline.push(entry);
  
  // Update the shipment status if provided in the entry and is a valid shipment status
  if (entry.status && Object.values(ShipmentStatus).includes(entry.status)) {
    this.status = entry.status;
  }
  
  // Update location if provided
  if (entry.location) {
    this.currentLocation = {
      ...entry.location,
      timestamp: new Date()
    };
  }
  
  return this.save();
};

// Helper method to add a document to shipment
shipmentSchema.methods.addDocument = function(document) {
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
    
    return this.save();
  }
  
  return this;
};

// Helper method to add a document to a timeline entry
shipmentSchema.methods.addDocumentToTimelineEntry = function(entryIndex, document) {
  if (this.timeline[entryIndex]) {
    const exists = this.timeline[entryIndex].documents.some(doc => 
      doc.documentId && doc.documentId.toString() === document._id.toString()
    );
    
    if (!exists) {
      this.timeline[entryIndex].documents.push({
        documentId: document._id,
        name: document.name,
        type: document.documentType
      });
      
      return this.save();
    }
  }
  
  return this;
};

// Helper method to report an issue
shipmentSchema.methods.reportIssue = function(issue) {
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
shipmentSchema.methods.resolveIssue = function(issueIndex, resolution) {
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
  justOne: false
});

// Virtual for all related documents
shipmentSchema.virtual('allDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'entityId',
  justOne: false,
  match: { entityType: 'Shipment', isActive: true }
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = {
  Shipment,
  ShipmentStatus
};
