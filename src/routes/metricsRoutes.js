const express = require('express');
const { authenticateToken, restrictTo } = require('../middleware/authMiddleware');
const metrics = require('../utils/metrics');
const errorTracker = require('../utils/errorTracker');
const dbMonitor = require('../utils/dbMonitor');
const logger = require('../utils/logger');
const { Shipment } = require('../models/Shipment');
const Truck = require('../models/Truck');

const router = express.Router();

// Wrapper for async route handlers to catch and forward errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /metrics
 * @desc    Get Prometheus metrics
 * @access  Admin only
 */
router.get(
  '/',
  authenticateToken,
  restrictTo('Admin'),
  asyncHandler(async (req, res) => {
    // Set the content type for Prometheus
    res.set('Content-Type', metrics.register.contentType);

    // Return the metrics
    const metricsOutput = await metrics.register.metrics();
    res.end(metricsOutput);
  })
);

/**
 * @route   GET /metrics/open
 * @desc    Get Prometheus metrics without authentication (for Prometheus scraping)
 * @access  Public
 */
router.get(
  '/open',
  asyncHandler(async (req, res) => {
    // Set the content type for Prometheus
    res.set('Content-Type', metrics.register.contentType);

    // Return the metrics
    const metricsOutput = await metrics.register.metrics();
    res.end(metricsOutput);
  })
);

/**
 * @route   GET /metrics/demo-data
 * @desc    Generate demo metrics data for testing dashboards
 * @access  Public
 */
router.get(
  '/demo-data',
  asyncHandler(async (req, res) => {
    try {
      // Generate HTTP metrics
      const routes = ['/api/shipments', '/api/trucks', '/api/users', '/api/auth/login', '/api/tracking'];
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const statusCodes = ['200', '201', '400', '401', '404', '500'];
      
      // Generate HTTP request counts
      for (let i = 0; i < 50; i++) {
        const route = routes[Math.floor(Math.random() * routes.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
        
        metrics.httpRequestCounter.inc({
          method,
          route,
          status_code: statusCode,
        });
        
        // Add some duration data
        const end = metrics.httpRequestDurationMicroseconds.startTimer();
        // Random duration between 0.01 and 2 seconds
        setTimeout(() => {
          end({
            method,
            route,
            status_code: statusCode,
          });
        }, Math.random() * 50);
      }
      
      // Generate database operation metrics
      const collections = ['shipments', 'trucks', 'users', 'tracking', 'documents'];
      const operations = ['find', 'findOne', 'insertOne', 'updateOne', 'deleteOne', 'aggregate'];
      
      for (let i = 0; i < 50; i++) {
        const collection = collections[Math.floor(Math.random() * collections.length)];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        metrics.databaseOperationsCounter.inc({
          operation,
          collection,
        });
        
        // Add some duration data
        const dbEnd = metrics.databaseOperationDuration.startTimer();
        // Random duration between 0.001 and 0.5 seconds
        setTimeout(() => {
          dbEnd({
            operation,
            collection,
          });
        }, Math.random() * 20);
      }
      
      // Set active connections
      metrics.activeConnections.set(Math.floor(Math.random() * 100));
      
      // Update shipment status metrics
      const shipmentStatuses = ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed'];
      const shipmentCounts = {};
      
      shipmentStatuses.forEach(status => {
        const count = Math.floor(Math.random() * 50) + 5;
        shipmentCounts[status] = count;
        metrics.shipmentStatusGauge.set({ status }, count);
      });
      
      // Update truck status metrics
      const truckStatuses = ['active', 'maintenance', 'breakdown', 'loading', 'unloading', 'idle'];
      const truckCounts = {};
      
      truckStatuses.forEach(status => {
        const count = Math.floor(Math.random() * 30) + 2;
        truckCounts[status] = count;
        metrics.truckStatusGauge.set({ status }, count);
      });
      
      // Set job queue size
      const queueNames = ['email', 'notification', 'tracking_update', 'document_processing'];
      queueNames.forEach(queue => {
        metrics.jobQueueSizeGauge.set({ queue_name: queue }, Math.floor(Math.random() * 20));
      });
      
      // Add some error metrics
      const errorTypes = ['validation', 'authentication', 'database', 'external_api', 'internal'];
      for (let i = 0; i < 15; i++) {
        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        const route = routes[Math.floor(Math.random() * routes.length)];
        
        metrics.errorCounter.inc({
          type: errorType,
          route,
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Demo metrics data generated successfully',
        shipmentCounts,
        truckCounts,
      });
    } catch (error) {
      logger.error(`Error generating demo metrics: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        error: 'Error generating demo metrics',
      });
    }
  })
);

/**
 * @route   GET /metrics/status-counts
 * @desc    Update status counts in metrics
 * @access  Admin only
 */
router.get(
  '/status-counts',
  authenticateToken,
  restrictTo('Admin'),
  asyncHandler(async (req, res) => {
    // Get shipment status counts
    const shipmentPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const shipmentStatusCounts = await Shipment.aggregate(shipmentPipeline);
    const shipmentCounts = {};

    shipmentStatusCounts.forEach((item) => {
      shipmentCounts[item._id || 'unknown'] = item.count;
    });

    // Get truck status counts
    const truckPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const truckStatusCounts = await Truck.aggregate(truckPipeline);
    const truckCounts = {};

    truckStatusCounts.forEach((item) => {
      truckCounts[item._id || 'unknown'] = item.count;
    });

    // Update metrics
    metrics.updateShipmentStatusMetrics(shipmentCounts);
    metrics.updateTruckStatusMetrics(truckCounts);

    res.status(200).json({
      success: true,
      shipmentCounts,
      truckCounts,
    });
  })
);

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
      ...errorStats,
    });
  } catch (error) {
    logger.error(`Error getting error stats: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Error retrieving error statistics',
    });
  }
});

/**
 * @route   GET /metrics/database
 * @desc    Get database metrics
 * @access  Admin only
 */
router.get(
  '/database',
  authenticateToken,
  restrictTo('Admin'),
  asyncHandler(async (req, res) => {
    const dbStats = await dbMonitor.collectMongoDBStats();

    res.status(200).json({
      success: true,
      stats: dbStats,
    });
  })
);

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
        error: 'Invalid log level. Must be one of: error, warn, info, debug, silly',
      });
    }

    // This assumes your logger supports changing level at runtime
    // You might need to modify this based on your logger implementation
    const previousLevel = logger.level;
    logger.level = level;

    logger.info(
      `Log level changed from ${previousLevel} to ${level} by ${req.user.email || req.user.id || 'unknown'}`
    );

    res.status(200).json({
      success: true,
      message: `Log level changed to ${level}`,
      previousLevel,
      currentLevel: level,
    });
  } catch (error) {
    logger.error(`Error changing log level: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Error changing log level',
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
    const isMetricsOk =
      metrics && metrics.register && typeof metrics.register.metrics === 'function';
    const isErrorTrackerOk = errorTracker && typeof errorTracker.getErrorStats === 'function';
    const isDbMonitorDefined = typeof dbMonitor !== 'undefined';

    res.status(200).json({
      success: true,
      health: {
        metrics: isMetricsOk ? 'OK' : 'ERROR',
        errorTracker: isErrorTrackerOk ? 'OK' : 'ERROR',
        dbMonitor: isDbMonitorDefined ? 'OK' : 'ERROR',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error checking metrics health: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Error checking metrics health',
    });
  }
});

module.exports = router;
