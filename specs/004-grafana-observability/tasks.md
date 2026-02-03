# Tasks: Grafana Observability Stack

**Input**: Design documents from `/specs/004-grafana-observability/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as the plan specifies unit and integration tests in `tests/` directory.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Docker infrastructure**: `docker/prometheus/`, `docker/grafana/`
- Paths based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create public metrics endpoint and enable default metrics collection

- [x] T001 Create public metrics endpoint (no auth) in src/routes/metricsRoutes.js
- [x] T002 [P] Enable prom-client collectDefaultMetrics() in src/utils/metrics.js
- [x] T003 [P] Update Prometheus scrape config to use /metrics path in docker/prometheus/prometheus.yml
- [x] T004 [P] Configure Prometheus retention to 15 days in docker/prometheus/prometheus.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core metrics infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add event loop lag metric using perf_hooks in src/utils/metrics.js
- [x] T006 [P] Add http_requests_total counter with method/route/status_code labels in src/utils/metrics.js
- [x] T007 [P] Add http_request_duration_seconds histogram with proper buckets in src/utils/metrics.js
- [x] T008 [P] Add application_errors_total counter with type/route labels in src/utils/metrics.js
- [x] T009 Create HTTP metrics middleware in src/middleware/metricsMiddleware.js
- [x] T010 Register metrics middleware in Express app in src/server.js
- [x] T011 Add route normalization (parameterized paths) in src/middleware/metricsMiddleware.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Operations Team Monitors Application Health (Priority: P1) 🎯 MVP

**Goal**: Enable operations team to view overall application health and performance in real-time

**Independent Test**: Access the Application Overview dashboard and verify health metrics (uptime, error rate, response time) display and update in real-time

### Tests for User Story 1

- [x] T012 [P] [US1] Create metrics endpoint test in tests/unit/metrics.test.js
- [x] T013 [P] [US1] Create HTTP metrics middleware test in tests/unit/metricsMiddleware.test.js

### Implementation for User Story 1

- [x] T014 [P] [US1] Add http_connections_active gauge in src/utils/metrics.js
- [x] T015 [US1] Update Application Overview dashboard with health panels in docker/grafana/dashboards/main-overview.json
- [x] T016 [US1] Add request rate stat panel with thresholds in docker/grafana/dashboards/main-overview.json
- [x] T017 [US1] Add error rate stat panel with color thresholds in docker/grafana/dashboards/main-overview.json
- [x] T018 [US1] Add P95 latency stat panel in docker/grafana/dashboards/main-overview.json
- [x] T019 [US1] Add traffic time series panel (requests per second by status code) in docker/grafana/dashboards/main-overview.json
- [x] T020 [US1] Add error breakdown pie chart panel in docker/grafana/dashboards/main-overview.json
- [x] T021 [US1] Configure dashboard auto-refresh at 30 seconds in docker/grafana/dashboards/main-overview.json
- [x] T022 [US1] Create dashboard provisioning config in docker/grafana/provisioning/dashboards/dashboards.yml

**Checkpoint**: User Story 1 complete - operations team can monitor application health

---

## Phase 4: User Story 2 - DevOps Engineer Investigates API Performance (Priority: P1)

**Goal**: Enable DevOps engineers to see detailed API endpoint performance metrics with latency percentiles

**Independent Test**: Generate traffic to various endpoints and verify the API Performance dashboard shows accurate latency distributions (p50, p95, p99), throughput, and error rates per endpoint

### Implementation for User Story 2

- [x] T023 [P] [US2] Update API Performance dashboard structure in docker/grafana/dashboards/http-api-performance.json
- [x] T024 [US2] Add latency percentiles time series panel (p50, p95, p99) in docker/grafana/dashboards/http-api-performance.json
- [x] T025 [US2] Add per-endpoint performance table panel in docker/grafana/dashboards/http-api-performance.json
- [x] T026 [US2] Add top routes by traffic time series panel in docker/grafana/dashboards/http-api-performance.json
- [x] T027 [US2] Add status code distribution time series panel in docker/grafana/dashboards/http-api-performance.json
- [x] T028 [US2] Add route and method template variables for filtering in docker/grafana/dashboards/http-api-performance.json
- [x] T029 [US2] Configure dashboard time range presets (15m, 1h, 6h, 24h, 7d) in docker/grafana/dashboards/http-api-performance.json

**Checkpoint**: User Story 2 complete - engineers can drill down into endpoint performance

---

## Phase 5: User Story 3 - Operations Team Receives Alerts (Priority: P1)

**Goal**: Configure automated alerting for critical threshold breaches visible in Grafana

**Independent Test**: Simulate threshold breaches (high error rate, high latency) and verify alerts trigger and display in Grafana alerting interface

### Implementation for User Story 3

- [x] T030 [P] [US3] Create Prometheus alert rules directory structure at docker/prometheus/alerts/
- [x] T031 [US3] Create high error rate alert rule (>5% for 5m) in docker/prometheus/alerts/rules.yml
- [x] T032 [US3] Create high latency alert rule (p95 >2s for 5m) in docker/prometheus/alerts/rules.yml
- [x] T033 [US3] Create scrape failure alert rule (down for 2m) in docker/prometheus/alerts/rules.yml
- [x] T034 [US3] Update Prometheus config to load alert rules in docker/prometheus/prometheus.yml
- [x] T035 [US3] Create Grafana alerting provisioning directory at docker/grafana/provisioning/alerting/
- [x] T036 [US3] Create Grafana unified alerting rules in docker/grafana/provisioning/alerting/alerts.yml
- [x] T037 [US3] Configure alert severity labels (critical, warning) in docker/grafana/provisioning/alerting/alerts.yml

**Checkpoint**: User Story 3 complete - automated alerting operational

---

## Phase 6: User Story 4 - Database Administrator Monitors MongoDB (Priority: P2)

**Goal**: Enable database administrators to monitor MongoDB performance metrics

**Independent Test**: Access the Database Performance dashboard and verify MongoDB metrics (connections, operations, query performance) display correctly

### Implementation for User Story 4

- [x] T038 [P] [US4] Add mongodb_connections_current gauge with state labels in src/utils/metrics.js
- [x] T039 [P] [US4] Add database_operations_total counter with operation/collection labels in src/utils/metrics.js
- [x] T040 [P] [US4] Add database_operation_duration_seconds histogram in src/utils/metrics.js
- [x] T041 [US4] Add mongodb_query_slow_total counter in src/utils/metrics.js
- [x] T042 [US4] Implement MongoDB connection pool monitoring via Mongoose events in src/config/database.js
- [x] T043 [US4] Update Database Performance dashboard with connection pool gauge in docker/grafana/dashboards/database-performance.json
- [x] T044 [US4] Add operations per second by type time series in docker/grafana/dashboards/database-performance.json
- [x] T045 [US4] Add operations by collection time series in docker/grafana/dashboards/database-performance.json
- [x] T046 [US4] Add query duration P95 panel in docker/grafana/dashboards/database-performance.json
- [x] T047 [US4] Add slow queries time series panel in docker/grafana/dashboards/database-performance.json
- [x] T048 [US4] Add MongoDB pool exhaustion alert (>80%) in docker/prometheus/alerts/rules.yml

**Checkpoint**: User Story 4 complete - database monitoring operational

---

## Phase 7: User Story 5 - Business Stakeholder Views Delivery Metrics (Priority: P2)

**Goal**: Enable business stakeholders to see business-level metrics about shipments and fleet

**Independent Test**: Create shipments and verify the Business Metrics dashboard reflects accurate counts, fleet utilization, and user metrics

### Implementation for User Story 5

- [x] T049 [P] [US5] Add applications_by_status gauge in src/utils/metrics.js
- [x] T050 [P] [US5] Add users_total gauge with role labels in src/utils/metrics.js
- [x] T051 [P] [US5] Add shipments_created_total counter in src/utils/metrics.js
- [x] T052 [US5] Implement periodic business metrics collection function in src/utils/metricScheduler.js
- [x] T053 [US5] Update Business Metrics dashboard with shipment overview stats in docker/grafana/dashboards/business-metrics.json
- [x] T054 [US5] Add shipments by status pie chart in docker/grafana/dashboards/business-metrics.json
- [x] T055 [US5] Add fleet utilization gauge panel in docker/grafana/dashboards/business-metrics.json
- [x] T056 [US5] Add trucks by status pie chart in docker/grafana/dashboards/business-metrics.json
- [x] T057 [US5] Add user metrics stat panels (total, by role) in docker/grafana/dashboards/business-metrics.json
- [x] T058 [US5] Add applications by status time series in docker/grafana/dashboards/business-metrics.json
- [x] T059 [US5] Configure 60-second refresh for business dashboard in docker/grafana/dashboards/business-metrics.json

**Checkpoint**: User Story 5 complete - business metrics dashboard operational

---

## Phase 8: User Story 6 - DevOps Engineer Monitors Infrastructure (Priority: P3)

**Goal**: Enable DevOps engineers to monitor Node.js runtime metrics and system resources

**Independent Test**: Access the Infrastructure dashboard and verify Node.js process metrics (memory, CPU, event loop, GC) display accurately

### Implementation for User Story 6

- [x] T060 [P] [US6] Create Infrastructure dashboard file in docker/grafana/dashboards/infrastructure.json
- [x] T061 [US6] Add heap usage gauge with threshold in docker/grafana/dashboards/infrastructure.json
- [x] T062 [US6] Add memory over time panel (heap used, total, RSS) in docker/grafana/dashboards/infrastructure.json
- [x] T063 [US6] Add CPU usage time series panel in docker/grafana/dashboards/infrastructure.json
- [x] T064 [US6] Add event loop lag gauge (P99) in docker/grafana/dashboards/infrastructure.json
- [x] T065 [US6] Add event loop lag time series in docker/grafana/dashboards/infrastructure.json
- [x] T066 [US6] Add GC duration and frequency panels in docker/grafana/dashboards/infrastructure.json
- [x] T067 [US6] Add active handles and requests panel in docker/grafana/dashboards/infrastructure.json
- [x] T068 [US6] Add high memory usage alert (>80%) in docker/prometheus/alerts/rules.yml
- [x] T069 [US6] Add high event loop lag alert (p99 >100ms) in docker/prometheus/alerts/rules.yml

**Checkpoint**: User Story 6 complete - infrastructure monitoring operational

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, validation, and documentation updates

- [x] T070 [P] Create integration test for metrics scrape endpoint in tests/integration/observability.test.js
- [x] T071 [P] Create Prometheus recording rules for dashboard performance in docker/prometheus/recording-rules.yml
- [x] T072 Update Prometheus config to load recording rules in docker/prometheus/prometheus.yml
- [ ] T073 Verify all dashboards load under 5 seconds (manual validation)
- [ ] T074 Run quickstart.md deployment validation (manual)
- [ ] T075 Verify metrics overhead <5% (manual performance test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - P1 stories (US1, US2, US3) can proceed in parallel
  - P2 stories (US4, US5) can proceed in parallel after Foundational
  - P3 story (US6) can proceed after Foundational
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Metrics collection tasks before dashboard tasks
- Dashboard structure before individual panels
- Core implementation before alerting integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All metrics collection tasks within a story marked [P] can run in parallel
- Dashboard panel tasks within a story can often run in parallel after structure is created

---

## Parallel Example: User Stories 1, 2, 3 (All P1)

```bash
# After Foundational phase completes, launch all P1 stories in parallel:

# User Story 1 - Application Health (1 developer)
Task: "T012 Create metrics endpoint test"
Task: "T013 Create HTTP metrics middleware test"
# Then: T014-T022 (dashboard implementation)

# User Story 2 - API Performance (1 developer)
Task: "T023 Update API Performance dashboard structure"
# Then: T024-T029 (panel implementation)

# User Story 3 - Alerting (1 developer)
Task: "T030 Create Prometheus alert rules directory"
# Then: T031-T037 (alert rules implementation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 (T012-T022)
4. **STOP and VALIDATE**: Test Application Overview dashboard independently
5. Deploy/demo if ready - operations team can monitor health

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP - Health Monitoring)
3. Add User Story 2 → Test independently → Deploy (API Performance)
4. Add User Story 3 → Test independently → Deploy (Alerting)
5. Add User Story 4 → Test independently → Deploy (Database Monitoring)
6. Add User Story 5 → Test independently → Deploy (Business Metrics)
7. Add User Story 6 → Test independently → Deploy (Infrastructure)
8. Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Health) + User Story 4 (Database)
   - Developer B: User Story 2 (API) + User Story 5 (Business)
   - Developer C: User Story 3 (Alerts) + User Story 6 (Infrastructure)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Existing dashboards in `docker/grafana/dashboards/` will be enhanced (not replaced)
- Metrics in `src/utils/metrics.js` extend existing prom-client setup
- All dashboards use Prometheus datasource already configured
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
