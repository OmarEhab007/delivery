# Feature Specification: Production Frontend Completion

**Feature Branch**: `007-production-frontend`
**Created**: 2026-02-05
**Status**: Draft
**Input**: Move the delivery app frontend from MVP to a complete production-ready application with real-time features, full API coverage, analytics, notifications, maps, search, payments, performance, accessibility, and testing.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Real-Time Shipment Tracking (Priority: P1)

A merchant or admin views a shipment detail page and sees the assigned driver's live location on an interactive map, updated every few seconds. The shipment status badge updates automatically when the driver changes status (e.g., from IN_TRANSIT to AT_BORDER) without requiring a page refresh. A connection indicator shows whether the real-time feed is active.

**Why this priority**: Real-time tracking is the core differentiator for a logistics platform. Without it, users must manually refresh pages to see driver locations and status updates, which is unacceptable for time-sensitive international shipments.

**Independent Test**: Can be tested by having a driver emit location updates via the Socket.io connection and verifying the merchant's map marker moves and status badge updates in real time.

**Acceptance Scenarios**:

1. **Given** a shipment is IN_TRANSIT with an assigned driver, **When** the driver sends a location update, **Then** the map marker on the merchant's shipment detail page moves to the new position within 5 seconds.
2. **Given** a user is viewing a shipment detail page, **When** the driver changes the shipment status, **Then** the status badge and timeline update automatically without page refresh.
3. **Given** the real-time connection drops, **When** the user looks at the connection indicator, **Then** it shows a disconnected state and attempts automatic reconnection.
4. **Given** the real-time connection is restored, **When** reconnection succeeds, **Then** the system fetches the latest state to sync any missed updates.

---

### User Story 2 - In-App Notification System (Priority: P1)

All users receive in-app notifications for events relevant to their role: merchants get notified about new bids, shipment status changes, and delivery completions; truck owners about new available shipments and application decisions; drivers about new assignments. A notification bell in the header shows the unread count. A notifications page lists all notifications with read/unread state and bulk actions.

**Why this priority**: Notifications are essential for user engagement and operational awareness. Without them, users must manually check each section for updates, leading to missed bids, delayed responses, and poor user experience.

**Independent Test**: Can be tested by triggering a backend event (e.g., application submitted) and verifying the notification appears in the bell dropdown and notifications page.

**Acceptance Scenarios**:

1. **Given** a truck owner submits a bid on a merchant's shipment, **When** the merchant is logged in, **Then** a notification badge increments and the notification appears in the dropdown within 10 seconds.
2. **Given** a user has 5 unread notifications, **When** they view the notifications page, **Then** all 5 are listed with unread styling and can be marked as read individually or in bulk.
3. **Given** a user marks all notifications as read, **When** they return to the header, **Then** the notification count resets to zero.
4. **Given** a user is offline when an event occurs, **When** they come back online, **Then** they receive the missed notifications on next page load.

---

### User Story 3 - Interactive Map & Route Visualization (Priority: P1)

Shipment detail pages display an interactive map showing the origin, destination, and current driver location. The route between origin and destination is drawn on the map. For active shipments, the driver's position updates in real time. Map components are used across merchant, admin, truck owner, and driver views with role-appropriate information density.

**Why this priority**: Visual route and location display is fundamental to a logistics application. Users need geographic context to understand shipment progress, plan logistics, and manage expectations.

**Independent Test**: Can be tested by loading a shipment detail page with origin/destination coordinates and verifying markers, route line, and (for active shipments) a live driver marker appear correctly.

**Acceptance Scenarios**:

1. **Given** a shipment has origin and destination coordinates, **When** a user views the shipment detail page, **Then** the map displays both markers with a connecting route line and auto-fits the bounds.
2. **Given** a shipment is actively in transit, **When** a user views the shipment map, **Then** a driver icon shows the current position and animates to new positions as location updates arrive.
3. **Given** a shipment has tracking history, **When** the user toggles "show route history", **Then** the map draws the actual path traveled based on tracking points.

---

### User Story 4 - Advanced Admin Analytics Dashboard (Priority: P2)

An admin navigates to the analytics section and sees comprehensive charts: shipment status trends over time, revenue analysis by period, fleet utilization rates, driver/truck performance rankings, customer insights, operational efficiency metrics, and geographic distribution maps. Each chart supports date range filtering and data export.

**Why this priority**: Analytics drive business decisions. Without comprehensive reporting, admins cannot identify bottlenecks, optimize operations, or measure business health. The backend already provides all data endpoints.

**Independent Test**: Can be tested by loading the admin analytics page and verifying each chart renders with data from the backend analytics endpoints and responds to date filter changes.

**Acceptance Scenarios**:

1. **Given** an admin navigates to the analytics dashboard, **When** the page loads, **Then** all chart sections render with data from the respective backend endpoints (KPIs, status trends, revenue, performance, customers, efficiency, geo).
2. **Given** the admin changes the date range filter, **When** the filter is applied, **Then** all charts update to reflect the selected time period.
3. **Given** the admin clicks "Export" on any chart, **When** the export completes, **Then** the data downloads as a CSV or PDF file.

---

### User Story 5 - Admin Broker & Registration Management (Priority: P2)

An admin manages customs brokers (create, view, edit, deactivate) and reviews user registration requests (approve or reject with reason). These are critical admin workflows that the backend supports but the frontend does not yet expose.

**Why this priority**: Broker management is essential for international shipments requiring customs clearance. Registration request handling is the gateway for new users to join the platform. Both are blocking operational workflows.

**Independent Test**: Can be tested by navigating to the admin broker page, creating a broker, and verifying it appears in the list; and by navigating to registration requests, approving one, and verifying the user account is created.

**Acceptance Scenarios**:

1. **Given** an admin navigates to the broker management page, **When** they fill out the "Create Broker" form (name, license number, countries, contacts), **Then** the broker is created and appears in the broker list.
2. **Given** a broker exists, **When** the admin edits its details or deactivates it, **Then** the changes persist and the list reflects the update.
3. **Given** pending registration requests exist, **When** the admin views the registration requests page, **Then** they see a list with user details, role, and submitted documents.
4. **Given** the admin approves a registration request, **When** the action completes, **Then** the user account is created and the request is removed from the pending list.
5. **Given** the admin rejects a registration request, **When** they provide a reason and confirm, **Then** the request is marked rejected and the reason is stored.

---

### User Story 6 - Automation Rules & Webhook Management (Priority: P2)

A merchant configures automation rules (e.g., "alert me if a shipment has no update for 12 hours") and manages integration settings (API credentials and webhook subscriptions). These features enable advanced users to integrate the platform into their workflows and receive proactive alerts.

**Why this priority**: Automation and integrations are differentiators for enterprise merchants. The backend fully supports these features but the frontend has no UI for them.

**Independent Test**: Can be tested by creating an automation rule, verifying it appears in the rules list, and confirming webhook subscriptions can be created and listed.

**Acceptance Scenarios**:

1. **Given** a merchant navigates to automation settings, **When** they create a rule (name, trigger type, threshold, action), **Then** the rule is saved and appears in the active rules list.
2. **Given** a rule exists, **When** the merchant toggles it off or updates the threshold, **Then** the change persists.
3. **Given** a merchant navigates to integration settings, **When** they generate API credentials, **Then** the API key is displayed once and the credential appears in the list with its prefix.
4. **Given** a merchant creates a webhook subscription, **When** they provide an endpoint URL and select event types, **Then** the webhook is created and listed with its status.

---

### User Story 7 - Global Search & Advanced Filtering (Priority: P2)

Users access a global search command palette (keyboard shortcut) to quickly find shipments, trucks, drivers, or users by name, ID, or keyword. All list pages (shipments, trucks, drivers, applications, users) support multi-filter search with status, date range, and entity-specific filters. Filters can be applied simultaneously and are reflected in the URL for shareability.

**Why this priority**: As the platform grows, users need efficient ways to find specific records. Currently, list pages have basic or no filtering, making it hard to locate specific shipments or users.

**Independent Test**: Can be tested by opening the command palette, typing a search term, and verifying results appear; and by applying multiple filters on a list page and verifying the results update correctly.

**Acceptance Scenarios**:

1. **Given** a user presses the keyboard shortcut (Cmd/Ctrl+K), **When** the command palette opens, **Then** they can type to search across shipments, trucks, drivers, and users with results appearing as they type.
2. **Given** a user is on the shipments list page, **When** they apply status, date range, and origin country filters, **Then** the list shows only matching shipments and the URL updates to reflect the filters.
3. **Given** a user shares a filtered URL, **When** another user opens it, **Then** the same filters are applied and the same results are shown.

---

### User Story 8 - Payment Details & History (Priority: P3)

Merchants view payment information on shipment detail pages including payment status, amount, receipt, and proof of payment. A payment history section aggregates payment information across shipments. Invoice views display formatted payment details suitable for records.

**Why this priority**: Payment visibility is important for financial tracking but the core payment proof upload already exists. This enhances the existing functionality with better display and history.

**Independent Test**: Can be tested by viewing a shipment with payment details and verifying the payment section displays amount, status, receipt link, and verification state.

**Acceptance Scenarios**:

1. **Given** a shipment has payment details recorded, **When** a merchant views the shipment, **Then** a payment section shows the amount, currency, payment date, receipt link, and verification status.
2. **Given** a merchant navigates to payment history, **When** the page loads, **Then** it lists all payments across their shipments with totals and filtering by date/status.

---

### User Story 9 - Performance & Loading Experience (Priority: P3)

All pages load within acceptable time limits. Long lists use efficient pagination. Role-specific code is loaded on demand. Skeleton screens appear during data loading. Common navigation paths are prefetched. The application handles network errors gracefully with retry options.

**Why this priority**: Performance directly impacts user satisfaction and retention. While the app is functional, slow loads, layout shifts, and missing loading states create a poor impression.

**Independent Test**: Can be tested by measuring page load times with browser developer tools and verifying skeleton screens appear during loading, pages render within targets, and error states offer retry actions.

**Acceptance Scenarios**:

1. **Given** a user navigates to any dashboard page, **When** data is loading, **Then** skeleton screens appear in place of content cards and tables.
2. **Given** a user navigates between role-specific sections, **When** the section loads, **Then** only that section's code is downloaded (lazy loading).
3. **Given** a network request fails, **When** the user sees the error, **Then** a retry button is available and clicking it re-attempts the request.
4. **Given** a user is on the dashboard, **When** they hover over a navigation link, **Then** the target page's data begins prefetching.

---

### User Story 10 - Accessibility & RTL Support (Priority: P3)

The application is fully navigable via keyboard, all interactive elements have appropriate ARIA labels, color contrast meets WCAG AA standards in both light and dark modes, and RTL layout works correctly for Arabic-language users.

**Why this priority**: Accessibility is a legal and ethical requirement. The platform targets Middle Eastern markets where Arabic RTL support is essential. Current RTL metadata exists but full RTL layout support needs validation.

**Independent Test**: Can be tested by navigating the entire application using only keyboard, running an automated accessibility audit, and switching to Arabic locale to verify RTL layout.

**Acceptance Scenarios**:

1. **Given** a user navigates using only the keyboard, **When** they tab through the application, **Then** all interactive elements are reachable with visible focus indicators.
2. **Given** the application is in dark mode, **When** an accessibility audit runs, **Then** all text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
3. **Given** a user switches to Arabic locale, **When** the page renders, **Then** the layout mirrors correctly (sidebar on right, text right-aligned, form labels right-aligned).

---

### User Story 11 - Automated Testing Suite (Priority: P3)

Developers can run unit tests for hooks and utilities, component tests for critical UI flows, and end-to-end tests for primary user journeys. Test infrastructure is set up with proper mocking for API calls and consistent test patterns.

**Why this priority**: Testing ensures reliability during ongoing development and prevents regressions. The testing infrastructure (Jest, Playwright configs) exists but no actual tests are written.

**Independent Test**: Can be tested by running the test suite and verifying all tests pass with adequate coverage of core user journeys.

**Acceptance Scenarios**:

1. **Given** a developer runs the unit test suite, **When** tests execute, **Then** all custom hooks and utility functions have passing tests covering normal and edge cases.
2. **Given** a developer runs the E2E test suite, **When** Playwright executes, **Then** the primary user journeys (login, create shipment, submit bid, track shipment) complete successfully.
3. **Given** a developer makes a code change, **When** they run the test suite, **Then** any regressions in existing functionality are caught by failing tests.

---

### Edge Cases

- What happens when the Socket.io connection fails repeatedly? The system should show a persistent warning and fall back to polling-based updates with a longer interval.
- What happens when a user has hundreds of notifications? The notification list should paginate or use infinite scroll, not load all at once.
- What happens when map coordinates are missing or invalid? The map component should show a placeholder message instead of crashing.
- What happens when the backend returns an unexpected error format? Error boundaries should catch and display a user-friendly message with a retry option.
- What happens when a user has no data (new account, no shipments)? Empty state illustrations and guidance text should appear instead of blank pages.
- What happens when the user's internet drops mid-form? Form data should be preserved so the user does not lose their progress.
- What happens when filters produce no results? A clear "no results" message should appear with suggestions to broaden the search.
- What happens when exported CSV/PDF files are very large? Export should show progress and handle timeouts gracefully.

## Requirements _(mandatory)_

### Functional Requirements

**Real-Time Features**
- **FR-001**: System MUST establish and maintain a Socket.io connection for authenticated users, displaying connection status in the UI.
- **FR-002**: System MUST receive and render live driver location updates on shipment detail maps within 5 seconds of the event.
- **FR-003**: System MUST update shipment status badges and timelines in real time when status change events are received.
- **FR-004**: System MUST handle connection drops gracefully with automatic reconnection and state synchronization on reconnect.

**Notifications**
- **FR-005**: System MUST display a notification bell in the header with an unread count badge for all authenticated users.
- **FR-006**: System MUST receive notifications via real-time events and display them in a dropdown and a dedicated notifications page.
- **FR-007**: System MUST allow users to mark notifications as read individually and in bulk (mark all as read).
- **FR-008**: System MUST persist notification read state across sessions.
- **FR-009**: System MUST display role-appropriate notifications (merchants see bid/shipment events, truck owners see shipment availability, drivers see assignments).

**Maps & Routes**
- **FR-010**: System MUST display interactive maps on shipment detail pages showing origin and destination markers with a connecting route.
- **FR-011**: System MUST show a live driver location marker on maps for active shipments, updated via real-time events.
- **FR-012**: System MUST support toggling tracking history visualization on shipment maps.
- **FR-013**: System MUST auto-fit map bounds to show all relevant markers.

**Analytics**
- **FR-014**: System MUST display admin analytics dashboard with charts for: KPIs, shipment status trends, revenue analysis, fleet performance, customer insights, operational efficiency, and geographic distribution.
- **FR-015**: System MUST support date range filtering on all analytics charts.
- **FR-016**: System MUST allow exporting chart data as CSV or PDF.

**Admin Management**
- **FR-017**: System MUST provide a broker management interface (list, create, edit, deactivate) for admin users.
- **FR-018**: System MUST provide a registration request review interface (list, approve, reject with reason) for admin users.
- **FR-019**: System MUST display admin analytics reports for status trends, revenue, performance, customers, efficiency, and geographic data from the backend reporting endpoints.

**Automation & Integrations**
- **FR-020**: System MUST provide a UI for merchants to create, view, update, and toggle automation rules (delay alerts, missing update alerts).
- **FR-021**: System MUST provide a UI for merchants to generate and manage API credentials (create, list, view prefix).
- **FR-022**: System MUST provide a UI for merchants to create and manage webhook subscriptions (endpoint URL, event types, status).

**Search & Filtering**
- **FR-023**: System MUST provide a global search command palette accessible via Cmd/Ctrl+K.
- **FR-024**: System MUST support multi-filter search on all list pages with URL-persisted filter state.
- **FR-025**: System MUST update list results as filters change without full page reload.

**Payment Display**
- **FR-026**: System MUST display payment details (amount, currency, status, receipt, verification) on shipment detail pages when payment data exists.
- **FR-027**: System MUST provide a payment history view aggregating payments across shipments with filtering.

**Performance**
- **FR-028**: System MUST display skeleton loading screens during data fetching on all major pages.
- **FR-029**: System MUST lazy-load role-specific page bundles to reduce initial load size.
- **FR-030**: System MUST prefetch data for likely navigation targets on hover.
- **FR-031**: System MUST display user-friendly error states with retry actions for all failed network requests.
- **FR-032**: System MUST preserve form data during temporary network interruptions.

**Accessibility**
- **FR-033**: System MUST be fully navigable via keyboard with visible focus indicators on all interactive elements.
- **FR-034**: System MUST meet WCAG AA color contrast ratios in both light and dark modes.
- **FR-035**: System MUST support RTL layout when the locale is set to Arabic.

**Testing**
- **FR-036**: System MUST have unit tests for all custom hooks and utility functions.
- **FR-037**: System MUST have E2E tests covering primary user journeys: login, create shipment, submit bid, track shipment.

### Key Entities

- **Notification**: Represents an in-app alert with type, message, read state, timestamp, and link to relevant entity. Associated with a user and optionally a shipment, application, or other entity.
- **Broker**: Customs clearance agent with name, license number, countries served, contacts, and active/inactive status. Linked to shipments for compliance.
- **AutomationRule**: Merchant-configured trigger with name, type (delay/missing-update), threshold, action (notify/escalate), and active state.
- **IntegrationCredential**: API key record with name, key prefix (for display), scopes, and active state. Owned by a merchant.
- **WebhookSubscription**: Event listener with endpoint URL, event types, status, and failure tracking. Owned by a merchant.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users see live driver location updates on shipment maps within 5 seconds of the driver's position changing.
- **SC-002**: Users receive in-app notifications for role-relevant events within 10 seconds of the event occurring.
- **SC-003**: All shipment detail pages display interactive maps with origin, destination, and (when applicable) live driver markers.
- **SC-004**: Admin analytics dashboard renders all 7 chart sections with data and supports date filtering and data export.
- **SC-005**: Admin users can manage brokers and process registration requests entirely through the frontend without direct database or API tool access.
- **SC-006**: Merchants can create automation rules and manage API credentials and webhook subscriptions through dedicated settings pages.
- **SC-007**: Users can find any record (shipment, truck, driver, user) within 3 interactions using the global search command palette.
- **SC-008**: All major pages display skeleton loading states during data fetching, with no layout shifts when data loads.
- **SC-009**: Role-specific pages are loaded on demand, reducing initial bundle size by at least 30% compared to loading all roles upfront.
- **SC-010**: The application passes automated accessibility audits with no critical or serious violations in both light and dark modes.
- **SC-011**: RTL layout renders correctly with mirrored navigation, text alignment, and form layout when Arabic locale is active.
- **SC-012**: Primary user journeys (login, create shipment, submit bid, view tracking) are covered by passing E2E tests.
- **SC-013**: All custom hooks and utility functions have unit tests with at least 80% code coverage.
- **SC-014**: Payment details and history are visible on shipment pages and a dedicated payment history view for merchants.
- **SC-015**: All list pages support multi-filter search with URL-persisted state that produces shareable links.

## Assumptions

- The backend Socket.io server is already configured and emits `shipment:location` and `shipment:status` events as documented in the tracking service.
- The backend notification service sends WhatsApp messages but does not persist in-app notifications; the frontend will either consume Socket.io events to create client-side notifications or a lightweight notification endpoint will be added to the backend.
- The backend analytics endpoints (`/api/reports/*`) return data in a consistent format suitable for chart rendering.
- The React Leaflet library already installed can handle all required map features (markers, polylines, auto-fit bounds).
- The existing Radix UI component library and Tailwind CSS are sufficient for all new UI requirements without additional design library dependencies.
- Browser support targets modern evergreen browsers (Chrome, Firefox, Safari, Edge - latest 2 versions).
- The backend CORS configuration already allows the frontend origin for Socket.io connections.
- RTL support will use CSS logical properties and Tailwind's RTL plugin without requiring a separate layout system.
