# Tasks: MVP Merchant FTL Quote Flow

**Input**: Design documents from `/specs/001-mvp-merchant-ftl-quote/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Create merchant portal route scaffold in `client/src/pages/` and `client/src/components/`
- [ ] T002 [P] Add broker and compliance route placeholders in `src/routes/`
- [ ] T003 [P] Update API documentation entries for new endpoints in `src/docs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Add broker model in `src/models/Broker.js`
- [ ] T005 Add quote model or extend existing application model in `src/models/`
- [ ] T006 Extend shipment model with compliance fields in `src/models/Shipment.js`
- [ ] T007 Add document types for compliance and payment proof in `src/models/Document.js`
- [ ] T008 Add broker assignment controller logic in `src/controllers/admin/`
- [ ] T009 Add compliance upload endpoints in `src/controllers/shipment/`

---

## Phase 3: User Story 1 - Request and Approve Quote (Priority: P1)

**Goal**: Merchant can request and accept a quote for FTL shipment.

**Independent Test**: Create shipment request, submit quote, and accept it.

### Implementation for User Story 1

- [ ] T010 [P] Add merchant shipment request form in `client/src/pages/Shipments.js`
- [ ] T011 [P] Add quote submission/acceptance UI in `client/src/pages/Shipments.js`
- [ ] T012 Implement quote acceptance logic in `src/controllers/shipment/shipmentController.js`
- [ ] T013 Update shipment status transitions for quote workflow in `src/models/Shipment.js`

---

## Phase 4: User Story 2 - Compliance Checklist and Broker Assignment (Priority: P2)

**Goal**: Broker assignment and compliance gating before dispatch.

**Independent Test**: Shipment cannot move to Ready to Dispatch without ACID proof and required docs.

### Implementation for User Story 2

- [ ] T014 [P] Add broker assignment UI in `client/src/pages/Shipments.js`
- [ ] T015 [P] Add compliance checklist UI in `client/src/pages/Shipments.js`
- [ ] T016 Implement broker assignment endpoint in `src/controllers/admin/adminShipmentController.js`
- [ ] T017 Implement compliance upload endpoints in `src/controllers/documentController.js`
- [ ] T018 Enforce compliance gate in `src/controllers/shipment/shipmentController.js`

---

## Phase 5: User Story 3 - Track and Close Shipment (Priority: P3)

**Goal**: Merchant can track shipment and close with POD.

**Independent Test**: Merchant sees location update and can close with POD.

### Implementation for User Story 3

- [ ] T019 [P] Add tracking view in `client/src/pages/Shipments.js`
- [ ] T020 Wire Socket.io tracking init in `src/server.js`
- [ ] T021 Add tracking history endpoint in `src/controllers/shipment/shipmentController.js`
- [ ] T022 Add POD upload and close flow in `src/controllers/documentController.js`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T023 Update merchant documentation in `docs/`
- [ ] T024 [P] Add logging for compliance and payment proof actions in `src/utils/logger.js`
- [ ] T025 Security review of document access for compliance and POD in `src/controllers/documentController.js`
