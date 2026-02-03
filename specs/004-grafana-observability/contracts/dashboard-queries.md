# Contract: Dashboard PromQL Queries

**Feature**: 004-grafana-observability
**Date**: 2026-02-03

This document defines the PromQL queries for each dashboard panel.

---

## 1. Application Overview Dashboard

**UID**: `delivery-overview`
**Refresh**: 30s
**Time Range**: Last 1 hour

### Row 1: Key Metrics (Stat Panels)

| Panel | Query | Unit | Thresholds |
|-------|-------|------|------------|
| Request Rate | `sum(rate(http_requests_total[5m]))` | reqps | green: 0, yellow: 100, red: 500 |
| Error Rate | `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100` | percent | green: 0, yellow: 1, red: 5 |
| P95 Latency | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | s | green: 0, yellow: 1, red: 2 |
| Active Connections | `http_connections_active` | short | green: 0, yellow: 50, red: 100 |

### Row 2: Traffic Overview (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Requests per Second | `sum by (status_code) (rate(http_requests_total[5m]))` | `{{status_code}}` |
| Request Duration | `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P50 |
| | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P95 |
| | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P99 |

### Row 3: Error Breakdown (Pie Chart + Table)

| Panel | Query | Format |
|-------|-------|--------|
| Errors by Type | `sum by (type) (rate(application_errors_total[5m]))` | Pie |
| Top Error Routes | `topk(10, sum by (route) (rate(http_requests_total{status_code=~"5.."}[5m])))` | Table |

---

## 2. API Performance Dashboard

**UID**: `http-api-performance`
**Refresh**: 30s
**Time Range**: Last 1 hour

### Row 1: Latency Percentiles (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Overall Latency | `histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P50 |
| | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P95 |
| | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | P99 |

### Row 2: Per-Endpoint Performance (Table)

```promql
# Endpoint Performance Table
# Columns: Route, Method, RPS, P50, P95, P99, Error Rate

# RPS by route
sum by (route, method) (rate(http_requests_total[5m]))

# P95 by route
histogram_quantile(0.95, sum by (le, route, method) (rate(http_request_duration_seconds_bucket[5m])))

# Error rate by route
sum by (route, method) (rate(http_requests_total{status_code=~"5.."}[5m]))
/
sum by (route, method) (rate(http_requests_total[5m]))
```

### Row 3: Throughput by Route (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Top 10 Routes by Traffic | `topk(10, sum by (route) (rate(http_requests_total[5m])))` | `{{route}}` |

### Row 4: Status Code Distribution (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Status Codes | `sum by (status_code) (rate(http_requests_total[5m]))` | `{{status_code}}` |

---

## 3. Database Performance Dashboard

**UID**: `database-performance`
**Refresh**: 30s
**Time Range**: Last 1 hour

### Row 1: Connection Pool (Gauge + Time Series)

| Panel | Query | Unit |
|-------|-------|------|
| Pool Utilization | `mongodb_connections_current{state="in_use"} / mongodb_connections_current{state="total"} * 100` | percent |
| Connections Over Time | `mongodb_connections_current` | short |

### Row 2: Operations (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Operations per Second | `sum by (operation) (rate(database_operations_total[5m]))` | `{{operation}}` |
| Operations by Collection | `sum by (collection) (rate(database_operations_total[5m]))` | `{{collection}}` |

### Row 3: Query Performance (Time Series + Table)

| Panel | Query | Format |
|-------|-------|--------|
| Query Duration P95 | `histogram_quantile(0.95, sum by (le, collection) (rate(database_operation_duration_seconds_bucket[5m])))` | Time Series |
| Slow Queries | `sum by (collection) (rate(mongodb_query_slow_total[5m]))` | Table |

---

## 4. Business Metrics Dashboard

**UID**: `business-metrics`
**Refresh**: 60s
**Time Range**: Last 24 hours

### Row 1: Shipment Overview (Stat Panels)

| Panel | Query | Unit |
|-------|-------|------|
| Total Active Shipments | `sum(shipments_by_status{status=~"IN_TRANSIT\|LOADING\|ASSIGNED\|REQUESTED"})` | short |
| Delivered Today | `increase(shipments_created_total[24h])` | short |
| Pending Approval | `shipments_by_status{status="PENDING_APPROVAL"}` | short |

### Row 2: Shipment Status Distribution (Pie + Time Series)

| Panel | Query | Format |
|-------|-------|--------|
| Shipments by Status | `shipments_by_status` | Pie |
| Status Trends | `shipments_by_status` | Time Series |

### Row 3: Fleet Overview (Stat + Pie)

| Panel | Query | Format |
|-------|-------|--------|
| Fleet Utilization | `sum(trucks_by_status{status="IN_SERVICE"}) / sum(trucks_by_status) * 100` | Gauge |
| Trucks by Status | `trucks_by_status` | Pie |

### Row 4: User Metrics (Stat Panels)

| Panel | Query | Unit |
|-------|-------|------|
| Total Users | `sum(users_total)` | short |
| Merchants | `users_total{role="Merchant"}` | short |
| Drivers | `users_total{role="Driver"}` | short |
| Truck Owners | `users_total{role="TruckOwner"}` | short |

### Row 5: Applications (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Applications by Status | `applications_by_status` | `{{status}}` |

---

## 5. Infrastructure Dashboard

**UID**: `infrastructure`
**Refresh**: 30s
**Time Range**: Last 1 hour

### Row 1: Memory (Gauge + Time Series)

| Panel | Query | Unit |
|-------|-------|------|
| Heap Usage | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100` | percent |
| Memory Over Time | `nodejs_heap_size_used_bytes` | bytes |
| | `nodejs_heap_size_total_bytes` | bytes |
| | `process_resident_memory_bytes` | bytes |

### Row 2: CPU (Time Series)

| Panel | Query | Unit |
|-------|-------|------|
| CPU Usage | `rate(process_cpu_seconds_total[5m]) * 100` | percent |

### Row 3: Event Loop (Gauge + Time Series)

| Panel | Query | Unit |
|-------|-------|------|
| Event Loop Lag P99 | `nodejs_eventloop_lag_seconds{percentile="p99"}` | s |
| Event Loop Lag Over Time | `nodejs_eventloop_lag_seconds` | s |

### Row 4: Garbage Collection (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| GC Duration | `rate(nodejs_gc_duration_seconds_sum[5m])` | GC Time |
| GC Frequency | `rate(nodejs_gc_duration_seconds_count[5m])` | GC Count |

### Row 5: Handles & Requests (Time Series)

| Panel | Query | Legend |
|-------|-------|--------|
| Active Handles | `nodejs_active_handles_total` | Handles |
| Active Requests | `nodejs_active_requests_total` | Requests |

---

## Variable Definitions

### Global Variables (All Dashboards)

```yaml
variables:
  - name: datasource
    type: datasource
    query: prometheus

  - name: interval
    type: interval
    values: [30s, 1m, 5m, 15m, 1h]
    default: 5m
```

### API Performance Variables

```yaml
variables:
  - name: route
    type: query
    query: label_values(http_requests_total, route)
    multi: true
    includeAll: true

  - name: method
    type: query
    query: label_values(http_requests_total, method)
    multi: true
    includeAll: true
```

### Database Performance Variables

```yaml
variables:
  - name: collection
    type: query
    query: label_values(database_operations_total, collection)
    multi: true
    includeAll: true
```

---

## Recording Rules

Pre-computed metrics for dashboard performance:

```yaml
groups:
  - name: delivery_recording_rules
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)

      - record: job:http_errors:rate5m
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job)

      - record: job:http_request_duration_seconds:p95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))

      - record: job:http_request_duration_seconds:p99
        expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))

      - record: job:error_rate:ratio5m
        expr: job:http_errors:rate5m / job:http_requests:rate5m
```
