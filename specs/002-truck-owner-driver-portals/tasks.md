# Tasks: Truck Owner and Driver Portals

**Input**: Design documents from `/specs/002-truck-owner-driver-portals/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Add carrier portal navigation entry in `client/src/App.js`
- [ ] T002 [P] Add driver portal navigation entry in `client/src/App.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Ensure application/bid endpoints are exposed for truck owners in `src/routes/applicationRoutes.js`
- [ ] T004 Ensure driver status and assignment fields are available in `src/models/User.js` and `src/models/Shipment.js`

---

## Phase 3: User Story 1 - Truck Owner Bidding and Load Management (Priority: P1)

**Goal**: Truck owners can view shipments and submit bids.

**Independent Test**: Submit a bid and see it in the owner dashboard.

### Implementation for User Story 1

- [ ] T005 [P] Build available shipments list view in `client/src/pages/Shipments.js`
- [ ] T006 [P] Build bid submission UI in `client/src/pages/Applications.js`
- [ ] T007 Add controller support for listing available shipments in `src/controllers/shipment/shipmentController.js`

---

## Phase 4: User Story 2 - Driver Assignment and Fleet Visibility (Priority: P2)

**Goal**: Truck owners can assign drivers to shipments.

**Independent Test**: Assign driver to shipment and verify status.

### Implementation for User Story 2

- [ ] T008 [P] Add driver assignment UI in `client/src/pages/Shipments.js`
- [ ] T009 Add assign-driver endpoint in `src/controllers/truck/truckOwnerController.js`
- [ ] T010 Enforce driver availability checks in `src/controllers/truck/truckOwnerController.js`

---

## Phase 5: User Story 3 - Driver Location and Milestones (Priority: P3)

**Goal**: Drivers can update location and milestones.

**Independent Test**: Driver posts a location update and sees it in shipment timeline.

### Implementation for User Story 3

- [ ] T011 [P] Add driver tracking UI in `client/src/pages/Shipments.js`
- [ ] T012 Wire driver location updates to tracking service in `src/services/tracking/trackingService.js`
- [ ] T013 Add POD upload support in `src/controllers/driver/driverController.js`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 Update carrier/driver documentation in `docs/`
- [ ] T015 Add logging for driver assignment and location updates in `src/utils/logger.js`
