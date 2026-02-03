const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set required environment variables for testing BEFORE any imports that use them
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-testing';
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '7';
process.env.NODE_ENV = 'test';

// Set test timeout
jest.setTimeout(30000);

let mongoServer;

// Connect to the in-memory database before running any tests
beforeAll(async () => {
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
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
