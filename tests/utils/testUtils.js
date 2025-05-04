const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const Truck = require('../../src/models/Truck');
const { Shipment } = require('../../src/models/Shipment');
const { Application } = require('../../src/models/Application');
const mongoose = require('mongoose');

/**
 * Create a test user with specified role
 * @param {String} role - User role (Merchant, TruckOwner, Driver)
 * @returns {Object} User object
 */
const createTestUser = async (role = 'Merchant') => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const userData = {
    name: `Test ${role}`,
    email: `test${role}${Date.now()}@example.com`,
    password: hashedPassword,
    phone: '+1234567890',
    role: role,
    isVerified: true
  };
  
  // Add role-specific required fields
  if (role === 'TruckOwner') {
    userData.companyName = 'Test Company';
    userData.companyAddress = 'Test Address';
  }
  
  if (role === 'Driver') {
    // We can't create a driver without an owner, so we'll create a dummy truck owner first
    if (!userData.ownerId) {
      const owner = await createTestUser('TruckOwner');
      userData.ownerId = owner._id;
    }
    userData.licenseNumber = `DL-${Date.now()}`;
  }
  
  const user = new User(userData);
  
  await user.save();
  return user;
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
};

/**
 * Create a test truck for truck owner
 * @param {String} ownerId - Owner's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Object} Truck object
 */
const createTestTruck = async (ownerId, overrides = {}) => {
  const defaultTruck = {
    plateNumber: `TEST-${Date.now()}`,
    model: 'Test Truck Model',
    capacity: 10000,
    year: 2023,
    dimensions: {
      length: 20,
      width: 8,
      height: 8,
      unit: 'ft'
    },
    truckType: 'Flatbed',
    features: ['GPS', 'Refrigeration'],
    ownerId: ownerId,
    available: true,
    location: {
      coordinates: [77.216721, 28.644800],
      address: 'Test Location'
    }
  };
  
  const truckData = { ...defaultTruck, ...overrides };
  return await Truck.create(truckData);
};

/**
 * Create a test shipment for a merchant
 * @param {String} merchantId - Merchant's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Object} Shipment object
 */
const createTestShipment = async (merchantId, overrides = {}) => {
  const defaultShipment = {
    merchantId: merchantId,
    origin: {
      address: '123 Pickup St, Test City',
      coordinates: {
        lat: 28.644800,
        lng: 77.216721
      }
    },
    destination: {
      address: '456 Delivery St, Test City',
      coordinates: {
        lat: 28.535517,
        lng: 77.391029
      }
    },
    cargoDetails: {
      description: 'Test Cargo',
      weight: 2000,
      dimensions: {
        length: 10,
        width: 5,
        height: 5,
        unit: 'ft'
      },
      category: 'general',
      specialHandling: ['none']
    },
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    paymentMethod: 'CARD',
    status: 'REQUESTED',
    timeline: [{
      status: 'REQUESTED',
      note: 'Shipment created',
      timestamp: new Date()
    }]
  };
  
  const shipmentData = { ...defaultShipment, ...overrides };
  
  // If status override was provided, make sure the timeline matches
  if (overrides.status && (!overrides.timeline || !overrides.timeline.length)) {
    shipmentData.timeline = [{
      status: overrides.status,
      note: `Shipment ${overrides.status.toLowerCase()}`,
      timestamp: new Date()
    }];
  }
  
  return await Shipment.create(shipmentData);
};

/**
 * Create a test application for a shipment
 * @param {String} shipmentId - Shipment ObjectId
 * @param {String} truckOwnerId - Truck owner's ObjectId
 * @param {String} truckId - Truck's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Object} Application object
 */
const createTestApplication = async (shipmentId, truckOwnerId, truckId, overrides = {}) => {
  const defaultApplication = {
    shipmentId: shipmentId,
    ownerId: truckOwnerId,
    truckId: truckId,
    driverId: mongoose.Types.ObjectId(),
    bidDetails: {
      price: 5000,
      currency: 'USD',
      notes: 'Test application'
    },
    status: 'PENDING'
  };
  
  const applicationData = { ...defaultApplication, ...overrides };
  return await Application.create(applicationData);
};

module.exports = {
  createTestUser,
  generateToken,
  createTestTruck,
  createTestShipment,
  createTestApplication
}; 