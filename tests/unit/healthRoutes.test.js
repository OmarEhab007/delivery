const express = require('express');
const request = require('supertest');

jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
  restrictTo: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../src/utils/healthCheck', () => ({
  runHealthChecks: jest.fn(),
  checkDatabaseConnection: jest.fn(),
  checkStorage: jest.fn(),
  checkSystemResources: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

const authMiddleware = require('../../src/middleware/authMiddleware');
const healthCheck = require('../../src/utils/healthCheck');
const logger = require('../../src/utils/logger');

describe('healthRoutes (unit)', () => {
  const originalEnv = { ...process.env };

  const buildApp = () => {
    const router = require('../../src/routes/healthRoutes');
    const app = express();
    app.use('/health', router);
    return { app, router };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    authMiddleware.authenticateToken.mockImplementation((req, res, next) => next());
    authMiddleware.restrictTo.mockImplementation(() => (req, res, next) => next());
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns basic health status', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.cache).toBe(true);
  });

  it('returns system status codes based on health', async () => {
    healthCheck.checkSystemResources.mockReturnValueOnce({ status: 'healthy' });
    let app = buildApp().app;
    expect((await request(app).get('/health/system')).status).toBe(200);

    healthCheck.checkSystemResources.mockReturnValueOnce({ status: 'critical' });
    app = buildApp().app;
    expect((await request(app).get('/health/system')).status).toBe(503);

    healthCheck.checkSystemResources.mockReturnValueOnce({ status: 'degraded' });
    app = buildApp().app;
    expect((await request(app).get('/health/system')).status).toBe(500);
  });

  it('returns storage status and handles errors', async () => {
    healthCheck.checkStorage.mockResolvedValueOnce({ status: 'critical' });
    let app = buildApp().app;
    expect((await request(app).get('/health/storage')).status).toBe(503);

    healthCheck.checkStorage.mockRejectedValueOnce(new Error('fail'));
    app = buildApp().app;
    expect((await request(app).get('/health/storage')).status).toBe(500);
  });

  it('returns database status codes', async () => {
    healthCheck.checkDatabaseConnection.mockResolvedValueOnce({ status: 'healthy' });
    let app = buildApp().app;
    expect((await request(app).get('/health/database')).status).toBe(200);

    healthCheck.checkDatabaseConnection.mockResolvedValueOnce({ status: 'unhealthy' });
    app = buildApp().app;
    expect((await request(app).get('/health/database')).status).toBe(503);
  });

  it('handles comprehensive checks with configured endpoints and degraded status', async () => {
    process.env.EXTERNAL_API_ENDPOINTS = JSON.stringify(['https://example.com/health']);
    healthCheck.runHealthChecks.mockResolvedValueOnce({ status: 'degraded' });

    const { app } = buildApp();
    const response = await request(app).get('/health/comprehensive');

    expect(response.status).toBe(200);
    expect(healthCheck.runHealthChecks).toHaveBeenCalled();
  });

  it('handles invalid external endpoint configuration', async () => {
    process.env.EXTERNAL_API_ENDPOINTS = 'invalid-json';
    healthCheck.runHealthChecks.mockResolvedValueOnce({ status: 'critical' });

    const { app } = buildApp();
    const response = await request(app).get('/health/comprehensive');

    expect(response.status).toBe(503);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns 500 when comprehensive checks throw', async () => {
    healthCheck.runHealthChecks.mockRejectedValueOnce(new Error('boom'));

    const { app } = buildApp();
    const response = await request(app).get('/health/comprehensive');

    expect(response.status).toBe(500);
  });

  it('returns cache-test success response', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/health/cache-test');

    expect(response.status).toBe(200);
    expect(response.body.cacheEnabled).toBe(true);
  });

  it('handles cache-test errors', async () => {
    const { router } = buildApp();
    const layer = router.stack.find((entry) => entry.route && entry.route.path === '/cache-test');
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;

    const req = {};
    const res = {
      set: jest.fn(() => {
        throw new Error('fail');
      }),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('handles basic health errors', async () => {
    const { router } = buildApp();
    const layer = router.stack.find((entry) => entry.route && entry.route.path === '/');
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;

    const req = {};
    const res = {
      setHeader: jest.fn(() => {
        throw new Error('fail');
      }),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
