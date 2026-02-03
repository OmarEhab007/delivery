const promClient = require('prom-client');

const logger = require('./logger');

// Initialize the Prometheus registry
const register = new promClient.Registry();

// Clear registry to avoid duplicate metric registration errors (especially in test environments)
register.clear();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Note: Event loop lag monitoring is provided by prom-client default metrics:
// - nodejs_eventloop_lag_seconds (summary with quantiles)
// - nodejs_eventloop_lag_p50_seconds, nodejs_eventloop_lag_p90_seconds, nodejs_eventloop_lag_p99_seconds
// - nodejs_eventloop_lag_min_seconds, nodejs_eventloop_lag_max_seconds, etc.

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

// MongoDB connection pool metrics
const mongoConnectionsGauge = new promClient.Gauge({
  name: 'mongodb_connections_current',
  help: 'Current MongoDB connection pool status',
  labelNames: ['state'],
});

// Slow query counter
const mongoSlowQueryCounter = new promClient.Counter({
  name: 'mongodb_query_slow_total',
  help: 'Count of slow queries (>100ms)',
  labelNames: ['collection'],
});

// Business metrics - Applications
const applicationsByStatusGauge = new promClient.Gauge({
  name: 'applications_by_status',
  help: 'Number of applications/bids by status',
  labelNames: ['status'],
});

// Business metrics - Users
const usersTotalGauge = new promClient.Gauge({
  name: 'users_total',
  help: 'Total users by role',
  labelNames: ['role'],
});

// Business metrics - Shipments created counter
const shipmentsCreatedCounter = new promClient.Counter({
  name: 'shipments_created_total',
  help: 'Total shipments created (running count)',
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
register.registerMetric(mongoConnectionsGauge);
register.registerMetric(mongoSlowQueryCounter);
register.registerMetric(applicationsByStatusGauge);
register.registerMetric(usersTotalGauge);
register.registerMetric(shipmentsCreatedCounter);

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
 * Update MongoDB connection pool metrics
 * @param {Object} poolStats - Connection pool statistics
 * @param {number} poolStats.total - Total connections in pool
 * @param {number} poolStats.available - Available connections
 * @param {number} poolStats.inUse - Connections currently in use
 */
const updateMongoConnectionMetrics = (poolStats) => {
  try {
    if (poolStats) {
      mongoConnectionsGauge.set({ state: 'total' }, poolStats.total || 0);
      mongoConnectionsGauge.set({ state: 'available' }, poolStats.available || 0);
      mongoConnectionsGauge.set({ state: 'in_use' }, poolStats.inUse || 0);
    }
  } catch (error) {
    console.error(`Failed to update MongoDB connection metrics: ${error.message}`);
  }
};

/**
 * Record a slow query
 * @param {string} collection - Collection name
 */
const recordSlowQuery = (collection) => {
  try {
    mongoSlowQueryCounter.inc({ collection });
  } catch (error) {
    console.error(`Failed to record slow query metric: ${error.message}`);
  }
};

/**
 * Update application status metrics
 * @param {Object} statusCounts - Object with status as keys and counts as values
 */
const updateApplicationStatusMetrics = (statusCounts) => {
  try {
    Object.entries(statusCounts).forEach(([status, count]) => {
      applicationsByStatusGauge.set({ status }, count);
    });
  } catch (error) {
    console.error(`Failed to update application status metrics: ${error.message}`);
  }
};

/**
 * Update user count metrics
 * @param {Object} roleCounts - Object with role as keys and counts as values
 */
const updateUserMetrics = (roleCounts) => {
  try {
    Object.entries(roleCounts).forEach(([role, count]) => {
      usersTotalGauge.set({ role }, count);
    });
  } catch (error) {
    console.error(`Failed to update user metrics: ${error.message}`);
  }
};

/**
 * Increment shipments created counter
 */
const incrementShipmentsCreated = () => {
  try {
    shipmentsCreatedCounter.inc();
  } catch (error) {
    console.error(`Failed to increment shipments created: ${error.message}`);
  }
};

/**
 * Normalize route path to replace dynamic segments with placeholders
 * Prevents high cardinality from unique IDs in metrics labels
 * @param {string} path - The request path
 * @returns {string} - Normalized path with :param placeholders
 */
const normalizeRoute = (path) => {
  if (!path) return 'unknown';

  // Replace MongoDB ObjectIDs (24 hex chars)
  let normalized = path.replace(/\/[a-f0-9]{24}/gi, '/:id');

  // Replace UUIDs
  normalized = normalized.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );

  // Replace numeric IDs
  normalized = normalized.replace(/\/\d+/g, '/:id');

  // Remove query strings
  normalized = normalized.split('?')[0];

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '') || '/';

  return normalized;
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

    // Collect response metrics when the response is finished
    res.on('finish', () => {
      try {
        // Get normalized route - prefer Express route pattern, fallback to normalized path
        const route = req.route?.path
          ? req.baseUrl + req.route.path
          : normalizeRoute(req.path);

        // Record metrics
        const duration = end({
          method: req.method,
          route,
          status_code: res.statusCode.toString(),
        });

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
  updateMongoConnectionMetrics,
  recordSlowQuery,
  updateApplicationStatusMetrics,
  updateUserMetrics,
  incrementShipmentsCreated,
  // Export the metric objects for direct use
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  databaseOperationsCounter,
  databaseOperationDuration,
  activeConnections,
  shipmentStatusGauge,
  trucksStatusGauge,
  jobQueueSizeGauge,
  errorCounter,
  mongoConnectionsGauge,
  mongoSlowQueryCounter,
  applicationsByStatusGauge,
  usersTotalGauge,
  shipmentsCreatedCounter,
};
