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
  PAYMENT_UPLOADED: 'PAYMENT_UPLOADED'
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
      const result = await sendWhatsAppMessage(
        recipient.phone,
        content.message,
        content.mediaUrls
      );
      
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
        mediaUrls: []
      };
      
    case EventTypes.APPLICATION_SUBMITTED:
      return {
        message: `New application received for your shipment #${data.shipmentId}. Truck Owner: ${data.ownerName}, Truck: ${data.truckDetails}. Check the app to review!`,
        mediaUrls: []
      };
      
    case EventTypes.APPLICATION_APPROVED:
      return {
        message: `Congratulations! Your application for shipment #${data.shipmentId} has been approved. Origin: ${data.origin}, Destination: ${data.destination}. Please prepare for pickup.`,
        mediaUrls: []
      };
      
    case EventTypes.APPLICATION_REJECTED:
      return {
        message: `Your application for shipment #${data.shipmentId} was not selected this time. Reason: ${data.reason || 'Another truck was chosen'}. Please check the app for other available shipments.`,
        mediaUrls: []
      };
      
    case EventTypes.SHIPMENT_STATUS_UPDATED:
      return {
        message: `Shipment #${data.shipmentId} status updated to: ${data.status}. ${data.notes || ''}`,
        mediaUrls: data.documentUrls || []
      };
      
    case EventTypes.SHIPMENT_DELIVERED:
      return {
        message: `Shipment #${data.shipmentId} has been delivered to ${data.destination}. Please check the app to confirm delivery.`,
        mediaUrls: data.documentUrls || []
      };
      
    case EventTypes.PAYMENT_UPLOADED:
      return {
        message: `Payment receipt uploaded for shipment #${data.shipmentId}. The shipment is now confirmed.`,
        mediaUrls: [data.receiptUrl]
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
  return sendNotification(
    EventTypes.SHIPMENT_CREATED,
    shipment,
    { truckOwner }
  );
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
    truckDetails: `${truckDetails.model} (${truckDetails.plateNumber})`
  };
  
  return sendNotification(
    EventTypes.APPLICATION_SUBMITTED,
    data,
    { merchant }
  );
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
    pickupDate: shipment.estimatedPickupDate
  };
  
  return sendNotification(
    EventTypes.APPLICATION_APPROVED,
    data,
    { truckOwner, driver }
  );
};

module.exports = {
  EventTypes,
  sendNotification,
  notifyNewShipment,
  notifyNewApplication,
  notifyApplicationApproved
};
