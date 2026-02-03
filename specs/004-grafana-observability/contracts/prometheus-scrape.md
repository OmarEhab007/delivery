# Contract: Prometheus Scrape Endpoint

**Feature**: 004-grafana-observability
**Date**: 2026-02-03

This document specifies the metrics endpoint contract for Prometheus scraping.

---

## Endpoint Specification

### GET /metrics

**Purpose**: Expose application metrics in Prometheus text format for scraping.

**Authentication**: None (public endpoint for Prometheus scraper)

**Rate Limiting**: Exempt from rate limiting

**Response Format**: `text/plain; version=0.0.4; charset=utf-8`

---

## Request

```http
GET /metrics HTTP/1.1
Host: app:3000
Accept: text/plain
```

**Query Parameters**: None

**Headers**:
| Header | Required | Value |
|--------|----------|-------|
| Accept | Optional | `text/plain` or `*/*` |

---

## Response

### Success Response (200 OK)

```text
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/shipments",status_code="200"} 1542
http_requests_total{method="POST",route="/api/shipments",status_code="201"} 89
http_requests_total{method="GET",route="/api/auth/login",status_code="401"} 23

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="0.01"} 120
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="0.05"} 890
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="0.1"} 1200
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="0.5"} 1480
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="1"} 1520
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="2"} 1538
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="5"} 1542
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="10"} 1542
http_request_duration_seconds_bucket{method="GET",route="/api/shipments",status_code="200",le="+Inf"} 1542
http_request_duration_seconds_sum{method="GET",route="/api/shipments",status_code="200"} 187.32
http_request_duration_seconds_count{method="GET",route="/api/shipments",status_code="200"} 1542

# HELP nodejs_eventloop_lag_seconds Event loop lag in seconds
# TYPE nodejs_eventloop_lag_seconds gauge
nodejs_eventloop_lag_seconds{percentile="p50"} 0.000842
nodejs_eventloop_lag_seconds{percentile="p99"} 0.012453

# HELP process_cpu_seconds_total Total CPU time spent in seconds
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 125.42

# HELP nodejs_heap_size_used_bytes Heap memory used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 48291840

# HELP mongodb_connections_current Current MongoDB connections
# TYPE mongodb_connections_current gauge
mongodb_connections_current{state="total"} 10
mongodb_connections_current{state="available"} 8
mongodb_connections_current{state="in_use"} 2

# HELP shipments_by_status Number of shipments by status
# TYPE shipments_by_status gauge
shipments_by_status{status="PENDING_APPROVAL"} 5
shipments_by_status{status="REQUESTED"} 12
shipments_by_status{status="IN_TRANSIT"} 8
shipments_by_status{status="DELIVERED"} 156

# HELP trucks_by_status Number of trucks by status
# TYPE trucks_by_status gauge
trucks_by_status{status="AVAILABLE"} 15
trucks_by_status{status="IN_SERVICE"} 8
trucks_by_status{status="IN_MAINTENANCE"} 2

# HELP users_total Total users by role
# TYPE users_total gauge
users_total{role="Admin"} 2
users_total{role="Merchant"} 45
users_total{role="TruckOwner"} 23
users_total{role="Driver"} 31
```

### Error Response (503 Service Unavailable)

Returned when metrics collection is temporarily unavailable.

```text
# HELP up Application health status (1=up, 0=down)
# TYPE up gauge
up 0
```

---

## Prometheus Configuration

### Scrape Job Configuration

```yaml
# In prometheus.yml
scrape_configs:
  - job_name: 'delivery-app'
    scrape_interval: 30s
    scrape_timeout: 10s
    metrics_path: /metrics
    static_configs:
      - targets: ['app:3000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'delivery-app'
```

---

## Label Cardinality Rules

To prevent metric cardinality explosion:

| Label | Allowed Values | Notes |
|-------|----------------|-------|
| method | GET, POST, PUT, DELETE, PATCH, OPTIONS | HTTP methods only |
| route | Parameterized paths | `/api/shipments/:id` not `/api/shipments/abc123` |
| status_code | HTTP status codes | 200, 201, 400, 401, 403, 404, 500 |
| state | Predefined states | See metric-specific definitions |
| status | Predefined statuses | Application-defined status enums |
| role | User roles | Admin, Merchant, TruckOwner, Driver |

**Route Normalization Rules**:
- Path parameters replaced with `:param` placeholder
- Query strings stripped
- Trailing slashes normalized

Examples:
- `/api/shipments/abc123` → `/api/shipments/:id`
- `/api/users/123/documents/456` → `/api/users/:userId/documents/:documentId`

---

## Metric Categories Exposed

| Category | Metrics Count | Update Frequency |
|----------|---------------|------------------|
| HTTP Request | 4 | Per request |
| Node.js Runtime | 6 | Every 10s (default metrics) |
| MongoDB | 4 | Every 30s |
| Business | 5 | Every 60s |

---

## Security Considerations

1. **No Authentication**: Endpoint must be accessible without auth for Prometheus
2. **Internal Network Only**: Endpoint should only be exposed on internal Docker network
3. **No PII in Labels**: Labels must never contain user IDs, emails, or other PII
4. **Rate Limit Exempt**: Endpoint exempt from API rate limiting to ensure reliable scraping
