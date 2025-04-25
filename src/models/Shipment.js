const mongoose = require('mongoose');

// Shipment status enum
const ShipmentStatus = {
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_BORDER: 'AT_BORDER',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Timeline entry schema
const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      required: true
    },
    note: String,
    documents: [
      {
        name: String,
        url: String,
        type: String
      }
    ],
    location: {
      lat: Number,
      lng: Number,
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
      lat: Number,
      lng: Number,
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
      paymentDate: Date
    },
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

// Helper method to add timeline entry
shipmentSchema.methods.addTimelineEntry = function(entry) {
  this.timeline.push(entry);
  
  // Update the shipment status if provided in the entry
  if (entry.status) {
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

// Virtual for applications
shipmentSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'shipmentId',
  justOne: false
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = {
  Shipment,
  ShipmentStatus
};
