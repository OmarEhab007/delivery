const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectDB = async (retryCount = 0) => {
  try {
    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Add replica set options if transactions are enabled
    if (process.env.USE_MONGODB_TRANSACTIONS === 'true') {
      logger.info('Connecting to MongoDB with replica set support for transactions');
      options.replicaSet = 'rs0';
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    
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
