const mongoose = require('mongoose');

const brokerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Broker name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'Broker license number is required'],
      trim: true,
    },
    countriesServed: {
      type: [String],
      default: [],
    },
    contacts: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

brokerSchema.index({ name: 1 });
brokerSchema.index({ licenseNumber: 1 }, { unique: true });

const Broker = mongoose.model('Broker', brokerSchema);

module.exports = Broker;
