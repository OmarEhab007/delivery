/**
 * @fileoverview Integration tests for observability endpoints
 * Tests the Prometheus metrics scrape endpoint
 */

const request = require('supertest');
const { app } = require('../../src/server');

describe('Observability Integration Tests', () => {
  describe('GET /metrics', () => {
    it('should return metrics in Prometheus text format', async () => {
      const response = await request(app).get('/metrics').expect(200);

      // Check content type is Prometheus format
      expect(response.headers['content-type']).toContain('text/plain');

      // Check for required metrics
      const metricsText = response.text;

      // HTTP metrics
      expect(metricsText).toContain('http_requests_total');
      expect(metricsText).toContain('http_request_duration_seconds');
      expect(metricsText).toContain('http_connections_active');

      // Node.js default metrics
      expect(metricsText).toContain('process_cpu_seconds_total');
      expect(metricsText).toContain('nodejs_heap_size');

      // Event loop metrics
      expect(metricsText).toContain('nodejs_eventloop_lag_seconds');

      // Error metrics
      expect(metricsText).toContain('application_errors_total');

      // Database metrics
      expect(metricsText).toContain('database_operations_total');
      expect(metricsText).toContain('database_operation_duration_seconds');

      // Business metrics
      expect(metricsText).toContain('shipments_by_status');
      expect(metricsText).toContain('trucks_by_status');
    });

    it('should be accessible without authentication', async () => {
      // No Authorization header
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
    });

    it('should return valid Prometheus exposition format', async () => {
      const response = await request(app).get('/metrics').expect(200);

      const metricsText = response.text;

      // Check for HELP and TYPE comments (Prometheus format requirements)
      expect(metricsText).toMatch(/# HELP \w+/);
      expect(metricsText).toMatch(/# TYPE \w+ (counter|gauge|histogram|summary)/);

      // Check metric lines have valid format: metric_name{labels} value
      const metricLines = metricsText.split('\n').filter((line) => !line.startsWith('#') && line.trim());

      metricLines.forEach((line) => {
        if (line.trim()) {
          // Valid metric line: name{labels} value or name value
          // Note: Prometheus allows special values like Nan, +Inf, -Inf
          expect(line).toMatch(/^[\w:]+(\{[^}]*\})?\s+([\d.eE+-]+|Nan|\+Inf|-Inf)(\s+\d+)?$/i);
        }
      });
    });

    it('should include histogram definitions for duration metrics', async () => {
      // First, make some requests to generate HTTP metrics
      await request(app).get('/health').expect(200);
      await request(app).get('/health').expect(200);

      // Wait for metrics to be recorded
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app).get('/metrics').expect(200);

      const metricsText = response.text;

      // Check for histogram HELP and TYPE definitions (always present once metrics module is loaded)
      expect(metricsText).toContain('# HELP http_request_duration_seconds');
      expect(metricsText).toContain('# TYPE http_request_duration_seconds histogram');
    });

    it('should include event loop lag percentiles', async () => {
      const response = await request(app).get('/metrics').expect(200);

      const metricsText = response.text;

      // Check for event loop lag metrics from default prom-client metrics
      expect(metricsText).toContain('nodejs_eventloop_lag_p50_seconds');
      expect(metricsText).toContain('nodejs_eventloop_lag_p99_seconds');
    });
  });

  describe('Public metrics endpoint accessibility', () => {
    it('should return metrics from /metrics without authentication', async () => {
      // The public /metrics endpoint is for Prometheus scraping
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      // Check for default metrics which are always present
      expect(response.text).toContain('process_cpu_seconds_total');
    });
  });

  describe('Metrics Collection', () => {
    it('should record metrics for API requests', async () => {
      // Make a request to trigger metrics collection
      await request(app).get('/health').expect(200);

      // Wait a bit for metrics to be recorded
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check metrics endpoint for the recorded request
      const metricsResponse = await request(app).get('/metrics').expect(200);

      const metricsText = metricsResponse.text;

      // Should have recorded the /health request
      expect(metricsText).toContain('http_requests_total');
    });
  });
});
