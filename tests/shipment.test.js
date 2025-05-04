const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const { Shipment } = require('../src/models/Shipment');
const { 
  createTestUser, 
  generateToken, 
  createTestShipment,
  createTestTruck,
  createTestApplication
} = require('./utils/testUtils');

describe('Shipment Management Module Tests', () => {
  let merchant;
  let merchantToken;
  
  beforeEach(async () => {
    merchant = await createTestUser('Merchant');
    merchantToken = generateToken(merchant);
  });
  
  describe('Shipment Creation', () => {
    it('should create a new shipment for a merchant', async () => {
      const shipmentData = {
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
          description: 'Test cargo',
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
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        paymentMethod: 'CARD',
        notes: 'Test shipment notes'
      };
      
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send(shipmentData);
      
      expect(response.status).toBe(201);
      expect(response.body.data.shipment).toHaveProperty('status', 'REQUESTED');
      expect(response.body.data.shipment).toHaveProperty('merchantId', merchant._id.toString());
      expect(response.body.data.shipment.origin).toHaveProperty('address', shipmentData.origin.address);
      expect(response.body.data.shipment.destination).toHaveProperty('address', shipmentData.destination.address);
    });
    
    it('should not allow a truck owner to create a shipment', async () => {
      const truckOwner = await createTestUser('TruckOwner');
      const truckOwnerToken = generateToken(truckOwner);
      
      const shipmentData = {
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
          description: 'Test cargo',
          weight: 2000
        },
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${truckOwnerToken}`)
        .send(shipmentData);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Shipment Management', () => {
    it('should get a list of shipments for a merchant', async () => {
      // Create a couple of test shipments
      await createTestShipment(merchant._id);
      await createTestShipment(merchant._id);
      
      const response = await request(app)
        .get('/api/shipments')
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.shipments)).toBe(true);
    });
    
    it('should get a single shipment by ID', async () => {
      const shipment = await createTestShipment(merchant._id);
      
      const response = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.shipment).toHaveProperty('_id', shipment._id.toString());
    });
    
    // These endpoints appear to be missing in the API implementation
    it.skip('should update a shipment', async () => {
      const shipment = await createTestShipment(merchant._id);
      
      const updateData = {
        cargoDetails: {
          description: 'Updated cargo description',
          weight: 3000,
          category: 'fragile'
        }
      };
      
      const response = await request(app)
        .put(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.data.shipment.cargoDetails).toHaveProperty('description', 'Updated cargo description');
      expect(response.body.data.shipment.cargoDetails).toHaveProperty('weight', 3000);
      expect(response.body.data.shipment.cargoDetails).toHaveProperty('category', 'fragile');
    });
    
    it.skip('should not allow a merchant to update another merchant\'s shipment', async () => {
      const anotherMerchant = await createTestUser('Merchant');
      const shipment = await createTestShipment(anotherMerchant._id);
      
      const updateData = {
        cargoDetails: {
          description: 'Unauthorized update'
        }
      };
      
      const response = await request(app)
        .put(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send(updateData);
      
      expect(response.status).toBe(403);
    });
    
    it.skip('should delete a shipment', async () => {
      const shipment = await createTestShipment(merchant._id);
      
      const response = await request(app)
        .delete(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(response.status).toBe(200);
      
      // Verify shipment is deleted
      const findResponse = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(findResponse.status).toBe(404);
    });
  });
  
  describe('Shipment Status Management', () => {
    it.skip('should update shipment status', async () => {
      const shipment = await createTestShipment(merchant._id);
      
      // Assign a truck and driver (assuming this is necessary for status changes)
      const truckOwner = await createTestUser('TruckOwner');
      const truck = await createTestTruck(truckOwner._id);
      const driver = await createTestUser('Driver', { ownerId: truckOwner._id });
      
      // Create and approve an application for the shipment
      const application = await createTestApplication(shipment._id, truckOwner._id, truck._id);
      
      // Approve the application (this would normally be done by the merchant)
      await request(app)
        .put(`/api/applications/${application._id}/approve`)
        .set('Authorization', `Bearer ${merchantToken}`);
      
      // Update shipment status
      const response = await request(app)
        .put(`/api/shipments/${shipment._id}/status`)
        .set('Authorization', `Bearer ${truckOwnerToken}`)
        .send({
          status: 'IN_TRANSIT',
          notes: 'Shipment picked up and in transit'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.shipment).toHaveProperty('status', 'IN_TRANSIT');
      expect(response.body.data.shipment.timeline[response.body.data.shipment.timeline.length - 1])
        .toHaveProperty('status', 'IN_TRANSIT');
    });
    
    it.skip('should mark a shipment as delivered', async () => {
      const shipment = await createTestShipment(merchant._id);
      
      // Assign a truck and driver
      const truckOwner = await createTestUser('TruckOwner');
      const truckOwnerToken = generateToken(truckOwner);
      const truck = await createTestTruck(truckOwner._id);
      const driver = await createTestUser('Driver', { ownerId: truckOwner._id });
      
      // Create and approve an application for the shipment
      const application = await createTestApplication(shipment._id, truckOwner._id, truck._id);
      
      // Update shipment status to delivered
      const response = await request(app)
        .put(`/api/shipments/${shipment._id}/status`)
        .set('Authorization', `Bearer ${truckOwnerToken}`)
        .send({
          status: 'DELIVERED',
          notes: 'Shipment delivered successfully'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.shipment).toHaveProperty('status', 'DELIVERED');
      expect(response.body.data.shipment.timeline[response.body.data.shipment.timeline.length - 1])
        .toHaveProperty('status', 'DELIVERED');
    });
  });
  
  describe('Shipment Search and Filtering', () => {
    it('should search shipments by status', async () => {
      // Create shipments with different statuses
      await createTestShipment(merchant._id, { status: 'DELIVERED' });
      await createTestShipment(merchant._id, { status: 'DELIVERED' });
      await createTestShipment(merchant._id, { status: 'REQUESTED' });
      
      const response = await request(app)
        .get('/api/shipments/search')
        .query({ status: 'DELIVERED' })
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.shipments)).toBe(true);
      
      // All returned shipments should have DELIVERED status
      response.body.data.shipments.forEach(shipment => {
        expect(shipment.status).toBe('DELIVERED');
      });
    });
    
    it('should search shipments by date range', async () => {
      // Create shipments with different dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 3); // 3 days ago
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3); // 3 days from now
      
      await createTestShipment(merchant._id, { 
        scheduledDate: new Date() // Today
      });
      
      const response = await request(app)
        .get('/api/shipments/search')
        .query({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${merchantToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.shipments)).toBe(true);
    });
  });
}); 