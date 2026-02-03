/**
 * Data Factories for Tests
 *
 * Provides factory functions for creating test data including
 * shipments, trucks, applications, and other domain entities.
 */

const mongoose = require('mongoose');

const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../src/models/Shipment');
const Truck = require('../../src/models/Truck');
const { Application } = require('../../src/models/Application');
const { createTestUser } = require('./authHelpers');

/**
 * Create a test shipment
 * @param {string|ObjectId} merchantId - Merchant's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created shipment document
 */
const createTestShipment = async (merchantId, overrides = {}) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);

  const defaultShipment = {
    merchantId,
    pricingType: 'BIDDING',
    origin: {
      address: `123 Origin St, Origin City ${randomSuffix}`,
      coordinates: {
        lat: 28.6448 + Math.random() * 0.01,
        lng: 77.216721 + Math.random() * 0.01,
      },
      country: 'US',
    },
    destination: {
      address: `456 Destination Ave, Destination City ${randomSuffix}`,
      coordinates: {
        lat: 28.535517 + Math.random() * 0.01,
        lng: 77.391029 + Math.random() * 0.01,
      },
      country: 'CA',
    },
    cargoDetails: {
      description: `Test Cargo ${randomSuffix}`,
      weight: 1000 + Math.floor(Math.random() * 9000),
      volume: 50 + Math.floor(Math.random() * 50),
      category: 'general',
      hazardous: false,
      specialInstructions: 'Handle with care',
    },
    status: ShipmentStatus.REQUESTED,
    approval: {
      state: ShipmentApprovalState.APPROVED,
      submittedBy: merchantId,
      submittedAt: new Date(),
    },
    estimatedPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    timeline: [
      {
        status: ShipmentStatus.REQUESTED,
        note: 'Shipment created',
      },
    ],
  };

  const shipmentData = { ...defaultShipment, ...overrides };

  // Handle nested overrides properly
  if (overrides.origin) {
    shipmentData.origin = { ...defaultShipment.origin, ...overrides.origin };
  }
  if (overrides.destination) {
    shipmentData.destination = { ...defaultShipment.destination, ...overrides.destination };
  }
  if (overrides.cargoDetails) {
    shipmentData.cargoDetails = { ...defaultShipment.cargoDetails, ...overrides.cargoDetails };
  }
  if (overrides.approval) {
    shipmentData.approval = { ...defaultShipment.approval, ...overrides.approval };
  }

  // Update timeline if status override was provided
  if (overrides.status && !overrides.timeline) {
    shipmentData.timeline = [
      {
        status: overrides.status,
        note: `Shipment ${overrides.status.toLowerCase()}`,
      },
    ];
  }

  return await Shipment.create(shipmentData);
};

/**
 * Create a test truck
 * @param {string|ObjectId} ownerId - Truck owner's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created truck document
 */
const createTestTruck = async (ownerId, overrides = {}) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);

  const defaultTruck = {
    plateNumber: `TEST-${timestamp}-${randomSuffix}`.toUpperCase().substring(0, 15),
    model: `Test Truck Model ${randomSuffix}`,
    capacity: 10000 + Math.floor(Math.random() * 10000),
    year: 2020 + Math.floor(Math.random() * 4),
    dimensions: {
      length: 15 + Math.floor(Math.random() * 10),
      width: 6 + Math.floor(Math.random() * 4),
      height: 6 + Math.floor(Math.random() * 4),
      unit: 'ft',
    },
    truckType: 'Flatbed',
    features: ['GPS', 'Refrigeration', 'Lift Gate'],
    ownerId,
    available: true,
    location: {
      coordinates: [77.216721 + Math.random() * 0.1, 28.6448 + Math.random() * 0.1],
      address: `Truck Location ${randomSuffix}`,
    },
  };

  const truckData = { ...defaultTruck, ...overrides };

  // Handle nested overrides
  if (overrides.dimensions) {
    truckData.dimensions = { ...defaultTruck.dimensions, ...overrides.dimensions };
  }
  if (overrides.location) {
    truckData.location = { ...defaultTruck.location, ...overrides.location };
  }

  return await Truck.create(truckData);
};

/**
 * Create a test application (bid for a shipment)
 * @param {string|ObjectId} shipmentId - Shipment's ObjectId
 * @param {string|ObjectId} ownerId - Truck owner's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created application document
 */
const createTestApplication = async (shipmentId, ownerId, overrides = {}) => {
  const randomSuffix = Math.random().toString(36).substring(7);

  // Create a truck if truckId is not provided
  let truckId = overrides.truckId;
  if (!truckId) {
    const truck = await createTestTruck(ownerId);
    truckId = truck._id;
  }

  // Create a driver if driverId is not provided
  let driverId = overrides.driverId;
  if (!driverId) {
    const driver = await createTestUser('Driver', { ownerId });
    driverId = driver._id;
  }

  const defaultApplication = {
    shipmentId,
    ownerId,
    truckId,
    driverId,
    bidDetails: {
      price: 1000 + Math.floor(Math.random() * 9000),
      currency: 'USD',
      notes: `Test bid application ${randomSuffix}`,
      estimatedDeliveryDays: 2 + Math.floor(Math.random() * 5),
    },
    status: 'PENDING',
  };

  const applicationData = { ...defaultApplication, ...overrides };

  // Handle nested overrides
  if (overrides.bidDetails) {
    applicationData.bidDetails = { ...defaultApplication.bidDetails, ...overrides.bidDetails };
  }

  return await Application.create(applicationData);
};

/**
 * Create a complete test scenario with merchant, truck owner, driver, truck, shipment, and application
 * @param {Object} options - Options for scenario creation
 * @returns {Promise<Object>} Object containing all created entities
 */
const createCompleteScenario = async (options = {}) => {
  // Create users
  const merchant = await createTestUser('Merchant', options.merchantOverrides);
  const truckOwner = await createTestUser('TruckOwner', options.truckOwnerOverrides);
  const driver = await createTestUser('Driver', {
    ownerId: truckOwner._id,
    ...options.driverOverrides,
  });

  // Create truck
  const truck = await createTestTruck(truckOwner._id, options.truckOverrides);

  // Create shipment
  const shipment = await createTestShipment(merchant._id, options.shipmentOverrides);

  // Create application
  const application = await createTestApplication(shipment._id, truckOwner._id, {
    truckId: truck._id,
    driverId: driver._id,
    ...options.applicationOverrides,
  });

  return {
    merchant,
    truckOwner,
    driver,
    truck,
    shipment,
    application,
  };
};

/**
 * Create multiple test shipments
 * @param {string|ObjectId} merchantId - Merchant's ObjectId
 * @param {number} count - Number of shipments to create
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Array>} Array of created shipments
 */
const createMultipleShipments = async (merchantId, count = 5, overrides = {}) => {
  const shipments = [];
  for (let i = 0; i < count; i++) {
    const shipment = await createTestShipment(merchantId, overrides);
    shipments.push(shipment);
  }
  return shipments;
};

/**
 * Create a shipment with a specific status for workflow testing
 * @param {string|ObjectId} merchantId - Merchant's ObjectId
 * @param {string} status - Desired shipment status
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created shipment document
 */
const createShipmentWithStatus = async (merchantId, status, overrides = {}) => {
  return await createTestShipment(merchantId, { status, ...overrides });
};

/**
 * Create an approved shipment ready for bidding
 * @param {string|ObjectId} merchantId - Merchant's ObjectId
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created shipment document
 */
const createApprovedShipment = async (merchantId, overrides = {}) => {
  return await createTestShipment(merchantId, {
    status: ShipmentStatus.REQUESTED,
    approval: {
      state: ShipmentApprovalState.APPROVED,
      submittedBy: merchantId,
      submittedAt: new Date(),
      reviewedAt: new Date(),
    },
    ...overrides,
  });
};

/**
 * Create a fixed price shipment
 * @param {string|ObjectId} merchantId - Merchant's ObjectId
 * @param {number} price - Fixed price amount
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} Created shipment document
 */
const createFixedPriceShipment = async (merchantId, price = 5000, overrides = {}) => {
  return await createTestShipment(merchantId, {
    pricingType: 'FIXED_PRICE',
    fixedPriceDetails: {
      amount: price,
      currency: 'USD',
      autoAssign: true,
      requirements: {
        minTruckCapacity: 5000,
        requiredFeatures: ['GPS'],
        maxDeliveryDays: 5,
      },
    },
    ...overrides,
  });
};

module.exports = {
  createTestShipment,
  createTestTruck,
  createTestApplication,
  createCompleteScenario,
  createMultipleShipments,
  createShipmentWithStatus,
  createApprovedShipment,
  createFixedPriceShipment,
  ShipmentStatus,
  ShipmentApprovalState,
};
