# Feature Specification: Next.js Frontend Application

**Feature Branch**: `005-nextjs-frontend`
**Created**: 2026-02-04
**Status**: Draft
**Input**: Create a Next.js 14 frontend application with shadcn/ui components for the delivery app with 4 role-based interfaces: Admin Portal, Merchant Portal, TruckOwner Portal, and Driver Portal

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Authentication and Role-Based Access (Priority: P1)

Users of all roles (Admin, Merchant, TruckOwner, Driver) must be able to securely log in and be directed to their role-specific dashboard. The system must protect routes based on user roles and handle session management.

**Why this priority**: Authentication is the foundation of the entire application. No other feature can function without secure user access control. All other portals depend on knowing who the user is and what role they have.

**Independent Test**: Can be fully tested by attempting login with different user credentials and verifying correct dashboard routing and access restrictions.

**Acceptance Scenarios**:

1. **Given** a registered user with valid credentials, **When** they submit the login form, **Then** they are authenticated and redirected to their role-specific dashboard
2. **Given** a logged-in user, **When** they attempt to access a route for a different role, **Then** they are redirected to their own dashboard with an access denied notification
3. **Given** a user with an expired session, **When** they attempt any protected action, **Then** their token is automatically refreshed or they are prompted to log in again
4. **Given** any user on any page, **When** they click the logout button, **Then** their session is terminated and they are redirected to the login page
5. **Given** a user, **When** they toggle the theme switch, **Then** the interface switches between light and dark mode and the preference is persisted

---

### User Story 2 - Merchant Creates and Manages Shipments (Priority: P1)

Merchants need to create shipment requests (both bidding and fixed-price types), specify cargo details, origin/destination, and manage the complete shipment lifecycle from creation through delivery completion.

**Why this priority**: Shipment creation is the core business function that initiates all other workflows. Without shipments, there is nothing for TruckOwners to bid on or Drivers to deliver.

**Independent Test**: Can be tested by a merchant logging in, creating a shipment, viewing it in their list, and updating its details.

**Acceptance Scenarios**:

1. **Given** a logged-in merchant, **When** they fill out the shipment creation form with valid cargo and location details, **Then** a new shipment is created and appears in their shipments list
2. **Given** a merchant with pending shipments, **When** they navigate to their shipments dashboard, **Then** they see a searchable, filterable list of all their shipments with status indicators
3. **Given** a shipment in REQUESTED status, **When** the merchant views it, **Then** they can see all bids received and accept or reject each bid
4. **Given** a shipment with an accepted bid, **When** the merchant views the shipment details, **Then** they can see real-time location tracking on an interactive map
5. **Given** a merchant, **When** they access their KPI dashboard, **Then** they see performance metrics and lane analytics

---

### User Story 3 - TruckOwner Bids on Shipments (Priority: P1)

TruckOwners need to browse available shipments, evaluate opportunities, and submit competitive bids specifying their truck, driver, and pricing.

**Why this priority**: The bidding system is how TruckOwners acquire work. This is essential for the marketplace to function and connects supply (trucks) with demand (shipments).

**Independent Test**: Can be tested by a TruckOwner logging in, viewing available shipments, and submitting a bid on one.

**Acceptance Scenarios**:

1. **Given** a logged-in TruckOwner, **When** they navigate to available shipments, **Then** they see a list of shipments open for bidding with route, cargo, and date information
2. **Given** a TruckOwner viewing a shipment, **When** they click "Submit Bid", **Then** they can select from their available trucks and drivers and specify their price
3. **Given** a TruckOwner with submitted bids, **When** they view their applications dashboard, **Then** they see the status of all their bids (pending, accepted, rejected)
4. **Given** a bid in PENDING status, **When** the TruckOwner wants to modify it, **Then** they can update the price or cancel the bid

---

### User Story 4 - TruckOwner Manages Fleet (Priority: P2)

TruckOwners need to manage their fleet of trucks and team of drivers, including registration, document management, and availability tracking.

**Why this priority**: Fleet management supports the bidding workflow. TruckOwners need trucks and drivers registered before they can bid, but the bidding itself is more critical to the core business flow.

**Independent Test**: Can be tested by a TruckOwner adding a new truck with documents, registering a driver, and assigning the driver to the truck.

**Acceptance Scenarios**:

1. **Given** a logged-in TruckOwner, **When** they navigate to fleet management, **Then** they see a dashboard with all their trucks showing status, assigned driver, and document status
2. **Given** a TruckOwner, **When** they add a new truck with required details and documents, **Then** the truck appears in their fleet list pending verification
3. **Given** a TruckOwner, **When** they register a new driver with license information, **Then** the driver account is created pending admin approval
4. **Given** a TruckOwner with verified trucks and drivers, **When** they assign a driver to a truck, **Then** the assignment is saved and both show as linked
5. **Given** a TruckOwner with an assigned shipment, **When** they access tracking, **Then** they can see their driver's real-time location on the route

---

### User Story 5 - Driver Executes Deliveries (Priority: P2)

Drivers need a mobile-friendly interface to view their assigned shipments, start deliveries, update their location, report issues, and complete deliveries with proof.

**Why this priority**: Delivery execution is the fulfillment of the business promise. However, it depends on shipments being created and bids being accepted first.

**Independent Test**: Can be tested by a driver logging in, viewing assigned shipments, starting a delivery, and completing it with proof upload.

**Acceptance Scenarios**:

1. **Given** a logged-in driver, **When** they access their dashboard, **Then** they see their assigned shipments, current status, and quick actions
2. **Given** a driver with an assigned shipment, **When** they click "Start Delivery" and enter odometer reading, **Then** the shipment status changes to IN_TRANSIT
3. **Given** a driver on an active delivery, **When** they view the route, **Then** they see a map with the route from current location to destination
4. **Given** a driver completing a delivery, **When** they enter final odometer, recipient name, and upload photos, **Then** the delivery is marked complete
5. **Given** a driver encountering a problem, **When** they report an issue, **Then** it is recorded with details and notifications are sent to relevant parties
6. **Given** a driver, **When** they update their status (active/off-duty/on-break), **Then** the system reflects their availability correctly

---

### User Story 6 - Admin Oversees System Operations (Priority: P2)

Admins need comprehensive dashboards and tools to manage users, approve registrations, oversee shipments, verify documents, and monitor system health.

**Why this priority**: Admin functions are essential for system governance but don't directly contribute to the core merchant-TruckOwner-driver workflow. The system can initially operate with pre-approved users.

**Independent Test**: Can be tested by an admin logging in, viewing the dashboard, and performing user management actions.

**Acceptance Scenarios**:

1. **Given** a logged-in admin, **When** they access the dashboard, **Then** they see key statistics: total users by role, active shipments, pending approvals, and recent activity
2. **Given** an admin, **When** they navigate to user management, **Then** they can search, filter, and view all users with their roles and status
3. **Given** pending registration requests, **When** an admin reviews them, **Then** they can approve or reject each request with an optional reason
4. **Given** an admin viewing shipments, **When** they select a shipment, **Then** they can view full details, change status, assign resources, and view timeline
5. **Given** documents pending verification, **When** an admin reviews them, **Then** they can verify or reject documents with notes
6. **Given** an admin, **When** they access analytics, **Then** they see system metrics, performance indicators, and can generate reports

---

### User Story 7 - Real-Time Location Tracking (Priority: P2)

Merchants, TruckOwners, and Admins need to track shipment locations in real-time on interactive maps showing driver position, route, and estimated arrival.

**Why this priority**: Real-time tracking provides visibility and trust but is an enhancement to the core workflow rather than essential for basic operation.

**Independent Test**: Can be tested by viewing an active shipment and verifying the map updates with driver location changes.

**Acceptance Scenarios**:

1. **Given** an active shipment with a driver on route, **When** an authorized user views tracking, **Then** they see an interactive map with the driver's current position
2. **Given** a tracking view, **When** the driver's location updates, **Then** the map marker moves without page refresh
3. **Given** a shipment tracking page, **When** the user views history, **Then** they see the complete route traveled with timestamps

---

### User Story 8 - Document Management (Priority: P3)

All users need to upload, view, and manage documents related to their activities (compliance docs, vehicle papers, licenses, proof of delivery).

**Why this priority**: Document management supports compliance and verification but the core workflows can function with manual verification initially.

**Independent Test**: Can be tested by uploading a document, viewing it, and downloading it.

**Acceptance Scenarios**:

1. **Given** any authenticated user, **When** they upload a document with type and entity reference, **Then** the document is stored and linked correctly
2. **Given** a user viewing an entity with documents, **When** they click on a document, **Then** they can view or download it
3. **Given** an admin, **When** they view pending documents, **Then** they can verify or reject each with notes

---

### Edge Cases

- What happens when a user's role is changed while they are logged in?
  - System should check permissions on each protected action and redirect if role no longer has access
- How does the system handle network disconnection during real-time tracking?
  - Display last known position with a "connection lost" indicator and auto-reconnect
- What happens when a driver's location services are disabled?
  - Show a prominent warning and prevent starting deliveries until location is enabled
- How does the system behave with slow/poor network connections?
  - Show loading states, implement retry logic, and cache critical data for offline viewing
- What happens when multiple TruckOwners bid the same amount?
  - Display all bids with timestamps; merchant decides based on other factors (truck capacity, ratings)
- How does the form handle browser refresh during multi-step processes?
  - Implement form state persistence to local storage; restore on page reload

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization
- **FR-001**: System MUST provide a login page accepting email and password credentials
- **FR-002**: System MUST authenticate users against the backend API and receive JWT tokens
- **FR-003**: System MUST automatically refresh access tokens before expiration
- **FR-004**: System MUST store user session securely and persist across browser sessions
- **FR-005**: System MUST redirect users to their role-specific dashboard after login
- **FR-006**: System MUST protect all routes requiring authentication
- **FR-007**: System MUST restrict route access based on user role (Admin, Merchant, TruckOwner, Driver)
- **FR-008**: System MUST provide a logout function that clears all session data

#### Theme & UI
- **FR-009**: System MUST provide a toggle for switching between light and dark themes
- **FR-010**: System MUST persist theme preference across sessions
- **FR-011**: System MUST be fully responsive for desktop, tablet, and mobile viewports
- **FR-012**: System MUST use consistent UI components throughout all portals

#### Admin Portal
- **FR-013**: Admin dashboard MUST display system statistics (user counts by role, shipment counts by status, pending approvals)
- **FR-014**: Admin MUST be able to view, create, update, and deactivate users of any role
- **FR-015**: Admin MUST be able to search and filter users by name, email, role, and status
- **FR-016**: Admin MUST be able to view all shipments with filtering by status, date, merchant
- **FR-017**: Admin MUST be able to approve or reject shipments pending approval
- **FR-018**: Admin MUST be able to change shipment status and assign drivers
- **FR-019**: Admin MUST be able to view and manage all applications/bids
- **FR-020**: Admin MUST be able to view, create, update, and delete trucks
- **FR-021**: Admin MUST be able to manage brokers (create, update, deactivate)
- **FR-022**: Admin MUST be able to view pending registration requests and approve/reject them
- **FR-023**: Admin MUST be able to verify or reject uploaded documents
- **FR-024**: Admin MUST be able to view system metrics and analytics

#### Merchant Portal
- **FR-025**: Merchant dashboard MUST display their shipment statistics and recent activity
- **FR-026**: Merchant MUST be able to create bidding shipments with origin, destination, cargo details, and dates
- **FR-027**: Merchant MUST be able to create fixed-price shipments with auto-assignment option
- **FR-028**: Merchant MUST be able to view all their shipments in a searchable, sortable list
- **FR-029**: Merchant MUST be able to filter shipments by status, date range, and destination
- **FR-030**: Merchant MUST be able to view all bids received on a shipment
- **FR-031**: Merchant MUST be able to accept one bid (which auto-rejects others) or reject individual bids
- **FR-032**: Merchant MUST be able to upload compliance documents for shipments
- **FR-033**: Merchant MUST be able to view compliance status for each shipment
- **FR-034**: Merchant MUST be able to upload payment proof documents
- **FR-035**: Merchant MUST be able to track shipment location in real-time on a map
- **FR-036**: Merchant MUST be able to view tracking history with timeline
- **FR-037**: Merchant MUST be able to view KPI dashboard with performance metrics
- **FR-038**: Merchant MUST be able to view lane performance analytics
- **FR-039**: Merchant MUST be able to cancel shipments (when status allows)
- **FR-040**: Merchant MUST be able to update their profile information

#### TruckOwner Portal
- **FR-041**: TruckOwner dashboard MUST display fleet statistics, active shipments, and pending bids
- **FR-042**: TruckOwner MUST be able to view shipments available for bidding
- **FR-043**: TruckOwner MUST be able to filter available shipments by route, cargo type, and dates
- **FR-044**: TruckOwner MUST be able to submit bids specifying truck, driver, and price
- **FR-045**: TruckOwner MUST be able to view all their submitted bids with status
- **FR-046**: TruckOwner MUST be able to update or cancel pending bids
- **FR-047**: TruckOwner MUST be able to create, view, update, and delete trucks
- **FR-048**: TruckOwner MUST be able to upload truck documents (registration, insurance, inspection)
- **FR-049**: TruckOwner MUST be able to record truck maintenance history
- **FR-050**: TruckOwner MUST be able to register new drivers (creates registration request)
- **FR-051**: TruckOwner MUST be able to view all their drivers with status and availability
- **FR-052**: TruckOwner MUST be able to update driver information
- **FR-053**: TruckOwner MUST be able to assign drivers to trucks
- **FR-054**: TruckOwner MUST be able to view their assigned shipments
- **FR-055**: TruckOwner MUST be able to assign shipments to specific drivers
- **FR-056**: TruckOwner MUST be able to track assigned shipments on a map

#### Driver Portal
- **FR-057**: Driver dashboard MUST display assigned shipments, current status, and quick actions
- **FR-058**: Driver MUST be able to view their assigned shipments with details
- **FR-059**: Driver MUST be able to view their delivery history
- **FR-060**: Driver MUST be able to start a delivery (recording odometer reading)
- **FR-061**: Driver MUST be able to complete a delivery (odometer, recipient info, signature capture)
- **FR-062**: Driver MUST be able to upload proof of delivery (photos)
- **FR-063**: Driver MUST be able to view delivery route on an interactive map
- **FR-064**: Driver MUST be able to report issues during delivery with details and photos
- **FR-065**: Driver MUST be able to check-in and check-out (with location and truck condition)
- **FR-066**: Driver MUST be able to update their status (ACTIVE, OFF_DUTY, ON_BREAK)
- **FR-067**: Driver MUST be able to update their current location (manual or automatic)
- **FR-068**: Driver MUST be able to view their profile and assigned truck information

#### Real-Time Features
- **FR-069**: System MUST connect to real-time tracking service when viewing active shipments
- **FR-070**: Map markers MUST update in real-time as driver location changes
- **FR-071**: System MUST display connection status indicator for real-time features
- **FR-072**: System MUST gracefully handle disconnection and reconnection

#### Document Management
- **FR-073**: System MUST support file uploads with progress indication
- **FR-074**: System MUST validate file types and sizes before upload
- **FR-075**: System MUST display documents with download capability
- **FR-076**: System MUST show document verification status

### Key Entities

- **User**: Represents all system users with role (Admin, Merchant, TruckOwner, Driver), credentials, and profile information
- **Shipment**: Core business entity representing cargo to be transported, with origin/destination, cargo details, status, and tracking
- **Application/Bid**: Represents a TruckOwner's offer to transport a shipment, with pricing and assigned resources
- **Truck**: Vehicle in TruckOwner's fleet with specifications, documents, and assigned driver
- **Driver**: User subtype managed by TruckOwner with license, status, and location tracking
- **Document**: Uploaded file linked to shipments, trucks, or users for compliance and verification

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete login and reach their dashboard within 5 seconds on standard network
- **SC-002**: Merchants can create a complete shipment in under 3 minutes
- **SC-003**: TruckOwners can submit a bid on a shipment in under 1 minute
- **SC-004**: Drivers can start a delivery in under 30 seconds
- **SC-005**: Real-time map updates display within 2 seconds of location change
- **SC-006**: All forms provide clear validation feedback before submission
- **SC-007**: System remains usable on mobile devices with minimum 320px viewport width
- **SC-008**: Theme toggle takes effect immediately without page reload
- **SC-009**: 95% of user actions complete without errors under normal operation
- **SC-010**: Search and filter operations return results within 1 second
- **SC-011**: File uploads show accurate progress and complete reliably for files up to 10MB
- **SC-012**: System maintains session across browser refresh without requiring re-login

## Design System *(from Figma)*

**Figma Sources**:
- Primary: https://www.figma.com/design/QRMuRxJjg7WyVHtLFZYTkE/Course_App?node-id=0-1
- Secondary: https://www.figma.com/design/E6mdcPTHAMIn3FQiDJcuOK/Almarine?node-id=1-13

### Color Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| **Primary** | `#E57F00` | `--color-primary` | Primary CTA buttons, key actions |
| **Primary Light** | `#FDA058` | `--color-primary-light` | Links, secondary buttons, hover states |
| **Primary Bright** | `#FB8500` | `--color-primary-bright` | Accent highlights, notifications |
| **Dark** | `#2F0F01` | `--color-dark` | Headings, primary text |
| **Secondary** | `#90735A` | `--color-secondary` | Muted elements, secondary text |
| **Cream** | `#F1D6B2` | `--color-cream` | Light backgrounds, cards, accents |
| **Background** | `#F6F6F6` | `--color-background` | Page backgrounds |
| **Surface** | `#FFFFFF` | `--color-surface` | Input backgrounds, cards |
| **Text Primary** | `#363636` | `--color-text-primary` | Body text |
| **Text Muted** | `#B5B5B5` | `--color-text-muted` | Placeholder text, disabled states |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Font Family** | Roboto | - | - |
| Headings (H1) | Roboto | Medium (500) | 25px |
| Body Text | Roboto | Regular (400) | 15px |
| Labels | Roboto | Regular (400) | 12px |
| Buttons | Roboto | Bold (700) | 15px |
| Small Text | Roboto | Regular (400) | 13px |

### Border Radius

| Element | Radius |
|---------|--------|
| Cards/Containers | 48px |
| Buttons (primary) | 25px |
| Input fields | 5px |
| Avatars/Icons | 50% (circle) |

### Component Patterns

- **Primary Button**: Background `#FDA058`, text white, bold, rounded 25px
- **Input Field**: White background, subtle border, rounded 5px, placeholder text `#B5B5B5`
- **Card**: White or cream background, large border-radius (48px for mobile views)
- **Links**: Color `#FDA058`, underlined on hover
- **Status Indicators**: Use primary orange for active/success, muted brown for inactive

### Dark Mode Adaptations

| Light Mode | Dark Mode |
|------------|-----------|
| `#F6F6F6` background | `#1A1A1A` background |
| `#FFFFFF` surface | `#2D2D2D` surface |
| `#363636` text | `#E5E5E5` text |
| `#2F0F01` headings | `#F1D6B2` headings |

## Assumptions

- Backend API is stable and follows the documented endpoints
- Users have modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Map provider API key will be configured in environment variables
- File upload size limit matches backend configuration (assumed 10MB)
- CSRF token endpoint is available for form submissions
- WebSocket/Socket.io server is accessible at the same origin or configured CORS
- Admin users exist in the system for initial testing
- Backend handles pagination with standard page/limit query parameters

---

## Phase 2: Frontend Completion & UI Enhancement

**Added**: 2026-02-04
**Status**: Draft

### User Story 9 - User Settings Management (Priority: P2)

Users of all roles (Merchant, TruckOwner, Driver) need a dedicated settings page to manage their profile information, configure notification preferences, and handle account security.

**Why this priority**: Settings pages are referenced in the sidebar navigation but currently not implemented. Users need to manage their account preferences for effective platform usage.

**Independent Test**: Can be tested by logging in as any role, navigating to settings, updating profile information, and verifying changes persist.

**Acceptance Scenarios**:

1. **Given** a logged-in user (any role), **When** they click "Settings" in the sidebar, **Then** they see a settings page with profile, notifications, and security sections
2. **Given** a user on the settings page, **When** they update their profile information and save, **Then** the changes are reflected across the platform
3. **Given** a user on the settings page, **When** they toggle notification preferences (email, SMS, WhatsApp), **Then** their preferences are saved and honored
4. **Given** a user on the settings page, **When** they change their password with valid credentials, **Then** the password is updated successfully
5. **Given** a driver on settings, **When** they toggle location sharing settings, **Then** their location tracking behavior changes accordingly

---

### User Story 10 - Enhanced Visual Design System (Priority: P1)

All users experience a modern, polished interface with refined colors, improved typography, and subtle animations that convey professionalism and trustworthiness for a logistics platform.

**Why this priority**: The visual design affects every user interaction across all roles. A cohesive, modern design system establishes brand credibility and improves user confidence in the platform.

**Independent Test**: Can be tested by navigating through any portal and observing consistent styling, smooth transitions, improved color contrast, and modern aesthetic across all pages.

**Acceptance Scenarios**:

1. **Given** a user visits any page, **When** the page loads, **Then** they see a modern color palette with refined blues/indigos as primary colors and proper contrast ratios
2. **Given** a user interacts with buttons, cards, or inputs, **When** they hover or focus, **Then** they see smooth, subtle animations and transitions
3. **Given** a user views the application on any device, **When** they navigate between sections, **Then** the design remains consistent and polished
4. **Given** a user enables dark mode, **When** the theme switches, **Then** all colors adapt appropriately with good contrast and readability

---

### User Story 11 - Analytics Export Functionality (Priority: P3)

Users with analytics access (Merchants, Admins) can export their analytics data to CSV or PDF format for offline analysis and reporting.

**Why this priority**: Export functionality exists in the UI but is currently disabled. Enabling it completes the analytics feature and provides value for business reporting needs.

**Independent Test**: Can be tested by accessing the analytics page, clicking export, selecting format, and verifying the downloaded file contains accurate data.

**Acceptance Scenarios**:

1. **Given** a user on the analytics page, **When** they click the export button, **Then** they see options for CSV and PDF export
2. **Given** a user selects CSV export, **When** the export completes, **Then** they receive a properly formatted CSV file with all visible metrics
3. **Given** a user selects PDF export, **When** the export completes, **Then** they receive a formatted PDF report with charts and data tables

---

### Phase 2 Edge Cases

- What happens when a user tries to save settings with invalid data (empty required fields, invalid email format)?
- How does the system handle password change when the current password is incorrect?
- What happens if location sharing toggle fails due to browser permission denial?
- How does the system behave when export is requested for a date range with no data?
- What happens when a user switches themes rapidly multiple times?
- How does the design system handle RTL (Arabic) text direction with the new color palette?

### Phase 2 Functional Requirements

#### Design System Enhancement

- **FR-077**: System MUST implement a refined color palette with blue/indigo as primary color (#4F46E5), replacing the current orange (#FB8500)
- **FR-078**: System MUST maintain WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text) in both light and dark modes
- **FR-079**: System MUST apply consistent border-radius (12px for cards, 8px for buttons, 6px for inputs) across all components
- **FR-080**: System MUST implement a refined shadow system with subtle, layered shadows for depth perception
- **FR-081**: System MUST include smooth transitions (150-300ms duration) for hover states, focus states, and theme changes
- **FR-082**: System MUST maintain RTL (Right-to-Left) support for Arabic language

#### Settings Pages

- **FR-083**: System MUST provide a Settings page accessible from the sidebar for Merchant, TruckOwner, and Driver roles
- **FR-084**: All Settings pages MUST include sections for: Profile Management, Notification Preferences, and Password Change
- **FR-085**: TruckOwner Settings MUST include additional Fleet Notification configuration section
- **FR-086**: Driver Settings MUST include Location Sharing preferences section
- **FR-087**: Profile changes MUST be validated before saving (required fields, email format, phone format)
- **FR-088**: Password change MUST require current password verification and enforce minimum security requirements (8+ characters)
- **FR-089**: Notification preferences MUST support toggles for Email, SMS, and WhatsApp channels

#### Analytics Export

- **FR-090**: Analytics pages MUST enable the export button (currently disabled)
- **FR-091**: System MUST support CSV export with all visible metrics and proper column headers
- **FR-092**: System MUST support PDF export with formatted charts and data tables
- **FR-093**: Export MUST respect the currently selected date range filter

### Phase 2 Success Criteria

- **SC-013**: All users can complete settings page navigation and profile update in under 30 seconds
- **SC-014**: Color contrast ratios meet WCAG 2.1 AA standards (4.5:1 minimum) across all pages in both themes
- **SC-015**: Page transitions and hover effects complete within 300ms providing smooth, responsive feedback
- **SC-016**: 100% of Settings sidebar links navigate to functional pages (no dead links)
- **SC-017**: Users can successfully export analytics data in both CSV and PDF formats
- **SC-018**: The new design system is consistently applied across all existing pages
- **SC-019**: Mobile responsiveness maintained with all settings pages fully functional on screens 375px and wider
- **SC-020**: RTL layout correctly renders all new UI elements for Arabic language users

### Phase 2 Design System Update

#### New Color Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| **Primary** | `#4F46E5` | `--color-primary` | Primary CTA buttons, key actions |
| **Primary Light** | `#818CF8` | `--color-primary-light` | Hover states, secondary buttons |
| **Primary Dark** | `#3730A3` | `--color-primary-dark` | Active states, focus rings |
| **Accent** | `#06B6D4` | `--color-accent` | Success indicators, highlights |
| **Dark** | `#1E293B` | `--color-dark` | Headings, primary text |
| **Secondary** | `#64748B` | `--color-secondary` | Muted elements, secondary text |
| **Background Light** | `#F8FAFC` | `--color-background` | Page backgrounds |
| **Surface** | `#FFFFFF` | `--color-surface` | Cards, input backgrounds |
| **Border** | `#E2E8F0` | `--color-border` | Borders, dividers |
| **Text Primary** | `#1E293B` | `--color-text-primary` | Body text |
| **Text Muted** | `#94A3B8` | `--color-text-muted` | Placeholder text, disabled states |

#### Dark Mode Adaptations

| Light Mode | Dark Mode |
|------------|-----------|
| `#F8FAFC` background | `#0F172A` background |
| `#FFFFFF` surface | `#1E293B` surface |
| `#1E293B` text | `#F1F5F9` text |
| `#E2E8F0` border | `#334155` border |
| `#4F46E5` primary | `#818CF8` primary |

#### Updated Border Radius

| Element | Radius |
|---------|--------|
| Cards/Containers | 12px |
| Buttons | 8px |
| Input fields | 6px |
| Avatars | 50% (circle) |
| Badges | 9999px (pill) |

#### Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| sm | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elements |
| md | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| lg | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, popovers |
| xl | `0 20px 25px -5px rgba(0,0,0,0.1)` | Dialogs |
