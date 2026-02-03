const { AutomationRule } = require('../../models/AutomationRule');
const User = require('../../models/User');
const { sendNotification, EventTypes } = require('../notification/notificationService');
const logger = require('../../utils/logger');

const HOURS_TO_MS = 60 * 60 * 1000;
const SUPPORTED_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED']);

const shouldThrottle = (rule, shipmentId) => {
  if (!rule.lastTriggeredAt || !rule.lastTriggeredShipmentId) return false;
  if (rule.lastTriggeredShipmentId.toString() !== shipmentId.toString()) return false;

  const hoursSince = (Date.now() - rule.lastTriggeredAt.getTime()) / HOURS_TO_MS;
  return hoursSince < 1;
};

const notifyRule = async (rule, shipment, message, eventType) => {
  const merchant = await User.findById(shipment.merchantId);
  if (!merchant) {
    return;
  }

  const recipients = { merchant };

  if (rule.action === 'escalate') {
    const admins = await User.find({ role: 'Admin', active: true });
    admins.forEach((admin, index) => {
      recipients[`admin_${index}`] = admin;
    });
  }

  await sendNotification(eventType, message, recipients);
};

const evaluateDelayRule = async (rule, shipment) => {
  if (!shipment.estimatedDeliveryDate || SUPPORTED_STATUSES.has(shipment.status)) {
    return false;
  }

  const thresholdMs = rule.threshold * HOURS_TO_MS;
  const isDelayed = Date.now() - shipment.estimatedDeliveryDate.getTime() > thresholdMs;

  if (!isDelayed) {
    return false;
  }

  if (shouldThrottle(rule, shipment._id)) {
    return false;
  }

  await notifyRule(
    rule,
    shipment,
    {
      shipmentId: shipment._id,
      status: shipment.status,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    },
    EventTypes.SHIPMENT_DELAY_ALERT
  );

  rule.lastTriggeredAt = new Date();
  rule.lastTriggeredShipmentId = shipment._id;
  await rule.save();

  return true;
};

const evaluateMissingUpdateRule = async (rule, shipment) => {
  const lastUpdate = shipment.currentLocation?.timestamp || shipment.updatedAt;
  if (!lastUpdate || SUPPORTED_STATUSES.has(shipment.status)) {
    return false;
  }

  const thresholdMs = rule.threshold * HOURS_TO_MS;
  const isMissingUpdate = Date.now() - lastUpdate.getTime() > thresholdMs;

  if (!isMissingUpdate) {
    return false;
  }

  if (shouldThrottle(rule, shipment._id)) {
    return false;
  }

  await notifyRule(
    rule,
    shipment,
    {
      shipmentId: shipment._id,
      status: shipment.status,
      lastUpdate,
    },
    EventTypes.SHIPMENT_MISSING_UPDATE
  );

  rule.lastTriggeredAt = new Date();
  rule.lastTriggeredShipmentId = shipment._id;
  await rule.save();

  return true;
};

const evaluateAutomationRules = async (shipment, context = {}) => {
  if (!shipment?.merchantId) return;

  const rules = await AutomationRule.find({ merchantId: shipment.merchantId, active: true });

  if (!rules.length) return;

  await Promise.all(
    rules.map(async (rule) => {
      try {
        if (rule.triggerType === 'delay') {
          await evaluateDelayRule(rule, shipment);
        }
        if (rule.triggerType === 'missing-update') {
          await evaluateMissingUpdateRule(rule, shipment);
        }
      } catch (error) {
        logger.warn(`Automation rule evaluation failed: ${error.message}`);
      }
    })
  );
};

module.exports = {
  evaluateAutomationRules,
};
