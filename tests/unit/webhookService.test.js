const { EventEmitter } = require('events');
const mongoose = require('mongoose');

jest.mock('http', () => ({
  request: jest.fn(),
}));

jest.mock('https', () => ({
  request: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const http = require('http');
const { WebhookSubscription } = require('../../src/models/WebhookSubscription');
const { WebhookDelivery } = require('../../src/models/WebhookDelivery');
const logger = require('../../src/utils/logger');
const webhookService = require('../../src/services/integration/webhookService');

const makeRequestSuccess = () => {
  http.request.mockImplementation((options, cb) => {
    const res = new EventEmitter();
    res.statusCode = 200;
    process.nextTick(() => {
      cb(res);
      res.emit('data', Buffer.from(''));
      res.emit('end');
    });

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn();
    req.destroy = jest.fn();
    return req;
  });
};

const makeRequestFailure = () => {
  http.request.mockImplementation(() => {
    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn();
    req.destroy = jest.fn();
    process.nextTick(() => req.emit('error', new Error('fail')));
    return req;
  });
};

const createSubscription = async (overrides = {}) => {
  return WebhookSubscription.create({
    merchantId: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    endpointUrl: 'http://example.com/webhook',
    eventTypes: [webhookService.WEBHOOK_EVENT_STATUS_UPDATED],
    secret: 'secret',
    status: 'ACTIVE',
    ...overrides,
  });
};

describe('webhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers webhook successfully', async () => {
    makeRequestSuccess();
    const subscription = await createSubscription({ failureCount: 3 });

    const delivery = await webhookService.deliverWebhook(
      subscription,
      webhookService.WEBHOOK_EVENT_STATUS_UPDATED,
      {
        id: 's1',
      }
    );

    expect(delivery.status).toBe('SUCCESS');
    const persistedDelivery = await WebhookDelivery.findById(delivery._id);
    expect(persistedDelivery).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        responseCode: 200,
      })
    );

    const updatedSubscription = await WebhookSubscription.findById(subscription._id).select('+secret');
    expect(updatedSubscription.failureCount).toBe(0);
    expect(updatedSubscription.lastDeliveredAt).toBeInstanceOf(Date);
    expect(updatedSubscription.lastFailureAt).toBeFalsy();
  });

  it('records failure when webhook request errors', async () => {
    makeRequestFailure();
    const subscription = await createSubscription({ failureCount: 0 });

    await expect(
      webhookService.deliverWebhook(subscription, webhookService.WEBHOOK_EVENT_STATUS_UPDATED, {
        id: 's1',
      })
    ).rejects.toThrow('fail');

    const delivery = await WebhookDelivery.findOne({ subscriptionId: subscription._id });
    expect(delivery).toEqual(
      expect.objectContaining({
        status: 'FAILED',
        error: 'fail',
      })
    );

    const updatedSubscription = await WebhookSubscription.findById(subscription._id).select('+secret');
    expect(updatedSubscription.failureCount).toBe(1);
    expect(updatedSubscription.lastFailureAt).toBeInstanceOf(Date);
  });

  it('emits shipment status event only for active subscriptions', async () => {
    makeRequestSuccess();
    const merchantId = new mongoose.Types.ObjectId();

    const active = await createSubscription({
      merchantId,
      eventTypes: [webhookService.WEBHOOK_EVENT_STATUS_UPDATED],
      status: 'ACTIVE',
    });
    const paused = await createSubscription({
      merchantId,
      eventTypes: [webhookService.WEBHOOK_EVENT_STATUS_UPDATED],
      status: 'PAUSED',
    });

    await webhookService.emitShipmentStatusEvent({
      shipment: {
        _id: new mongoose.Types.ObjectId(),
        merchantId,
        status: 'IN_TRANSIT',
      },
    });

    expect(await WebhookDelivery.countDocuments({ subscriptionId: active._id })).toBe(1);
    expect(await WebhookDelivery.countDocuments({ subscriptionId: paused._id })).toBe(0);
  });

  it('ignores emit when shipment missing merchantId', async () => {
    makeRequestSuccess();

    await webhookService.emitShipmentStatusEvent({ shipment: {} });

    expect(await WebhookDelivery.countDocuments()).toBe(0);
  });

  it('logs warning when delivery fails', async () => {
    makeRequestFailure();
    const merchantId = new mongoose.Types.ObjectId();
    const subscription = await createSubscription({ merchantId });

    await webhookService.emitShipmentStatusEvent({
      shipment: { _id: new mongoose.Types.ObjectId(), merchantId, status: 'IN_TRANSIT' },
      previousStatus: 'REQUESTED',
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`Webhook delivery failed for ${subscription._id}: fail`)
    );
    const delivery = await WebhookDelivery.findOne({ subscriptionId: subscription._id });
    expect(delivery.status).toBe('FAILED');
  });
});
