# Research: Grafana Observability Stack

**Date**: 2026-02-03
**Feature**: 004-grafana-observability

## Research Questions

1. Node.js metrics best practices (event loop, GC, heap)
2. Grafana unified alerting provisioning format
3. Prometheus recording rules for dashboard performance
4. MongoDB metrics collection via Mongoose
5. Grafana dashboard JSON structure (v9.x+)

---

## 1. Node.js Metrics Best Practices

### Decision: Use prom-client's built-in collectors + custom event loop monitoring

### Rationale

prom-client already provides `collectDefaultMetrics()` which includes:
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - RSS memory
- `nodejs_heap_size_total_bytes` - Total heap
- `nodejs_heap_size_used_bytes` - Used heap
- `nodejs_external_memory_bytes` - External memory
- `nodejs_active_handles_total` - Active handles
- `nodejs_active_requests_total` - Active requests

**Event Loop Lag**: Use `monitorEventLoopDelay()` from Node.js `perf_hooks`:
```javascript
const { monitorEventLoopDelay } = require('perf_hooks');
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// Export p50, p99 values
const eventLoopLag = new Gauge({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Event loop lag in seconds',
  labelNames: ['percentile'],
  collect() {
    this.set({ percentile: 'p50' }, histogram.percentile(50) / 1e9);
    this.set({ percentile: 'p99' }, histogram.percentile(99) / 1e9);
  }
});
```

**GC Metrics**: Use prom-client's GC observer (enabled by default in collectDefaultMetrics).

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| OpenTelemetry | Overkill for metrics-only; adds complexity |
| Custom GC hooks | prom-client already handles this |
| External agent (node_exporter) | Adds container dependency |

---

## 2. Grafana Unified Alerting Provisioning

### Decision: Use file-based provisioning with Grafana 9.x unified alerting YAML format

### Rationale

Grafana 9+ uses unified alerting with file provisioning at `/etc/grafana/provisioning/alerting/`.

**Alert Rule Format** (`alerts.yml`):
```yaml
apiVersion: 1
groups:
  - orgId: 1
    name: Application Alerts
    folder: Delivery App
    interval: 1m
    rules:
      - uid: error-rate-high
        title: High Error Rate
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
              intervalMs: 1000
              maxDataPoints: 43200
          - refId: C
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params: [0]
                    type: gt
                  operator:
                    type: and
                  query:
                    params: [A]
                  reducer:
                    type: last
              type: threshold
        noDataState: NoData
        execErrState: Error
        for: 5m
        annotations:
          summary: Error rate exceeds 5%
        labels:
          severity: critical
```

**Dashboard Provisioning** (`dashboards.yml`):
```yaml
apiVersion: 1
providers:
  - name: 'Delivery App Dashboards'
    orgId: 1
    folder: 'Delivery App'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Grafana API provisioning | Requires running container first |
| Terraform provider | Adds IaC complexity for simple setup |
| Manual dashboard import | Not reproducible |

---

## 3. Prometheus Recording Rules

### Decision: Use recording rules for frequently-used aggregations

### Rationale

Recording rules pre-compute expensive queries, improving dashboard load times.

**Recommended Recording Rules** (`recording-rules.yml`):
```yaml
groups:
  - name: delivery_app_recording
    interval: 30s
    rules:
      # HTTP request rates
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)

      # Error rate
      - record: job:http_errors:rate5m
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job)

      # P95 latency
      - record: job:http_request_duration_seconds:p95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))

      # P99 latency
      - record: job:http_request_duration_seconds:p99
        expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| No recording rules | Dashboard queries would be slow with large datasets |
| Client-side aggregation | Prometheus does this more efficiently |

---

## 4. MongoDB Metrics via Mongoose

### Decision: Use Mongoose connection events + manual pool monitoring

### Rationale

Mongoose exposes connection state but not detailed pool metrics. Options:

**Option A: Mongoose Events (Chosen)**
```javascript
const mongoose = require('mongoose');
const { Gauge } = require('prom-client');

const mongoConnections = new Gauge({
  name: 'mongodb_connections_current',
  help: 'Current MongoDB connections',
  labelNames: ['state']
});

mongoose.connection.on('connected', () => {
  mongoConnections.set({ state: 'connected' }, 1);
});

mongoose.connection.on('disconnected', () => {
  mongoConnections.set({ state: 'connected' }, 0);
});

// Pool stats (MongoDB driver 4.x+)
const getPoolStats = () => {
  const client = mongoose.connection.getClient();
  if (client && client.topology) {
    const pool = client.topology.s.pool;
    return {
      totalConnectionCount: pool?.totalConnectionCount || 0,
      availableConnectionCount: pool?.availableConnectionCount || 0,
      waitQueueSize: pool?.waitQueueSize || 0
    };
  }
  return null;
};
```

**Option B: MongoDB Exporter (Deferred)**
Use `mongodb_exporter` container for comprehensive metrics. Deferred as optional enhancement since it requires MongoDB credentials exposed to another container.

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| mongodb_exporter | Adds container, requires credentials management |
| Direct MongoDB serverStatus | Requires admin privileges |

---

## 5. Grafana Dashboard JSON Structure

### Decision: Use Grafana 9.x schema with standardized panel IDs

### Rationale

Grafana dashboards are JSON with these key sections:

```json
{
  "uid": "delivery-overview",
  "title": "Application Overview",
  "tags": ["delivery", "overview"],
  "timezone": "browser",
  "schemaVersion": 38,
  "version": 1,
  "refresh": "30s",
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "templating": {
    "list": []
  },
  "panels": [
    {
      "id": 1,
      "type": "stat",
      "title": "Request Rate",
      "gridPos": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m]))",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "yellow", "value": 100 },
              { "color": "red", "value": 500 }
            ]
          }
        }
      }
    }
  ]
}
```

**Key Panel Types**:
- `stat` - Single value with thresholds
- `timeseries` - Time series graphs
- `gauge` - Circular gauge with thresholds
- `table` - Tabular data
- `row` - Collapsible section

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Grafonnet (Jsonnet) | Learning curve, existing dashboards are JSON |
| Dashboard as code tools | Overkill for 5 dashboards |

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Node.js metrics | prom-client + perf_hooks | Already in use, comprehensive |
| Grafana alerting | File-based unified alerting | Reproducible, version-controlled |
| Recording rules | Pre-compute p95/p99/rates | Dashboard performance |
| MongoDB metrics | Mongoose events + optional exporter | Simple, no new dependencies |
| Dashboard format | Native Grafana JSON | Existing dashboards use this |

---

## References

- [prom-client documentation](https://github.com/siimon/prom-client)
- [Grafana Unified Alerting Provisioning](https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting-resources/file-provisioning/)
- [Prometheus Recording Rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Node.js perf_hooks](https://nodejs.org/api/perf_hooks.html)
- [Grafana Dashboard JSON Model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/)
