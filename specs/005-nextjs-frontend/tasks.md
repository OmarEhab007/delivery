# Tasks: Next.js Frontend Application

**Input**: Design documents from `/specs/005-nextjs-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/` (Next.js 14 App Router project)
- **Tests**: `frontend/tests/` (Jest/RTL unit, Playwright E2E)
- **Types**: `frontend/src/types/`
- **Components**: `frontend/src/components/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create Next.js project and configure development environment

- [X] T001 Create Next.js 14 project with TypeScript in `frontend/` directory
- [X] T002 Install core dependencies (Tanstack Query, Zustand, Zod, React Hook Form) in `frontend/package.json`
- [X] T003 [P] Initialize shadcn/ui and add base components in `frontend/components.json`
- [X] T004 [P] Configure Tailwind CSS with Figma design tokens in `frontend/tailwind.config.ts`
- [X] T005 [P] Set up CSS variables for theme colors in `frontend/src/styles/globals.css`
- [X] T006 [P] Install and configure Leaflet/React-Leaflet for maps in `frontend/package.json`
- [X] T007 [P] Configure ESLint and Prettier in `frontend/.eslintrc.json` and `frontend/.prettierrc`
- [X] T008 Create environment configuration file `frontend/.env.local`
- [X] T009 Update root `package.json` with frontend scripts (dev:all, frontend commands)
- [X] T010 [P] Set up Jest and React Testing Library in `frontend/jest.config.js`
- [X] T011 [P] Set up Playwright for E2E tests in `frontend/playwright.config.ts`

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Copy API types from `specs/005-nextjs-frontend/contracts/api-types.ts` to `frontend/src/types/api.ts`
- [X] T013 Create entity types from data-model in `frontend/src/types/entities.ts`
- [X] T014 [P] Create API client base with fetch wrapper in `frontend/src/lib/api/client.ts`
- [X] T015 [P] Implement API endpoints configuration in `frontend/src/lib/api/endpoints.ts`
- [X] T016 Implement auth API methods (login, logout, refresh) in `frontend/src/lib/api/auth.ts`
- [X] T017 [P] Implement shipments API methods in `frontend/src/lib/api/shipments.ts`
- [X] T018 [P] Implement applications API methods in `frontend/src/lib/api/applications.ts`
- [X] T019 [P] Implement trucks API methods in `frontend/src/lib/api/trucks.ts`
- [X] T020 [P] Implement drivers API methods in `frontend/src/lib/api/drivers.ts`
- [X] T021 [P] Implement documents API methods in `frontend/src/lib/api/documents.ts`
- [X] T022 [P] Implement admin API methods in `frontend/src/lib/api/admin.ts`
- [X] T023 Create auth store with Zustand in `frontend/src/stores/auth-store.ts`
- [X] T024 [P] Create theme store with Zustand in `frontend/src/stores/theme-store.ts`
- [X] T025 [P] Create notification store with Zustand in `frontend/src/stores/notification-store.ts`
- [X] T026 Create Tanstack Query provider in `frontend/src/lib/providers/query-provider.tsx`
- [X] T027 [P] Create Zustand providers wrapper in `frontend/src/lib/providers/store-provider.tsx`
- [X] T028 Create root layout with all providers in `frontend/src/app/layout.tsx`
- [X] T029 [P] Create cn utility function in `frontend/src/lib/utils.ts`
- [X] T030 [P] Create Zod validation schemas in `frontend/src/lib/validations/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - User Authentication and Role-Based Access (Priority: P1) MVP

**Goal**: Users can securely log in, be redirected to role-specific dashboards, and manage their sessions with theme preferences

**Independent Test**: Login with different user credentials and verify correct dashboard routing and access restrictions

### Implementation for User Story 1

- [X] T031 [US1] Create login page UI in `frontend/src/app/(auth)/login/page.tsx`
- [X] T032 [P] [US1] Create login form component with validation in `frontend/src/components/forms/login-form.tsx`
- [X] T033 [P] [US1] Create registration page UI in `frontend/src/app/(auth)/register/page.tsx`
- [X] T034 [P] [US1] Create registration form component in `frontend/src/components/forms/register-form.tsx`
- [X] T035 [US1] Create auth layout for login/register pages in `frontend/src/app/(auth)/layout.tsx`
- [X] T036 [US1] Implement Next.js middleware for route protection in `frontend/src/middleware.ts`
- [X] T037 [US1] Create dashboard layout with sidebar navigation in `frontend/src/app/(dashboard)/layout.tsx`
- [X] T038 [P] [US1] Create sidebar component with role-based menu in `frontend/src/components/shared/sidebar.tsx`
- [X] T039 [P] [US1] Create header component with user menu in `frontend/src/components/shared/header.tsx`
- [X] T040 [P] [US1] Create theme toggle component in `frontend/src/components/shared/theme-toggle.tsx`
- [X] T041 [US1] Create admin dashboard redirect page in `frontend/src/app/(dashboard)/admin/page.tsx`
- [X] T042 [P] [US1] Create merchant dashboard redirect page in `frontend/src/app/(dashboard)/merchant/page.tsx`
- [X] T043 [P] [US1] Create truck-owner dashboard redirect page in `frontend/src/app/(dashboard)/truck-owner/page.tsx`
- [X] T044 [P] [US1] Create driver dashboard redirect page in `frontend/src/app/(dashboard)/driver/page.tsx`
- [X] T045 [US1] Create landing page with redirect logic in `frontend/src/app/page.tsx`
- [X] T046 [US1] Implement token refresh hook in `frontend/src/hooks/use-auth.ts`
- [X] T047 [P] [US1] Create access denied component in `frontend/src/components/shared/access-denied.tsx`
- [X] T048 [P] [US1] Create loading spinner component in `frontend/src/components/ui/loading-spinner.tsx`
- [X] T049 [US1] Add toast notifications for auth events in `frontend/src/components/shared/toaster.tsx`

**Checkpoint**: Users can login, see role-specific dashboards, toggle theme, and logout

---

## Phase 4: User Story 2 - Merchant Creates and Manages Shipments (Priority: P1)

**Goal**: Merchants can create shipments, view their shipment list, manage bids, and track shipments

**Independent Test**: Merchant logs in, creates a shipment, views it in their list, and manages bids

### Implementation for User Story 2

- [X] T050 [US2] Create merchant dashboard page with stats in `frontend/src/app/(dashboard)/merchant/dashboard/page.tsx`
- [X] T051 [P] [US2] Create stats cards component in `frontend/src/components/shared/stats-cards.tsx`
- [X] T052 [US2] Create shipments list page in `frontend/src/app/(dashboard)/merchant/shipments/page.tsx`
- [X] T053 [P] [US2] Create shipments data table component in `frontend/src/components/tables/shipments-table.tsx`
- [X] T054 [P] [US2] Create shipment status badge component in `frontend/src/components/shared/status-badge.tsx`
- [X] T055 [US2] Create new shipment page in `frontend/src/app/(dashboard)/merchant/shipments/new/page.tsx`
- [X] T056 [US2] Create shipment form component (bidding type) in `frontend/src/components/forms/shipment-form.tsx`
- [X] T057 [P] [US2] Create location picker component in `frontend/src/components/forms/location-picker.tsx`
- [X] T058 [P] [US2] Create cargo details form section in `frontend/src/components/forms/cargo-details.tsx`
- [X] T059 [US2] Create shipment detail page in `frontend/src/app/(dashboard)/merchant/shipments/[id]/page.tsx`
- [X] T060 [P] [US2] Create shipment detail card component in `frontend/src/components/shared/shipment-detail-card.tsx`
- [X] T061 [US2] Create bids list component for shipment detail in `frontend/src/components/tables/bids-table.tsx`
- [X] T062 [P] [US2] Create accept/reject bid dialog in `frontend/src/components/shared/bid-action-dialog.tsx`
- [X] T063 [US2] Create shipment timeline component in `frontend/src/components/shared/shipment-timeline.tsx`
- [X] T064 [US2] Implement useShipments query hook in `frontend/src/hooks/use-shipments.ts`
- [X] T065 [P] [US2] Implement useApplications query hook in `frontend/src/hooks/use-applications.ts`
- [X] T066 [US2] Create merchant KPI dashboard page in `frontend/src/app/(dashboard)/merchant/analytics/page.tsx`
- [X] T067 [P] [US2] Create KPI charts components in `frontend/src/components/charts/kpi-charts.tsx`

**Checkpoint**: Merchants can create shipments, view list, manage bids, and see analytics

---

## Phase 5: User Story 3 - TruckOwner Bids on Shipments (Priority: P1)

**Goal**: TruckOwners can browse available shipments and submit competitive bids

**Independent Test**: TruckOwner logs in, views available shipments, and submits a bid

### Implementation for User Story 3

- [X] T068 [US3] Create truck-owner dashboard page in `frontend/src/app/(dashboard)/truck-owner/dashboard/page.tsx`
- [X] T069 [US3] Create available shipments page in `frontend/src/app/(dashboard)/truck-owner/shipments/page.tsx`
- [X] T070 [P] [US3] Create available shipments table component in `frontend/src/components/tables/available-shipments-table.tsx`
- [X] T071 [US3] Create shipment detail page for truck owner in `frontend/src/app/(dashboard)/truck-owner/shipments/[id]/page.tsx`
- [X] T072 [US3] Create bid submission form in `frontend/src/components/forms/bid-form.tsx`
- [X] T073 [P] [US3] Create truck selector component in `frontend/src/components/forms/truck-selector.tsx`
- [X] T074 [P] [US3] Create driver selector component in `frontend/src/components/forms/driver-selector.tsx`
- [X] T075 [US3] Create my applications page in `frontend/src/app/(dashboard)/truck-owner/applications/page.tsx`
- [X] T076 [P] [US3] Create my applications table component in `frontend/src/components/tables/my-applications-table.tsx`
- [X] T077 [US3] Create application detail page in `frontend/src/app/(dashboard)/truck-owner/applications/[id]/page.tsx`
- [X] T078 [P] [US3] Create edit/cancel bid dialog in `frontend/src/components/shared/edit-bid-dialog.tsx`
- [X] T079 [US3] Implement useTrucks query hook in `frontend/src/hooks/use-trucks.ts`
- [X] T080 [P] [US3] Implement useDrivers query hook in `frontend/src/hooks/use-drivers.ts`

**Checkpoint**: TruckOwners can view shipments, submit bids, and manage their applications

---

## Phase 6: User Story 4 - TruckOwner Manages Fleet (Priority: P2)

**Goal**: TruckOwners can manage their fleet of trucks and team of drivers

**Independent Test**: TruckOwner adds a new truck with documents, registers a driver, and assigns driver to truck

### Implementation for User Story 4

- [X] T081 [US4] Create fleet management page in `frontend/src/app/(dashboard)/truck-owner/fleet/page.tsx`
- [X] T082 [P] [US4] Create trucks list table component in `frontend/src/components/tables/trucks-table.tsx`
- [X] T083 [US4] Create add truck page in `frontend/src/app/(dashboard)/truck-owner/fleet/trucks/new/page.tsx`
- [X] T084 [US4] Create truck form component in `frontend/src/components/forms/truck-form.tsx`
- [X] T085 [US4] Create truck detail page in `frontend/src/app/(dashboard)/truck-owner/fleet/trucks/[id]/page.tsx`
- [X] T086 [P] [US4] Create truck detail card component in `frontend/src/components/shared/truck-detail-card.tsx`
- [X] T087 [P] [US4] Create maintenance history component in `frontend/src/components/shared/maintenance-history.tsx`
- [X] T088 [US4] Create drivers list page in `frontend/src/app/(dashboard)/truck-owner/fleet/drivers/page.tsx`
- [X] T089 [P] [US4] Create drivers table component in `frontend/src/components/tables/drivers-table.tsx`
- [X] T090 [US4] Create add driver page in `frontend/src/app/(dashboard)/truck-owner/fleet/drivers/new/page.tsx`
- [X] T091 [US4] Create driver registration form in `frontend/src/components/forms/driver-form.tsx`
- [X] T092 [US4] Create driver detail page in `frontend/src/app/(dashboard)/truck-owner/fleet/drivers/[id]/page.tsx`
- [X] T093 [P] [US4] Create assign driver to truck dialog in `frontend/src/components/shared/assign-driver-dialog.tsx`
- [X] T094 [US4] Create assigned shipments page for truck owner in `frontend/src/app/(dashboard)/truck-owner/assigned/page.tsx`

**Checkpoint**: TruckOwners can manage trucks, drivers, and assignments

---

## Phase 7: User Story 5 - Driver Executes Deliveries (Priority: P2)

**Goal**: Drivers can view assigned shipments, start/complete deliveries, report issues, and manage status

**Independent Test**: Driver logs in, views assigned shipments, starts delivery, and completes with proof

### Implementation for User Story 5

- [X] T095 [US5] Create driver dashboard page in `frontend/src/app/(dashboard)/driver/dashboard/page.tsx`
- [X] T096 [P] [US5] Create driver quick actions component in `frontend/src/components/shared/driver-quick-actions.tsx`
- [X] T097 [US5] Create assigned shipments page in `frontend/src/app/(dashboard)/driver/shipments/page.tsx`
- [X] T098 [P] [US5] Create driver shipments list component in `frontend/src/components/tables/driver-shipments-table.tsx`
- [X] T099 [US5] Create shipment execution page in `frontend/src/app/(dashboard)/driver/shipments/[id]/page.tsx`
- [X] T100 [US5] Create start delivery form component in `frontend/src/components/forms/start-delivery-form.tsx`
- [X] T101 [P] [US5] Create complete delivery form component in `frontend/src/components/forms/complete-delivery-form.tsx`
- [X] T102 [P] [US5] Create photo upload component for POD in `frontend/src/components/forms/photo-upload.tsx`
- [X] T103 [P] [US5] Create signature capture component in `frontend/src/components/forms/signature-capture.tsx`
- [X] T104 [US5] Create report issue form in `frontend/src/components/forms/report-issue-form.tsx`
- [X] T105 [US5] Create driver status toggle component in `frontend/src/components/shared/driver-status-toggle.tsx`
- [X] T106 [US5] Create check-in/check-out page in `frontend/src/app/(dashboard)/driver/checkin/page.tsx`
- [X] T107 [P] [US5] Create check-in form component in `frontend/src/components/forms/checkin-form.tsx`
- [X] T108 [US5] Create driver history page in `frontend/src/app/(dashboard)/driver/history/page.tsx`
- [X] T109 [US5] Create driver profile page in `frontend/src/app/(dashboard)/driver/profile/page.tsx`

**Checkpoint**: Drivers can execute full delivery workflow including proof of delivery

---

## Phase 8: User Story 6 - Admin Oversees System Operations (Priority: P2)

**Goal**: Admins can manage users, approve registrations, oversee shipments, and verify documents

**Independent Test**: Admin logs in, views dashboard, and performs user management actions

### Implementation for User Story 6

- [X] T110 [US6] Create admin dashboard page in `frontend/src/app/(dashboard)/admin/dashboard/page.tsx`
- [X] T111 [P] [US6] Create admin stats cards component in `frontend/src/components/shared/admin-stats-cards.tsx`
- [X] T112 [P] [US6] Create recent activity feed component in `frontend/src/components/shared/activity-feed.tsx`
- [X] T113 [US6] Create user management page in `frontend/src/app/(dashboard)/admin/users/page.tsx`
- [X] T114 [P] [US6] Create users table component in `frontend/src/components/tables/users-table.tsx`
- [X] T115 [US6] Create user detail page in `frontend/src/app/(dashboard)/admin/users/[id]/page.tsx`
- [X] T116 [P] [US6] Create user detail card component in `frontend/src/components/shared/user-detail-card.tsx`
- [X] T117 [US6] Create pending approvals page in `frontend/src/app/(dashboard)/admin/approvals/page.tsx`
- [X] T118 [P] [US6] Create approval cards component in `frontend/src/components/shared/approval-cards.tsx`
- [X] T119 [P] [US6] Create approve/reject dialog in `frontend/src/components/shared/approve-dialog.tsx`
- [X] T120 [US6] Create admin shipments page in `frontend/src/app/(dashboard)/admin/shipments/page.tsx`
- [X] T121 [US6] Create admin shipment detail page in `frontend/src/app/(dashboard)/admin/shipments/[id]/page.tsx`
- [X] T122 [US6] Create admin trucks page in `frontend/src/app/(dashboard)/admin/trucks/page.tsx`
- [X] T123 [US6] Create document verification page in `frontend/src/app/(dashboard)/admin/documents/page.tsx`
- [X] T124 [P] [US6] Create document verification card component in `frontend/src/components/shared/document-verification-card.tsx`
- [X] T125 [US6] Create admin analytics page in `frontend/src/app/(dashboard)/admin/analytics/page.tsx`
- [X] T126 [US6] Implement useAdmin query hook in `frontend/src/hooks/use-admin.ts`

**Checkpoint**: Admins can manage all system aspects including approvals and verification

---

## Phase 9: User Story 7 - Real-Time Location Tracking (Priority: P2)

**Goal**: Users can track shipment locations in real-time on interactive maps

**Independent Test**: View an active shipment and verify map updates with driver location changes

### Implementation for User Story 7

- [X] T127 [US7] Create tracking map component in `frontend/src/components/maps/tracking-map.tsx`
- [X] T128 [P] [US7] Create map marker component in `frontend/src/components/maps/map-marker.tsx`
- [X] T129 [P] [US7] Create route polyline component in `frontend/src/components/maps/route-polyline.tsx`
- [X] T130 [US7] Create useTrackingSocket hook in `frontend/src/hooks/use-tracking-socket.ts`
- [X] T131 [P] [US7] Create connection status indicator in `frontend/src/components/shared/connection-status.tsx`
- [X] T132 [US7] Create tracking history view component in `frontend/src/components/shared/tracking-history.tsx`
- [X] T133 [US7] Integrate tracking map into merchant shipment detail page
- [X] T134 [P] [US7] Integrate tracking map into truck-owner assigned shipments
- [X] T135 [P] [US7] Integrate tracking map into driver shipment execution page

**Checkpoint**: Real-time tracking works across all relevant portals

---

## Phase 10: User Story 8 - Document Management (Priority: P3)

**Goal**: Users can upload, view, and manage documents with verification workflow

**Independent Test**: Upload a document, view it, and download it

### Implementation for User Story 8

- [X] T136 [US8] Create document upload component with progress in `frontend/src/components/forms/document-upload.tsx`
- [X] T137 [P] [US8] Create document list component in `frontend/src/components/shared/document-list.tsx`
- [X] T138 [P] [US8] Create document preview dialog in `frontend/src/components/shared/document-preview.tsx`
- [X] T139 [US8] Create useDocuments query hook in `frontend/src/hooks/use-documents.ts`
- [X] T140 [US8] Create useFileUpload hook with progress in `frontend/src/hooks/use-file-upload.ts`
- [X] T141 [US8] Integrate document upload into shipment forms
- [X] T142 [P] [US8] Integrate document upload into truck forms
- [X] T143 [P] [US8] Integrate document upload into driver registration

**Checkpoint**: Document management works across all entity types

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T144 [P] Create error boundary components in `frontend/src/components/shared/error-boundary.tsx`
- [X] T145 [P] Create 404 not found page in `frontend/src/app/not-found.tsx`
- [X] T146 [P] Create global error page in `frontend/src/app/error.tsx`
- [X] T147 Add loading states to all pages with `loading.tsx` files
- [X] T148 [P] Implement infinite scroll for list pages
- [X] T149 [P] Add debounced search to all table components
- [X] T150 Create mobile responsive navigation in `frontend/src/components/shared/mobile-nav.tsx`
- [X] T151 [P] Optimize images and add lazy loading
- [X] T152 Add meta tags and SEO optimization to layout files
- [X] T153 Run quickstart.md validation and fix any issues
- [X] T154 Performance optimization pass (bundle analysis, code splitting)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP Authentication
- **User Story 2 (Phase 4)**: Depends on US1 (auth) - Merchant Portal
- **User Story 3 (Phase 5)**: Depends on US1 (auth) - TruckOwner Bidding
- **User Story 4 (Phase 6)**: Depends on US3 - TruckOwner Fleet
- **User Story 5 (Phase 7)**: Depends on US1 (auth) - Driver Portal
- **User Story 6 (Phase 8)**: Depends on US1 (auth) - Admin Portal
- **User Story 7 (Phase 9)**: Depends on US2, US3, US5 - Tracking (cross-portal)
- **User Story 8 (Phase 10)**: Depends on Foundational - Documents (parallel with others)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
US1 (Auth) ─────┬────> US2 (Merchant Shipments)
                │
                ├────> US3 (TruckOwner Bidding) ───> US4 (Fleet Management)
                │
                ├────> US5 (Driver Deliveries)
                │
                └────> US6 (Admin Operations)

US2 + US3 + US5 ─────> US7 (Real-Time Tracking)

Foundational ───────> US8 (Document Management) [can parallel with US1+]
```

### Within Each User Story

- API hooks before UI components
- Shared components before page-specific ones
- List pages before detail pages
- Forms before submission logic
- Core features before enhancements

### Parallel Opportunities

**Setup Phase (all [P] tasks):**
- T003, T004, T005, T006, T007, T010, T011 can all run in parallel

**Foundational Phase:**
- T014, T015 (API base) first, then T016-T022 can parallel
- T23, T24, T25 stores can parallel
- T26, T27, T29, T30 can parallel

**User Story 1 (Auth):**
- T032, T033, T034 can parallel (forms)
- T038, T039, T040 can parallel (shared components)
- T041, T042, T043, T044 can parallel (dashboard pages)

**User Story 2-8:**
- Follow similar patterns - tables, forms, and cards can often parallelize

---

## Parallel Example: User Story 1 Setup

```bash
# Launch shared components in parallel:
Task: "Create sidebar component in frontend/src/components/shared/sidebar.tsx"
Task: "Create header component in frontend/src/components/shared/header.tsx"
Task: "Create theme toggle in frontend/src/components/shared/theme-toggle.tsx"

# Launch dashboard redirect pages in parallel:
Task: "Create admin dashboard redirect in frontend/src/app/(dashboard)/admin/page.tsx"
Task: "Create merchant dashboard redirect in frontend/src/app/(dashboard)/merchant/page.tsx"
Task: "Create truck-owner dashboard redirect in frontend/src/app/(dashboard)/truck-owner/page.tsx"
Task: "Create driver dashboard redirect in frontend/src/app/(dashboard)/driver/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Authentication)
4. **STOP and VALIDATE**: Test login, role routing, theme toggle
5. Deploy/demo if ready

### Incremental Delivery

1. **MVP**: Setup + Foundation + US1 → Auth working
2. **Core Business**: Add US2 + US3 → Shipment + Bidding flow
3. **Fleet Operations**: Add US4 + US5 → Fleet + Driver workflows
4. **Admin Control**: Add US6 → System management
5. **Enhancements**: Add US7 + US8 → Tracking + Documents
6. **Polish**: Final phase → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. After Phase 2:
   - Developer A: US2 (Merchant) + US7 (Tracking)
   - Developer B: US3 (TruckOwner Bidding) + US4 (Fleet)
   - Developer C: US5 (Driver) + US6 (Admin)
   - Developer D: US8 (Documents) + US11 (Polish)

---

## Summary

| Phase | User Story | Task Count | Priority |
|-------|------------|------------|----------|
| 1 | Setup | 11 | - |
| 2 | Foundational | 19 | - |
| 3 | US1: Authentication | 19 | P1 MVP |
| 4 | US2: Merchant Shipments | 18 | P1 |
| 5 | US3: TruckOwner Bidding | 13 | P1 |
| 6 | US4: Fleet Management | 14 | P2 |
| 7 | US5: Driver Deliveries | 15 | P2 |
| 8 | US6: Admin Operations | 17 | P2 |
| 9 | US7: Real-Time Tracking | 9 | P2 |
| 10 | US8: Document Management | 8 | P3 |
| 11 | Polish | 11 | - |
| **Total** | | **154** | |

---

## Phase 12: User Story 9 - Settings Pages (Priority: P2)

**Goal**: Users can manage their profile, notification preferences, and account security

**Independent Test**: User logs in, navigates to settings, updates profile, and changes password

### Implementation for User Story 9

- [X] T155 [US9] Create merchant settings page in `frontend/src/app/(dashboard)/merchant/settings/page.tsx`
- [X] T156 [P] [US9] Create settings layout component in `frontend/src/components/settings/settings-layout.tsx`
- [X] T157 [P] [US9] Create profile settings form in `frontend/src/components/settings/profile-form.tsx`
- [X] T158 [P] [US9] Create notification preferences form in `frontend/src/components/settings/notification-preferences.tsx`
- [X] T159 [P] [US9] Create password change form in `frontend/src/components/settings/password-form.tsx`
- [X] T160 [US9] Create truck-owner settings page in `frontend/src/app/(dashboard)/truck-owner/settings/page.tsx`
- [X] T161 [P] [US9] Create fleet notifications form in `frontend/src/components/settings/fleet-notifications.tsx`
- [X] T162 [US9] Create driver settings page in `frontend/src/app/(dashboard)/driver/settings/page.tsx`
- [X] T163 [P] [US9] Create location sharing settings in `frontend/src/components/settings/location-settings.tsx`
- [X] T164 [US9] Create useSettings query hook in `frontend/src/hooks/use-settings.ts`
- [X] T165 [P] [US9] Add settings API methods in `frontend/src/lib/api/settings.ts`
- [X] T166 [US9] Update sidebar to link to settings pages (all roles)

**Checkpoint**: All roles can access and use settings pages

---

## Phase 13: User Story 10 - UI/Design Enhancement (Priority: P1)

**Goal**: Modern, polished visual design with refined colors and smooth interactions

**Independent Test**: Navigate through any portal and verify consistent modern styling

### Implementation for User Story 10

- [X] T167 [US10] Update Tailwind config with new color palette in `frontend/tailwind.config.ts`
- [X] T168 [US10] Update CSS variables in `frontend/src/app/globals.css`
- [X] T169 [P] [US10] Update Button component with new styles in `frontend/src/components/ui/button.tsx`
- [X] T170 [P] [US10] Update Card component with new styles in `frontend/src/components/ui/card.tsx`
- [X] T171 [P] [US10] Update Input component with new styles in `frontend/src/components/ui/input.tsx`
- [X] T172 [P] [US10] Update Select component with new styles in `frontend/src/components/ui/select.tsx`
- [X] T173 [P] [US10] Update Badge component with new styles in `frontend/src/components/ui/badge.tsx`
- [X] T174 [P] [US10] Update Dialog component with new styles in `frontend/src/components/ui/dialog.tsx`
- [X] T175 [P] [US10] Update Table component with new styles in `frontend/src/components/ui/table.tsx`
- [X] T176 [US10] Update Sidebar with new design in `frontend/src/components/shared/sidebar.tsx`
- [X] T177 [P] [US10] Update Header with new design in `frontend/src/components/shared/header.tsx`
- [X] T178 [US10] Update all stats cards with new design in `frontend/src/components/shared/stats-cards.tsx`
- [X] T179 [P] [US10] Update portal hero component in `frontend/src/components/shared/portal-hero.tsx`
- [X] T180 [US10] Update landing page with new design in `frontend/src/app/page.tsx`
- [X] T181 [P] [US10] Update login/register forms with new design
- [X] T182 [US10] Add smooth transition utilities in `frontend/src/lib/utils.ts`
- [X] T183 [P] [US10] Update status badge colors in `frontend/src/components/shared/status-badge.tsx`
- [X] T184 [US10] Update dark mode colors across all components
- [X] T185 [P] [US10] Verify RTL support for new design tokens
- [X] T186 [US10] Update loading spinner with new design in `frontend/src/components/ui/loading-spinner.tsx`

**Checkpoint**: Entire application has consistent modern styling in both light and dark modes

---

## Phase 14: User Story 11 - Analytics Export (Priority: P3)

**Goal**: Users can export analytics data to CSV and PDF formats

**Independent Test**: User navigates to analytics, exports data, and verifies downloaded file

### Implementation for User Story 11

- [X] T187 [US11] Create export utilities in `frontend/src/lib/export/index.ts`
- [X] T188 [P] [US11] Create CSV export function in `frontend/src/lib/export/csv.ts`
- [X] T189 [P] [US11] Create PDF export function in `frontend/src/lib/export/pdf.ts`
- [X] T190 [US11] Create export button component in `frontend/src/components/shared/export-button.tsx`
- [X] T191 [US11] Enable export in merchant analytics page
- [X] T192 [P] [US11] Enable export in admin analytics page
- [X] T193 [US11] Add date range filter integration for exports
- [X] T194 [P] [US11] Add export progress indicator

**Checkpoint**: Analytics export works for both CSV and PDF formats

---

## Phase 15: Final Polish & Validation

**Purpose**: Final validation and polish for Phase 2 features

- [ ] T195 [P] Validate all settings pages work end-to-end
- [ ] T196 [P] Validate new design across all 37+ pages
- [ ] T197 [P] Test WCAG 2.1 AA contrast compliance
- [ ] T198 [P] Test mobile responsiveness for new components
- [ ] T199 [P] Test RTL layout for all new components
- [ ] T200 Run full E2E test suite and fix any regressions

**Checkpoint**: Phase 2 complete - Settings, UI Enhancement, and Export all working

---

## Phase 2 Dependencies

### Phase Dependencies

- **Phase 12 (Settings)**: Depends on Phase 11 completion - can start immediately
- **Phase 13 (UI Enhancement)**: No dependencies - can start immediately (highest priority)
- **Phase 14 (Export)**: Depends on Phase 11 completion - can parallel with Phase 12
- **Phase 15 (Validation)**: Depends on Phases 12-14 completion

### Parallel Opportunities

**Phase 13 (UI Enhancement):**
- T169-T175 (UI components) can all run in parallel
- T177, T179, T181, T183, T185 can parallel after base colors are set

**Phase 12 (Settings):**
- T156-T159 (shared components) can all run in parallel
- T161, T163 (role-specific) can parallel

**Phase 14 (Export):**
- T188, T189 (CSV/PDF) can run in parallel
- T192, T194 can parallel after T191

---

## Updated Summary

| Phase | User Story | Task Count | Priority | Status |
|-------|------------|------------|----------|--------|
| 1 | Setup | 11 | - | Complete |
| 2 | Foundational | 19 | - | Complete |
| 3 | US1: Authentication | 19 | P1 MVP | Complete |
| 4 | US2: Merchant Shipments | 18 | P1 | Complete |
| 5 | US3: TruckOwner Bidding | 13 | P1 | Complete |
| 6 | US4: Fleet Management | 14 | P2 | Complete |
| 7 | US5: Driver Deliveries | 15 | P2 | Complete |
| 8 | US6: Admin Operations | 17 | P2 | Complete |
| 9 | US7: Real-Time Tracking | 9 | P2 | Complete |
| 10 | US8: Document Management | 8 | P3 | Complete |
| 11 | Polish | 11 | - | Complete |
| **12** | **US9: Settings Pages** | **12** | **P2** | **Pending** |
| **13** | **US10: UI Enhancement** | **20** | **P1** | **Pending** |
| **14** | **US11: Analytics Export** | **8** | **P3** | **Pending** |
| **15** | **Final Validation** | **6** | **-** | **Pending** |
| **Total** | | **200** | | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP: Complete through Phase 3 (US1) for working authentication
- **Phase 2 MVP**: Start with Phase 13 (UI Enhancement) as it affects all pages
