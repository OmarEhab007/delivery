/**
 * Tracking Service
 * Handles real-time location tracking for shipments
 */
const { Shipment } = require('../../models/Shipment');
const logger = require('../../utils/logger');

/**
 * Initialize Socket.io tracking
 * @param {Object} io - Socket.io server instance
 */
const initializeTracking = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const { token } = socket.handshake.auth;
    // JWT verification logic would go here
    // For now, we're just ensuring a token exists
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // Could decode token and attach user data to socket
    // socket.user = decodedUser;
    next();
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle driver location updates
    socket.on('driver:location', async (data) => {
      try {
        const { shipmentId, location } = data;

        // Validate data
        if (!shipmentId || !location || !location.lat || !location.lng) {
          logger.warn(`Invalid location data: ${JSON.stringify(data)}`);
          return;
        }

        // Update location in database
        await updateShipmentLocation(shipmentId, location);

        // Broadcast to room for this shipment
        io.to(`shipment:${shipmentId}`).emit('shipment:location', {
          shipmentId,
          location: {
            ...location,
            timestamp: new Date(),
          },
        });

        logger.debug(`Location updated for shipment ${shipmentId}: ${JSON.stringify(location)}`);
      } catch (error) {
        logger.error(`Error processing location update: ${error.message}`);
      }
    });

    // Join a shipment tracking room
    socket.on('join:shipment', (shipmentId) => {
      // Here we would verify the user has access to this shipment
      socket.join(`shipment:${shipmentId}`);
      logger.info(`Socket ${socket.id} joined room for shipment ${shipmentId}`);
    });

    // Leave a shipment tracking room
    socket.on('leave:shipment', (shipmentId) => {
      socket.leave(`shipment:${shipmentId}`);
      logger.info(`Socket ${socket.id} left room for shipment ${shipmentId}`);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Tracking service initialized');
};

/**
 * Update a shipment's current location
 * @param {string} shipmentId - Shipment ID
 * @param {Object} location - Location data with lat, lng
 * @returns {Promise<Object>} - Updated shipment
 */
const updateShipmentLocation = async (shipmentId, location) => {
  try {
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    // Update the current location
    shipment.currentLocation = {
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date(),
      address: location.address, // Optional
    };

    await shipment.save();

    return shipment;
  } catch (error) {
    logger.error(`Error updating shipment location: ${error.message}`);
    throw error;
  }
};

/**
 * Get the current location of a shipment
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Object>} - Location data
 */
const getShipmentLocation = async (shipmentId) => {
  try {
    const shipment = await Shipment.findById(shipmentId, 'currentLocation');

    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    return shipment.currentLocation;
  } catch (error) {
    logger.error(`Error retrieving shipment location: ${error.message}`);
    throw error;
  }
};

/**
 * Store a location point in shipment's history
 * @param {string} shipmentId - Shipment ID
 * @param {Object} location - Location data
 * @param {string} status - Associated status (optional)
 * @returns {Promise<Object>} - Updated shipment
 */
const recordLocationHistory = async (shipmentId, location, status = null) => {
  try {
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    // Create a timeline entry with location
    const timelineEntry = {
      status: status || shipment.status,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      },
    };

    // Add to timeline
    await shipment.addTimelineEntry(timelineEntry);

    return shipment;
  } catch (error) {
    logger.error(`Error recording location history: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate estimated time of arrival
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Date>} - Estimated arrival time
 *
 * Note: This is a placeholder. In a real implementation,
 * this would use a mapping service API to calculate ETA.
 */
const calculateETA = async (shipmentId) => {
  try {
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    // This is a simplistic placeholder calculation
    // In production, you would use a mapping service API
    const now = new Date();
    const estimatedHours = 24; // Default to 24 hours

    const eta = new Date(now.getTime() + estimatedHours * 60 * 60 * 1000);

    return eta;
  } catch (error) {
    logger.error(`Error calculating ETA: ${error.message}`);
    throw error;
  }
};

/**
 * Check if a location is within a geofence
 * @param {Object} location - Location with lat, lng
 * @param {Object} geofence - Geofence definition
 * @returns {boolean} - Whether location is within geofence
 */
const isWithinGeofence = (location, geofence) => {
  // Basic circular geofence implementation
  // In production, you would use more sophisticated geofencing
  const { centerLat, centerLng, radiusKm } = geofence;

  // Calculate distance using Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = toRadians(centerLat - location.lat);
  const dLng = toRadians(centerLng - location.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(location.lat)) *
      Math.cos(toRadians(centerLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};

// Helper function for geofence calculations
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

module.exports = {
  initializeTracking,
  updateShipmentLocation,
  getShipmentLocation,
  recordLocationHistory,
  calculateETA,
  isWithinGeofence,
};
