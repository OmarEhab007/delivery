jest.mock('../../src/models/IntegrationCredential', () => ({
  IntegrationCredential: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/services/integration/apiKeyService', () => ({
  hashApiKey: jest.fn(),
}));

const { IntegrationCredential } = require('../../src/models/IntegrationCredential');
const { hashApiKey } = require('../../src/services/integration/apiKeyService');
const { authenticateIntegration, requireIntegrationScope } = require('../../src/middleware/integrationAuth');

const makeRes = () => ({});

describe('integrationAuth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hashApiKey.mockImplementation((key) => `hash-${key}`);
  });

  it('rejects when api key is missing', async () => {
    const next = jest.fn();
    await authenticateIntegration({ headers: {} }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('uses x-api-key header when provided', async () => {
    const credential = {
      _id: 'cred1',
      merchantId: 'm1',
      scopes: ['orders:read'],
      name: 'Test',
      save: jest.fn(),
    };
    IntegrationCredential.findOne.mockResolvedValue(credential);

    const req = { headers: { 'x-api-key': '  api-key  ' } };
    const next = jest.fn();

    await authenticateIntegration(req, makeRes(), next);

    expect(IntegrationCredential.findOne).toHaveBeenCalledWith({
      apiKeyHash: 'hash-api-key',
      active: true,
    });
    expect(req.integration).toEqual({
      id: 'cred1',
      merchantId: 'm1',
      scopes: ['orders:read'],
      name: 'Test',
    });
    expect(next).toHaveBeenCalled();
  });

  it('accepts ApiKey authorization header', async () => {
    const credential = {
      _id: 'cred2',
      merchantId: 'm2',
      scopes: [],
      name: 'Key',
      save: jest.fn(),
    };
    IntegrationCredential.findOne.mockResolvedValue(credential);

    const req = { headers: { authorization: 'ApiKey token-1' } };
    await authenticateIntegration(req, makeRes(), jest.fn());

    expect(IntegrationCredential.findOne).toHaveBeenCalled();
  });

  it('accepts Bearer authorization header', async () => {
    const credential = {
      _id: 'cred3',
      merchantId: 'm3',
      scopes: [],
      name: 'Bearer',
      save: jest.fn(),
    };
    IntegrationCredential.findOne.mockResolvedValue(credential);

    const req = { headers: { authorization: 'Bearer token-2' } };
    await authenticateIntegration(req, makeRes(), jest.fn());

    expect(IntegrationCredential.findOne).toHaveBeenCalled();
  });

  it('rejects invalid api key', async () => {
    IntegrationCredential.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await authenticateIntegration({ headers: { 'x-api-key': 'bad' } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('allows required integration scope', () => {
    const middleware = requireIntegrationScope('shipments:read');
    const next = jest.fn();

    middleware({ integration: { scopes: ['shipments:read'] } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('allows wildcard integration scope', () => {
    const middleware = requireIntegrationScope('shipments:read');
    const next = jest.fn();

    middleware({ integration: { scopes: ['*'] } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects missing integration scope', () => {
    const middleware = requireIntegrationScope('shipments:read');
    const next = jest.fn();

    middleware({ integration: { scopes: ['other'] } }, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
