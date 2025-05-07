const logger = require('./logger');
const metrics = require('./metrics');
const dbMonitor = require('./dbMonitor');
const { Shipment } = require('../models/Shipment');
const Truck = require('../models/Truck');

/**
 * Update shipment status metrics
 */
const updateShipmentStatusMetrics = async () => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];
    
    const statusCounts = await Shipment.aggregate(pipeline);
    const formattedCounts = {};
    
    statusCounts.forEach(item => {
      formattedCounts[item._id] = item.count;
    });
    
    metrics.updateShipmentStatusMetrics(formattedCounts);
    
    logger.debug('Updated shipment status metrics', {
      counts: formattedCounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error updating shipment status metrics: ${error.message}`, { error });
  }
};

/**
 * Update truck status metrics
 */
const updateTruckStatusMetrics = async () => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];
    
    const statusCounts = await Truck.aggregate(pipeline);
    const formattedCounts = {};
    
    statusCounts.forEach(item => {
      formattedCounts[item._id] = item.count;
    });
    
    metrics.updateTruckStatusMetrics(formattedCounts);
    
    logger.debug('Updated truck status metrics', {
      counts: formattedCounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error updating truck status metrics: ${error.message}`, { error });
  }
};

/**
 * Update MongoDB stats in metrics
 */
const updateDbMetrics = async () => {
  try {
    await dbMonitor.collectMongoDBStats();
    logger.debug('Updated database metrics', {
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error updating database metrics: ${error.message}`, { error });
  }
};

/**
 * Initialize metric collection schedules
 */
const initMetricSchedulers = () => {
  // Update status counts every 5 minutes
  setInterval(updateShipmentStatusMetrics, 5 * 60 * 1000);
  setInterval(updateTruckStatusMetrics, 5 * 60 * 1000);
  
  // Update DB metrics every 15 minutes
  setInterval(updateDbMetrics, 15 * 60 * 1000);
  
  // Initial collection
  setTimeout(() => {
    logger.info('Starting initial metrics collection');
    
    updateShipmentStatusMetrics()
      .then(() => updateTruckStatusMetrics())
      .then(() => updateDbMetrics())
      .then(() => {
        logger.info('Initial metrics collection complete');
      })
      .catch(error => {
        logger.error(`Error during initial metrics collection: ${error.message}`, { error });
      });
  }, 5000); // Wait 5 seconds after startup
  
  logger.info('Metric schedulers initialized');
};

module.exports = {
  initMetricSchedulers,
  updateShipmentStatusMetrics,
  updateTruckStatusMetrics,
  updateDbMetrics
}; 