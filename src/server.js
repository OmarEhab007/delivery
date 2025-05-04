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

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const truckRoutes = require('./routes/truckRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Add other route imports as they are developed

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Connect to MongoDB and initialize admin (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Commented out admin initialization for now
    await initializeAdminUser();
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
// Add other routes as they are developed

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
