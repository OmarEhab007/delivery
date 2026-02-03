# Feature Specification: Truck Owner and Driver Portals

**Feature Branch**: `002-truck-owner-driver-portals`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "Phase 2 portals for truck owners and drivers: bidding, assignment, tracking updates, POD uploads."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Truck Owner Bidding and Load Management (Priority: P1)

A truck owner views available shipments, submits bids, and manages their active loads.

**Why this priority**: Carriers must engage with the platform to fulfill merchant requests.

**Independent Test**: A truck owner can submit a bid and see it listed on their dashboard.

**Acceptance Scenarios**:

1. **Given** available shipments, **When** a truck owner submits a bid,
   **Then** the bid appears in their active applications list.
2. **Given** a bid is accepted, **When** the shipment is assigned,
   **Then** the truck owner sees the shipment in active loads.

---

### User Story 2 - Driver Assignment and Fleet Visibility (Priority: P2)

Truck owners assign drivers to shipments and track driver availability.

**Why this priority**: Dispatch requires assigning drivers to loads.

**Independent Test**: A truck owner can assign a driver to an active shipment.

**Acceptance Scenarios**:

1. **Given** an active shipment, **When** a truck owner assigns a driver,
   **Then** the driver is linked to the shipment.
2. **Given** a driver is unavailable, **When** dispatching a shipment,
   **Then** the system prevents assignment and shows availability status.

---

### User Story 3 - Driver Location and Milestones (Priority: P3)

Drivers update location and milestone status, and upload proof of delivery.

**Why this priority**: Reliable tracking and POD are necessary to close shipments.

**Independent Test**: A driver can submit a location update and a delivery milestone.

**Acceptance Scenarios**:

1. **Given** a driver on an assigned shipment, **When** they submit a location update,
   **Then** the shipment tracking reflects the new location.
2. **Given** a delivery is complete, **When** the driver uploads POD,
   **Then** the shipment can be marked delivered.

---

### Edge Cases

- What happens when a truck owner attempts to bid on an expired shipment?
- How does the system handle driver reassignment mid-route?
- What happens when a driver is offline and uploads location data later?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide truck owners a list of available shipments for bidding.
- **FR-002**: System MUST allow truck owners to submit bids and track bid status.
- **FR-003**: System MUST allow truck owners to assign drivers to active shipments.
- **FR-004**: System MUST track driver availability and prevent invalid assignments.
- **FR-005**: System MUST allow drivers to send location updates and status milestones.
- **FR-006**: System MUST allow drivers to upload POD and issue reports.

### Key Entities _(include if feature involves data)_

- **Bid/Application**: Carrier bid for a shipment.
- **DriverAssignment**: Link between shipment, truck, and driver.
- **DriverStatus**: Availability and current assignment state.
- **Milestone**: Shipment status updates from the driver.

## Assumptions & Dependencies

- Shipment request and quote acceptance workflows exist.
- Drivers are already registered under truck owner accounts.
- Tracking and document storage services are available.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A truck owner can submit a bid in under 3 minutes.
- **SC-002**: Driver assignment is completed without admin intervention 95% of the time.
- **SC-003**: Location updates appear in tracking within 10 seconds of submission.
