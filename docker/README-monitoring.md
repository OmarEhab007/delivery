# Monitoring Setup for Delivery App

This document explains how to use the monitoring stack configured for the Delivery App.

## Components

The monitoring stack consists of:

1. **Prometheus**: Collects and stores metrics from the application
2. **Grafana**: Provides dashboards and visualization of the metrics

## Accessing the Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (username: admin, password: admin)

## Available Dashboards

We've set up five comprehensive dashboards:

1. **Main Overview Dashboard**
   - System overview with key performance indicators
   - Quick view of critical metrics

2. **HTTP API Performance Dashboard**
   - Request rates, durations, and status codes
   - Endpoint performance comparison

3. **Database Performance Dashboard**
   - MongoDB operation metrics
   - Query performance and collection statistics

4. **Business Metrics Dashboard**
   - Shipment status distribution
   - Truck status monitoring
   - Other business-relevant KPIs

5. **Error Monitoring Dashboard**
   - Error rates by type and endpoint
   - System-wide error tracking

## Generating Demo Metrics

For testing and demonstration purposes, you can generate sample metrics by calling:

```
GET /api/metrics/demo-data
```

This will populate random metrics data across all categories for dashboard testing.

## Metrics Implementation

The application automatically collects metrics in several categories:

1. **HTTP Metrics**: Request counts, durations, and status codes
2. **Database Metrics**: Query counts and durations by operation and collection
3. **Business Metrics**: Shipment and truck status counts
4. **System Metrics**: Node.js runtime metrics
5. **Error Tracking**: Application error counts by type

## Troubleshooting

If no data appears in Grafana:

1. Check if Prometheus is running: `docker ps | grep prometheus`
2. Verify Prometheus can scrape metrics: http://localhost:9090/targets
3. Check if the application's /api/metrics/open endpoint is accessible
4. Ensure Grafana is properly connected to Prometheus as a data source

## Adding Custom Metrics

To add custom metrics:

1. Define new metrics in `src/utils/metrics.js`
2. Register them in the Prometheus registry
3. Instrument your code to record values
4. Update dashboards as needed

## Important Notes

- Metrics data is stored in Docker volumes and will persist between restarts
- The open metrics endpoint (/api/metrics/open) is designed for Prometheus and should be protected if exposed externally
- For production deployment, you should configure authentication for Prometheus 