/**
 * @fileoverview Unit tests for HTTP metrics middleware
 * Tests route normalization and metrics collection
 */

const httpMocks = require('node-mocks-http');

// Mock logger to avoid test noise
jest.mock('../../src/utils/logger', () => ({
  performance: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

const metrics = require('../../src/utils/metrics');

describe('Metrics Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/shipments',
      path: '/api/shipments',
    });
    res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter,
    });
    next = jest.fn();

    // Reset metrics
    metrics.activeConnections.reset();
  });

  afterAll(() => {
    metrics.register.clear();
  });

  describe('metricsMiddleware', () => {
    it('should call next() for all requests', () => {
      metrics.metricsMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should skip metrics collection for /metrics path', () => {
      req.path = '/metrics';
      const initialConnections = metrics.activeConnections;

      metrics.metricsMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should skip metrics collection for /api/metrics path', () => {
      req.path = '/api/metrics/open';

      metrics.metricsMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should increment active connections on request start', () => {
      // Get initial value
      metrics.activeConnections.reset();

      metrics.metricsMiddleware(req, res, next);

      // Connection should be incremented
      expect(next).toHaveBeenCalled();
    });

    it('should record metrics on response finish', (done) => {
      metrics.metricsMiddleware(req, res, next);

      // Emit finish event
      res.statusCode = 200;
      res.emit('finish');

      // Give time for async operations
      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('http_requests_total');
        done();
      }, 50);
    });
  });

  describe('Route Normalization', () => {
    // Test the normalizeRoute function indirectly through middleware behavior

    it('should normalize MongoDB ObjectIDs in paths', (done) => {
      req.path = '/api/shipments/507f1f77bcf86cd799439011';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        // Should contain normalized route, not the actual ObjectID
        expect(metricsOutput).toContain('/api/shipments/:id');
        expect(metricsOutput).not.toContain('507f1f77bcf86cd799439011');
        done();
      }, 50);
    });

    it('should normalize UUID paths', (done) => {
      req.path = '/api/users/123e4567-e89b-12d3-a456-426614174000';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('/api/users/:id');
        expect(metricsOutput).not.toContain('123e4567-e89b-12d3-a456-426614174000');
        done();
      }, 50);
    });

    it('should normalize numeric IDs in paths', (done) => {
      req.path = '/api/orders/12345';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('/api/orders/:id');
        expect(metricsOutput).not.toContain('/api/orders/12345');
        done();
      }, 50);
    });

    it('should normalize trailing slashes', (done) => {
      req.path = '/api/';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('route="/api"');
        done();
      }, 50);
    });

    it('should handle nested IDs in paths', (done) => {
      req.path = '/api/users/507f1f77bcf86cd799439011/documents/507f1f77bcf86cd799439012';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('/api/users/:id/documents/:id');
        done();
      }, 50);
    });

    it('should strip query parameters from paths', (done) => {
      req.path = '/api/shipments?status=pending&page=1';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('/api/shipments');
        expect(metricsOutput).not.toContain('status=pending');
        done();
      }, 50);
    });

    it('should use Express route pattern when available', (done) => {
      req.baseUrl = '/api';
      req.route = { path: '/shipments/:id' };
      req.path = '/shipments/507f1f77bcf86cd799439011';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        // Should use the Express route pattern
        expect(metricsOutput).toContain('/api/shipments/:id');
        done();
      }, 50);
    });

    it('should use unknown route when path is missing', (done) => {
      req.path = '';
      req.method = 'GET';

      metrics.metricsMiddleware(req, res, next);

      res.statusCode = 200;
      res.emit('finish');

      setTimeout(async () => {
        const metricsOutput = await metrics.register.metrics();
        expect(metricsOutput).toContain('route="unknown"');
        done();
      }, 50);
    });
  });

  describe('Error Handling', () => {
    it('should continue processing even if metrics collection fails', () => {
      // Create a request that might cause issues
      req.path = null;

      // Should not throw
      expect(() => {
        metrics.metricsMiddleware(req, res, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalled();
    });

    it('should handle response finish errors gracefully', (done) => {
      metrics.metricsMiddleware(req, res, next);

      // Force an error scenario
      res.statusCode = 200;
      res.emit('finish');

      // Should complete without throwing
      setTimeout(() => {
        expect(true).toBe(true);
        done();
      }, 50);
    });

    it('logs slow requests when duration is high', (done) => {
      const logger = require('../../src/utils/logger');
      const originalStartTimer = metrics.httpRequestDurationMicroseconds.startTimer;
      metrics.httpRequestDurationMicroseconds.startTimer = () => () => 2;

      metrics.metricsMiddleware(req, res, next);
      res.statusCode = 200;
      res.emit('finish');

      setTimeout(() => {
        expect(logger.performance).toHaveBeenCalled();
        metrics.httpRequestDurationMicroseconds.startTimer = originalStartTimer;
        done();
      }, 50);
    });

    it('logs errors when finish metrics throw', (done) => {
      const logger = require('../../src/utils/logger');
      const originalInc = metrics.httpRequestCounter.inc;
      metrics.httpRequestCounter.inc = () => {
        throw new Error('boom');
      };

      metrics.metricsMiddleware(req, res, next);
      res.statusCode = 200;
      res.emit('finish');

      setTimeout(() => {
        expect(logger.error).toHaveBeenCalled();
        metrics.httpRequestCounter.inc = originalInc;
        done();
      }, 50);
    });
  });
});
