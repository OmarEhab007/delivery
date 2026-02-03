const http = require('http');
const https = require('https');
const crypto = require('crypto');

const { WebhookSubscription } = require('../../models/WebhookSubscription');
const { WebhookDelivery } = require('../../models/WebhookDelivery');
const logger = require('../../utils/logger');

const WEBHOOK_TIMEOUT_MS = 5000;
const WEBHOOK_EVENT_STATUS_UPDATED = 'shipment.status.updated';

const signPayload = (secret, payload, timestamp) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${payload}`);
  return hmac.digest('hex');
};

const postJson = (endpointUrl, payload, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpointUrl);
    const data = JSON.stringify(payload);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
      timeout: WEBHOOK_TIMEOUT_MS,
    };

    const req = client.request(options, (res) => {
      res.on('data', () => undefined);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Webhook request timed out'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const deliverWebhook = async (subscription, eventType, payload) => {
  const payloadBody = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const signature = signPayload(subscription.secret, payloadBody, timestamp);

  const delivery = new WebhookDelivery({
    subscriptionId: subscription._id,
    eventType,
    payload,
    status: 'FAILED',
    attemptCount: 1,
  });

  const startTime = Date.now();

  try {
    const response = await postJson(subscription.endpointUrl, payload, {
      'X-Delivery-Event': eventType,
      'X-Delivery-Timestamp': timestamp,
      'X-Delivery-Signature': signature,
    });

    delivery.status = response.statusCode >= 200 && response.statusCode < 300 ? 'SUCCESS' : 'FAILED';
    delivery.responseCode = response.statusCode;
    delivery.durationMs = Date.now() - startTime;
    delivery.deliveredAt = new Date();

    await delivery.save();

    if (delivery.status === 'SUCCESS') {
      subscription.lastDeliveredAt = delivery.deliveredAt;
      subscription.failureCount = 0;
      subscription.lastFailureAt = undefined;
    } else {
      subscription.failureCount += 1;
      subscription.lastFailureAt = delivery.deliveredAt;
    }

    await subscription.save();

    return delivery;
  } catch (error) {
    delivery.status = 'FAILED';
    delivery.error = error.message;
    delivery.durationMs = Date.now() - startTime;
    delivery.deliveredAt = new Date();
    delivery.attemptCount = 1;

    await delivery.save();

    subscription.failureCount += 1;
    subscription.lastFailureAt = delivery.deliveredAt;
    await subscription.save();

    throw error;
  }
};

const emitShipmentStatusEvent = async ({ shipment, previousStatus }) => {
  if (!shipment?.merchantId) {
    return;
  }

  const subscriptions = await WebhookSubscription.find({
    merchantId: shipment.merchantId,
    status: 'ACTIVE',
    eventTypes: { $in: [WEBHOOK_EVENT_STATUS_UPDATED, '*'] },
  }).select('+secret');

  if (!subscriptions.length) {
    return;
  }

  const payload = {
    id: shipment._id,
    event: WEBHOOK_EVENT_STATUS_UPDATED,
    occurredAt: new Date().toISOString(),
    data: {
      shipmentId: shipment._id,
      status: shipment.status,
      previousStatus,
      origin: shipment.origin,
      destination: shipment.destination,
      updatedAt: shipment.updatedAt,
    },
  };

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await deliverWebhook(subscription, WEBHOOK_EVENT_STATUS_UPDATED, payload);
      } catch (error) {
        logger.warn(`Webhook delivery failed for ${subscription._id}: ${error.message}`);
      }
    })
  );
};

module.exports = {
  emitShipmentStatusEvent,
  deliverWebhook,
  WEBHOOK_EVENT_STATUS_UPDATED,
};
