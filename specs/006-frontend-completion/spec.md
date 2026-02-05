# Feature Specification: Frontend Completion & Backend Wiring

**Feature Branch**: `006-frontend-completion`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "Continue planning/specifying/implementing frontend so missing pages and business flows work. Wire driver flows, tracking, admin user creation, admin shipment details, and fix notification button; use Speckit."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Driver Workflow Fully Wired (Priority: P1)

Drivers need the dashboard, assigned shipments, history, check-in/out, delivery start/complete, issue reporting, and tracking to call real backend endpoints with sensible fallbacks.

**Why this priority**: Driver execution is core to shipment completion and tracking integrity. Currently these are mocked and block real use.

**Independent Test**: Login as driver, open dashboard, start a delivery, update status, report issue, complete delivery, and see history updated.

**Acceptance Scenarios**:

1. **Given** a logged-in driver, **When** they open the dashboard, **Then** it shows backend-derived active shipment and truck data.
2. **Given** a driver with assigned shipments, **When** they open "شحناتي", **Then** the list comes from backend and supports status tabs.
3. **Given** a driver starting a delivery, **When** they submit the start form, **Then** `/api/driver/shipments/:id/start` is called and status updates.
4. **Given** a driver completing a delivery, **When** they submit the complete form, **Then** `/api/driver/shipments/:id/complete` is called and proof uploads are attempted.
5. **Given** a driver reporting an issue, **When** they submit the issue form, **Then** `/api/driver/shipments/:id/issues` is called with issue data.

---

### User Story 2 - Admin Shipment Detail & Actions (Priority: P1)

Admins need a working shipment details page with status actions, assignment, and compliance visibility.

**Why this priority**: Admin workflows are required for approval, assignment, and oversight; the page is currently a placeholder.

**Independent Test**: Login as admin, open a shipment from admin list, approve/reject or update status, and assign driver.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they open a shipment details page, **Then** they see shipment, timeline, compliance, and assignment details.
2. **Given** a pending approval shipment, **When** admin approves/rejects, **Then** the UI calls `/api/admin/shipments/:id/approve|reject` and refreshes.
3. **Given** a shipment, **When** admin assigns a driver/truck or updates status, **Then** the UI calls `/api/admin/shipments/:id/assign|status`.

---

### User Story 3 - Admin Create User (Priority: P2)

Admins should be able to create users from the UI, including role-specific fields.

**Why this priority**: User onboarding and corrections are a recurring admin task and currently absent.

**Independent Test**: Admin creates a Merchant, TruckOwner, and Driver using the UI and sees them in the list.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they open the create user dialog, **Then** they can create a Merchant with required fields.
2. **Given** an admin, **When** they choose TruckOwner role, **Then** company fields are required and sent.
3. **Given** an admin, **When** they choose Driver role, **Then** license number and owner (TruckOwner) are required and sent.

---

### User Story 4 - Tracking and Notifications Fixes (Priority: P2)

Tracking must authenticate and align with backend socket events; the notifications button must navigate.

**Why this priority**: Tracking currently fails due to socket auth/event mismatch; notifications button is non-functional.

**Independent Test**: Start tracking and verify connection; click the bell and navigate to notifications.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** tracking connects, **Then** the socket sends JWT auth and listens to `shipment:location`.
2. **Given** a tracking view, **When** driver updates location, **Then** map updates without refresh.
3. **Given** a user, **When** they click the bell icon, **Then** they navigate to `/notifications`.

---

### User Story 5 - Rating Placeholders (Priority: P3)

Rating UI should exist with placeholders until backend support is implemented.

**Why this priority**: Ratings are referenced in workflows; UI should not be broken or misleading.

**Independent Test**: Open driver dashboard/history and see rating fields as placeholders.

**Acceptance Scenarios**:

1. **Given** a driver dashboard, **When** rating data is unavailable, **Then** UI shows a placeholder (e.g., "—").
2. **Given** a driver history page, **When** rating data is unavailable, **Then** UI shows placeholders in tables and summary.

---

### Edge Cases

- Driver denies geolocation permission during tracking or check-in/out.
- Driver attempts to complete delivery without proof photos; UI still submits core data and reports upload failure.
- Admin attempts to create a Driver without selecting a TruckOwner.
- TruckOwner views available shipment details that are not yet assigned.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Driver dashboard MUST call `/api/driver/dashboard` and map response into UI cards.
- **FR-002**: Driver shipments list MUST use `/api/driver/shipments/assigned` and history MUST use `/api/driver/shipments/history` with client-side paging.
- **FR-003**: Driver start/complete delivery MUST call `/api/driver/shipments/:id/start|complete` and report errors.
- **FR-004**: Driver issue reporting MUST call `/api/driver/shipments/:id/issues` with issue type and description.
- **FR-005**: Driver check-in/out MUST call `/api/driver/checkin` and `/api/driver/checkout` with geolocation and form data.
- **FR-006**: Socket tracking MUST authenticate with JWT and use `driver:location` and `shipment:location` events.
- **FR-007**: Admin shipment detail MUST fetch `/api/admin/shipments/:id` and allow approve/reject/assign/status updates.
- **FR-008**: Admin user creation MUST call `/api/admin/users` with role-specific fields.
- **FR-009**: Notification bell MUST navigate to `/notifications`.
- **FR-010**: Ratings UI MUST render placeholder values when not available.

### Key Entities _(include if feature involves data)_

- **Driver Dashboard**: Aggregated driver, truck, active shipments, next delivery, metrics.
- **Shipment**: Admin detail view, assignment, compliance, tracking/timeline.
- **User**: Admin-created users with role-specific requirements.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Driver flows no longer use mock data; all data requests hit backend endpoints.
- **SC-002**: Admin shipment detail page replaces placeholder and supports status/assignment actions.
- **SC-003**: Admin can create Merchant, TruckOwner, and Driver from UI without API errors.
- **SC-004**: Socket tracking connects with auth and receives shipment location updates.
- **SC-005**: Notification bell navigates correctly across roles.
