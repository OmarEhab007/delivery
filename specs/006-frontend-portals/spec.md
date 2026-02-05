# Feature Specification: Next.js Frontend Portals

**Feature Branch**: `006-frontend-portals`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "Next.js 14 frontend under /frontend with shadcn/ui for Admin, Merchant, Truck Owner, and Driver portals. Include auth flows and align visual identity to provided Figma."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auth + Role Routing (Priority: P1)

A user can register or log in, receive tokens, and is routed to the correct portal based on role.

**Why this priority**: Without auth and role routing, none of the portals are accessible.

**Independent Test**: A user can log in, obtain tokens, and land on the correct portal home.

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** a user logs in, **Then** tokens are stored and the user is routed to the correct portal.
2. **Given** a pending registration, **When** a user attempts to log in, **Then** the UI shows approval status guidance.
3. **Given** an expired access token, **When** a protected API call fails, **Then** the refresh flow retries and continues the session.

---

### User Story 2 - Admin Control Center (Priority: P1)

Admins can manage users, shipments, applications, trucks, documents, and view reports.

**Why this priority**: Admin oversight is required for approvals and system operations.

**Independent Test**: An admin can approve a registration request and view the user in the users list.

**Acceptance Scenarios**:

1. **Given** pending registration requests, **When** an admin approves a request, **Then** the user appears as active in the users list.
2. **Given** a shipment, **When** an admin updates or assigns data (broker, status, etc.), **Then** the shipment reflects the change.
3. **Given** a report endpoint, **When** an admin views a dashboard, **Then** the UI renders the metrics without errors.

---

### User Story 3 - Merchant Shipment Workflow (Priority: P1)

Merchants can request shipments, review quotes, upload documents, and track shipments to completion.

**Why this priority**: Merchant workflow drives the core revenue flow.

**Independent Test**: A merchant creates a shipment request and sees it in their shipments list.

**Acceptance Scenarios**:

1. **Given** the merchant portal, **When** a merchant submits a shipment request, **Then** it appears with status "Quote Requested".
2. **Given** a quote is available, **When** the merchant accepts it, **Then** the shipment progresses to the next stage.
3. **Given** an in-transit shipment, **When** tracking updates arrive, **Then** the merchant sees the updated location and timestamp.

---

### User Story 4 - Truck Owner Bidding & Dispatch (Priority: P2)

Truck owners can view available shipments, submit bids, and assign drivers to accepted loads.

**Why this priority**: Truck owners provide the capacity necessary to fulfill shipments.

**Independent Test**: A truck owner submits a bid and sees it in their applications list.

**Acceptance Scenarios**:

1. **Given** available shipments, **When** a truck owner submits a bid, **Then** the bid appears in their applications list.
2. **Given** an accepted bid, **When** a truck owner assigns a driver, **Then** the shipment shows the assignment.

---

### User Story 5 - Driver Execution & Proof (Priority: P3)

Drivers can update status, share location, upload POD, and report issues.

**Why this priority**: Driver updates close the loop on delivery and compliance.

**Independent Test**: A driver submits a status update and sees it reflected on their shipment.

**Acceptance Scenarios**:

1. **Given** an assigned shipment, **When** the driver posts a status update, **Then** the shipment timeline reflects the change.
2. **Given** a delivered shipment, **When** the driver uploads POD, **Then** the shipment can be marked delivered.

---

### Edge Cases

- What happens when an access token expires and refresh fails?
- How does the UI handle role mismatch (e.g., user tries to access /admin without Admin role)?
- What happens when a large document upload fails mid-transfer?
- How does the UI respond if tracking updates stop for an extended interval?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Next.js 14 frontend under `/frontend` using the App Router.
- **FR-002**: System MUST use `shadcn/ui` components for shared UI patterns and layouts.
- **FR-003**: System MUST implement auth flows (login, registration, refresh, logout) with role-based routing.
- **FR-004**: System MUST provide separate portal routes for Admin, Merchant, Truck Owner, and Driver.
- **FR-005**: System MUST integrate with backend REST APIs under `/api` including CSRF token handling.
- **FR-006**: System MUST support document uploads (POD, compliance, payment proof) with status feedback.
- **FR-007**: System MUST present shipment tracking information with timestamps and status history.
- **FR-008**: System MUST align visual identity to the provided Figma design (colors, typography, layout).

### Key Entities *(include if feature involves data)*

- **Session**: Access/refresh tokens, expiration, user role.
- **UserProfile**: Admin, Merchant, TruckOwner, Driver profiles and permissions.
- **Shipment**: Status, routing, assignments, documents, timeline events.
- **Application/Bid**: Truck owner bids with pricing and status.
- **Truck/Driver**: Fleet details, availability, assignments.
- **Document**: Upload metadata, validation status, associated entity.
- **TrackingUpdate**: Location coordinates, timestamp, ETA.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log in and reach their portal home in under 30 seconds.
- **SC-002**: Admin approval flow completes in under 2 minutes for a pending registration.
- **SC-003**: Merchants can submit a shipment request in under 5 minutes.
- **SC-004**: Drivers can upload POD in under 2 minutes with a success confirmation.
