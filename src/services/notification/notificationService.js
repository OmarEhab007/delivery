/**
 * Notification Service
 * Handles sending notifications through different channels (WhatsApp, etc.)
 */
const { sendWhatsAppMessage, sendTemplateMessage } = require('../../utils/sendWhatsApp');
const logger = require('../../utils/logger');

// Event types
const EventTypes = {
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  APPLICATION_APPROVED: 'APPLICATION_APPROVED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  SHIPMENT_STATUS_UPDATED: 'SHIPMENT_STATUS_UPDATED',
  SHIPMENT_DELIVERED: 'SHIPMENT_DELIVERED',
  PAYMENT_UPLOADED: 'PAYMENT_UPLOADED',
  FIXED_PRICE_SHIPMENT_AVAILABLE: 'FIXED_PRICE_SHIPMENT_AVAILABLE',
  FIXED_PRICE_SHIPMENT_ACCEPTED: 'FIXED_PRICE_SHIPMENT_ACCEPTED',
  ASSIGNED_TO_SHIPMENT: 'ASSIGNED_TO_SHIPMENT',
  SHIPMENT_DELAY_ALERT: 'SHIPMENT_DELAY_ALERT',
  SHIPMENT_MISSING_UPDATE: 'SHIPMENT_MISSING_UPDATE',
};

/**
 * Send a notification based on an event
 * @param {string} eventType - Type of event that triggered the notification
 * @param {Object} data - Data related to the event
 * @param {Object} recipients - Recipients information with phone numbers
 * @returns {Promise<Array>} - Array of notification results
 */
const sendNotification = async (eventType, data, recipients) => {
  try {
    const results = [];

    // Process each recipient
    for (const recipient of Object.values(recipients)) {
      if (!recipient.phone) {
        logger.warn(`No phone number for recipient: ${recipient.name || 'Unknown'}`);
        continue;
      }

      // Create the notification content based on event type
      const content = createNotificationContent(eventType, data, recipient);

      // Skip if no content was generated
      if (!content) continue;

      // Send WhatsApp message
      const result = await sendWhatsAppMessage(recipient.phone, content.message, content.mediaUrls);

      results.push(result);
    }

    return results;
  } catch (error) {
    logger.error(`Error sending notification for ${eventType}: ${error.message}`);
    throw error;
  }
};

/**
 * Create content for a notification based on event type
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 * @param {Object} recipient - Recipient information
 * @returns {Object|null} - Notification content or null if not applicable
 */
const createNotificationContent = (eventType, data, recipient) => {
  switch (eventType) {
    case EventTypes.SHIPMENT_CREATED:
      return {
        message: `New shipment available from ${data.origin.address} to ${data.destination.address}. Cargo: ${data.cargoDetails.description}. Check the app for more details!`,
        mediaUrls: [],
      };

    case EventTypes.APPLICATION_SUBMITTED:
      return {
        message: `New application received for your shipment #${data.shipmentId}. Truck Owner: ${data.ownerName}, Truck: ${data.truckDetails}. Check the app to review!`,
        mediaUrls: [],
      };

    case EventTypes.APPLICATION_APPROVED:
      return {
        message: `Congratulations! Your application for shipment #${data.shipmentId} has been approved. Origin: ${data.origin}, Destination: ${data.destination}. Please prepare for pickup.`,
        mediaUrls: [],
      };

    case EventTypes.APPLICATION_REJECTED:
      return {
        message: `Your application for shipment #${data.shipmentId} was not selected this time. Reason: ${data.reason || 'Another truck was chosen'}. Please check the app for other available shipments.`,
        mediaUrls: [],
      };

    case EventTypes.SHIPMENT_STATUS_UPDATED:
      return {
        message: `Shipment #${data.shipmentId} status updated to: ${data.status}. ${data.notes || ''}`,
        mediaUrls: data.documentUrls || [],
      };

    case EventTypes.SHIPMENT_DELIVERED:
      return {
        message: `Shipment #${data.shipmentId} has been delivered to ${data.destination}. Please check the app to confirm delivery.`,
        mediaUrls: data.documentUrls || [],
      };

    case EventTypes.PAYMENT_UPLOADED:
      return {
        message: `Payment receipt uploaded for shipment #${data.shipmentId}. The shipment is now confirmed.`,
        mediaUrls: [data.receiptUrl],
      };

    case EventTypes.FIXED_PRICE_SHIPMENT_AVAILABLE:
      return {
        message: `New FIXED-PRICE shipment available! Route: ${data.origin} to ${data.destination}. Price: ${data.currency} ${data.price}. Cargo: ${data.cargo}. First-come-first-served - Accept now in the app!`,
        mediaUrls: [],
      };

    case EventTypes.FIXED_PRICE_SHIPMENT_ACCEPTED:
      return {
        message: `Your fixed-price shipment #${data.shipmentId} has been accepted by ${data.truckOwnerName}. Truck: ${data.truckDetails}, Driver: ${data.driverName}. Price: ${data.currency} ${data.price}`,
        mediaUrls: [],
      };

    case EventTypes.ASSIGNED_TO_SHIPMENT:
      return {
        message: `You have been assigned to shipment #${data.shipmentId}. Route: ${data.origin} to ${data.destination}. Cargo: ${data.cargo}. Please prepare for pickup.`,
        mediaUrls: [],
      };
    case EventTypes.SHIPMENT_DELAY_ALERT:
      return {
        message: `Shipment #${data.shipmentId} is delayed beyond the expected delivery date. Current status: ${data.status}. Please review and take action.`,
        mediaUrls: [],
      };
    case EventTypes.SHIPMENT_MISSING_UPDATE:
      return {
        message: `Shipment #${data.shipmentId} has not received an update within the expected window. Current status: ${data.status}. Please check the latest tracking information.`,
        mediaUrls: [],
      };

    default:
      logger.warn(`Unknown event type: ${eventType}`);
      return null;
  }
};

/**
 * Notify a truck owner about a new shipment
 * @param {Object} shipment - Shipment details
 * @param {Object} truckOwner - Truck owner details
 * @returns {Promise<Object>} - Notification result
 */
const notifyNewShipment = async (shipment, truckOwner) => {
  return sendNotification(EventTypes.SHIPMENT_CREATED, shipment, { truckOwner });
};

/**
 * Notify a merchant about a new application
 * @param {Object} application - Application details
 * @param {Object} merchant - Merchant details
 * @param {Object} truckOwner - Truck owner details
 * @param {Object} truckDetails - Truck details
 * @returns {Promise<Object>} - Notification result
 */
const notifyNewApplication = async (application, merchant, truckOwner, truckDetails) => {
  const data = {
    shipmentId: application.shipmentId,
    ownerName: truckOwner.name,
    truckDetails: `${truckDetails.model} (${truckDetails.plateNumber})`,
  };

  return sendNotification(EventTypes.APPLICATION_SUBMITTED, data, { merchant });
};

/**
 * Notify about application approval
 * @param {Object} application - Application details
 * @param {Object} shipment - Shipment details
 * @param {Object} truckOwner - Truck owner details
 * @param {Object} driver - Driver details
 * @returns {Promise<Array>} - Notification results
 */
const notifyApplicationApproved = async (application, shipment, truckOwner, driver) => {
  const data = {
    shipmentId: shipment._id,
    origin: shipment.origin.address,
    destination: shipment.destination.address,
    pickupDate: shipment.estimatedPickupDate,
  };

  return sendNotification(EventTypes.APPLICATION_APPROVED, data, { truckOwner, driver });
};

module.exports = {
  EventTypes,
  sendNotification,
  notifyNewShipment,
  notifyNewApplication,
  notifyApplicationApproved,
};
