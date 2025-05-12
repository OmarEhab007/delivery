/**
 * Database Indexing Script
 *
 * This script creates optimized indexes on MongoDB collections to improve query performance.
 * It adds indexes for frequently queried fields and compound indexes for common query patterns.
 *
 * Usage:
 * - Run once after initial database setup: node src/scripts/database/createIndexes.js
 * - Run when updating index structure: node src/scripts/database/createIndexes.js
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Import models to ensure schemas are registered
const User = require('../../models/User');
const { Shipment } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const { Application } = require('../../models/Application');
const { Document } = require('../../models/Document');

// Function to log with timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Create indexes for User collection
async function createUserIndexes(db) {
  const collection = db.collection('users');
  log('Creating User collection indexes...');

  // Basic indexes for frequent lookups
  await collection.createIndex({ email: 1 }, { unique: true, background: true });
  await collection.createIndex({ role: 1 }, { background: true });
  await collection.createIndex({ verificationStatus: 1 }, { background: true });
  await collection.createIndex({ active: 1 }, { background: true });
  await collection.createIndex({ 'currentLocation.coordinates': '2dsphere' }, { background: true });
  await collection.createIndex({ createdAt: -1 }, { background: true }); // For sorting by creation date

  // Role-specific indexes
  await collection.createIndex({ role: 1, isAvailable: 1 }, { background: true }); // Finding available drivers
  await collection.createIndex({ role: 1, driverStatus: 1 }, { background: true }); // Filtering drivers by status
  await collection.createIndex({ ownerId: 1, role: 1 }, { background: true }); // Finding drivers by owner

  // Compound indexes for common queries
  await collection.createIndex({ role: 1, verificationStatus: 1 }, { background: true }); // Filtering verified users by role
  await collection.createIndex({ role: 1, active: 1 }, { background: true }); // Finding active users by role

  // Document-related indexes
  await collection.createIndex({ 'documents.documentType': 1 }, { background: true }); // Finding users with specific document types
  await collection.createIndex({ 'documents.verified': 1 }, { background: true }); // Finding users with verified documents

  log('User collection indexes created successfully');
}

// Create indexes for Shipment collection
async function createShipmentIndexes(db) {
  const collection = db.collection('shipments');
  log('Creating Shipment collection indexes...');

  // Basic indexes for frequent lookups
  await collection.createIndex({ merchantId: 1 }, { background: true }); // Find merchant's shipments
  await collection.createIndex({ status: 1 }, { background: true }); // Filter by status
  await collection.createIndex({ assignedTruckId: 1 }, { background: true }); // Find truck's shipments
  await collection.createIndex({ assignedDriverId: 1 }, { background: true }); // Find driver's shipments
  await collection.createIndex({ createdAt: -1 }, { background: true }); // Sort by creation date
  await collection.createIndex({ 'currentLocation.coordinates': '2dsphere' }, { background: true }); // Geospatial queries
  await collection.createIndex({ 'origin.country': 1 }, { background: true }); // Filter by origin country
  await collection.createIndex({ 'destination.country': 1 }, { background: true }); // Filter by destination country

  // Compound indexes for common query patterns
  await collection.createIndex({ merchantId: 1, status: 1 }, { background: true }); // Merchant's shipments by status
  await collection.createIndex({ assignedDriverId: 1, status: 1 }, { background: true }); // Driver's shipments by status
  await collection.createIndex({ assignedTruckId: 1, status: 1 }, { background: true }); // Truck's shipments by status
  await collection.createIndex({ status: 1, createdAt: -1 }, { background: true }); // Shipments by status sorted by date
  await collection.createIndex(
    { 'origin.country': 1, 'destination.country': 1 },
    { background: true }
  ); // International routes

  // Specific business queries
  await collection.createIndex({ status: 1, 'cargoDetails.hazardous': 1 }, { background: true }); // Hazardous shipments by status
  await collection.createIndex({ estimatedDeliveryDate: 1, status: 1 }, { background: true }); // Upcoming deliveries
  await collection.createIndex({ 'paymentDetails.paymentVerified': 1 }, { background: true }); // Filter paid/unpaid shipments

  log('Shipment collection indexes created successfully');
}

// Create indexes for Truck collection
async function createTruckIndexes(db) {
  const collection = db.collection('trucks');
  log('Creating Truck collection indexes...');

  // Basic indexes
  await collection.createIndex({ ownerId: 1 }, { background: true }); // Find owner's trucks
  await collection.createIndex({ driverId: 1 }, { background: true }); // Find driver's truck
  await collection.createIndex({ plateNumber: 1 }, { unique: true, background: true }); // Lookup by plate number
  await collection.createIndex({ status: 1 }, { background: true }); // Filter by status
  await collection.createIndex({ available: 1 }, { background: true }); // Find available trucks
  await collection.createIndex({ verificationStatus: 1 }, { background: true }); // Find verified trucks
  await collection.createIndex({ active: 1 }, { background: true }); // Find active trucks
  await collection.createIndex({ capacity: 1 }, { background: true }); // Search by capacity

  // Compound indexes for efficient queries
  await collection.createIndex({ ownerId: 1, status: 1 }, { background: true }); // Owner's trucks by status
  await collection.createIndex({ status: 1, available: 1 }, { background: true }); // Available trucks by status
  await collection.createIndex({ status: 1, capacity: 1 }, { background: true }); // Filter trucks by status and capacity

  // Maintenance and document related
  await collection.createIndex({ 'insuranceInfo.expiryDate': 1 }, { background: true }); // Find trucks with expiring insurance
  await collection.createIndex({ 'registrationInfo.expiryDate': 1 }, { background: true }); // Find trucks with expiring registration
  await collection.createIndex({ nextMaintenanceDate: 1 }, { background: true }); // Find trucks needing maintenance

  log('Truck collection indexes created successfully');
}

// Create indexes for Application collection
async function createApplicationIndexes(db) {
  const collection = db.collection('applications');
  log('Creating Application collection indexes...');

  // Basic indexes
  await collection.createIndex({ shipmentId: 1 }, { background: true }); // Find applications for a shipment
  await collection.createIndex({ ownerId: 1 }, { background: true }); // Find owner's applications
  await collection.createIndex({ driverId: 1 }, { background: true }); // Find driver's applications
  await collection.createIndex({ assignedTruckId: 1 }, { background: true }); // Find applications for a truck
  await collection.createIndex({ status: 1 }, { background: true }); // Filter by status
  await collection.createIndex({ createdAt: -1 }, { background: true }); // Sort by creation date

  // Unique constraint for one application per shipment per owner
  await collection.createIndex({ shipmentId: 1, ownerId: 1 }, { unique: true, background: true });

  // Compound indexes for common query patterns
  await collection.createIndex({ shipmentId: 1, status: 1 }, { background: true }); // Applications for shipment by status
  await collection.createIndex({ ownerId: 1, status: 1 }, { background: true }); // Owner's applications by status
  await collection.createIndex({ status: 1, 'bidDetails.price': 1 }, { background: true }); // Filter by status and price
  await collection.createIndex({ status: 1, createdAt: -1 }, { background: true }); // Applications by status sorted by date

  log('Application collection indexes created successfully');
}

// Create indexes for Document collection
async function createDocumentIndexes(db) {
  const collection = db.collection('documents');
  log('Creating Document collection indexes...');

  // Basic indexes
  await collection.createIndex({ uploadedBy: 1 }, { background: true }); // Find documents uploaded by user
  await collection.createIndex({ documentType: 1 }, { background: true }); // Filter by document type
  await collection.createIndex({ entityType: 1, entityId: 1 }, { background: true }); // Find documents for an entity
  await collection.createIndex({ isVerified: 1 }, { background: true }); // Find verified documents
  await collection.createIndex({ isActive: 1 }, { background: true }); // Find active documents
  await collection.createIndex({ createdAt: -1 }, { background: true }); // Sort by creation date
  await collection.createIndex({ expiryDate: 1 }, { background: true }); // Find expiring documents

  // Compound indexes for common query patterns
  await collection.createIndex({ entityType: 1, documentType: 1 }, { background: true }); // Find documents by type for entity type
  await collection.createIndex({ entityType: 1, isVerified: 1 }, { background: true }); // Find verified documents by entity type
  await collection.createIndex({ uploadedBy: 1, isActive: 1 }, { background: true }); // Find active documents by uploader
  await collection.createIndex({ isActive: 1, expiryDate: 1 }, { background: true }); // Find active documents by expiry

  log('Document collection indexes created successfully');
}

// Main function to create all indexes
async function createIndexes() {
  log('Starting database indexing process...');

  // Connect to MongoDB directly for index operations
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    log('Connected to MongoDB');

    const db = client.db();

    // Create indexes for each collection
    await createUserIndexes(db);
    await createShipmentIndexes(db);
    await createTruckIndexes(db);
    await createApplicationIndexes(db);
    await createDocumentIndexes(db);

    // Get statistics about indexes
    log('Retrieving index statistics...');
    const stats = {};

    const collections = ['users', 'shipments', 'trucks', 'applications', 'documents'];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      stats[collName] = {
        count: indexes.length,
        indexes: indexes.map((idx) => idx.name),
      };
    }

    log('Index statistics:');
    console.log(JSON.stringify(stats, null, 2));

    log('All database indexes created successfully');
  } catch (error) {
    log(`Error creating indexes: ${error.message}`);
    console.error(error);
  } finally {
    await client.close();
    log('MongoDB connection closed');
  }
}

// If script is run directly (not imported)
if (require.main === module) {
  createIndexes()
    .then(() => {
      log('Database indexing completed');
      process.exit(0);
    })
    .catch((err) => {
      log(`Error in indexing script: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = createIndexes;
}
