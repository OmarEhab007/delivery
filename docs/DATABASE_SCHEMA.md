# Database Schema Documentation

## Overview

This document describes the database schema for the Delivery App system. The application uses MongoDB with Mongoose ODM for data modeling.

## Models

### User

The User model represents different types of users in the system with role-based fields.

```javascript
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
      select: false // Don't include in query results by default
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
    // Password reset fields
    passwordResetToken: String,
    passwordResetExpires: Date,
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
```

#### Virtual Fields
- `trucks`: References trucks owned by a truck owner
- `drivers`: References drivers under a truck owner

#### Methods
- `comparePassword(candidatePassword)`: Compares provided password with stored hashed password

### Truck

The Truck model represents vehicles used for transportation.

```javascript
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
```

#### Indexes
- `ownerId`
- `plateNumber`
- `driverId`

#### Virtual Fields
- `currentShipment`: References the current active shipment assigned to this truck

### Shipment

The Shipment model represents cargo transportation from origin to destination.

```javascript
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
```

#### Constants
```javascript
const ShipmentStatus = {
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_BORDER: 'AT_BORDER',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};
```

#### Indexes
- `merchantId`
- `status`
- `assignedTruckId`
- `assignedDriverId`
- `origin.country`, `destination.country`

#### Methods
- `addTimelineEntry(entry)`: Adds a new entry to the timeline and updates status

#### Virtual Fields
- `applications`: References applications for this shipment

### Application

The Application model represents bids from truck owners for shipments.

```javascript
const applicationSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: [true, 'Application must be for a shipment']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must be from a truck owner']
    },
    truckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: [true, 'Application must specify a truck']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Application must specify a driver']
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING
    },
    bidDetails: {
      price: {
        type: Number,
        required: [true, 'Bid price is required']
      },
      currency: {
        type: String,
        default: 'USD'
      },
      notes: String,
      validUntil: Date
    },
    rejectionReason: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
```

#### Constants
```javascript
const ApplicationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};
```

#### Indexes
- `{ shipmentId: 1, ownerId: 1 }` (unique)
- `ownerId`
- `status`
- `{ shipmentId: 1, status: 1 }`

#### Methods
- `accept()`: Updates status to ACCEPTED
- `reject(reason)`: Updates status to REJECTED with optional reason
- `cancel()`: Updates status to CANCELLED

#### Static Methods
- `rejectOthers(shipmentId, acceptedAppId)`: Rejects all other pending applications for a shipment

## Relationships

### User (TruckOwner) to Truck
- One-to-Many: A truck owner can have multiple trucks

### User (TruckOwner) to User (Driver)
- One-to-Many: A truck owner can have multiple drivers

### Truck to Shipment
- One-to-Many: A truck can be assigned to multiple shipments (over time)

### User (Merchant) to Shipment
- One-to-Many: A merchant can have multiple shipments

### Shipment to Application
- One-to-Many: A shipment can have multiple applications from different truck owners

### User (TruckOwner) to Application
- One-to-Many: A truck owner can make multiple applications for different shipments

## Data Flow Example

1. A Merchant creates a Shipment (`status: REQUESTED`)
2. Multiple TruckOwners create Applications for the shipment (`status: PENDING`)
3. The Merchant accepts one Application (`status: ACCEPTED`)
4. All other Applications are automatically rejected (`status: REJECTED`)
5. The Shipment status is updated (`status: CONFIRMED`)
6. The selected truck and driver are assigned to the shipment
7. As the shipment progresses, timeline entries are added and the status is updated
8. When delivery is complete, the status is updated (`status: DELIVERED`)
9. After verification, the shipment is marked as complete (`status: COMPLETED`) 