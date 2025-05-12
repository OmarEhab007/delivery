const os = require('os');

const promClient = require('prom-client');

const logger = require('./logger');

// Initialize the Prometheus registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const databaseOperationsCounter = new promClient.Counter({
  name: 'database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'collection'],
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const activeConnections = new promClient.Gauge({
  name: 'http_connections_active',
  help: 'Number of active HTTP connections',
});

const shipmentStatusGauge = new promClient.Gauge({
  name: 'shipments_by_status',
  help: 'Number of shipments by status',
  labelNames: ['status'],
});

const trucksStatusGauge = new promClient.Gauge({
  name: 'trucks_by_status',
  help: 'Number of trucks by status',
  labelNames: ['status'],
});

const jobQueueSizeGauge = new promClient.Gauge({
  name: 'job_queue_size',
  help: 'Number of jobs in processing queues',
  labelNames: ['queue_name'],
});

const errorCounter = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'route'],
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(databaseOperationsCounter);
register.registerMetric(databaseOperationDuration);
register.registerMetric(activeConnections);
register.registerMetric(shipmentStatusGauge);
register.registerMetric(trucksStatusGauge);
register.registerMetric(jobQueueSizeGauge);
register.registerMetric(errorCounter);

/**
 * Start timing a database operation
 * @param {string} operation - The operation being performed (find, update, etc.)
 * @param {string} collection - The collection being operated on
 * @returns {function} A function that stops the timer and records the duration
 */
const startDbTimer = (operation, collection) => {
  const endTimer = databaseOperationDuration.startTimer({
    operation,
    collection,
  });

  databaseOperationsCounter.inc({
    operation,
    collection,
  });

  return endTimer;
};

/**
 * Update shipment status metrics
 * @param {Object} statusCounts - Object with status as keys and counts as values
 */
const updateShipmentStatusMetrics = (statusCounts) => {
  Object.entries(statusCounts).forEach(([status, count]) => {
    shipmentStatusGauge.set({ status }, count);
  });
};

/**
 * Update truck status metrics
 * @param {Object} statusCounts - Object with status as keys and counts as values
 */
const updateTruckStatusMetrics = (statusCounts) => {
  Object.entries(statusCounts).forEach(([status, count]) => {
    trucksStatusGauge.set({ status }, count);
  });
};

/**
 * Update job queue size metric
 * @param {string} queueName - Name of the queue
 * @param {number} size - Number of jobs in the queue
 */
const updateJobQueueMetric = (queueName, size) => {
  jobQueueSizeGauge.set({ queue_name: queueName }, size);
};

/**
 * Record an error
 * @param {string} type - Error type
 * @param {string} route - Route where error occurred
 */
const recordError = (type, route = 'unknown') => {
  try {
    errorCounter.inc({ type, route });
  } catch (error) {
    // Log error but don't crash
    console.error(`Failed to record error metric: ${error.message}`);
  }
};

/**
 * Middleware to capture HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
  try {
    // Skip metrics route to avoid circular reporting
    if (req.path === '/metrics' || req.path.startsWith('/api/metrics')) {
      return next();
    }

    // Increment the connections gauge
    activeConnections.inc();

    // Create end timer function
    const end = httpRequestDurationMicroseconds.startTimer();

    // Record the path being called
    const route = req.route ? req.route.path : req.path;

    // Collect response metrics when the response is finished
    res.on('finish', () => {
      try {
        // Record metrics
        const duration = end();
        const statusCode = res.statusCode.toString();
        const { method } = req;

        httpRequestCounter.inc({
          method,
          route,
          status_code: statusCode,
        });

        // Decrement the connections gauge
        activeConnections.dec();

        // Log performance data for slow requests (over 1 second)
        if (duration > 1) {
          logger.performance(`Slow request: ${method} ${route}`, {
            method,
            route,
            statusCode,
            durationMs: duration * 1000,
            userAgent: req.headers['user-agent'],
          });
        }
      } catch (err) {
        // Log error but don't crash the response
        console.error(`Error recording metrics on response finish: ${err.message}`);
        logger.error(`Error recording metrics: ${err.message}`, { error: err });
      }
    });

    next();
  } catch (err) {
    // Log error but continue processing the request
    console.error(`Error in metrics middleware: ${err.message}`);
    logger.error(`Error in metrics middleware: ${err.message}`, { error: err });
    next();
  }
};

module.exports = {
  register,
  metricsMiddleware,
  startDbTimer,
  updateShipmentStatusMetrics,
  updateTruckStatusMetrics,
  updateJobQueueMetric,
  recordError,
  // Export the metric objects for direct use
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  databaseOperationsCounter,
  databaseOperationDuration,
  activeConnections,
  shipmentStatusGauge,
  trucksStatusGauge,
  jobQueueSizeGauge,
  errorCounter
};
