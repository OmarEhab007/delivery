const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('../config/config');

// Cache for transaction support check
let transactionsSupportedCache = null;

/**
 * Check if the MongoDB deployment supports transactions
 * @param {boolean} forceCheck Force a new check even if cached result exists
 * @returns {Promise<boolean>} True if transactions are supported, false otherwise
 */
exports.supportsTransactions = async (forceCheck = false) => {
  // Return cached result if available and not forcing a fresh check
  if (transactionsSupportedCache !== null && !forceCheck) {
    return transactionsSupportedCache;
  }
  
  // If transactions are disabled in config, return false immediately
  if (config.database && config.database.useTransactions === false) {
    logger.info('MongoDB transactions disabled by configuration.');
    transactionsSupportedCache = false;
    return false;
  }
  
  try {
    // Try to start a session
    const session = await mongoose.startSession();
    
    // Check if we can start a transaction
    try {
      session.startTransaction();
      await session.commitTransaction();
      session.endSession();
      transactionsSupportedCache = true;
      return true;
    } catch (error) {
      // If transaction fails, end the session and return false
      session.endSession();
      logger.warn('MongoDB transactions are not supported. Using fallback mode.');
      transactionsSupportedCache = false;
      return false;
    }
  } catch (error) {
    logger.warn('MongoDB sessions are not supported. Using fallback mode.');
    transactionsSupportedCache = false;
    return false;
  }
}; 