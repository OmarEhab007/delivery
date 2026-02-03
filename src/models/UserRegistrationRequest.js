const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// SEC-002: Hash passwords before storage to prevent plain-text exposure
// OWASP A02:2021 - Cryptographic Failures
userRegistrationRequestSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('payload.password')) {
    return next();
  }

  // Check if password exists and is not already hashed (bcrypt hashes start with $2)
  if (this.payload && this.payload.password && !this.payload.password.startsWith('$2')) {
    const salt = await bcrypt.genSalt(12);
    this.payload.password = await bcrypt.hash(this.payload.password, salt);
  }

  next();
});

const UserRegistrationRequest = mongoose.model(
  'UserRegistrationRequest',
  userRegistrationRequestSchema
);

module.exports = {
  UserRegistrationRequest,
  UserRegistrationState,
};
