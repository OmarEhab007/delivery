# Monitoring & Observability System

This document describes the monitoring and observability features added to the delivery application.

## Overview

The delivery app now includes a comprehensive monitoring system with the following components:

1. **Metrics Collection** - Using Prometheus for gathering system and application metrics
2. **Distributed Tracing** - Correlation ID-based tracing across requests and operations
3. **Enhanced Logging** - Structured logging with contextual information
4. **Error Tracking** - Centralized error monitoring with grouping and frequency analysis
5. **Database Monitoring** - Performance tracking for MongoDB operations
6. **Health Checks** - Extended system health monitoring

## Accessing Metrics

### Prometheus Metrics

All Prometheus metrics are exposed via the `/api/metrics` endpoint (admin access required).

```
GET /api/metrics
```

These metrics can be consumed by Prometheus server or other compatible monitoring systems.

### Status Metrics

Current status metrics for shipments and trucks can be viewed at:

```
GET /api/metrics/status-counts
```

### Error Statistics

Error tracking information is available at:

```
GET /api/metrics/errors
```

### Database Metrics

Detailed MongoDB statistics are available at:

```
GET /api/metrics/database
```

### Log Level Configuration

Log level can be changed at runtime via:

```
POST /api/metrics/log-level
Body: { "level": "debug" }
```

Supported levels: `error`, `warn`, `info`, `debug`, `silly`

## Available Metrics

The system tracks the following metrics:

### HTTP Metrics
- `http_request_duration_seconds` - Histogram of request durations
- `http_requests_total` - Counter of total requests by method, route and status code
- `http_connections_active` - Gauge of active HTTP connections

### Database Metrics
- `database_operations_total` - Counter of database operations
- `database_operation_duration_seconds` - Histogram of database operation durations

### Business Metrics
- `shipments_by_status` - Gauge of shipments per status
- `trucks_by_status` - Gauge of trucks per status
- `job_queue_size` - Gauge of job queue sizes

### Error Metrics
- `application_errors_total` - Counter of application errors

### System Metrics (Default Prometheus metrics)
- CPU, memory, and Node.js metrics

## Distributed Tracing

The application implements distributed tracing using correlation IDs. Each request receives a trace ID, and operations within the request are tracked with span IDs.

### Trace Headers

The system adds the following headers to responses:
- `X-Trace-ID` - Unique trace identifier
- `X-Span-ID` - Span identifier for this service

When making service-to-service calls, propagate these headers to maintain the trace context.

## Database Monitoring

MongoDB operations are automatically wrapped with monitoring:
- Performance metrics for each query
- Slow query detection
- Query counts by collection and operation type

## Error Tracking

Errors are tracked with:
- Error fingerprinting for grouping similar errors
- Frequency tracking
- Context information
- Associated request and user information (if available)

## Periodic Metric Collection

The system automatically collects and updates metrics on a scheduled basis:
- Shipment status metrics: Every 5 minutes
- Truck status metrics: Every 5 minutes
- Database statistics: Every 15 minutes

## Integration with External Systems

### Prometheus

Configure Prometheus to scrape the `/api/metrics` endpoint. Example prometheus.yml configuration:

```yaml
scrape_configs:
  - job_name: 'delivery-app'
    scrape_interval: 15s
    metrics_path: '/api/metrics'
    basic_auth:
      username: 'admin_user'
      password: 'admin_password'
    static_configs:
      - targets: ['localhost:3000']
```

### Grafana

For visualization, connect Grafana to your Prometheus instance and create dashboards for your metrics.

## Best Practices

1. **Correlation ID**: Always include the trace ID in log messages for request tracing
2. **Span Creation**: For long-running operations, create child spans
3. **Custom Metrics**: Add custom metrics for business-specific operations
4. **Error Context**: Provide rich context when using the error tracker

## Health Checks

Enhanced health check endpoints at `/health/*` provide detailed health status for different system components. 