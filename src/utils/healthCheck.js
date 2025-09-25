const mongoose = require('mongoose');

const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
const path = require('path');

const { checkMissingIndexes } = require('../config/database');
const connectDB = require('../config/database');

const logger = require('./logger');

// Get critical thresholds from environment variables or use defaults
const CRITICAL_DISK_PERCENT = parseInt(process.env.HEALTH_CHECK_CRITICAL_DISK_PERCENT || '95');
const CRITICAL_CPU_PERCENT = parseInt(process.env.HEALTH_CHECK_CRITICAL_CPU_PERCENT || '90');
const CRITICAL_MEMORY_PERCENT = parseInt(process.env.HEALTH_CHECK_CRITICAL_MEMORY_PERCENT || '90');

/**
 * Check MongoDB connection status
 * @returns {Promise<Object>} Connection status and details
 */
const checkDatabaseConnection = async () => {
  try {
    // Check if already connected
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      logger.warn('Database not connected, attempting to connect...');
      await connectDB();
    }

    // Get connection stats
    const dbStats = await mongoose.connection.db.stats();
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();

    // Check for slow queries
    const currentOp = await mongoose.connection.db
      .admin()
      .command({ currentOp: 1, secs_running: { $gt: 1 } });
    const slowQueries = currentOp.inprog.length;

    // Check for index issues
    const indexStatus = await checkMissingIndexes();

    return {
      status: 'healthy',
      connection: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        connectionState:
          ['disconnected', 'connected', 'connecting', 'disconnecting'][
            mongoose.connection.readyState
          ] || 'unknown',
      },
      statistics: {
        collections: dbStats.collections,
        documents: dbStats.objects,
        dataSize: `${(dbStats.dataSize / (1024 * 1024)).toFixed(2)} MB`,
        storageSize: `${(dbStats.storageSize / (1024 * 1024)).toFixed(2)} MB`,
        indexes: dbStats.indexes,
        indexSize: `${(dbStats.indexSize / (1024 * 1024)).toFixed(2)} MB`,
      },
      performance: {
        slowQueries,
        connections: serverStatus.connections,
        activeConnections: serverStatus.connections.active,
        availableConnections: serverStatus.connections.available,
      },
      indexStatus,
    };
  } catch (error) {
    logger.error(`Database health check error: ${error.message}`, { error });
    return {
      status: 'unhealthy',
      error: error.message,
      connection: {
        readyState: mongoose.connection.readyState,
        connectionState:
          ['disconnected', 'connected', 'connecting', 'disconnecting'][
            mongoose.connection.readyState
          ] || 'unknown',
      },
    };
  }
};

/**
 * Check file system status including storage space
 * @returns {Promise<Object>} Storage status and details
 */
const checkStorage = async () => {
  try {
    const rootDir = process.cwd();
    const uploadsDir = path.join(rootDir, 'uploads');
    const logsDir = path.join(rootDir, 'logs');

    // Check if uploads and logs directories exist
    const uploadsExists = fs.existsSync(uploadsDir);
    const logsExists = fs.existsSync(logsDir);

    // Get disk space info using df command for more accurate results
    let diskSpace;
    try {
      const { stdout } = await exec(`df -h ${rootDir}`);
      // Parse stdout to get filesystem data
      const lines = stdout.trim().split('\n');
      const headers = lines[0].split(/\s+/).filter(Boolean);
      const values = lines[1].split(/\s+/).filter(Boolean);

      diskSpace = headers.reduce((obj, header, i) => {
        obj[header.toLowerCase()] = values[i];
        return obj;
      }, {});
    } catch (err) {
      // Fallback to Node.js if df command fails
      logger.warn(`Could not execute df command: ${err.message}. Using Node.js fallback.`);

      const stats = fs.statfsSync(rootDir);
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedBytes = totalBytes - freeBytes;

      diskSpace = {
        filesystem: 'node-fallback',
        size: `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        used: `${(usedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        avail: `${(freeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
        'use%': `${Math.round((usedBytes / totalBytes) * 100)}%`,
        mounted: rootDir,
      };
    }

    // Calculate directory sizes
    const getDirectorySize = (dirPath) => {
      try {
        let size = 0;
        if (!fs.existsSync(dirPath)) return 0;

        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
          } else {
            size += stats.size;
          }
        }
        return size;
      } catch (err) {
        logger.error(`Error calculating directory size for ${dirPath}: ${err.message}`);
        return 0;
      }
    };

    const uploadsSizeBytes = uploadsExists ? getDirectorySize(uploadsDir) : 0;
    const logsSizeBytes = logsExists ? getDirectorySize(logsDir) : 0;

    // Check if there's a critical storage issue
    const percentFree = parseInt(diskSpace['use%'].replace('%', ''));
    const isCriticalStorage = percentFree > CRITICAL_DISK_PERCENT;

    return {
      status: isCriticalStorage ? 'critical' : 'healthy',
      diskSpace,
      directories: {
        uploads: {
          exists: uploadsExists,
          size: `${(uploadsSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        },
        logs: {
          exists: logsExists,
          size: `${(logsSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        },
      },
      warning: isCriticalStorage
        ? `Critical: More than ${CRITICAL_DISK_PERCENT}% disk space used`
        : null,
    };
  } catch (error) {
    logger.error(`Storage health check error: ${error.message}`, { error });
    return {
      status: 'error',
      error: error.message,
    };
  }
};

/**
 * Check system resources (CPU, memory, uptime)
 * @returns {Object} System resource status
 */
const checkSystemResources = () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Get CPU information
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuModel = cpus[0].model;

    // Calculate CPU load average
    const loadAvg = os.loadavg();
    const cpuLoad = loadAvg[0]; // 1 minute load average
    const cpuLoadPercent = Math.round((cpuLoad / cpuCount) * 100);

    // Calculate process memory usage
    const processMemoryUsage = process.memoryUsage();

    // Check if there's a critical resource issue
    const isCriticalCpu = cpuLoadPercent > CRITICAL_CPU_PERCENT;
    const isCriticalMemory = memoryUsagePercent > CRITICAL_MEMORY_PERCENT;

    return {
      status: isCriticalCpu || isCriticalMemory ? 'critical' : 'healthy',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: `${Math.floor(os.uptime() / 3600)} hours, ${Math.floor((os.uptime() % 3600) / 60)} minutes`,
      },
      cpu: {
        model: cpuModel,
        cores: cpuCount,
        loadAverage: loadAvg,
        loadPercent: `${cpuLoadPercent}%`,
        critical: isCriticalCpu,
        criticalThreshold: `${CRITICAL_CPU_PERCENT}%`,
      },
      memory: {
        total: `${Math.round((totalMemory / (1024 * 1024 * 1024)) * 100) / 100} GB`,
        free: `${Math.round((freeMemory / (1024 * 1024 * 1024)) * 100) / 100} GB`,
        used: `${Math.round((usedMemory / (1024 * 1024 * 1024)) * 100) / 100} GB`,
        usagePercent: `${memoryUsagePercent}%`,
        critical: isCriticalMemory,
        criticalThreshold: `${CRITICAL_MEMORY_PERCENT}%`,
      },
      process: {
        pid: process.pid,
        memoryUsage: {
          rss: `${Math.round(processMemoryUsage.rss / (1024 * 1024))} MB`,
          heapTotal: `${Math.round(processMemoryUsage.heapTotal / (1024 * 1024))} MB`,
          heapUsed: `${Math.round(processMemoryUsage.heapUsed / (1024 * 1024))} MB`,
          external: `${Math.round(processMemoryUsage.external / (1024 * 1024))} MB`,
        },
        uptime: `${Math.floor(process.uptime() / 3600)} hours, ${Math.floor((process.uptime() % 3600) / 60)} minutes`,
      },
    };
  } catch (error) {
    logger.error(`System resources health check error: ${error.message}`, { error });
    return {
      status: 'error',
      error: error.message,
    };
  }
};

/**
 * Check external API endpoints
 * @param {Array} endpoints - List of endpoints to check
 * @returns {Promise<Object>} External API status
 */
const checkExternalApis = async (endpoints = []) => {
  try {
    if (!endpoints || endpoints.length === 0) {
      return { status: 'skipped', message: 'No external APIs configured for health check' };
    }

    const results = {};
    let allHealthy = true;

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, {
          method: 'GET',
          timeout: endpoint.timeout || 5000,
          headers: endpoint.headers || {},
        });
        const responseTime = Date.now() - startTime;

        const isHealthy = response.ok && responseTime < (endpoint.maxResponseTime || 2000);

        results[endpoint.name] = {
          url: endpoint.url,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseCode: response.status,
          responseTime: `${responseTime}ms`,
          warning: !isHealthy
            ? `Response time exceeded threshold (${endpoint.maxResponseTime || 2000}ms) or non-200 status`
            : null,
        };

        if (!isHealthy) allHealthy = false;
      } catch (error) {
        results[endpoint.name] = {
          url: endpoint.url,
          status: 'error',
          error: error.message,
        };
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      endpoints: results,
    };
  } catch (error) {
    logger.error(`External API health check error: ${error.message}`, { error });
    return {
      status: 'error',
      error: error.message,
    };
  }
};

/**
 * Run all health checks
 * @param {Object} options - Health check options
 * @returns {Promise<Object>} Comprehensive health status
 */
const runHealthChecks = async (options = {}) => {
  const {
    includeSystem = true,
    includeStorage = true,
    includeDatabase = true,
    includeApis = true,
    apiEndpoints = [],
  } = options;

  try {
    const checks = {};
    let overallStatus = 'healthy';

    // Run system resources check
    if (includeSystem) {
      checks.system = checkSystemResources();
      if (checks.system.status === 'critical' || checks.system.status === 'error') {
        overallStatus = checks.system.status;
      }
    }

    // Run storage check
    if (includeStorage) {
      checks.storage = await checkStorage();
      if (checks.storage.status === 'critical' && overallStatus !== 'error') {
        overallStatus = 'critical';
      } else if (checks.storage.status === 'error') {
        overallStatus = 'error';
      }
    }

    // Run database check
    if (includeDatabase) {
      checks.database = await checkDatabaseConnection();
      if (checks.database.status === 'unhealthy') {
        overallStatus = 'error';
      }
    }

    // Run external API checks
    if (includeApis && apiEndpoints.length > 0) {
      checks.externalApis = await checkExternalApis(apiEndpoints);
      if (checks.externalApis.status === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      } else if (checks.externalApis.status === 'error' && overallStatus !== 'error') {
        overallStatus = 'error';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      checks,
    };
  } catch (error) {
    logger.error(`Health check error: ${error.message}`, { error });
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

module.exports = {
  runHealthChecks,
  checkDatabaseConnection,
  checkStorage,
  checkSystemResources,
  checkExternalApis,
};
