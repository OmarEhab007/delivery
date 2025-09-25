/**
 * Database Indexing Test Script
 *
 * This script tests the database indexing functionality by:
 * 1. Creating test data to work with
 * 2. Running basic queries that should use indexes
 * 3. Verifying query performance with explain() output
 *
 * Usage: npm run test:indexes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const createIndexes = require('../../src/scripts/database/createIndexes');

// Import models
const User = require('../../src/models/User');
const { Shipment } = require('../../src/models/Shipment');

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Disconnect from MongoDB
async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
}

// Test query performance for User collection
async function testUserQueries() {
  console.log('\n---Testing User Queries---');

  try {
    // Test query 1: Find by email (should use email_1 index)
    console.log('Testing query by email...');
    const emailQuery = await User.findOne({ email: 'admin@example.com' }).explain('executionStats');

    const emailIndexUsed =
      emailQuery.executionStats.executionStages.inputStage?.indexName === 'email_1';
    console.log(`Query by email used index: ${emailIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${emailQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${emailQuery.executionStats.executionTimeMillis}ms`);

    // Test query 2: Find by role (should use role_1 index)
    console.log('\nTesting query by role...');
    const roleQuery = await User.find({ role: 'driver' }).limit(5).explain('executionStats');

    const roleIndexUsed =
      roleQuery.executionStats.executionStages.inputStage?.indexName === 'role_1';
    console.log(`Query by role used index: ${roleIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${roleQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${roleQuery.executionStats.executionTimeMillis}ms`);

    // Test query 3: Compound query (should use compound index)
    console.log('\nTesting compound query (role + verificationStatus)...');
    const compoundQuery = await User.find({
      role: 'driver',
      verificationStatus: 'verified',
    })
      .limit(5)
      .explain('executionStats');

    const compoundIndexUsed =
      compoundQuery.executionStats.executionStages.inputStage?.indexName ===
      'role_1_verificationStatus_1';
    console.log(`Compound query used index: ${compoundIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${compoundQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${compoundQuery.executionStats.executionTimeMillis}ms`);

    return {
      emailIndexUsed,
      roleIndexUsed,
      compoundIndexUsed,
    };
  } catch (error) {
    console.error('Error testing User queries:', error.message);
    return {
      emailIndexUsed: false,
      roleIndexUsed: false,
      compoundIndexUsed: false,
      error: error.message,
    };
  }
}

// Test query performance for Shipment collection
async function testShipmentQueries() {
  console.log('\n---Testing Shipment Queries---');

  try {
    // Test query 1: Find by status (should use status_1 index)
    console.log('Testing query by status...');
    const statusQuery = await Shipment.find({ status: 'in_transit' })
      .limit(5)
      .explain('executionStats');

    const statusIndexUsed =
      statusQuery.executionStats.executionStages.inputStage?.indexName === 'status_1';
    console.log(`Query by status used index: ${statusIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${statusQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${statusQuery.executionStats.executionTimeMillis}ms`);

    // Test query 2: Sorting by creation date (should use createdAt_-1 index)
    console.log('\nTesting query with sorting by createdAt...');
    const sortQuery = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .explain('executionStats');

    const sortIndexUsed =
      sortQuery.executionStats.executionStages.inputStage?.indexName === 'createdAt_-1';
    console.log(`Sort query used index: ${sortIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${sortQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${sortQuery.executionStats.executionTimeMillis}ms`);

    // Test query 3: Compound query (should use compound index)
    console.log('\nTesting compound query (status + createdAt)...');
    const compoundQuery = await Shipment.find({
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .explain('executionStats');

    const compoundIndexUsed =
      compoundQuery.executionStats.executionStages.inputStage?.indexName ===
      'status_1_createdAt_-1';
    console.log(`Compound query used index: ${compoundIndexUsed ? 'Yes' : 'No'}`);
    console.log(`Documents examined: ${compoundQuery.executionStats.totalDocsExamined}`);
    console.log(`Execution time: ${compoundQuery.executionStats.executionTimeMillis}ms`);

    return {
      statusIndexUsed,
      sortIndexUsed,
      compoundIndexUsed,
    };
  } catch (error) {
    console.error('Error testing Shipment queries:', error.message);
    return {
      statusIndexUsed: false,
      sortIndexUsed: false,
      compoundIndexUsed: false,
      error: error.message,
    };
  }
}

// Main test function
async function runTests() {
  console.log('Starting database index tests...');

  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Cannot proceed with tests without MongoDB connection.');
    process.exit(1);
  }

  try {
    // Run the indexing script
    console.log('\nRunning createIndexes script...');
    await createIndexes();

    // Test index usage in queries
    const userResults = await testUserQueries();
    const shipmentResults = await testShipmentQueries();

    // Print summary
    console.log('\n--- Test Results Summary ---');
    console.log('User Collection:');
    console.log(`- Email index used: ${userResults.emailIndexUsed ? 'Yes' : 'No'}`);
    console.log(`- Role index used: ${userResults.roleIndexUsed ? 'Yes' : 'No'}`);
    console.log(`- Compound index used: ${userResults.compoundIndexUsed ? 'Yes' : 'No'}`);

    console.log('\nShipment Collection:');
    console.log(`- Status index used: ${shipmentResults.statusIndexUsed ? 'Yes' : 'No'}`);
    console.log(`- Sort index used: ${shipmentResults.sortIndexUsed ? 'Yes' : 'No'}`);
    console.log(`- Compound index used: ${shipmentResults.compoundIndexUsed ? 'Yes' : 'No'}`);

    // Calculate overall success
    const userSuccess =
      userResults.emailIndexUsed && userResults.roleIndexUsed && userResults.compoundIndexUsed;
    const shipmentSuccess =
      shipmentResults.statusIndexUsed &&
      shipmentResults.sortIndexUsed &&
      shipmentResults.compoundIndexUsed;
    const overallSuccess = userSuccess && shipmentSuccess;

    console.log('\nOverall test result:', overallSuccess ? 'SUCCESS' : 'FAILURE');

    if (!overallSuccess) {
      console.log('\nSome indexes are not being used as expected. Consider:');
      console.log('1. Verifying that the indexes were created correctly');
      console.log('2. Checking if queries are structured to take advantage of the indexes');
      console.log('3. Ensuring sufficient data exists to make index usage beneficial');
    }
  } catch (error) {
    console.error('Error during tests:', error.message);
  } finally {
    // Disconnect from MongoDB
    await disconnectFromMongoDB();
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test script failed:', error.message);
      process.exit(1);
    });
} else {
  // Export for use in other test scripts
  module.exports = runTests;
}
