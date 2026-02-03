# Feature Specification: MVP Merchant FTL Quote Flow

**Feature Branch**: `001-mvp-merchant-ftl-quote`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "Merchant-first MVP for Egypt -> GCC, FTL only, request-quote only, admin assigns broker, Google Maps tracking/ETA, payment proof upload."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request and Approve Quote (Priority: P1)

A merchant creates an FTL shipment request, receives a quote, and approves it to
start the shipment workflow.

**Why this priority**: This is the minimum viable commercial flow to move freight.

**Independent Test**: A merchant can create a shipment request and approve a
received quote without needing any tracking or compliance steps.

**Acceptance Scenarios**:

1. **Given** a merchant account, **When** the merchant submits an FTL request,
   **Then** the request is created with status "Quote Requested".
2. **Given** an active request, **When** a quote is submitted and the merchant
   accepts it, **Then** the shipment transitions to "Quote Accepted" and is ready
   for compliance validation.

---

### User Story 2 - Compliance Checklist and Broker Assignment (Priority: P2)

An admin assigns a broker-of-record, and the merchant completes required
compliance documentation before dispatch.

**Why this priority**: Cross-border shipments require compliance proof and broker
assignment; this gate prevents illegal dispatch.

**Independent Test**: A shipment cannot be marked "Ready to Dispatch" until the
broker is assigned and required documents are uploaded.

**Acceptance Scenarios**:

1. **Given** a quote-accepted shipment, **When** an admin assigns a broker,
   **Then** the shipment shows the broker assignment and compliance checklist.
2. **Given** required documents are uploaded, **When** the compliance checklist
   is complete, **Then** the shipment becomes "Ready to Dispatch".

---

### User Story 3 - Track and Close Shipment (Priority: P3)

A merchant views live tracking and ETA updates, then receives proof of delivery
and completes the shipment.

**Why this priority**: Tracking and POD close the loop for merchant confidence
and payment reconciliation.

**Independent Test**: A merchant can view a live location update and see the last
update time without needing full analytics or ERP integration.

**Acceptance Scenarios**:

1. **Given** a shipment in transit, **When** a location update is received,
   **Then** the merchant tracking view shows the updated position and timestamp.
2. **Given** a delivered shipment, **When** POD is uploaded, **Then** the
   shipment can be marked "Delivered" and closed.

---

### Edge Cases

- What happens when a merchant attempts to dispatch without ACID proof?
- How does the system handle missing documents for GAFTA when the merchant
  selected duty preference?
- What happens when tracking updates stop for more than the allowed interval?
- How does the system handle a quote that expires before acceptance?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow merchants to create FTL shipment requests with
  origin, destination, cargo details, and requested pickup date.
- **FR-002**: System MUST support a request-quote workflow with quote submission
  and merchant acceptance.
- **FR-003**: System MUST allow admins to assign a broker-of-record to a shipment.
- **FR-004**: System MUST enforce a compliance checklist that blocks dispatch
  until required documents and ACID proof are provided.
- **FR-005**: System MUST store ACID number and ACI proof metadata for each
  shipment.
- **FR-006**: System MUST track Incoterm selection and require insurance proof
  only when the Incoterm mandates it.
- **FR-007**: System MUST allow merchants to upload payment proof (PDF/image) and
  mark payments as submitted.
- **FR-008**: System MUST provide a live tracking view with last-update timestamp
  and estimated arrival time.
- **FR-009**: System MUST allow POD upload and mark shipments delivered.

### Key Entities *(include if feature involves data)*

- **ShipmentRequest**: Merchant shipment request with route, cargo, and status.
- **Quote**: Carrier pricing proposal tied to a shipment request.
- **ComplianceChecklist**: Required documents, ACID proof, and broker assignment.
- **BrokerAssignment**: Broker-of-record linked to shipment.
- **TrackingUpdate**: Location updates with timestamps and ETA.
- **PaymentProof**: Uploaded evidence of direct-to-carrier payment.

## Assumptions & Dependencies

- Merchants and admins exist as authenticated users with role-based access.
- A broker-of-record can be assigned from an internal broker directory.
- Tracking updates are provided by driver or carrier systems.
- Documents are stored and retrievable for compliance review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A merchant can submit a complete shipment request in under 5 minutes.
- **SC-002**: Compliance checklist prevents dispatch when required items are missing.
- **SC-003**: Tracking view shows latest update within 10 seconds of receiving a
  location update.
- **SC-004**: At least 90% of merchants can complete quote acceptance without
  support during pilot testing.
