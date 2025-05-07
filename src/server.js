const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const initializeAdminUser = require('./utils/initAdmin');
const documentService = require('./services/documentService');
const ensureLogDirectory = require('./utils/ensureLogDir');
const { requestLogger } = require('./middleware/loggingMiddleware');
const { apiLimiter, authLimiter, sensitiveOpLimiter } = require('./middleware/rateLimiters');
const { compressionWithLogging } = require('./middleware/compressionMiddleware');
const { cacheControl, noCache, staticCache } = require('./middleware/cacheControlMiddleware');
const { csrfProtection, handleCSRFError, addCSRFHeaders } = require('./middleware/csrfProtection');
const { configureSecurityHeaders, handleCSPReports } = require('./middleware/securityHeaders');
// Import Swagger configuration
const { swaggerServe, swaggerSetup } = require('./config/swagger');

// Import monitoring utilities
const metrics = require('./utils/metrics');
const tracer = require('./utils/tracer');
const dbMonitor = require('./utils/dbMonitor');
const { errorHandlerMiddleware } = require('./utils/errorTracker');
const metricScheduler = require('./utils/metricScheduler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const truckRoutes = require('./routes/truckRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const documentRoutes = require('./routes/documentRoutes');
const truckOwnerRoutes = require('./routes/truckOwnerRoutes');
const healthRoutes = require('./routes/healthRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const swaggerRoutes = require('./routes/swaggerRoutes');
// Add other route imports as they are developed

// For debugging
const { Document, DocumentType } = require('./models/Document');
const { Shipment } = require('./models/Shipment');
const { Application } = require('./models/Application');
const Truck = require('./models/Truck');
const User = require('./models/User');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Ensure logs directory exists before starting
if (process.env.NODE_ENV !== 'test') {
  ensureLogDirectory()
    .then(() => {
      logger.info('Log directory verified and ready');
      // Create Morgan access log stream
      const accessLogStream = fs.createWriteStream(
        path.join(process.cwd(), 'logs', 'access.log'),
        { flags: 'a' }
      );
      
      // Set up Morgan with the log stream
      app.use(morgan('combined', { stream: accessLogStream }));
      
      // Connect to MongoDB and initialize
      return connectDB();
    })
    .then(async () => {
      // Initialize admin user
      await initializeAdminUser();
      
      // Initialize document storage directory
      await documentService.initializeStorage();
      
      // Initialize database monitoring
      await dbMonitor.initDbMonitoring();
      
      // Initialize metric schedulers
      metricScheduler.initMetricSchedulers();
      
      logger.info('Application startup complete with monitoring enabled');
    })
    .catch(err => {
      console.error('Startup error:', err);
      logger.error(`Startup error: ${err.message}`, { error: err });
    });
}

// Configure security headers with enhanced CSP
const securityHeadersMiddleware = configureSecurityHeaders({
  logHeaders: process.env.NODE_ENV === 'development',
  cspDirectives: {
    // Customize CSP directives here if needed, or use defaults from the middleware
  }
});

// Middleware
app.use(securityHeadersMiddleware);
app.use(cors());

// Compression middleware with logging
app.use(compressionWithLogging({
  level: process.env.COMPRESSION_LEVEL ? parseInt(process.env.COMPRESSION_LEVEL) : 6,
  threshold: process.env.COMPRESSION_THRESHOLD ? parseInt(process.env.COMPRESSION_THRESHOLD) : 0
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'delivery-app-secret'));

// Add CSRF-related security headers to all responses
app.use(addCSRFHeaders);

// Apply metrics middleware
app.use(metrics.metricsMiddleware);

// Apply tracing middleware
app.use(tracer.tracingMiddleware());

// Apply rate limiting to all requests
app.use(apiLimiter);

// Development logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply request logging middleware
app.use(requestLogger);

// CSRF error handler
app.use(handleCSRFError);

// CSP violation reporting endpoint
app.post('/api/csp-report', express.json({
  type: 'application/csp-report'
}), handleCSPReports());

// Comment out these lines to disable auth rate limiting during development
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// API Routes with specific rate limits
app.use('/api/users/reset-password', sensitiveOpLimiter);
app.use('/api/users/change-password', sensitiveOpLimiter);

// Cache control for static assets
app.use('/uploads', staticCache());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Make sure helmet doesn't override our cache headers
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'cache-control') {
      // Log that we're setting a cache-control header
      console.log(`Setting Cache-Control: ${value} for ${req.path}`);
    }
    return originalSetHeader.call(this, name, value);
  };
  next();
});

// Cache control for specific API routes
app.use('/api/shipments', cacheControl('short')); // Short cache for shipments (may change frequently)
app.use('/api/trucks', cacheControl('medium')); // Medium cache for trucks
app.use('/api/users', cacheControl('medium')); // Medium cache for user lists

// No cache for authentication and sensitive operations
app.use('/api/auth', noCache());
app.use('/api/admin', noCache());
app.use('/api/driver/current-location', noCache()); // Real-time data shouldn't be cached

// Special route for CSRF token generation - this needs to be accessible
app.get('/api/auth/csrf-token', csrfProtection, (req, res, next) => {
  // Add CSRF token to response header
  res.set('X-CSRF-Token', req.csrfToken());
  // Pass to the actual controller
  next();
});

// Direct test endpoint for CSRF token
app.get('/api/test-csrf', csrfProtection, (req, res) => {
  res.set('X-CSRF-Token', req.csrfToken());
  res.status(200).json({
    success: true,
    message: 'CSRF token generated successfully'
  });
});

// Routes that require CSRF protection
// Note: GET requests are safe and don't need CSRF protection
const csrfProtectedPaths = [
  '/api/users/profile',
  '/api/users/:id',
  '/api/shipments',
  '/api/shipments/:id',
  '/api/applications',
  '/api/applications/:id',
  '/api/trucks',
  '/api/trucks/:id',
  '/api/auth/change-password',
  '/api/documents'
];

// Apply CSRF protection to routes that modify data
csrfProtectedPaths.forEach(path => {
  app.all(path, csrfProtection);
});

// Add Swagger documentation route
app.use('/api-docs', swaggerServe, swaggerSetup);
// Add Swagger specification export route
app.use('/api-docs-json', swaggerRoutes);

// General API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/truck-owner', truckOwnerRoutes);
// Add metrics routes
app.use('/api/metrics', metricsRoutes);
// Add other routes as they are developed

// Health check routes
app.use('/health', healthRoutes);

// Debug route - no auth required
app.get('/debug-models', (req, res) => {
  const models = {
    Document: typeof Document !== 'undefined',
    Shipment: typeof Shipment !== 'undefined',
    Application: typeof Application !== 'undefined',
    Truck: typeof Truck !== 'undefined',
    User: typeof User !== 'undefined'
  };
  
  const methods = {
    Document: typeof Document?.findById === 'function',
    Shipment: typeof Shipment?.findById === 'function',
    Application: typeof Application?.findById === 'function',
    Truck: typeof Truck?.findById === 'function',
    User: typeof User?.findById === 'function'
  };
  
  res.status(200).json({
    success: true,
    models,
    methods
  });
});

// Socket.io setup for real-time tracking
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  
  // Add socket event handlers here as they are developed
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Use the enhanced error tracking middleware
app.use(errorHandlerMiddleware());

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl || req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Start the server (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  // Read port from environment variables with fallbacks
  const PORT = process.env.PORT || process.env.API_PORT || 5001;
  
  // Check if port is already in use before starting
  const http = require('http');
  const testServer = http.createServer();
  
  testServer.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please use a different port.`);
      console.error(`❌ Error: Port ${PORT} is already in use. Please use a different port or stop the process using it.`);
      process.exit(1);
    } else {
      logger.error(`Error checking port availability: ${err.message}`, { error: err });
      console.error(`❌ Error checking port availability: ${err.message}`);
    }
  });
  
  testServer.once('listening', () => {
    // Port is available, close test server and start actual server
    testServer.close(() => {
      httpServer.listen(PORT, () => {
        logger.info(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log(`📊 Metrics available at: http://localhost:${PORT}/api/metrics`);
      }).on('error', (err) => {
        logger.error(`Error starting server: ${err.message}`, { error: err });
        console.error(`❌ Error starting server: ${err.message}`);
      });
    });
  });
  
  // Test if port is available
  testServer.listen(PORT);
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, { error: err });
    console.error(`❌ Unhandled Promise Rejection: ${err.message}`);
    // Don't exit the process automatically, just log the error
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { error: err });
    console.error(`❌ Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    // Give the process time to log the error before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

module.exports = { app, httpServer };
