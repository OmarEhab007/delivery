const mongoose = require('mongoose');
const User = require('../src/models/User');
const Truck = require('../src/models/Truck');
const { Shipment, ShipmentStatus } = require('../src/models/Shipment');
const { Application } = require('../src/models/Application');
const bcrypt = require('bcryptjs');

describe('Simplified End-to-End Test', () => {
  let merchant, truckOwner, driver;
  let truck;
  let shipment;
  let application;

  beforeAll(async () => {
    // Clear all collections
    await Promise.all(Object.values(mongoose.connection.collections).map(c => c.deleteMany({})));
  });

  test('Complete shipment flow', async () => {
    // 1. Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    merchant = await User.create({
      name: 'Test Merchant',
      email: `merchant${Date.now()}@example.com`,
      password: hashedPassword,
      phone: '+1234567890',
      role: 'Merchant',
      isVerified: true
    });
    
    truckOwner = await User.create({
      name: 'Test Truck Owner',
      email: `truckowner${Date.now()}@example.com`,
      password: hashedPassword,
      phone: '+1234567891',
      role: 'TruckOwner',
      companyName: 'Test Trucking Co',
      companyAddress: '123 Company Street',
      isVerified: true
    });
    
    driver = await User.create({
      name: 'Test Driver',
      email: `driver${Date.now()}@example.com`,
      password: hashedPassword,
      phone: '+1234567892',
      role: 'Driver',
      ownerId: truckOwner._id,
      licenseNumber: `DL-${Date.now()}`,
      isVerified: true
    });
    
    // 2. Create truck
    truck = await Truck.create({
      plateNumber: `TEST-${Date.now()}`,
      model: 'Test Truck Model',
      capacity: 10000,
      year: 2023,
      truckType: 'Flatbed',
      ownerId: truckOwner._id,
      driverId: driver._id,
      available: true
    });
    
    // 3. Create shipment
    shipment = await Shipment.create({
      merchantId: merchant._id,
      origin: {
        address: '123 Origin St',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      destination: {
        address: '456 Destination Ave',
        coordinates: { lat: 34.0522, lng: -118.2437 }
      },
      cargoDetails: {
        description: 'Test Cargo',
        weight: 5000,
        category: 'general'
      },
      status: ShipmentStatus.REQUESTED,
      timeline: [
        {
          status: ShipmentStatus.REQUESTED,
          note: 'Shipment created',
          timestamp: new Date()
        }
      ]
    });
    
    // 4. Create application
    application = await Application.create({
      shipmentId: shipment._id,
      ownerId: truckOwner._id,
      truckId: truck._id,
      driverId: driver._id,
      bidDetails: {
        price: 1000,
        currency: 'USD'
      },
      status: 'PENDING'
    });
    
    // 5. Accept application
    application = await Application.findByIdAndUpdate(
      application._id,
      { status: 'ACCEPTED' },
      { new: true }
    );
    
    // 6. Update shipment to ASSIGNED
    shipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      {
        status: ShipmentStatus.ASSIGNED,
        assignedTruckId: truck._id,
        assignedDriverId: driver._id,
        assignedOwnerId: truckOwner._id,
        selectedApplicationId: application._id
      },
      { new: true }
    );
    
    expect(shipment.status).toBe(ShipmentStatus.ASSIGNED);
    
    // 7. Update shipment to LOADING
    shipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      { status: ShipmentStatus.LOADING },
      { new: true }
    );
    
    expect(shipment.status).toBe(ShipmentStatus.LOADING);
    
    // 8. Update shipment to IN_TRANSIT
    shipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      { status: ShipmentStatus.IN_TRANSIT },
      { new: true }
    );
    
    expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
    
    // 9. Update shipment to DELIVERED
    shipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      { status: ShipmentStatus.DELIVERED },
      { new: true }
    );
    
    expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
    
    // 10. Update shipment to COMPLETED
    shipment = await Shipment.findByIdAndUpdate(
      shipment._id,
      { status: ShipmentStatus.COMPLETED },
      { new: true }
    );
    
    expect(shipment.status).toBe(ShipmentStatus.COMPLETED);
    
    console.log('End-to-end test completed successfully!');
  });
}); 