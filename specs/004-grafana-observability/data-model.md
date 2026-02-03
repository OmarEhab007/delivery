# Data Model: Metrics Schema

**Feature**: 004-grafana-observability
**Date**: 2026-02-03

This document defines all metrics collected by the observability system.

---

## 1. HTTP Request Metrics

### http_requests_total (Counter)

Total number of HTTP requests received.

| Label | Description | Example Values |
|-------|-------------|----------------|
| method | HTTP method | GET, POST, PUT, DELETE, PATCH |
| route | Route path pattern | /api/shipments, /api/auth/login |
| status_code | HTTP response code | 200, 201, 400, 401, 404, 500 |

**PromQL Examples**:
```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Requests by route
sum by (route) (rate(http_requests_total[5m]))
```

### http_request_duration_seconds (Histogram)

Duration of HTTP requests in seconds.

| Label | Description | Example Values |
|-------|-------------|----------------|
| method | HTTP method | GET, POST, PUT, DELETE, PATCH |
| route | Route path pattern | /api/shipments, /api/auth/login |
| status_code | HTTP response code | 200, 201, 400, 401, 404, 500 |

**Buckets**: 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10 seconds

**PromQL Examples**:
```promql
# P50 latency
histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Average latency by route
sum by (route) (rate(http_request_duration_seconds_sum[5m])) / sum by (route) (rate(http_request_duration_seconds_count[5m]))
```

### http_connections_active (Gauge)

Number of currently active HTTP connections.

**PromQL Examples**:
```promql
# Current active connections
http_connections_active
```

### application_errors_total (Counter)

Total application errors by type.

| Label | Description | Example Values |
|-------|-------------|----------------|
| type | Error category | validation, authentication, database, external_api, internal |
| route | Route where error occurred | /api/shipments, /api/auth/login |

**PromQL Examples**:
```promql
# Error rate by type
sum by (type) (rate(application_errors_total[5m]))

# Top error routes
topk(5, sum by (route) (rate(application_errors_total[5m])))
```

---

## 2. Node.js Runtime Metrics

### nodejs_eventloop_lag_seconds (Gauge)

Event loop lag in seconds.

| Label | Description | Example Values |
|-------|-------------|----------------|
| percentile | Latency percentile | p50, p99 |

**PromQL Examples**:
```promql
# P99 event loop lag
nodejs_eventloop_lag_seconds{percentile="p99"}
```

### process_cpu_seconds_total (Counter)

*Built-in from prom-client collectDefaultMetrics*

Total CPU time spent in seconds.

**PromQL Examples**:
```promql
# CPU usage rate
rate(process_cpu_seconds_total[5m])
```

### nodejs_heap_size_used_bytes (Gauge)

*Built-in from prom-client collectDefaultMetrics*

Heap memory used in bytes.

**PromQL Examples**:
```promql
# Heap usage percentage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# Memory growth rate
rate(nodejs_heap_size_used_bytes[1h])
```

### nodejs_gc_duration_seconds (Histogram)

*Built-in from prom-client collectDefaultMetrics*

Garbage collection duration.

| Label | Description | Example Values |
|-------|-------------|----------------|
| gc_type | GC type | major, minor, incremental, weakcb |

**PromQL Examples**:
```promql
# GC frequency
sum(rate(nodejs_gc_duration_seconds_count[5m]))

# GC time percentage
sum(rate(nodejs_gc_duration_seconds_sum[5m])) * 100
```

### nodejs_active_handles_total (Gauge)

*Built-in from prom-client collectDefaultMetrics*

Number of active handles (sockets, timers, etc.).

### nodejs_active_requests_total (Gauge)

*Built-in from prom-client collectDefaultMetrics*

Number of active libuv requests.

---

## 3. MongoDB Metrics

### mongodb_connections_current (Gauge)

Current MongoDB connection pool status.

| Label | Description | Example Values |
|-------|-------------|----------------|
| state | Connection state | total, available, in_use |

**PromQL Examples**:
```promql
# Connection pool utilization
mongodb_connections_current{state="in_use"} / mongodb_connections_current{state="total"} * 100
```

### database_operations_total (Counter)

Total database operations.

| Label | Description | Example Values |
|-------|-------------|----------------|
| operation | Operation type | find, findOne, insertOne, updateOne, deleteOne, aggregate |
| collection | Collection name | shipments, trucks, users, applications |

**PromQL Examples**:
```promql
# Operations per second
sum(rate(database_operations_total[5m]))

# Operations by collection
sum by (collection) (rate(database_operations_total[5m]))
```

### database_operation_duration_seconds (Histogram)

Database operation duration.

| Label | Description | Example Values |
|-------|-------------|----------------|
| operation | Operation type | find, findOne, insertOne, updateOne, deleteOne, aggregate |
| collection | Collection name | shipments, trucks, users, applications |

**Buckets**: 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1 seconds

**PromQL Examples**:
```promql
# Slow query detection (>100ms)
histogram_quantile(0.95, sum(rate(database_operation_duration_seconds_bucket[5m])) by (le, collection)) > 0.1
```

### mongodb_query_slow_total (Counter)

Count of slow queries (>100ms).

| Label | Description | Example Values |
|-------|-------------|----------------|
| collection | Collection name | shipments, trucks, users |

---

## 4. Business Metrics

### shipments_by_status (Gauge)

Number of shipments by status.

| Label | Description | Example Values |
|-------|-------------|----------------|
| status | Shipment status | PENDING_APPROVAL, REQUESTED, CONFIRMED, ASSIGNED, LOADING, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED |

**PromQL Examples**:
```promql
# Active shipments
sum(shipments_by_status{status=~"IN_TRANSIT|LOADING|ASSIGNED"})

# Delivery completion rate
shipments_by_status{status="DELIVERED"} / sum(shipments_by_status)
```

### trucks_by_status (Gauge)

Number of trucks by status.

| Label | Description | Example Values |
|-------|-------------|----------------|
| status | Truck status | AVAILABLE, IN_SERVICE, IN_MAINTENANCE, OUT_OF_SERVICE |

**PromQL Examples**:
```promql
# Fleet utilization
sum(trucks_by_status{status="IN_SERVICE"}) / sum(trucks_by_status) * 100
```

### applications_by_status (Gauge)

Number of applications/bids by status.

| Label | Description | Example Values |
|-------|-------------|----------------|
| status | Application status | PENDING, ACCEPTED, REJECTED, CANCELLED |

### users_total (Gauge)

Total users by role.

| Label | Description | Example Values |
|-------|-------------|----------------|
| role | User role | Admin, Merchant, TruckOwner, Driver |

**PromQL Examples**:
```promql
# Total users
sum(users_total)

# Driver to truck ratio
users_total{role="Driver"} / sum(trucks_by_status)
```

### shipments_created_total (Counter)

Total shipments created (running count).

**PromQL Examples**:
```promql
# Shipment creation rate
rate(shipments_created_total[1h])
```

---

## 5. Alert Rule Thresholds

| Alert | Metric | Condition | Duration | Severity |
|-------|--------|-----------|----------|----------|
| HighErrorRate | http_requests_total | error_rate > 5% | 5m | critical |
| HighLatency | http_request_duration_seconds | p95 > 2s | 5m | warning |
| MongoPoolExhausted | mongodb_connections_current | utilization > 80% | 5m | warning |
| HighMemoryUsage | nodejs_heap_size_used_bytes | usage > 80% | 5m | warning |
| ScrapeFailure | up | up == 0 | 2m | critical |
| HighEventLoopLag | nodejs_eventloop_lag_seconds | p99 > 100ms | 5m | warning |

---

## 6. Recording Rules

Pre-computed metrics for dashboard performance:

| Rule Name | Expression | Update Interval |
|-----------|------------|-----------------|
| job:http_requests:rate5m | sum(rate(http_requests_total[5m])) by (job) | 30s |
| job:http_errors:rate5m | sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job) | 30s |
| job:http_request_duration_seconds:p95 | histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)) | 30s |
| job:http_request_duration_seconds:p99 | histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)) | 30s |
| job:error_rate:ratio5m | job:http_errors:rate5m / job:http_requests:rate5m | 30s |
