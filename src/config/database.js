const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

/**
 * Checks for missing indexes in collections
 * @returns {Promise<Object>} Missing indexes by collection
 */
const checkMissingIndexes = async () => {
  try {
    logger.info('Checking for missing indexes...');
    const results = {};
    
    // Get collections that have indexes defined in our system
    const collectionsToCheck = ['users', 'shipments', 'trucks', 'applications', 'documents'];
    
    for (const collName of collectionsToCheck) {
      // Skip if collection doesn't exist yet
      if (!mongoose.connection.collections[collName]) continue;
      
      // Get current indexes
      const indexes = await mongoose.connection.collections[collName].indexes();
      const indexNames = indexes.map(idx => idx.name);
      
      // Log indexes for this collection
      logger.info(`Collection ${collName} has ${indexes.length} indexes`);
      
      // Store index info
      results[collName] = {
        indexCount: indexes.length,
        indexes: indexNames
      };
    }
    
    return results;
  } catch (error) {
    logger.error(`Error checking indexes: ${error.message}`, { error });
    return { error: error.message };
  }
};

/**
 * Connect to MongoDB with retry logic and detailed logging
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectDB = async (retryCount = 0) => {
  try {
    const startTime = Date.now();
    
    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    // Configure connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optimized settings for indexing operations
      connectTimeoutMS: 30000, // More time for initial connection (helpful during indexing)
      socketTimeoutMS: 45000,  // More time for operations (helpful for long running index creations)
      maxPoolSize: 50,         // Increase connection pool for parallel operations
      minPoolSize: 5,          // Maintain minimum connections for performance
      serverSelectionTimeoutMS: 30000, // More time for server selection
    };
    
    // Add replica set options if transactions are enabled
    if (process.env.USE_MONGODB_TRANSACTIONS === 'true') {
      logger.info('Connecting to MongoDB with replica set support for transactions');
      options.replicaSet = 'rs0';
    }
    
    // Set up Mongoose debug logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        // Track index operations specifically
        const isIndexOperation = 
          method === 'createIndex' || 
          method === 'ensureIndex' || 
          method === 'dropIndex' || 
          method === 'dropIndexes';
        
        logger.database(`Mongoose: ${collectionName}.${method}`, {
          collection: collectionName,
          method,
          isIndexOperation,
          query: JSON.stringify(query),
          doc: doc ? '...' : null,
          queryTime: null // Will be filled by response handler
        });
      });
    }
    
    // Connect to database
    logger.info(`Connecting to MongoDB: ${process.env.MONGODB_URI?.split('@').pop() || '[URI not set]'}`);
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    const connectionTime = Date.now() - startTime;
    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      host: conn.connection.host, 
      name: conn.connection.name,
      connectionTime: `${connectionTime}ms`,
      replica: conn.connection.replica || false
    });
    
    // Check for indexes if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      const indexResults = await checkMissingIndexes();
      logger.info('Index check completed', { indexResults });
    }
    
    // Monitor connection events
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err.message}`, { error: err });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err.message}`, { error: err });
        process.exit(1);
      }
    });
    
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`, { 
      error, 
      attemptNumber: retryCount + 1, 
      maxRetries: MAX_RETRIES 
    });
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection in ${RETRY_INTERVAL/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectDB(retryCount + 1);
    }
    
    // Exit if all retries fail
    logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.checkMissingIndexes = checkMissingIndexes;
