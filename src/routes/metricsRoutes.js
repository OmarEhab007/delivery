const express = require('express');
const router = express.Router();
const { authenticateToken, restrictTo } = require('../middleware/authMiddleware');
const metrics = require('../utils/metrics');
const errorTracker = require('../utils/errorTracker');
const dbMonitor = require('../utils/dbMonitor');
const logger = require('../utils/logger');
const { Shipment } = require('../models/Shipment');
const Truck = require('../models/Truck');

// Wrapper for async route handlers to catch and forward errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /metrics
 * @desc    Get Prometheus metrics
 * @access  Admin only
 */
router.get('/', authenticateToken, restrictTo('Admin'), asyncHandler(async (req, res) => {
  // Set the content type for Prometheus
  res.set('Content-Type', metrics.register.contentType);
  
  // Return the metrics
  const metricsOutput = await metrics.register.metrics();
  res.end(metricsOutput);
}));

/**
 * @route   GET /metrics/status-counts
 * @desc    Update status counts in metrics
 * @access  Admin only
 */
router.get('/status-counts', authenticateToken, restrictTo('Admin'), asyncHandler(async (req, res) => {
  // Get shipment status counts
  const shipmentPipeline = [
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  const shipmentStatusCounts = await Shipment.aggregate(shipmentPipeline);
  const shipmentCounts = {};
  
  shipmentStatusCounts.forEach(item => {
    shipmentCounts[item._id || 'unknown'] = item.count;
  });
  
  // Get truck status counts
  const truckPipeline = [
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  const truckStatusCounts = await Truck.aggregate(truckPipeline);
  const truckCounts = {};
  
  truckStatusCounts.forEach(item => {
    truckCounts[item._id || 'unknown'] = item.count;
  });
  
  // Update metrics
  metrics.updateShipmentStatusMetrics(shipmentCounts);
  metrics.updateTruckStatusMetrics(truckCounts);
  
  res.status(200).json({
    success: true,
    shipmentCounts,
    truckCounts
  });
}));

/**
 * @route   GET /metrics/errors
 * @desc    Get error statistics
 * @access  Admin only
 */
router.get('/errors', authenticateToken, restrictTo('Admin'), (req, res) => {
  try {
    const errorStats = errorTracker.getErrorStats();
    
    res.status(200).json({
      success: true,
      ...errorStats
    });
  } catch (error) {
    logger.error(`Error getting error stats: ${error.message}`, { error });
    res.status(500).json({ 
      success: false,
      error: 'Error retrieving error statistics' 
    });
  }
});

/**
 * @route   GET /metrics/database
 * @desc    Get database metrics
 * @access  Admin only
 */
router.get('/database', authenticateToken, restrictTo('Admin'), asyncHandler(async (req, res) => {
  const dbStats = await dbMonitor.collectMongoDBStats();
  
  res.status(200).json({
    success: true,
    stats: dbStats
  });
}));

/**
 * @route   POST /metrics/log-level
 * @desc    Update log level at runtime
 * @access  Admin only
 */
router.post('/log-level', authenticateToken, restrictTo('Admin'), (req, res) => {
  try {
    const { level } = req.body;
    
    if (!level || !['error', 'warn', 'info', 'debug', 'silly'].includes(level)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid log level. Must be one of: error, warn, info, debug, silly' 
      });
    }
    
    // This assumes your logger supports changing level at runtime
    // You might need to modify this based on your logger implementation
    const previousLevel = logger.level;
    logger.level = level;
    
    logger.info(`Log level changed from ${previousLevel} to ${level} by ${req.user.email || req.user.id || 'unknown'}`);
    
    res.status(200).json({
      success: true,
      message: `Log level changed to ${level}`,
      previousLevel,
      currentLevel: level
    });
  } catch (error) {
    logger.error(`Error changing log level: ${error.message}`, { error });
    res.status(500).json({ 
      success: false,
      error: 'Error changing log level' 
    });
  }
});

/**
 * @route   GET /metrics/health
 * @desc    Get health status of the metrics system
 * @access  Admin only
 */
router.get('/health', authenticateToken, restrictTo('Admin'), (req, res) => {
  try {
    // Simple test to ensure metrics components are working
    const isMetricsOk = metrics && metrics.register && typeof metrics.register.metrics === 'function';
    const isErrorTrackerOk = errorTracker && typeof errorTracker.getErrorStats === 'function';
    const isDbMonitorDefined = typeof dbMonitor !== 'undefined';
    
    res.status(200).json({
      success: true,
      health: {
        metrics: isMetricsOk ? 'OK' : 'ERROR',
        errorTracker: isErrorTrackerOk ? 'OK' : 'ERROR',
        dbMonitor: isDbMonitorDefined ? 'OK' : 'ERROR'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error checking metrics health: ${error.message}`, { error });
    res.status(500).json({ 
      success: false,
      error: 'Error checking metrics health'
    });
  }
});

module.exports = router; 