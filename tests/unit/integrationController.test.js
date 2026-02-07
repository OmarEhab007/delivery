jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/IntegrationCredential', () => ({
  IntegrationCredential: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../../src/models/WebhookSubscription', () => ({
  WebhookSubscription: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
  ShipmentStatus: {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
  },
  ShipmentApprovalState: {
    PENDING: 'PENDING',
  },
}));

jest.mock('../../src/services/integration/apiKeyService', () => ({
  generateApiKey: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { IntegrationCredential } = require('../../src/models/IntegrationCredential');
const { WebhookSubscription } = require('../../src/models/WebhookSubscription');
const { Shipment } = require('../../src/models/Shipment');
const { generateApiKey } = require('../../src/services/integration/apiKeyService');
const controller = require('../../src/controllers/integration/integrationController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  sort: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('integrationController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    generateApiKey.mockReturnValue({
      rawKey: 'raw',
      apiKeyHash: 'hash',
      apiKeyPrefix: 'pref',
    });
  });

  it('rejects credential creation without name', async () => {
    const next = jest.fn();

    await controller.createCredential(
      { body: {}, user: { id: 'u1', role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('creates credential with sanitized scopes', async () => {
    IntegrationCredential.create.mockResolvedValue({
      _id: 'c1',
      name: 'Cred',
      scopes: ['shipments:read'],
      apiKeyPrefix: 'pref',
      active: true,
      createdAt: new Date(),
    });
    const res = makeRes();

    await controller.createCredential(
      { body: { name: 'Cred', scopes: ['shipments:read', 'bad'] }, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );

    expect(IntegrationCredential.create).toHaveBeenCalledWith(
      expect.objectContaining({ scopes: ['shipments:read'] })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates credential for admin merchantId and omits empty scopes', async () => {
    IntegrationCredential.create.mockResolvedValue({
      _id: 'c1',
      name: 'Cred',
      scopes: undefined,
      apiKeyPrefix: 'pref',
      active: true,
      createdAt: new Date(),
    });
    const res = makeRes();

    await controller.createCredential(
      { body: { name: 'Cred', scopes: ['bad'], merchantId: 'm1' }, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );

    expect(IntegrationCredential.create).toHaveBeenCalledWith(
      expect.objectContaining({ merchantId: 'm1', scopes: undefined })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('lists credentials for admin query', async () => {
    IntegrationCredential.find.mockReturnValue(makeQuery([{ id: 'c1' }]));
    const res = makeRes();

    await controller.listCredentials(
      { query: { merchantId: 'm1' }, user: { role: 'Admin', id: 'admin' } },
      res,
      jest.fn()
    );

    expect(IntegrationCredential.find).toHaveBeenCalledWith({ merchantId: 'm1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('lists credentials for merchant', async () => {
    IntegrationCredential.find.mockReturnValue(makeQuery([{ id: 'c1' }]));
    const res = makeRes();

    await controller.listCredentials(
      { query: {}, user: { role: 'Merchant', id: 'm1' } },
      res,
      jest.fn()
    );

    expect(IntegrationCredential.find).toHaveBeenCalledWith({ merchantId: 'm1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects webhook creation with validation errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.createWebhook(
      { body: {}, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates webhook without eventTypes array', async () => {
    WebhookSubscription.create.mockResolvedValue({
      _id: 'w1',
      endpointUrl: 'https://example.com',
      eventTypes: undefined,
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    const res = makeRes();

    await controller.createWebhook(
      {
        body: { endpointUrl: 'https://example.com', eventTypes: 'bad' },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      jest.fn()
    );

    expect(WebhookSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventTypes: undefined })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('lists webhooks for admin query', async () => {
    WebhookSubscription.find.mockReturnValue(makeQuery([{ id: 'w1' }]));
    const res = makeRes();

    await controller.listWebhooks(
      { query: { merchantId: 'm1' }, user: { role: 'Admin', id: 'admin' } },
      res,
      jest.fn()
    );

    expect(WebhookSubscription.find).toHaveBeenCalledWith({ merchantId: 'm1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects integration shipment creation with validation errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.createShipmentViaIntegration(
      { body: {}, headers: {}, integration: { id: 'c1', merchantId: 'm1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns duplicate shipment when idempotency key matches', async () => {
    Shipment.findOne.mockResolvedValue({ id: 's1' });
    const res = makeRes();

    await controller.createShipmentViaIntegration(
      { body: {}, headers: { 'x-idempotency-key': 'key1' }, integration: { id: 'c1', merchantId: 'm1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.duplicate).toBe(true);
  });

  it('creates shipment with default pricing type and integration reference', async () => {
    Shipment.findOne.mockResolvedValue(null);
    Shipment.create.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await controller.createShipmentViaIntegration(
      {
        body: { origin: 'A', destination: 'B' },
        headers: { 'x-external-reference': 'ref1' },
        integration: { id: 'c1', merchantId: 'm1' },
      },
      res,
      jest.fn()
    );

    expect(Shipment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pricingType: 'BIDDING',
        integrationReference: expect.objectContaining({ referenceId: 'ref1' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects shipment status when not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getShipmentStatusViaIntegration(
      { params: { id: 's1' }, integration: { merchantId: 'm1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects shipment status when merchant mismatch', async () => {
    Shipment.findById.mockResolvedValue({
      merchantId: { toString: () => 'other' },
    });
    const next = jest.fn();

    await controller.getShipmentStatusViaIntegration(
      { params: { id: 's1' }, integration: { merchantId: 'm1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns shipment status for authorized merchant', async () => {
    Shipment.findById.mockResolvedValue({
      _id: 's1',
      status: 'REQUESTED',
      approval: {},
      origin: 'A',
      destination: 'B',
      updatedAt: new Date(),
      estimatedPickupDate: null,
      estimatedDeliveryDate: null,
      merchantId: { toString: () => 'm1' },
    });
    const res = makeRes();

    await controller.getShipmentStatusViaIntegration(
      { params: { id: 's1' }, integration: { merchantId: 'm1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
