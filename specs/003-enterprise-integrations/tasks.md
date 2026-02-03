# Tasks: Enterprise Integrations and Automation

**Input**: Design documents from `/specs/003-enterprise-integrations/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Add integration routes scaffold in `src/routes/`
- [ ] T002 [P] Add webhook delivery job scaffold in `src/services/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Add integration credential model in `src/models/IntegrationCredential.js`
- [ ] T004 Add webhook subscription and delivery models in `src/models/`
- [ ] T005 Add analytics aggregation service in `src/services/reporting/`

---

## Phase 3: User Story 1 - ERP Integration via Webhooks/API (Priority: P1)

**Goal**: APIs and webhooks for enterprise integrations.

**Independent Test**: Webhook receives shipment status event.

### Implementation for User Story 1

- [ ] T006 [P] Implement credential CRUD in `src/controllers/integration/`
- [ ] T007 [P] Implement webhook registration in `src/controllers/integration/`
- [ ] T008 Implement webhook delivery worker in `src/services/notification/`

---

## Phase 4: User Story 2 - Analytics and Performance Reporting (Priority: P2)

**Goal**: Provide KPI and lane reports.

**Independent Test**: Request KPI summary for last month.

### Implementation for User Story 2

- [ ] T009 [P] Add KPI aggregation endpoint in `src/controllers/admin/reportingController.js`
- [ ] T010 Add lane performance endpoint in `src/controllers/admin/reportingController.js`

---

## Phase 5: User Story 3 - Automation Rules (Priority: P3)

**Goal**: Rules for delays and missing updates.

**Independent Test**: Delay rule triggers notification.

### Implementation for User Story 3

- [ ] T011 [P] Add automation rule model in `src/models/AutomationRule.js`
- [ ] T012 Implement rule evaluation service in `src/services/automation/`
- [ ] T013 Add rule CRUD endpoints in `src/controllers/automation/`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 Update enterprise integration docs in `docs/`
- [ ] T015 Add logging and metrics for webhook deliveries in `src/utils/metrics.js`
