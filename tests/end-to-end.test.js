const mongoose = require('mongoose');
const User = require('../src/models/User');
const Truck = require('../src/models/Truck');
const { Shipment } = require('../src/models/Shipment');
const { Application } = require('../src/models/Application');
const { createTestUser, generateToken, createTestTruck, createTestShipment, createTestApplication } = require('./utils/testUtils');

/**
 * End-to-end test for the Delivery App
 * 
 * This test covers the complete workflow in a simplified manner.
 */
describe('Delivery App End-to-End Tests', () => {
  // Test data
  let merchant, truckOwner, driver;
  let truck;
  let shipment;
  let application;
  
  beforeAll(async () => {
    // Clear database collections before tests
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
    
    // Set JWT secret for token generation
    process.env.JWT_SECRET = 'test-secret';
  });
  
  test('1. User creation', async () => {
    // Create a merchant user
    merchant = await createTestUser('Merchant');
    expect(merchant).toBeDefined();
    expect(merchant.role).toBe('Merchant');
    
    // Create a truck owner
    truckOwner = await createTestUser('TruckOwner');
    expect(truckOwner).toBeDefined();
    expect(truckOwner.role).toBe('TruckOwner');
    expect(truckOwner.companyName).toBeDefined();
    
    // Create a driver directly
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    driver = await User.create({
      name: 'Test Driver',
      email: `testdriver${Date.now()}@example.com`,
      password: hashedPassword,
      phone: '+1234567890',
      role: 'Driver',
      isVerified: true,
      ownerId: truckOwner._id,
      licenseNumber: `DL-${Date.now()}`
    });
    
    expect(driver).toBeDefined();
    expect(driver.role).toBe('Driver');
    expect(driver.ownerId.toString()).toBe(truckOwner._id.toString());
  });
  
  test('2. Truck management', async () => {
    // Create a truck for the truck owner with driver already assigned
    truck = await Truck.create({
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
      ownerId: truckOwner._id,
      driverId: driver._id,
      available: true,
      location: {
        type: 'Point',
        coordinates: [77.216721, 28.644800],
        address: 'Test Location'
      }
    });
    
    expect(truck).toBeDefined();
    expect(truck.ownerId.toString()).toBe(truckOwner._id.toString());
    expect(truck.driverId.toString()).toBe(driver._id.toString());
  });
  
  test('3. Shipment creation', async () => {
    // Create a shipment directly instead of using the utility
    shipment = await Shipment.create({
      merchantId: merchant._id,
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
        description: 'Electronics',
        weight: 1500,
        category: 'electronics'
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
    });
    
    expect(shipment).toBeDefined();
    expect(shipment.merchantId.toString()).toBe(merchant._id.toString());
    expect(shipment.status).toBe('REQUESTED');
    
    // Log the shipment ID to debug any issues
    console.log('Shipment created with ID:', shipment._id.toString());
  });
  
  test('4. Application process', async () => {
    // Make sure the shipment exists
    const foundShipment = await Shipment.findById(shipment._id);
    expect(foundShipment).toBeDefined();
  
    // Create an application directly
    application = await Application.create({
      shipmentId: shipment._id,
      ownerId: truckOwner._id,
      truckId: truck._id,
      driverId: driver._id,
      bidDetails: {
        price: 2500,
        currency: 'USD',
        notes: 'Available for electronics transport'
      },
      status: 'PENDING'
    });
    
    expect(application).toBeDefined();
    expect(application.shipmentId.toString()).toBe(shipment._id.toString());
    expect(application.ownerId.toString()).toBe(truckOwner._id.toString());
    expect(application.status).toBe('PENDING');
    
    // Approve application
    application = await Application.findByIdAndUpdate(
      application._id,
      { status: 'ACCEPTED' },
      { new: true }
    );
    expect(application.status).toBe('ACCEPTED');
    
    // Update shipment with assignment - use plain direct update
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: 'ASSIGNED',
        assignedTruckId: truck._id,
        assignedDriverId: driver._id,
        assignedOwnerId: truckOwner._id,
        selectedApplicationId: application._id,
        $push: {
          timeline: {
            status: 'ASSIGNED',
            note: 'Application approved',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Make sure it worked and update our reference
    expect(updatedShipment).toBeDefined();
    if (updatedShipment) {
      shipment = updatedShipment;
      expect(shipment.status).toBe('ASSIGNED');
    } else {
      throw new Error('Failed to update shipment status to ASSIGNED');
    }
  });
  
  test('5. Shipment execution - Loading phase', async () => {
    // Double check shipment exists
    expect(shipment).toBeDefined();
    expect(shipment._id).toBeDefined();
    
    // Update shipment to Loading
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: 'LOADING',
        $push: {
          timeline: {
            status: 'LOADING',
            note: 'Loading cargo at origin',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Make sure it worked and update our reference
    expect(updatedShipment).toBeDefined();
    if (updatedShipment) {
      shipment = updatedShipment;
      expect(shipment.status).toBe('LOADING');
    } else {
      throw new Error('Failed to update shipment status to LOADING');
    }
  });
  
  test('6. Shipment execution - In Transit phase', async () => {
    // Update shipment to In Transit
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: 'IN_TRANSIT',
        $push: {
          timeline: {
            status: 'IN_TRANSIT',
            note: 'Shipment in transit',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Make sure it worked and update our reference
    expect(updatedShipment).toBeDefined();
    if (updatedShipment) {
      shipment = updatedShipment;
      expect(shipment.status).toBe('IN_TRANSIT');
    } else {
      throw new Error('Failed to update shipment status to IN_TRANSIT');
    }
  });
  
  test('7. Shipment execution - Delivered phase', async () => {
    // Update shipment to Delivered
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: 'DELIVERED',
        $push: {
          timeline: {
            status: 'DELIVERED',
            note: 'Shipment delivered to recipient',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Make sure it worked and update our reference
    expect(updatedShipment).toBeDefined();
    if (updatedShipment) {
      shipment = updatedShipment;
      expect(shipment.status).toBe('DELIVERED');
    } else {
      throw new Error('Failed to update shipment status to DELIVERED');
    }
  });
  
  test('8. Shipment execution - Completed phase', async () => {
    // Update shipment to Completed
    const updatedShipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: 'COMPLETED',
        rating: 5,
        feedback: 'Excellent service, on time delivery',
        $push: {
          timeline: {
            status: 'COMPLETED',
            note: 'Shipment completed with positive feedback',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Make sure it worked and update our reference
    expect(updatedShipment).toBeDefined();
    if (updatedShipment) {
      shipment = updatedShipment;
      expect(shipment.status).toBe('COMPLETED');
      expect(shipment.rating).toBe(5);
    } else {
      throw new Error('Failed to update shipment status to COMPLETED');
    }
  });
}); 