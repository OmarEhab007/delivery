const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const initializeAdminUser = require('./utils/initAdmin');
const documentService = require('./services/documentService');

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

// Connect to MongoDB and initialize admin (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Commented out admin initialization for now
    await initializeAdminUser();
    
    // Initialize document storage directory
    await documentService.initializeStorage();
  }).catch(err => {
    logger.error(`Database connection error: ${err.message}`);
  });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/truck-owner', truckOwnerRoutes);
// Add other routes as they are developed

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
  });
}

module.exports = app;
