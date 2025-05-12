const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    role: {
      type: String,
      enum: ['Admin', 'Merchant', 'TruckOwner', 'Driver'],
      required: [true, 'Please specify user role'],
    },
    // Admin-specific fields
    adminPermissions: {
      type: [String],
      enum: [
        'FULL_ACCESS',
        'USER_MANAGEMENT',
        'SHIPMENT_MANAGEMENT',
        'TRUCK_MANAGEMENT',
        'APPLICATION_MANAGEMENT',
      ],
      default() {
        return this.role === 'Admin' ? ['FULL_ACCESS'] : [];
      },
    },
    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Merchant-specific fields
    // None for basic implementation

    // Truck Owner-specific fields
    companyName: {
      type: String,
      required() {
        return this.role === 'TruckOwner';
      },
    },
    companyAddress: {
      type: String,
      required() {
        return this.role === 'TruckOwner';
      },
    },

    // Driver-specific fields
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required() {
        return this.role === 'Driver';
      },
    },
    licenseNumber: {
      type: String,
      required() {
        return this.role === 'Driver';
      },
    },
    driverLicense: {
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
      issueDate: Date,
      expiryDate: Date,
      issuedBy: String,
      verified: {
        type: Boolean,
        default: false,
      },
      verificationDate: Date,
    },
    // Driver status fields
    isAvailable: {
      type: Boolean,
      default() {
        return this.role === 'Driver' ? true : undefined;
      },
    },
    driverStatus: {
      type: String,
      enum: ['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'],
      default() {
        return this.role === 'Driver' ? 'INACTIVE' : undefined;
      },
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'],
        },
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    driverLogs: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ['CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'STATUS_CHANGE'],
        },
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
            default: [0, 0],
          },
        },
        truckId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Truck',
        },
        truckCondition: String,
        fuelLevel: Number,
        totalMiles: Number,
        notes: String,
      },
    ],

    // Document management fields
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
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
    },

    // Common fields
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for referencing trucks owned by truck owner
userSchema.virtual('trucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'ownerId',
  justOne: false,
});

// Virtual for referencing drivers under a truck owner
userSchema.virtual('drivers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'ownerId',
  justOne: false,
  match: { role: 'Driver' },
});

// Virtual for all related documents
userSchema.virtual('allDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'entityId',
  justOne: false,
  match: { entityType: 'User', isActive: true },
});

// Helper method to add a document to user
userSchema.methods.addDocument = function (document) {
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

    // Update specific document fields based on type
    if (document.documentType === 'DRIVER_LICENSE' && this.role === 'Driver') {
      this.driverLicense = {
        ...this.driverLicense,
        documentId: document._id,
      };

      // Update driver verification status if not already verified
      if (this.verificationStatus === 'UNVERIFIED') {
        this.verificationStatus = 'PENDING';
      }
    }

    return this.save();
  }

  return this;
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create a 2dsphere index on the location field for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
