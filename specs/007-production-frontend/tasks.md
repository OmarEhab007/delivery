# Tasks: Production Frontend Completion

**Input**: Design documents from `/specs/007-production-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-hooks.ts, quickstart.md

**Tests**: Included as User Story 11 (P3) per spec.md FR-036 and FR-037.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and add shared types/endpoints needed across multiple stories

- [ ] T001 Install new dependencies: run `npm install recharts` and `npm install msw @types/recharts --save-dev` in `frontend/`
- [ ] T002 [P] Add new entity types (Broker, AutomationRule, IntegrationCredential, WebhookSubscription, PersistentNotification, all analytics response types) to `frontend/src/types/entities.ts` per data-model.md
- [ ] T003 [P] Add new API response types (KpiResponse, StatusTrendsResponse, RevenueResponse, PerformanceResponse, CustomerInsightsResponse, EfficiencyResponse, GeoResponse, GeoHotspotsResponse) to `frontend/src/types/api.ts` per data-model.md
- [ ] T004 [P] Add missing API endpoints (analytics, reports, brokers, registrations, automation, integration) to `frontend/src/lib/api/endpoints.ts` per contracts/api-hooks.ts
- [ ] T005 [P] Add Zod validation schemas for broker form, automation rule form, and webhook form to `frontend/src/lib/validations/index.ts`
- [ ] T006 [P] Create reusable empty state component in `frontend/src/components/shared/empty-state.tsx` with icon, title, description, and optional action button
- [ ] T007 [P] Create reusable error-with-retry component in `frontend/src/components/shared/error-retry.tsx` with error message display and retry button that calls a provided callback

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that multiple user stories depend on - Socket.io provider and notification store

**CRITICAL**: US1, US2, and US3 all depend on the Socket.io connection provider

- [ ] T008 Create a Socket.io connection provider component in `frontend/src/lib/providers/socket-provider.tsx` that establishes a single Socket.io connection per authenticated session, provides connection status via React context, and auto-reconnects with exponential backoff; wrap the dashboard layout with this provider in `frontend/src/app/(dashboard)/layout.tsx`
- [ ] T009 Enhance the existing tracking socket hook in `frontend/src/hooks/use-tracking-socket.ts` to use the Socket.io provider context from T008, add React Query `queryClient.invalidateQueries` on `shipment:status` events to auto-refresh shipment data, and expose a `subscribeToShipment(shipmentId)` / `unsubscribeFromShipment(shipmentId)` interface
- [ ] T010 Add `ConnectionStatusIndicator` component from `frontend/src/components/shared/connection-status.tsx` into the dashboard header at `frontend/src/components/shared/header.tsx`, reading status from the Socket.io provider context

**Checkpoint**: Socket.io connection established for all authenticated users, connection status visible in header

---

## Phase 3: User Story 1 - Real-Time Shipment Tracking (Priority: P1)

**Goal**: Merchant/admin sees live driver location on shipment maps with auto-updating status badges

**Independent Test**: Open shipment detail as merchant, have driver emit location update, verify map marker moves and status badge updates within 5 seconds

### Implementation for User Story 1

- [ ] T011 [US1] Create `frontend/src/components/maps/shipment-map.tsx` - a smart wrapper that accepts a shipmentId, subscribes to Socket.io location events via the enhanced tracking hook (T009), passes currentLocation/trackingHistory to the existing `tracking-map.tsx`, and shows a toggle button for tracking history display
- [ ] T012 [US1] Integrate the `shipment-map.tsx` component into the merchant shipment detail page at `frontend/src/app/(dashboard)/merchant/shipments/[id]/page.tsx` - render the map section with origin, destination, and live driver location when the shipment has coordinates
- [ ] T013 [P] [US1] Integrate the `shipment-map.tsx` component into the admin shipment detail page at `frontend/src/app/(dashboard)/admin/shipments/[id]/page.tsx`
- [ ] T014 [P] [US1] Integrate the `shipment-map.tsx` component into the truck owner assigned shipment detail pages at `frontend/src/app/(dashboard)/truck-owner/assigned/page.tsx` (or relevant detail view)
- [ ] T015 [P] [US1] Integrate the `shipment-map.tsx` component into the driver shipment detail page at `frontend/src/app/(dashboard)/driver/shipments/[id]/page.tsx`
- [ ] T016 [US1] Wire real-time status updates in shipment detail pages: when a `shipment:status` event arrives for the viewed shipment, update the status badge and timeline without page refresh by invalidating the shipment query cache, across all role detail pages
- [ ] T017 [US1] Handle edge cases: show placeholder message when coordinates are missing/invalid in `shipment-map.tsx`; implement polling fallback (30s interval) when Socket.io connection fails repeatedly (>3 reconnect attempts); sync missed updates on reconnection

**Checkpoint**: User Story 1 fully functional - live tracking on maps with real-time status updates across all roles

---

## Phase 4: User Story 2 - In-App Notification System (Priority: P1)

**Goal**: All users receive role-appropriate in-app notifications with unread count, dropdown, and full notifications page

**Independent Test**: Trigger a backend event (e.g., application submitted), verify notification bell count increments and notification appears in dropdown and notifications page

### Implementation for User Story 2

- [ ] T018 [US2] Rewrite the notification store at `frontend/src/stores/notification-store.ts` to add a persistent notification system alongside the existing toast system: add `PersistentNotification[]` array with Zustand `persist` middleware (localStorage), `unreadCount` computed property, `addNotification`, `markAsRead(id)`, `markAllAsRead`, `removeNotification(id)`, `clearAll` actions, and max 100 notification cap with oldest-first eviction
- [ ] T019 [US2] Create `frontend/src/hooks/use-notifications.ts` with a `useNotificationSocket()` hook that listens to Socket.io notification events (using the provider from T008), maps event types to role-appropriate notification objects (title, message, link, entityType, entityId), and calls `addNotification` on the persistent store; include event type filtering based on user role from auth store
- [ ] T020 [P] [US2] Create `frontend/src/components/shared/notification-bell.tsx` - a header icon button showing unread count badge (from notification store), opens a dropdown on click
- [ ] T021 [US2] Create `frontend/src/components/shared/notification-dropdown.tsx` - a Radix UI popover showing the 10 most recent notifications with unread/read styling, click-to-navigate to entity link, "Mark all as read" button, and "View all" link to notifications page
- [ ] T022 [US2] Integrate the notification bell component into the dashboard header at `frontend/src/components/shared/header.tsx` (next to the connection status indicator)
- [ ] T023 [US2] Enhance the notifications page at `frontend/src/app/(dashboard)/notifications/page.tsx` to display all persistent notifications with: list view with unread/read styling, individual mark-as-read on click, bulk "Mark all as read" button, pagination or infinite scroll for large lists, empty state when no notifications exist
- [ ] T024 [US2] Handle edge cases: load missed notifications on reconnection by refetching recent data; handle localStorage quota by trimming oldest notifications; ensure notification sound/visual indicator does not fire for already-read items

**Checkpoint**: User Story 2 fully functional - notifications received in real time, bell shows count, dropdown previews, full page lists all

---

## Phase 5: User Story 3 - Interactive Map & Route Visualization (Priority: P1)

**Goal**: All shipment detail pages display interactive maps with origin/destination markers, route lines, and live driver position

**Independent Test**: Load a shipment detail page with coordinates, verify map shows markers and route; for active shipments verify live driver marker

### Implementation for User Story 3

- [ ] T025 [US3] Enhance `frontend/src/components/maps/tracking-map.tsx` to add a "Show route history" toggle button that switches between showing the planned route (dashed line) and the actual tracking history path (solid line from trackingHistory data)
- [ ] T026 [US3] Ensure `shipment-map.tsx` (created in T011) handles all map display scenarios: static map for completed shipments (origin + destination + final route), live map for active shipments (origin + destination + driver marker + real-time updates), and placeholder for shipments without coordinates
- [ ] T027 [P] [US3] Verify map auto-fits bounds correctly in `tracking-map.tsx` by testing with various coordinate combinations (same country, cross-border, extreme coordinates); fix any bound-fitting issues
- [ ] T028 [US3] Add map section to all remaining shipment list pages that show shipment previews: add a small map thumbnail or "View on map" link on shipment cards in `frontend/src/components/shared/shipment-detail-card.tsx`

**Checkpoint**: User Story 3 fully functional - all shipment views show interactive maps with correct markers and routes

---

## Phase 6: User Story 4 - Advanced Admin Analytics Dashboard (Priority: P2)

**Goal**: Admin sees comprehensive charts (7 sections) with date filtering and export on the analytics page

**Independent Test**: Navigate to admin analytics as admin user, verify all 7 chart sections render with data, change date filter and verify charts update, export a chart as CSV

### Implementation for User Story 4

- [ ] T029 [P] [US4] Create `frontend/src/lib/api/analytics.ts` with API functions for all 8 analytics endpoints: getKpiSummary, getLanePerformance, getStatusTrends, getRevenueAnalysis, getPerformanceMetrics, getCustomerInsights, getEfficiencyMetrics, getGeoAnalytics (per contracts/api-hooks.ts)
- [ ] T030 [US4] Create `frontend/src/hooks/use-analytics.ts` with React Query hooks wrapping each analytics API function: useKpiSummary, useLanePerformance, useStatusTrends, useRevenueAnalysis, usePerformanceMetrics, useCustomerInsights, useEfficiencyMetrics, useGeoAnalytics - all accepting optional date range params
- [ ] T031 [P] [US4] Create `frontend/src/components/charts/status-trends-chart.tsx` - Recharts AreaChart/LineChart showing shipment status counts over time periods, with legend for each status type, responsive container
- [ ] T032 [P] [US4] Create `frontend/src/components/charts/revenue-chart.tsx` - Recharts BarChart showing totalRevenue and shipmentCount per period, with dual Y-axis for revenue amount and shipment count
- [ ] T033 [P] [US4] Create `frontend/src/components/charts/performance-chart.tsx` - Recharts BarChart showing top drivers/trucks ranked by totalShipments, onTimeDeliveryRate, with a toggle between driver and truck view
- [ ] T034 [P] [US4] Create `frontend/src/components/charts/efficiency-chart.tsx` - Recharts LineChart showing completionRate, cancellationRate, delayRate over time periods
- [ ] T035 [P] [US4] Create `frontend/src/components/charts/customer-insights-chart.tsx` - data table (not chart) showing top customers sorted by shipmentCount/revenue/avgValue with sortable columns
- [ ] T036 [P] [US4] Create `frontend/src/components/charts/geo-chart.tsx` - table showing origin→destination lanes with shipmentCount and revenue; optionally use the existing Leaflet map to plot hotspot markers
- [ ] T037 [US4] Rewrite the admin analytics page at `frontend/src/app/(dashboard)/admin/analytics/page.tsx` to replace the current 4-card layout with a full dashboard: date range filter at top (shared across all charts), KPI summary cards row, then tab sections or scrollable sections for each of the 6 chart components (T031-T036), each with its own ExportButton
- [ ] T038 [US4] Wire export functionality: each chart section's ExportButton should export that section's data as CSV (using existing `exportToCSV`) or PDF (using existing `exportToPDF`) with the current filter date range

**Checkpoint**: User Story 4 fully functional - admin analytics page shows 7 data sections with filtering and export

---

## Phase 7: User Story 5 - Admin Broker & Registration Management (Priority: P2)

**Goal**: Admin can CRUD brokers and approve/reject registration requests through the frontend

**Independent Test**: Navigate to broker page as admin, create a broker, verify it appears; navigate to registrations, approve one, verify it's processed

### Implementation for User Story 5

- [ ] T039 [P] [US5] Create `frontend/src/lib/api/brokers.ts` with API functions: getBrokers, getBroker(id), createBroker, updateBroker(id), deactivateBroker(id)
- [ ] T040 [P] [US5] Create `frontend/src/hooks/use-brokers.ts` with React Query hooks: useBrokers, useBroker(id), useCreateBroker (mutation), useUpdateBroker (mutation), useDeactivateBroker (mutation) - all with proper cache invalidation on mutation success
- [ ] T041 [US5] Add registration request hooks to `frontend/src/hooks/use-admin.ts`: useRegistrationRequests (query), useApproveRegistration (mutation), useRejectRegistration (mutation with reason param) - with cache invalidation
- [ ] T042 [P] [US5] Create `frontend/src/components/forms/broker-form.tsx` - React Hook Form + Zod validated form with fields: name (required), licenseNumber (required), countriesServed (multi-select or tag input), contacts.email, contacts.phone, notes; supports both create and edit modes
- [ ] T043 [P] [US5] Create `frontend/src/components/tables/brokers-table.tsx` - data table listing brokers with columns: name, licenseNumber, countriesServed (badge list), status (badge), actions (edit/deactivate); sortable and filterable
- [ ] T044 [P] [US5] Create `frontend/src/components/tables/registrations-table.tsx` - data table listing registration requests with columns: name, email, role (badge), submittedAt, state (PENDING/APPROVED/REJECTED badge), actions (approve/reject buttons for PENDING items)
- [ ] T045 [US5] Create broker management page at `frontend/src/app/(dashboard)/admin/brokers/page.tsx` with: page header with "Add Broker" button, brokers table, dialog/sheet for create form, loading/empty states
- [ ] T046 [US5] Create broker detail/edit page at `frontend/src/app/(dashboard)/admin/brokers/[id]/page.tsx` with: broker details display, edit form (broker-form in edit mode), deactivate button with confirmation dialog
- [ ] T047 [US5] Create registration requests page at `frontend/src/app/(dashboard)/admin/registrations/page.tsx` with: page header, registrations table, approve confirmation dialog, reject dialog with reason text input
- [ ] T048 [US5] Add "Brokers" and "Registrations" navigation items to the admin sidebar in `frontend/src/components/shared/sidebar.tsx` under the admin role section

**Checkpoint**: User Story 5 fully functional - admin can manage brokers and process registration requests

---

## Phase 8: User Story 6 - Automation Rules & Webhook Management (Priority: P2)

**Goal**: Merchants can create/manage automation rules and integration settings (API keys, webhooks)

**Independent Test**: Navigate to automation settings as merchant, create a rule, verify it appears; navigate to integrations, generate API key, verify prefix shown; create webhook, verify listed

### Implementation for User Story 6

- [ ] T049 [P] [US6] Create `frontend/src/lib/api/automation.ts` with API functions: getAutomationRules, createAutomationRule, updateAutomationRule(id)
- [ ] T050 [P] [US6] Create `frontend/src/lib/api/integrations.ts` with API functions: getCredentials, createCredential, getWebhooks, createWebhook
- [ ] T051 [P] [US6] Create `frontend/src/hooks/use-automation.ts` with React Query hooks: useAutomationRules (query), useCreateAutomationRule (mutation), useUpdateAutomationRule (mutation) - with cache invalidation
- [ ] T052 [P] [US6] Create `frontend/src/hooks/use-integrations.ts` with React Query hooks: useIntegrationCredentials (query), useCreateCredential (mutation returning full API key), useWebhooks (query), useCreateWebhook (mutation) - with cache invalidation
- [ ] T053 [P] [US6] Create `frontend/src/components/forms/automation-rule-form.tsx` - form with fields: name (text), triggerType (select: delay/missing-update), threshold (number input), thresholdUnit (display "hours"), action (select: notify/escalate); Zod validated
- [ ] T054 [P] [US6] Create `frontend/src/components/forms/webhook-form.tsx` - form with fields: endpointUrl (URL input), eventTypes (multi-select checkboxes from available event types); Zod validated
- [ ] T055 [P] [US6] Create `frontend/src/components/tables/automation-rules-table.tsx` - table with columns: name, triggerType, threshold, action, active (switch toggle), lastTriggeredAt, actions (edit)
- [ ] T056 [P] [US6] Create `frontend/src/components/tables/webhooks-table.tsx` - table with columns: endpointUrl (truncated), eventTypes (badge list), status (badge), failureCount, lastDeliveredAt
- [ ] T057 [US6] Create automation rules page at `frontend/src/app/(dashboard)/merchant/automation/page.tsx` with: page header, "Create Rule" button, rules table with inline active toggle, create/edit dialog with automation-rule-form
- [ ] T058 [US6] Create integrations page at `frontend/src/app/(dashboard)/merchant/integrations/page.tsx` with: two sections - "API Credentials" (list of credentials with prefix shown, "Generate New Key" button that shows full key in a one-time dialog) and "Webhooks" (webhook table, "Add Webhook" button with webhook-form dialog)
- [ ] T059 [US6] Add "Automation" and "Integrations" navigation items to the merchant sidebar in `frontend/src/components/shared/sidebar.tsx` under the merchant role section

**Checkpoint**: User Story 6 fully functional - merchants can manage automation rules, API keys, and webhooks

---

## Phase 9: User Story 7 - Global Search & Advanced Filtering (Priority: P2)

**Goal**: Users can search globally via Cmd+K command palette and apply multi-filters on all list pages with URL persistence

**Independent Test**: Press Cmd+K, type a search term, verify results appear grouped by type; apply filters on shipments list, verify URL updates and results filter correctly

### Implementation for User Story 7

- [ ] T060 [US7] Create `frontend/src/hooks/use-url-filters.ts` - a generic hook that reads filter state from `useSearchParams`, writes updates via `router.push` (shallow), provides `setFilter(key, value)`, `setFilters(updates)`, `resetFilters()`, and returns the current `FilterState` object; debounce URL updates by 300ms
- [ ] T061 [US7] Create `frontend/src/components/shared/advanced-filters.tsx` - a reusable filter bar component that accepts a filter config (array of {key, label, type: 'select'|'date'|'text', options?}), renders filter inputs using Radix UI components, calls `setFilter` from the URL filters hook, shows active filter count badge, and has a "Clear all" button
- [ ] T062 [US7] Create `frontend/src/hooks/use-command-palette.ts` - hook that manages open/close state, search query, debounced search (300ms), fires parallel API calls to search shipments/trucks/drivers/users endpoints, aggregates results into typed SearchResult array grouped by entity type
- [ ] T063 [US7] Create `frontend/src/components/shared/command-palette.tsx` using the `cmdk` library - dialog triggered by Cmd/Ctrl+K, search input at top, results grouped by type (Shipments, Trucks, Drivers, Users) with icons, click navigates to entity detail page, keyboard navigation support, loading state while searching
- [ ] T064 [US7] Register the Cmd/Ctrl+K keyboard shortcut in the dashboard layout at `frontend/src/app/(dashboard)/layout.tsx` and render the CommandPalette component
- [ ] T065 [P] [US7] Integrate advanced-filters into the shipments list page at `frontend/src/app/(dashboard)/merchant/shipments/page.tsx` with filters: status (select), dateFrom/dateTo (date pickers), origin country (text); pass URL filter params to the shipments query hook
- [ ] T066 [P] [US7] Integrate advanced-filters into the admin shipments list at `frontend/src/app/(dashboard)/admin/shipments/page.tsx` with filters: status, dateFrom/dateTo, merchant
- [ ] T067 [P] [US7] Integrate advanced-filters into the trucks list at `frontend/src/app/(dashboard)/truck-owner/fleet/trucks/page.tsx` with filters: status, capacity range
- [ ] T068 [P] [US7] Integrate advanced-filters into the admin users list at `frontend/src/app/(dashboard)/admin/users/page.tsx` with filters: role, isActive
- [ ] T069 [P] [US7] Integrate advanced-filters into the applications list pages (merchant bids view, truck owner applications view) with filters: status, dateFrom/dateTo
- [ ] T070 [US7] Add "No results" empty state with suggestions to broaden search when filters produce zero results across all list pages using the empty-state component from T006

**Checkpoint**: User Story 7 fully functional - command palette search works, all list pages have URL-synced filters

---

## Phase 10: User Story 8 - Payment Details & History (Priority: P3)

**Goal**: Merchants see payment details on shipment pages and have a dedicated payment history view

**Independent Test**: View a shipment with payment data, verify payment section shows amount/status/receipt; navigate to payment history, verify aggregated list

### Implementation for User Story 8

- [ ] T071 [P] [US8] Create `frontend/src/components/shared/payment-details-card.tsx` - a card component displaying: payment amount with currency, payment date, payment status (verified/unverified badge), receipt link (download button), verification info (verifiedBy, date)
- [ ] T072 [US8] Integrate payment-details-card into the merchant shipment detail page at `frontend/src/app/(dashboard)/merchant/shipments/[id]/page.tsx` - render the card in a "Payment" section when shipment has paymentDetails data; conditionally hide when no payment data exists
- [ ] T073 [US8] Create payment history page at `frontend/src/app/(dashboard)/merchant/payments/page.tsx` - page that fetches all merchant shipments, extracts payment data, displays in a table with columns: shipment ID (link), amount, currency, payment date, status; with date range filter and totals summary row
- [ ] T074 [US8] Add "Payments" navigation item to the merchant sidebar in `frontend/src/components/shared/sidebar.tsx`

**Checkpoint**: User Story 8 fully functional - payment details visible on shipments, payment history page available

---

## Phase 11: User Story 9 - Performance & Loading Experience (Priority: P3)

**Goal**: Skeleton screens on all pages, lazy loading for role bundles, error retry states, prefetching

**Independent Test**: Navigate to dashboard, verify skeleton screens appear during loading; disconnect network, verify error retry UI appears; check bundle analyzer output for code splitting

### Implementation for User Story 9

- [ ] T075 [US9] Create skeleton loading components for each major page section: dashboard stats skeleton, table skeleton, chart skeleton, detail card skeleton, map skeleton - add to `frontend/src/components/shared/` as `skeleton-*.tsx` files (or extend existing Skeleton component usage)
- [ ] T076 [P] [US9] Add skeleton loading states to all 4 dashboard pages (admin, merchant, truck-owner, driver) by replacing `isLoading` conditional renders with skeleton components
- [ ] T077 [P] [US9] Add skeleton loading states to all table/list pages (shipments, trucks, drivers, applications, users, brokers, registrations)
- [ ] T078 [US9] Implement error retry wrapper: create a `QueryErrorBoundary` component in `frontend/src/components/shared/error-retry.tsx` that wraps React Query error states with the error-retry component from T007, displaying error message and retry button calling `refetch()`; integrate into all pages that use React Query
- [ ] T079 [US9] Configure Next.js for optimal code splitting in `frontend/next.config.mjs`: add `@next/bundle-analyzer` for analysis; verify App Router automatic code splitting is working per-route; add `optimizePackageImports` for large libraries (lucide-react, radix-ui)
- [ ] T080 [US9] Add link prefetching: ensure all Next.js `<Link>` components in sidebar and navigation use default prefetch behavior; add `router.prefetch()` calls for common navigation targets on dashboard hover events
- [ ] T081 [US9] Implement form data preservation: add `sessionStorage` auto-save (debounced 2s) to the multi-step shipment creation form at `frontend/src/components/forms/shipment-form.tsx`; restore on page reload; clear on successful submission

**Checkpoint**: User Story 9 fully functional - skeleton screens everywhere, error retries work, bundles are optimized

---

## Phase 12: User Story 10 - Accessibility & RTL Support (Priority: P3)

**Goal**: Keyboard navigation, WCAG AA compliance, and RTL layout for Arabic locale

**Independent Test**: Tab through entire app with keyboard, verify all elements reachable; run axe-core audit, verify no critical violations; set dir=rtl, verify layout mirrors correctly

### Implementation for User Story 10

- [ ] T082 [US10] Add `dir` attribute toggle to root layout at `frontend/src/app/layout.tsx` based on a locale context/cookie; default to `dir="ltr"` with ability to switch to `dir="rtl"` for Arabic
- [ ] T083 [US10] Audit and update the sidebar component at `frontend/src/components/shared/sidebar.tsx` for RTL: use CSS logical properties (`ms-*`/`me-*` instead of `ml-*`/`mr-*`), mirror sidebar position with `rtl:` Tailwind variants, ensure icons and text flow correctly in RTL
- [ ] T084 [P] [US10] Audit and update all form components in `frontend/src/components/forms/` for RTL: ensure labels align correctly, input text direction is appropriate, validation error messages appear on correct side
- [ ] T085 [P] [US10] Audit and update all table components in `frontend/src/components/tables/` for RTL: ensure column alignment and sort indicators mirror correctly
- [ ] T086 [US10] Add visible focus indicators to all interactive elements: verify `:focus-visible` ring styles are applied via Tailwind's `focus-visible:ring-2` across buttons, links, inputs, selects, and custom components; fix any missing focus styles
- [ ] T087 [US10] Add RTL CSS utilities to `frontend/src/app/globals.css`: add logical property utility classes if not already provided by Tailwind; add RTL-specific overrides for third-party components (Leaflet map controls, Recharts labels)
- [ ] T088 [US10] Run automated accessibility audit using axe-core (via browser extension or script): test all major pages in both light and dark modes; fix any critical or serious color contrast violations by adjusting CSS variables in globals.css

**Checkpoint**: User Story 10 fully functional - keyboard navigation works, accessibility audit passes, RTL layout correct

---

## Phase 13: User Story 11 - Automated Testing Suite (Priority: P3)

**Goal**: Unit tests for hooks/utilities, E2E tests for primary user journeys, MSW for API mocking

**Independent Test**: Run `npm test` and `npm run test:e2e`, verify all tests pass

### Implementation for User Story 11

- [ ] T089 [US11] Set up MSW (Mock Service Worker) in `frontend/tests/mocks/`: create `handlers.ts` with mock handlers for core API endpoints (auth/login, shipments CRUD, applications, trucks, users), create `server.ts` for test environment setup, update `frontend/jest.setup.js` to start/stop MSW server
- [ ] T090 [P] [US11] Write unit tests for `use-url-filters` hook in `frontend/tests/unit/hooks/use-url-filters.test.ts`: test reading from search params, setting filters, resetting, debounce behavior
- [ ] T091 [P] [US11] Write unit tests for notification store in `frontend/tests/unit/stores/notification-store.test.ts`: test addNotification, markAsRead, markAllAsRead, 100-cap eviction, persistence
- [ ] T092 [P] [US11] Write unit tests for API client in `frontend/tests/unit/lib/api-client.test.ts`: test token management, refresh flow, CSRF handling, error handling
- [ ] T093 [P] [US11] Write unit tests for export utilities in `frontend/tests/unit/lib/export.test.ts`: test CSV generation, PDF generation, filename formatting
- [ ] T094 [P] [US11] Write unit tests for validation schemas in `frontend/tests/unit/lib/validations.test.ts`: test all Zod schemas with valid and invalid inputs
- [ ] T095 [US11] Write E2E test for login flow in `frontend/tests/e2e/auth.spec.ts`: test successful login, invalid credentials error, redirect to dashboard after login, logout flow
- [ ] T096 [P] [US11] Write E2E test for shipment creation in `frontend/tests/e2e/shipment.spec.ts`: test multi-step form completion (origin, cargo, pricing), successful submission, redirect to shipment detail
- [ ] T097 [P] [US11] Write E2E test for bid submission in `frontend/tests/e2e/bidding.spec.ts`: test truck owner browsing available shipments, submitting a bid with truck and driver selection, bid appearing in applications list
- [ ] T098 [P] [US11] Write E2E test for shipment tracking in `frontend/tests/e2e/tracking.spec.ts`: test shipment detail page loads map, status badge displays correctly, timeline shows entries

**Checkpoint**: User Story 11 fully functional - all tests pass, coverage meets thresholds

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T099 [P] Add empty state components to all list pages that currently show blank when no data exists: shipments, trucks, drivers, applications, brokers, registrations, webhooks, automation rules - use the empty-state component from T006 with contextual messages and "Create" CTAs
- [ ] T100 Verify all new sidebar navigation items (Brokers, Registrations, Automation, Integrations, Payments) are correctly gated by user role in `frontend/src/components/shared/sidebar.tsx`
- [ ] T101 [P] Review and optimize React Query cache settings across all new hooks: set appropriate `staleTime` (5min for analytics, 1min for lists, 0 for real-time data) and `gcTime` values
- [ ] T102 Run `npm run build` in frontend and verify no TypeScript errors, no build warnings, and output bundle sizes are reasonable
- [ ] T103 Run quickstart.md validation: follow all steps in `specs/007-production-frontend/quickstart.md` from scratch and verify the development workflow works end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (dependency install) and T002-T004 (types/endpoints)
- **US1 (Phase 3)**: Depends on Phase 2 completion (Socket.io provider)
- **US2 (Phase 4)**: Depends on Phase 2 completion (Socket.io provider)
- **US3 (Phase 5)**: Depends on T011 from US1 (shipment-map component)
- **US4 (Phase 6)**: Depends on Phase 1 (Recharts install + types)
- **US5 (Phase 7)**: Depends on Phase 1 (types + endpoints)
- **US6 (Phase 8)**: Depends on Phase 1 (types + endpoints)
- **US7 (Phase 9)**: Depends on Phase 1 (types + endpoints)
- **US8 (Phase 10)**: Depends on Phase 1 (types)
- **US9 (Phase 11)**: Can start after Phase 1
- **US10 (Phase 12)**: Can start after Phase 1
- **US11 (Phase 13)**: Should start after US1-US7 to have code to test
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### User Story Independence

- **US1, US2**: Can run in parallel after Phase 2
- **US3**: Depends on US1 (uses shipment-map from T011)
- **US4, US5, US6, US7, US8**: All independent - can run in parallel after Phase 1
- **US9, US10**: Independent - can run in parallel at any time after Phase 1
- **US11**: Should run after implementation stories to have code to test

### Parallel Opportunities

**After Phase 1 (Setup)**:
- US4, US5, US6, US7, US8, US9, US10 can all start in parallel

**After Phase 2 (Foundational)**:
- US1 and US2 can start in parallel

**Within each story**:
- Tasks marked [P] within the same story can run in parallel
- API layer + Hook tasks can run in parallel with component/form tasks within the same story

---

## Parallel Example: User Story 5

```bash
# These 4 tasks can all run in parallel (different files, no deps):
Task T039: "Create frontend/src/lib/api/brokers.ts"
Task T040: "Create frontend/src/hooks/use-brokers.ts"
Task T042: "Create frontend/src/components/forms/broker-form.tsx"
Task T043: "Create frontend/src/components/tables/brokers-table.tsx"

# Then these depend on the above:
Task T045: "Create broker management page" (needs T040, T042, T043)
Task T046: "Create broker detail page" (needs T040, T042)
```

## Parallel Example: User Story 4

```bash
# These 6 chart components can all run in parallel:
Task T031: "Create status-trends-chart.tsx"
Task T032: "Create revenue-chart.tsx"
Task T033: "Create performance-chart.tsx"
Task T034: "Create efficiency-chart.tsx"
Task T035: "Create customer-insights-chart.tsx"
Task T036: "Create geo-chart.tsx"

# Then the page assembly depends on all charts:
Task T037: "Rewrite admin analytics page" (needs T031-T036)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Socket.io provider)
3. Complete Phase 3: US1 - Real-Time Tracking
4. Complete Phase 4: US2 - Notifications
5. Complete Phase 5: US3 - Maps
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready - core logistics platform features complete

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 + US3 (P1s) → Real-time platform (MVP!)
3. US4 + US5 (P2 admin) → Admin fully operational
4. US6 + US7 (P2 merchant) → Merchant features complete
5. US8 + US9 + US10 (P3s) → Polish and accessibility
6. US11 (P3) → Testing suite
7. Each increment adds value without breaking previous

### Parallel Team Strategy

With 3 developers after Phase 2:
- **Dev A**: US1 (tracking) → US3 (maps) → US9 (performance)
- **Dev B**: US2 (notifications) → US4 (analytics) → US10 (accessibility)
- **Dev C**: US5 (brokers) → US6 (automation) → US7 (search) → US8 (payments)
- **All**: US11 (testing) → Phase 14 (polish)

---

## Summary

| Metric | Count |
| --- | --- |
| **Total Tasks** | 103 |
| **Phase 1 (Setup)** | 7 |
| **Phase 2 (Foundational)** | 3 |
| **US1 (P1 - Tracking)** | 7 |
| **US2 (P1 - Notifications)** | 7 |
| **US3 (P1 - Maps)** | 4 |
| **US4 (P2 - Analytics)** | 10 |
| **US5 (P2 - Brokers/Registrations)** | 10 |
| **US6 (P2 - Automation/Webhooks)** | 11 |
| **US7 (P2 - Search/Filters)** | 11 |
| **US8 (P3 - Payments)** | 4 |
| **US9 (P3 - Performance)** | 7 |
| **US10 (P3 - Accessibility)** | 7 |
| **US11 (P3 - Testing)** | 10 |
| **Phase 14 (Polish)** | 5 |
| **Parallelizable Tasks** | 58 (56%) |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
