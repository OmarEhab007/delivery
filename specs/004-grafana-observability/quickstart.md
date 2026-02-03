# Quickstart Guide: Grafana Observability Stack

**Feature**: 004-grafana-observability
**Date**: 2026-02-03

This guide provides step-by-step instructions to deploy and configure the observability stack.

---

## Prerequisites

- Docker and Docker Compose installed
- Delivery application codebase cloned
- Node.js 18+ (for local development)
- Network access to ports 3000, 3002, 9090

---

## Quick Start (5 Minutes)

### Step 1: Start the Stack

```bash
# From project root
docker-compose up -d
```

This starts:
- **Application**: http://localhost:3000
- **Grafana**: http://localhost:3002
- **Prometheus**: http://localhost:9090

### Step 2: Access Grafana

1. Open http://localhost:3002
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted (or skip for development)

### Step 3: Verify Metrics

1. Open http://localhost:3000/metrics
2. Confirm Prometheus-format metrics are displayed
3. In Grafana, go to **Explore** → Select **Prometheus** → Query `up`

---

## Dashboards

All dashboards are pre-provisioned and available immediately:

| Dashboard | URL | Description |
|-----------|-----|-------------|
| Application Overview | `/d/delivery-overview` | Health, traffic, errors |
| API Performance | `/d/http-api-performance` | Endpoint latency, throughput |
| Database Performance | `/d/database-performance` | MongoDB metrics |
| Business Metrics | `/d/business-metrics` | Shipments, fleet, users |
| Infrastructure | `/d/infrastructure` | Node.js runtime metrics |

---

## Alerting

### View Active Alerts

1. In Grafana, go to **Alerting** → **Alert rules**
2. See all configured alerts and their states

### Alert Rules Summary

| Alert | Trigger | Severity |
|-------|---------|----------|
| High Error Rate | >5% 5xx errors for 5m | Critical |
| High Latency | P95 >2s for 5m | Warning |
| MongoDB Pool Exhausted | >80% utilization for 5m | Warning |
| High Memory Usage | >80% heap for 5m | Warning |
| Scrape Failure | Down for 2m | Critical |
| High Event Loop Lag | P99 >100ms for 5m | Warning |

### Test Alerts (Development)

```bash
# Trigger high error rate (for testing)
for i in {1..100}; do
  curl -X GET http://localhost:3000/api/nonexistent-endpoint
done
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | `true` | Enable/disable metrics collection |
| `METRICS_PREFIX` | `delivery_` | Prefix for custom metrics |
| `PROMETHEUS_PORT` | `9090` | Prometheus server port |
| `GRAFANA_PORT` | `3002` | Grafana server port |

### Prometheus Configuration

Location: `docker/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'delivery-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: /metrics

rule_files:
  - /etc/prometheus/alerts/*.yml
```

### Data Retention

- **Prometheus**: 15 days (configurable via `--storage.tsdb.retention.time`)
- **Grafana**: Persistent via Docker volume

---

## Troubleshooting

### Metrics Not Appearing

1. Check application is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check metrics endpoint:
   ```bash
   curl http://localhost:3000/metrics
   ```

3. Check Prometheus targets:
   - Open http://localhost:9090/targets
   - Verify `delivery-app` shows **UP**

### Dashboard Shows "No Data"

1. Verify time range is appropriate (last 1h recommended)
2. Check Prometheus datasource in Grafana:
   - Go to **Configuration** → **Data sources**
   - Test the Prometheus connection
3. Run a test query in Explore:
   ```promql
   http_requests_total
   ```

### Alerts Not Firing

1. Check alert rule status:
   - Go to **Alerting** → **Alert rules**
   - Look for error states
2. Verify alert conditions are met:
   - Use Explore to test the alert query
3. Check notification channels (if configured)

### High Memory Usage in Prometheus

1. Check cardinality:
   ```promql
   count({__name__=~".+"}) by (__name__)
   ```
2. Review metric labels for unbounded values
3. Reduce retention if needed:
   ```yaml
   # In docker-compose.yml
   command:
     - '--storage.tsdb.retention.time=7d'
   ```

---

## Useful PromQL Queries

### Request Analysis

```promql
# Request rate by endpoint
sum by (route) (rate(http_requests_total[5m]))

# Error rate percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# Slowest endpoints (P99)
topk(5, histogram_quantile(0.99,
  sum by (le, route) (rate(http_request_duration_seconds_bucket[5m]))))
```

### Resource Analysis

```promql
# Memory usage trend
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# CPU usage
rate(process_cpu_seconds_total[5m]) * 100

# Event loop lag
nodejs_eventloop_lag_seconds{percentile="p99"}
```

### Business Metrics

```promql
# Active shipments
sum(shipments_by_status{status=~"IN_TRANSIT|LOADING|ASSIGNED"})

# Fleet utilization
sum(trucks_by_status{status="IN_SERVICE"}) / sum(trucks_by_status) * 100
```

---

## Next Steps

1. **Configure Notifications** (Optional)
   - Add Slack/Email contact points in Grafana
   - Update alert notification policies

2. **Add Custom Dashboards**
   - Create team-specific views
   - Import community dashboards from grafana.com

3. **Scale for Production**
   - Consider Prometheus HA with Thanos
   - Add long-term storage for metrics
   - Configure SSO for Grafana

---

## Support

- **Grafana Documentation**: https://grafana.com/docs/
- **Prometheus Documentation**: https://prometheus.io/docs/
- **prom-client (Node.js)**: https://github.com/siimon/prom-client
