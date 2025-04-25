const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Truck must belong to a truck owner']
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
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expiryDate: Date
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    features: [String],
    photos: [String],
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

// Virtual for current shipment (if assigned)
truckSchema.virtual('currentShipment', {
  ref: 'Shipment',
  localField: '_id',
  foreignField: 'assignedTruckId',
  justOne: true,
  match: { status: { $in: ['CONFIRMED', 'IN_TRANSIT', 'AT_BORDER'] } }
});

const Truck = mongoose.model('Truck', truckSchema);

module.exports = Truck;
