const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number']
    },
    role: {
      type: String,
      enum: ['Admin', 'Merchant', 'TruckOwner', 'Driver'],
      required: [true, 'Please specify user role']
    },
    // Admin-specific fields
    adminPermissions: {
      type: [String],
      enum: ['FULL_ACCESS', 'USER_MANAGEMENT', 'SHIPMENT_MANAGEMENT', 'TRUCK_MANAGEMENT', 'APPLICATION_MANAGEMENT'],
      default: function() {
        return this.role === 'Admin' ? ['FULL_ACCESS'] : [];
      }
    },
    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Merchant-specific fields
    // None for basic implementation
    
    // Truck Owner-specific fields
    companyName: {
      type: String,
      required: function() {
        return this.role === 'TruckOwner';
      }
    },
    companyAddress: {
      type: String,
      required: function() {
        return this.role === 'TruckOwner';
      }
    },
    
    // Driver-specific fields
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.role === 'Driver';
      }
    },
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === 'Driver';
      }
    },
    
    // Common fields
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

// Virtual for referencing trucks owned by truck owner
userSchema.virtual('trucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'ownerId',
  justOne: false
});

// Virtual for referencing drivers under a truck owner
userSchema.virtual('drivers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'ownerId',
  justOne: false,
  match: { role: 'Driver' }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
