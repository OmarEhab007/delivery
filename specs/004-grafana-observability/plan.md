# Implementation Plan: Grafana Observability Stack

**Branch**: `004-grafana-observability` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-grafana-observability/spec.md`

## Summary

Enhance the existing observability infrastructure with production-ready Grafana dashboards, comprehensive alerting rules, improved metrics collection, and proper infrastructure configuration. The project already has Prometheus/Grafana in Docker Compose and basic metrics collection via prom-client - this plan extends it to meet full production observability requirements.

## Technical Context

**Language/Version**: Node.js (existing Express.js application)
**Primary Dependencies**: prom-client (existing), Express.js, Mongoose/MongoDB
**Storage**: MongoDB (existing), Prometheus TSDB (15-day retention), Grafana SQLite
**Testing**: Jest (existing), manual dashboard validation, metrics endpoint testing
**Target Platform**: Docker Compose (on-premises deployment)
**Project Type**: Single backend application with monitoring infrastructure
**Performance Goals**: <5% metrics overhead, <5s dashboard load time, 30s scrape interval
**Constraints**: On-premises deployment, no external notification channels initially
**Scale/Scope**: Single application instance, 5 dashboards, 6 alert rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template is not yet configured for this project. Proceeding with standard engineering best practices:

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | ✅ PASS | Using existing infrastructure (prom-client, Docker Compose) |
| Testability | ✅ PASS | Metrics endpoint testable, dashboards manually verifiable |
| Observability | ✅ PASS | This feature IS the observability implementation |
| Documentation | ✅ PASS | quickstart.md will provide deployment guide |

## Project Structure

### Documentation (this feature)

```text
specs/004-grafana-observability/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (metrics schema)
├── quickstart.md        # Phase 1 output (deployment guide)
├── contracts/           # Phase 1 output (PromQL queries, alert specs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Existing structure - extending with observability enhancements
src/
├── utils/
│   └── metrics.js           # ENHANCE: Add business metrics, event loop, GC
├── middleware/
│   └── metricsMiddleware.js # NEW: Dedicated HTTP metrics middleware
└── routes/
    └── metricsRoutes.js     # ENHANCE: Public scrape endpoint

docker/
├── prometheus/
│   ├── prometheus.yml       # ENHANCE: Scrape config, retention
│   └── alerts/              # NEW: Alert rules
│       └── rules.yml
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── prometheus.yml  # EXISTS: Already configured
    │   ├── dashboards/
    │   │   └── dashboards.yml  # NEW: Dashboard provisioning
    │   └── alerting/           # NEW: Alert provisioning
    │       └── alerts.yml
    └── dashboards/
        ├── main-overview.json       # EXISTS: Enhance
        ├── http-api-performance.json # EXISTS: Enhance
        ├── database-performance.json # EXISTS: Enhance
        ├── business-metrics.json     # EXISTS: Enhance
        ├── error-monitoring.json     # EXISTS: Convert to Infrastructure
        └── infrastructure.json       # NEW: Node.js runtime metrics

tests/
├── unit/
│   └── metrics.test.js      # NEW: Metrics collection tests
└── integration/
    └── observability.test.js # NEW: End-to-end scrape tests
```

**Structure Decision**: Extending existing single-project structure. All observability code integrates into the existing Express.js application and Docker Compose infrastructure.

## Complexity Tracking

> No constitution violations - using existing infrastructure patterns.

| Aspect | Decision | Justification |
|--------|----------|---------------|
| Metrics library | Keep prom-client | Already in use, well-suited for Node.js |
| Dashboard count | 5 dashboards | Matches spec requirements, no over-engineering |
| Alert rules | 6 rules | Core alerts only, external channels deferred |

---

## Phase 0: Research

### Research Tasks

1. **Node.js metrics best practices**: Event loop lag, GC metrics, heap monitoring
2. **Grafana alerting provisioning**: YAML format for unified alerting
3. **Prometheus recording rules**: Pre-compute expensive queries
4. **MongoDB metrics via Mongoose**: Connection pool monitoring approaches
5. **Dashboard JSON structure**: Grafana 9.x+ dashboard schema

### Findings

See [research.md](./research.md) for detailed findings.

---

## Phase 1: Design

### 1.1 Metrics Schema

See [data-model.md](./data-model.md) for complete metrics catalog.

**Summary of metrics by category:**

| Category | Metric Count | Type |
|----------|--------------|------|
| HTTP Request | 4 | Counter, Histogram |
| Node.js Runtime | 6 | Gauge |
| MongoDB | 4 | Gauge, Counter |
| Business | 5 | Gauge, Counter |
| Alerts | 6 | AlertRule |

### 1.2 API Contracts

See [contracts/](./contracts/) directory for:
- `prometheus-scrape.md` - Metrics endpoint specification
- `alert-rules.yml` - Prometheus/Grafana alerting rules
- `dashboard-queries.md` - PromQL queries for each dashboard panel

### 1.3 Deployment Guide

See [quickstart.md](./quickstart.md) for step-by-step deployment instructions.

---

## Phase 2: Implementation Tasks

*Generated by `/speckit.tasks` command - see [tasks.md](./tasks.md)*

### Task Groups (Preview)

1. **Metrics Enhancement** (P1)
   - Add event loop lag metric
   - Add GC metrics collection
   - Add business metrics (user registrations, applications)
   - Create public scrape endpoint (no auth for Prometheus)

2. **Dashboard Improvements** (P1)
   - Update Application Overview dashboard
   - Update API Performance dashboard with p50/p95/p99
   - Create Infrastructure dashboard (Node.js runtime)
   - Enhance Business Metrics dashboard

3. **Alerting Setup** (P1)
   - Create Prometheus alert rules
   - Configure Grafana alert provisioning
   - Add scrape failure alert

4. **Infrastructure Configuration** (P2)
   - Update Prometheus retention to 15 days
   - Add dashboard provisioning configuration
   - Create MongoDB exporter integration (optional)

5. **Testing & Documentation** (P3)
   - Unit tests for metrics collection
   - Integration test for scrape endpoint
   - Update deployment documentation

---

## Appendix: Existing Infrastructure Audit

### What Already Exists

| Component | Status | Notes |
|-----------|--------|-------|
| prom-client | ✅ Installed | v14.x in package.json |
| Prometheus container | ✅ Configured | Port 9090, 15s scrape |
| Grafana container | ✅ Configured | Port 3002, admin auth |
| Metrics middleware | ✅ Exists | HTTP duration, counters |
| Datasource provisioning | ✅ Exists | Prometheus connected |
| 5 Dashboards | ✅ Exists | Need enhancement |

### What Needs Enhancement

| Component | Gap | Priority |
|-----------|-----|----------|
| Metrics endpoint | Requires auth (blocks Prometheus scrape) | P1 |
| Event loop metrics | Not collected | P1 |
| GC metrics | Not collected | P2 |
| Alert rules | None configured | P1 |
| Dashboard provisioning | Manual only | P2 |
| Prometheus retention | Default (not 15d) | P2 |
| Business metrics | Partial (shipments, trucks only) | P2 |
