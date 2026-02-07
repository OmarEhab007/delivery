const express = require('express');
const request = require('supertest');

jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { email: 'admin@example.com', id: 'admin' };
    next();
  },
  restrictTo: () => (req, res, next) => next(),
}));

jest.mock('../../src/utils/metrics', () => ({
  register: {
    contentType: 'text/plain',
    metrics: jest.fn(),
  },
  httpRequestCounter: { inc: jest.fn() },
  httpRequestDurationMicroseconds: { startTimer: jest.fn(() => jest.fn()) },
  databaseOperationsCounter: { inc: jest.fn() },
  databaseOperationDuration: { startTimer: jest.fn(() => jest.fn()) },
  activeConnections: { set: jest.fn() },
  shipmentStatusGauge: { set: jest.fn() },
  trucksStatusGauge: { set: jest.fn() },
  jobQueueSizeGauge: { set: jest.fn() },
  errorCounter: { inc: jest.fn() },
  updateShipmentStatusMetrics: jest.fn(),
  updateTruckStatusMetrics: jest.fn(),
}));

jest.mock('../../src/utils/errorTracker', () => ({
  getErrorStats: jest.fn(),
}));

jest.mock('../../src/utils/dbMonitor', () => ({
  collectMongoDBStats: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  level: 'info',
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    aggregate: jest.fn(),
  },
}));

jest.mock('../../src/models/Truck', () => ({
  aggregate: jest.fn(),
}));

const metrics = require('../../src/utils/metrics');
const errorTracker = require('../../src/utils/errorTracker');
const dbMonitor = require('../../src/utils/dbMonitor');
const logger = require('../../src/utils/logger');
const { Shipment } = require('../../src/models/Shipment');
const Truck = require('../../src/models/Truck');

const loadApp = () => {
  const router = require('../../src/routes/metricsRoutes');
  const app = express();
  app.use(express.json());
  app.use('/metrics', router);
  return app;
};

describe('metricsRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    metrics.httpRequestDurationMicroseconds.startTimer.mockImplementation(() => jest.fn());
    metrics.databaseOperationDuration.startTimer.mockImplementation(() => jest.fn());
    metrics.register.metrics.mockResolvedValue('metric-output');
    errorTracker.getErrorStats.mockReturnValue({ total: 0, errors: [] });
    dbMonitor.collectMongoDBStats.mockResolvedValue({ ok: true });
    Shipment.aggregate.mockResolvedValue([{ _id: 'REQUESTED', count: 2 }, { _id: null, count: 1 }]);
    Truck.aggregate.mockResolvedValue([{ _id: 'ACTIVE', count: 1 }]);
  });

  it('returns metrics output', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.text).toBe('metric-output');
  });

  it('returns open metrics output', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics/open');

    expect(res.status).toBe(200);
    expect(res.text).toBe('metric-output');
  });

  it('generates demo data', async () => {
    jest.useFakeTimers();
    const app = loadApp();
    const res = await request(app).get('/metrics/demo-data');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(metrics.httpRequestCounter.inc).toHaveBeenCalled();
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('handles demo data generation errors', async () => {
    jest.useFakeTimers();
    metrics.httpRequestCounter.inc.mockImplementation(() => {
      throw new Error('boom');
    });
    const app = loadApp();
    const res = await request(app).get('/metrics/demo-data');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('updates status counts', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics/status-counts');

    expect(res.status).toBe(200);
    expect(metrics.updateShipmentStatusMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ REQUESTED: 2, unknown: 1 })
    );
    expect(metrics.updateTruckStatusMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ ACTIVE: 1 })
    );
  });

  it('returns error statistics', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics/errors');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('handles error stats failures', async () => {
    errorTracker.getErrorStats.mockImplementation(() => {
      throw new Error('fail');
    });
    const app = loadApp();
    const res = await request(app).get('/metrics/errors');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('returns database metrics', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics/database');

    expect(res.status).toBe(200);
    expect(res.body.stats).toEqual({ ok: true });
  });

  it('validates log level', async () => {
    const app = loadApp();
    const res = await request(app).post('/metrics/log-level').send({ level: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('updates log level', async () => {
    const app = loadApp();
    const res = await request(app).post('/metrics/log-level').send({ level: 'debug' });

    expect(res.status).toBe(200);
    expect(res.body.currentLevel).toBe('debug');
  });

  it('handles log level update errors', async () => {
    logger.info.mockImplementation(() => {
      throw new Error('boom');
    });
    const app = loadApp();
    const res = await request(app).post('/metrics/log-level').send({ level: 'info' });

    expect(res.status).toBe(500);
  });

  it('returns metrics health', async () => {
    const app = loadApp();
    const res = await request(app).get('/metrics/health');

    expect(res.status).toBe(200);
    expect(res.body.health.metrics).toBe('OK');
  });

  it('handles metrics health errors', async () => {
    const originalRegister = metrics.register;
    Object.defineProperty(metrics, 'register', {
      configurable: true,
      get() {
        throw new Error('boom');
      },
    });
    const app = loadApp();
    const res = await request(app).get('/metrics/health');

    expect(res.status).toBe(500);
    Object.defineProperty(metrics, 'register', {
      configurable: true,
      value: originalRegister,
    });
  });
});
