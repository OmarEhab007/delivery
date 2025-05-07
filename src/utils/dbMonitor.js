const mongoose = require('mongoose');
const metrics = require('./metrics');
const tracer = require('./tracer');
const logger = require('./logger');

/**
 * Wrap Mongoose model methods with monitoring
 * @param {Object} model - Mongoose model to wrap
 * @returns {Object} Wrapped model with monitoring
 */
const wrapModel = (model) => {
  const collection = model.collection.name;
  const originalMethods = {
    find: model.find,
    findOne: model.findOne,
    findById: model.findById,
    create: model.create,
    update: model.update,
    updateOne: model.updateOne,
    updateMany: model.updateMany,
    deleteOne: model.deleteOne,
    deleteMany: model.deleteMany,
    aggregate: model.aggregate,
    countDocuments: model.countDocuments
  };

  // Wrap find method
  model.find = function(...args) {
    const endTimer = metrics.startDbTimer('find', collection);
    const span = tracer.createChildSpan('MongoDB.find', { collection });
    const startTime = Date.now();
    
    try {
      const result = originalMethods.find.apply(this, args);
      
      // Add hooks to the query execution
      const originalExec = result.exec;
      result.exec = async function(...execArgs) {
        try {
          const docs = await originalExec.apply(this, execArgs);
          const duration = Date.now() - startTime;
          endTimer();
          span.addAttribute('count', docs ? docs.length : 0);
          span.end();
          
          // Log slow queries (more than 100ms)
          if (duration > 100) {
            logger.performance(`Slow DB query [${collection}.find]: ${duration}ms`, {
              collection,
              operation: 'find',
              duration,
              filter: JSON.stringify(args[0] || {})
            });
          }
          
          return docs;
        } catch (error) {
          endTimer();
          span.end(error);
          throw error;
        }
      };
      
      return result;
    } catch (error) {
      endTimer();
      span.end(error);
      throw error;
    }
  };
  
  // Wrap findOne method
  model.findOne = function(...args) {
    const endTimer = metrics.startDbTimer('findOne', collection);
    const span = tracer.createChildSpan('MongoDB.findOne', { collection });
    const startTime = Date.now();
    
    try {
      const result = originalMethods.findOne.apply(this, args);
      
      // Add hooks to the query execution
      const originalExec = result.exec;
      result.exec = async function(...execArgs) {
        try {
          const doc = await originalExec.apply(this, execArgs);
          const duration = Date.now() - startTime;
          endTimer();
          span.addAttribute('found', !!doc);
          span.end();
          
          // Log slow queries (more than 100ms)
          if (duration > 100) {
            logger.performance(`Slow DB query [${collection}.findOne]: ${duration}ms`, {
              collection,
              operation: 'findOne',
              duration,
              filter: JSON.stringify(args[0] || {})
            });
          }
          
          return doc;
        } catch (error) {
          endTimer();
          span.end(error);
          throw error;
        }
      };
      
      return result;
    } catch (error) {
      endTimer();
      span.end(error);
      throw error;
    }
  };
  
  // Wrap create method (handled differently since it doesn't return a query)
  model.create = async function(...args) {
    const endTimer = metrics.startDbTimer('create', collection);
    const span = tracer.createChildSpan('MongoDB.create', { collection });
    const startTime = Date.now();
    
    try {
      const doc = await originalMethods.create.apply(this, args);
      const duration = Date.now() - startTime;
      endTimer();
      span.end();
      
      // Log slow operations (more than 200ms)
      if (duration > 200) {
        logger.performance(`Slow DB operation [${collection}.create]: ${duration}ms`, {
          collection,
          operation: 'create',
          duration
        });
      }
      
      return doc;
    } catch (error) {
      endTimer();
      span.end(error);
      throw error;
    }
  };
  
  // Wrap aggregate method
  model.aggregate = function(...args) {
    const endTimer = metrics.startDbTimer('aggregate', collection);
    const span = tracer.createChildSpan('MongoDB.aggregate', { collection });
    const startTime = Date.now();
    const pipeline = args[0] || [];
    
    try {
      const result = originalMethods.aggregate.apply(this, args);
      
      // Add hooks to the aggregation execution
      const originalExec = result.exec;
      result.exec = async function(...execArgs) {
        try {
          const docs = await originalExec.apply(this, execArgs);
          const duration = Date.now() - startTime;
          endTimer();
          span.addAttribute('count', docs ? docs.length : 0);
          span.addAttribute('pipeline_stages', pipeline.length);
          span.end();
          
          // Always log aggregation performance
          logger.performance(`DB aggregation [${collection}]: ${duration}ms, ${pipeline.length} stages`, {
            collection,
            operation: 'aggregate',
            duration,
            stages: pipeline.length,
            slow: duration > 500
          });
          
          return docs;
        } catch (error) {
          endTimer();
          span.end(error);
          throw error;
        }
      };
      
      return result;
    } catch (error) {
      endTimer();
      span.end(error);
      throw error;
    }
  };
  
  // Similarly wrap other methods...
  // For brevity, we'll skip the implementation for other methods
  // but they would follow the same pattern
  
  return model;
};

/**
 * Initialize database monitoring for all models
 */
const initDbMonitoring = () => {
  // Wrap all existing models
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    mongoose.models[modelName] = wrapModel(model);
    
    logger.info(`Initialized monitoring for ${modelName} model`);
  }
  
  // Add a hook to automatically wrap new models
  const originalModel = mongoose.model.bind(mongoose);
  mongoose.model = function(...args) {
    const model = originalModel(...args);
    return wrapModel(model);
  };
};

/**
 * Generate MongoDB statistics for metrics collection
 * @returns {Promise<Object>} MongoDB statistics
 */
const collectMongoDBStats = async () => {
  try {
    const stats = {};
    
    // Get overall database stats
    const dbStats = await mongoose.connection.db.stats();
    stats.collections = dbStats.collections;
    stats.documents = dbStats.objects;
    stats.dataSize = dbStats.dataSize;
    stats.storageSize = dbStats.storageSize;
    stats.indexes = dbStats.indexes;
    stats.indexSize = dbStats.indexSize;
    
    // Get collection-specific stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    stats.collectionStats = {};
    
    for (const collection of collections) {
      const collStats = await mongoose.connection.db.collection(collection.name).stats();
      stats.collectionStats[collection.name] = {
        count: collStats.count,
        size: collStats.size,
        avgObjectSize: collStats.avgObjSize,
        storageSize: collStats.storageSize,
        indexSizes: collStats.indexSizes
      };
    }
    
    // Get connection stats
    const serverStatus = await mongoose.connection.db.admin().serverStatus();
    stats.connections = serverStatus.connections;
    stats.activeConnections = serverStatus.connections.active;
    stats.availableConnections = serverStatus.connections.available;
    
    return stats;
  } catch (error) {
    logger.error(`Error collecting MongoDB stats: ${error.message}`, { error });
    return { error: error.message };
  }
};

module.exports = {
  wrapModel,
  initDbMonitoring,
  collectMongoDBStats
}; 