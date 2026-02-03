const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const promClient = require('prom-client');

// Set required environment variables for testing BEFORE any imports that use them
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-testing';
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '7';
process.env.NODE_ENV = 'test';

// Clear prom-client registry to avoid duplicate metric registration errors
// This is needed because Jest may reload modules between test runs
promClient.register.clear();

// Set test timeout
jest.setTimeout(30000);

let mongoServer;
const externalMongoUri = process.env.TEST_MONGODB_URI;

// Connect to the in-memory database before running any tests
beforeAll(async () => {
  if (externalMongoUri) {
    await mongoose.connect(externalMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
  });
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear all test data after each test
afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and close the db connection after all tests are done
afterAll(async () => {
  // Only drop database for in-memory server to prevent accidental data loss
  if (mongoServer) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
