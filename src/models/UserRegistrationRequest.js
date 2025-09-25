const mongoose = require('mongoose');

const UserRegistrationState = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const userRegistrationRequestSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['Merchant', 'TruckOwner', 'Driver'],
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    state: {
      type: String,
      enum: Object.values(UserRegistrationState),
      default: UserRegistrationState.PENDING,
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
    payload: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      companyName: String,
      companyAddress: String,
      licenseNumber: String,
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserRegistrationRequest = mongoose.model(
  'UserRegistrationRequest',
  userRegistrationRequestSchema
);

module.exports = {
  UserRegistrationRequest,
  UserRegistrationState,
};
