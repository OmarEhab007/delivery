/**
 * @fileoverview Unit tests for metrics collection
 * Tests for the Prometheus metrics exposed by src/utils/metrics.js
 */

const promClient = require('prom-client');

// Import metrics module
const metrics = require('../../src/utils/metrics');

describe('Metrics Module', () => {
  beforeEach(() => {
    // Reset metrics before each test
    metrics.register.resetMetrics();
  });

  afterAll(async () => {
    // Clean up after all tests
    metrics.register.clear();
  });

  describe('Registry', () => {
    it('should have a valid Prometheus registry', () => {
      expect(metrics.register).toBeDefined();
      expect(metrics.register).toBeInstanceOf(promClient.Registry);
    });

    it('should return metrics in Prometheus text format', async () => {
      const metricsOutput = await metrics.register.metrics();
      expect(typeof metricsOutput).toBe('string');
      expect(metricsOutput).toContain('# HELP');
      expect(metricsOutput).toContain('# TYPE');
    });

    it('should have correct content type', () => {
      expect(metrics.register.contentType).toContain('text/plain');
    });
  });

  describe('HTTP Request Metrics', () => {
    it('should have http_requests_total counter', () => {
      expect(metrics.httpRequestCounter).toBeDefined();
      const metric = metrics.register.getSingleMetric('http_requests_total');
      expect(metric).toBeDefined();
    });

    it('should increment http_requests_total with correct labels', async () => {
      metrics.httpRequestCounter.inc({
        method: 'GET',
        route: '/api/shipments',
        status_code: '200',
      });

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('http_requests_total');
      expect(metricsOutput).toContain('method="GET"');
      expect(metricsOutput).toContain('route="/api/shipments"');
      expect(metricsOutput).toContain('status_code="200"');
    });

    it('should have http_request_duration_seconds histogram', () => {
      expect(metrics.httpRequestDurationMicroseconds).toBeDefined();
      const metric = metrics.register.getSingleMetric('http_request_duration_seconds');
      expect(metric).toBeDefined();
    });

    it('should record request duration with histogram buckets', async () => {
      const end = metrics.httpRequestDurationMicroseconds.startTimer();
      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 10));
      end({
        method: 'POST',
        route: '/api/shipments',
        status_code: '201',
      });

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('http_request_duration_seconds_bucket');
      expect(metricsOutput).toContain('http_request_duration_seconds_sum');
      expect(metricsOutput).toContain('http_request_duration_seconds_count');
    });

    it('should have http_connections_active gauge', () => {
      expect(metrics.activeConnections).toBeDefined();
      const metric = metrics.register.getSingleMetric('http_connections_active');
      expect(metric).toBeDefined();
    });

    it('should track active connections', async () => {
      metrics.activeConnections.inc();
      metrics.activeConnections.inc();
      metrics.activeConnections.dec();

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('http_connections_active');
    });
  });

  describe('Error Metrics', () => {
    it('should have application_errors_total counter', () => {
      expect(metrics.errorCounter).toBeDefined();
      const metric = metrics.register.getSingleMetric('application_errors_total');
      expect(metric).toBeDefined();
    });

    it('should record errors with type and route labels', async () => {
      metrics.recordError('validation', '/api/shipments');
      metrics.recordError('database', '/api/trucks');

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('application_errors_total');
      expect(metricsOutput).toContain('type="validation"');
      expect(metricsOutput).toContain('type="database"');
    });
  });

  describe('Event Loop Metrics', () => {
    it('should have nodejs_eventloop_lag_seconds gauge', async () => {
      const metric = metrics.register.getSingleMetric('nodejs_eventloop_lag_seconds');
      expect(metric).toBeDefined();
    });

    it('should expose p50 and p99 percentiles via default metrics', async () => {
      // Wait a bit for event loop metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metricsOutput = await metrics.register.metrics();
      // prom-client default metrics provide event loop lag as separate metrics per percentile
      expect(metricsOutput).toContain('nodejs_eventloop_lag_p50_seconds');
      expect(metricsOutput).toContain('nodejs_eventloop_lag_p99_seconds');
    });
  });

  describe('Business Metrics', () => {
    it('should have shipments_by_status gauge', () => {
      expect(metrics.shipmentStatusGauge).toBeDefined();
      const metric = metrics.register.getSingleMetric('shipments_by_status');
      expect(metric).toBeDefined();
    });

    it('should update shipment status metrics', async () => {
      metrics.updateShipmentStatusMetrics({
        PENDING: 10,
        IN_TRANSIT: 5,
        DELIVERED: 100,
      });

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('shipments_by_status');
      expect(metricsOutput).toContain('status="PENDING"');
      expect(metricsOutput).toContain('status="IN_TRANSIT"');
      expect(metricsOutput).toContain('status="DELIVERED"');
    });

    it('should have trucks_by_status gauge', () => {
      expect(metrics.trucksStatusGauge).toBeDefined();
      const metric = metrics.register.getSingleMetric('trucks_by_status');
      expect(metric).toBeDefined();
    });

    it('should update truck status metrics', async () => {
      metrics.updateTruckStatusMetrics({
        AVAILABLE: 15,
        IN_SERVICE: 8,
      });

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('trucks_by_status');
      expect(metricsOutput).toContain('status="AVAILABLE"');
      expect(metricsOutput).toContain('status="IN_SERVICE"');
    });

    it('should update job queue size metrics', async () => {
      metrics.updateJobQueueMetric('emails', 3);
      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('job_queue_size');
      expect(metricsOutput).toContain('queue_name="emails"');
    });
  });

  describe('Database Metrics', () => {
    it('should have database_operations_total counter', () => {
      expect(metrics.databaseOperationsCounter).toBeDefined();
      const metric = metrics.register.getSingleMetric('database_operations_total');
      expect(metric).toBeDefined();
    });

    it('should have database_operation_duration_seconds histogram', () => {
      expect(metrics.databaseOperationDuration).toBeDefined();
      const metric = metrics.register.getSingleMetric('database_operation_duration_seconds');
      expect(metric).toBeDefined();
    });

    it('should track database operations with startDbTimer', async () => {
      const endTimer = metrics.startDbTimer('find', 'shipments');
      await new Promise((resolve) => setTimeout(resolve, 5));
      endTimer();

      const metricsOutput = await metrics.register.metrics();
      expect(metricsOutput).toContain('database_operations_total');
      expect(metricsOutput).toContain('database_operation_duration_seconds');
      expect(metricsOutput).toContain('operation="find"');
      expect(metricsOutput).toContain('collection="shipments"');
    });
  });

  describe('Error Branches', () => {
    it('handles errors when recording errors', () => {
      const original = metrics.errorCounter.inc;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.errorCounter.inc = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() => metrics.recordError('type', '/route')).not.toThrow();

      metrics.errorCounter.inc = original;
      consoleSpy.mockRestore();
    });

    it('handles errors when updating mongo connection metrics', () => {
      const original = metrics.mongoConnectionsGauge.set;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.mongoConnectionsGauge.set = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() => metrics.updateMongoConnectionMetrics({ total: 1, available: 1, inUse: 0 })).not.toThrow();

      metrics.mongoConnectionsGauge.set = original;
      consoleSpy.mockRestore();
    });

    it('ignores null pool stats when updating mongo metrics', () => {
      expect(() => metrics.updateMongoConnectionMetrics(null)).not.toThrow();
    });

    it('handles errors when recording slow queries', () => {
      const original = metrics.mongoSlowQueryCounter.inc;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.mongoSlowQueryCounter.inc = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() => metrics.recordSlowQuery('shipments')).not.toThrow();

      metrics.mongoSlowQueryCounter.inc = original;
      consoleSpy.mockRestore();
    });

    it('handles errors when updating application metrics', () => {
      const original = metrics.applicationsByStatusGauge.set;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.applicationsByStatusGauge.set = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() =>
        metrics.updateApplicationStatusMetrics({ PENDING: 1, ACCEPTED: 2 })
      ).not.toThrow();

      metrics.applicationsByStatusGauge.set = original;
      consoleSpy.mockRestore();
    });

    it('handles errors when updating user metrics', () => {
      const original = metrics.usersTotalGauge.set;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.usersTotalGauge.set = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() => metrics.updateUserMetrics({ Admin: 1 })).not.toThrow();

      metrics.usersTotalGauge.set = original;
      consoleSpy.mockRestore();
    });

    it('handles errors when incrementing shipment counter', () => {
      const original = metrics.shipmentsCreatedCounter.inc;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      metrics.shipmentsCreatedCounter.inc = jest.fn(() => {
        throw new Error('fail');
      });

      expect(() => metrics.incrementShipmentsCreated()).not.toThrow();

      metrics.shipmentsCreatedCounter.inc = original;
      consoleSpy.mockRestore();
    });
  });

  describe('Default Metrics', () => {
    it('should collect Node.js default metrics', async () => {
      const metricsOutput = await metrics.register.metrics();

      // Check for common default metrics
      expect(metricsOutput).toContain('process_cpu_');
      expect(metricsOutput).toContain('nodejs_heap_size');
    });
  });
});
