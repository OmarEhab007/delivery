const express = require('express');
const router = express.Router();
const { authenticateToken, restrictTo } = require('../middleware/authMiddleware');
const { runHealthChecks, checkDatabaseConnection, checkStorage, checkSystemResources } = require('../utils/healthCheck');
const logger = require('../utils/logger');
const { cacheControl } = require('../middleware/cacheControlMiddleware');

/**
 * @route   GET /health
 * @desc    Basic health check endpoint (public)
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    // Set cache headers directly with a higher value to confirm it's our headers
    res.setHeader('Cache-Control', 'public, max-age=120');
    console.log('Health endpoint setting Cache-Control: public, max-age=120');
    
    // Simple health check that returns basic system status
    res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      cache: true // Adding this to confirm we're hitting our new code
    });
  } catch (error) {
    logger.error(`Basic health check failed: ${error.message}`, { error });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /health/debug
 * @desc    Debug endpoint to check current user info
 * @access  Authenticated
 */
router.get('/debug', authenticateToken, (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    message: 'If you can see this, you are authenticated',
    roleMatches: {
      matchesAdmin: req.user.role === 'Admin',
      matchesLowercase: req.user.role === 'admin',
      actualRole: req.user.role
    }
  });
});

/**
 * @route   GET /health/system
 * @desc    System resources health check
 * @access  Admin only
 */
router.get('/system', authenticateToken, restrictTo('Admin'), async (req, res) => {
  try {
    const systemHealth = checkSystemResources();
    
    const statusCode = systemHealth.status === 'healthy' ? 200 :
                       systemHealth.status === 'critical' ? 503 : 500;
    
    res.status(statusCode).json(systemHealth);
  } catch (error) {
    logger.error(`System health check failed: ${error.message}`, { error });
    res.status(500).json({
      status: 'error',
      message: 'System health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /health/storage
 * @desc    Storage health check
 * @access  Admin only
 */
router.get('/storage', authenticateToken, restrictTo('Admin'), async (req, res) => {
  try {
    const storageHealth = await checkStorage();
    
    const statusCode = storageHealth.status === 'healthy' ? 200 :
                       storageHealth.status === 'critical' ? 503 : 500;
    
    res.status(statusCode).json(storageHealth);
  } catch (error) {
    logger.error(`Storage health check failed: ${error.message}`, { error });
    res.status(500).json({
      status: 'error',
      message: 'Storage health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /health/database
 * @desc    Database health check
 * @access  Admin only
 */
router.get('/database', authenticateToken, restrictTo('Admin'), async (req, res) => {
  try {
    const dbHealth = await checkDatabaseConnection();
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    logger.error(`Database health check failed: ${error.message}`, { error });
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /health/comprehensive
 * @desc    Comprehensive health check with all components
 * @access  Admin only
 */
router.get('/comprehensive', authenticateToken, restrictTo('Admin'), async (req, res) => {
  try {
    // Define external APIs to check if configured
    const apiEndpoints = [];
    
    // Add configured external APIs if available
    if (process.env.EXTERNAL_API_ENDPOINTS) {
      try {
        const configuredEndpoints = JSON.parse(process.env.EXTERNAL_API_ENDPOINTS);
        if (Array.isArray(configuredEndpoints)) {
          apiEndpoints.push(...configuredEndpoints);
        }
      } catch (err) {
        logger.warn(`Failed to parse EXTERNAL_API_ENDPOINTS: ${err.message}`);
      }
    }
    
    // Run all health checks
    const healthStatus = await runHealthChecks({
      includeSystem: true,
      includeStorage: true,
      includeDatabase: true,
      includeApis: true,
      apiEndpoints
    });
    
    // Determine proper HTTP status code based on health status
    const statusCode = healthStatus.status === 'healthy' ? 200 :
                       healthStatus.status === 'degraded' ? 200 :
                       healthStatus.status === 'critical' ? 503 : 500;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error(`Comprehensive health check failed: ${error.message}`, { error });
    res.status(500).json({
      status: 'error',
      message: 'Comprehensive health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /health/cache-test
 * @desc    Test endpoint for caching
 * @access  Public
 */
router.get('/cache-test', (req, res) => {
  try {
    // Set cache headers explicitly
    res.set({
      'Cache-Control': 'public, max-age=300',
      'X-Cache-Test': 'true'
    });
    
    console.log('Cache test endpoint - setting Cache-Control: public, max-age=300');
    
    // Return a simple response
    res.status(200).json({
      status: 'ok',
      message: 'Cache test endpoint',
      timestamp: new Date().toISOString(),
      cacheEnabled: true
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router; 