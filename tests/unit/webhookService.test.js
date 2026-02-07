const { EventEmitter } = require('events');

jest.mock('http', () => ({
  request: jest.fn(),
}));

jest.mock('https', () => ({
  request: jest.fn(),
}));

jest.mock('../../src/models/WebhookSubscription', () => ({
  WebhookSubscription: {
    find: jest.fn(),
  },
}));

jest.mock('../../src/models/WebhookDelivery', () => ({
  WebhookDelivery: function WebhookDelivery(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  },
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const http = require('http');
const { WebhookSubscription } = require('../../src/models/WebhookSubscription');
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
    return req;
  });
};

const makeRequestFailure = () => {
  http.request.mockImplementation((options, cb) => {
    const res = new EventEmitter();
    res.statusCode = 500;
    process.nextTick(() => {
      cb(res);
      res.emit('data', Buffer.from(''));
      res.emit('end');
    });

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn();
    return req;
  });
};

describe('webhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers webhook successfully', async () => {
    makeRequestSuccess();

    const subscription = {
      _id: 'sub1',
      secret: 'secret',
      endpointUrl: 'http://example.com/webhook',
      failureCount: 0,
      save: jest.fn().mockResolvedValue(),
    };

    const delivery = await webhookService.deliverWebhook(subscription, 'shipment.status.updated', {
      id: 's1',
    });

    expect(delivery.status).toBe('SUCCESS');
    expect(subscription.save).toHaveBeenCalled();
  });

  it('records failure when webhook request errors', async () => {
    http.request.mockImplementation(() => {
      const req = new EventEmitter();
      req.write = jest.fn();
      req.end = jest.fn();
      process.nextTick(() => req.emit('error', new Error('fail')));
      return req;
    });

    const subscription = {
      _id: 'sub1',
      secret: 'secret',
      endpointUrl: 'http://example.com/webhook',
      failureCount: 0,
      save: jest.fn().mockResolvedValue(),
    };

    await expect(
      webhookService.deliverWebhook(subscription, 'shipment.status.updated', { id: 's1' })
    ).rejects.toThrow('fail');

    expect(subscription.save).toHaveBeenCalled();
  });

  it('emits shipment status event only for active subscriptions', async () => {
    WebhookSubscription.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    await webhookService.emitShipmentStatusEvent({ shipment: { merchantId: 'm1' } });

    expect(WebhookSubscription.find).toHaveBeenCalled();
  });

  it('ignores emit when shipment missing merchantId', async () => {
    await webhookService.emitShipmentStatusEvent({ shipment: {} });

    expect(WebhookSubscription.find).not.toHaveBeenCalled();
  });

  it('logs warning when delivery fails', async () => {
    http.request.mockImplementation(() => {
      const req = new EventEmitter();
      req.write = jest.fn();
      req.end = jest.fn();
      process.nextTick(() => req.emit('error', new Error('fail')));
      return req;
    });
    WebhookSubscription.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        {
          _id: 'sub1',
          secret: 'secret',
          endpointUrl: 'http://example.com/webhook',
          status: 'ACTIVE',
          eventTypes: ['shipment.status.updated'],
          failureCount: 0,
          save: jest.fn().mockResolvedValue(),
        },
      ]),
    });

    await webhookService.emitShipmentStatusEvent({
      shipment: { _id: 's1', merchantId: 'm1', status: 'IN_TRANSIT' },
      previousStatus: 'REQUESTED',
    });

    expect(logger.warn).toHaveBeenCalled();
  });
});
