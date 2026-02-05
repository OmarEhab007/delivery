# Tasks: Next.js Frontend Portals

**Input**: Design documents from `/specs/006-frontend-portals/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated tests requested. Use manual smoke checks noted per story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Initialize Next.js 14 app under `frontend/` with TypeScript and App Router
- [ ] T002 [P] Install Tailwind CSS and `shadcn/ui` scaffolding under `frontend/src/components/ui`
- [ ] T003 [P] Add base layout shells and global styles in `frontend/src/app/layout.tsx` and `frontend/src/styles/globals.css`
- [ ] T004 [P] Configure environment loading in `frontend/.env.local` and `frontend/src/lib/api/config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T005 Implement API client with auth header, refresh flow, and CSRF handling in `frontend/src/lib/api/client.ts`
- [ ] T006 Implement auth state store and token persistence in `frontend/src/lib/auth/session.ts`
- [ ] T007 Implement route guards and role-based layout wrappers in `frontend/src/lib/auth/guards.tsx`
- [ ] T008 Define shared types based on `data-model.md` in `frontend/src/types/*.ts`
- [ ] T009 Apply Figma design tokens in Tailwind config `frontend/tailwind.config.ts` and CSS variables in `frontend/src/styles/globals.css`

---

## Phase 3: User Story 1 - Auth + Role Routing (Priority: P1)

**Goal**: Users can register/login and land in their portal.

**Manual Smoke Check**: Log in as each role and confirm landing page and nav.

- [ ] T010 [P] Build login and registration screens in `frontend/src/app/(auth)/` routes
- [ ] T011 Wire login, refresh, logout flows to API in `frontend/src/lib/api/auth.ts`
- [ ] T012 Add role-based redirects after login in `frontend/src/app/(auth)/callback` or equivalent handler
- [ ] T013 Add approval status messaging for pending registrations in `frontend/src/components/auth/PendingApproval.tsx`

---

## Phase 4: User Story 2 - Admin Control Center (Priority: P1)

**Goal**: Admins manage users, shipments, applications, trucks, documents, and reports.

**Manual Smoke Check**: Approve a registration request and see user in list.

- [ ] T014 [P] Build admin dashboard layout and navigation in `frontend/src/app/admin/layout.tsx`
- [ ] T015 [P] Implement registration request list + approve/reject in `frontend/src/app/admin/registrations/`
- [ ] T016 [P] Implement user management list/detail CRUD in `frontend/src/app/admin/users/`
- [ ] T017 [P] Implement shipment management list/detail in `frontend/src/app/admin/shipments/`
- [ ] T018 [P] Implement applications list + actions in `frontend/src/app/admin/applications/`
- [ ] T019 [P] Implement trucks + drivers views in `frontend/src/app/admin/fleet/`
- [ ] T020 [P] Implement reports dashboards in `frontend/src/app/admin/reports/`

---

## Phase 5: User Story 3 - Merchant Shipment Workflow (Priority: P1)

**Goal**: Merchants request shipments, accept quotes, upload documents, and track shipments.

**Manual Smoke Check**: Create a shipment request and see it in list.

- [ ] T021 [P] Build merchant dashboard layout in `frontend/src/app/merchant/layout.tsx`
- [ ] T022 [P] Implement shipment request form in `frontend/src/app/merchant/shipments/new`
- [ ] T023 [P] Implement shipments list/detail views in `frontend/src/app/merchant/shipments/`
- [ ] T024 [P] Implement quote acceptance flow in `frontend/src/app/merchant/shipments/[id]/quote`
- [ ] T025 [P] Implement document upload flow in `frontend/src/app/merchant/shipments/[id]/documents`
- [ ] T026 [P] Implement tracking view in `frontend/src/app/merchant/shipments/[id]/tracking`

---

## Phase 6: User Story 4 - Truck Owner Bidding & Dispatch (Priority: P2)

**Goal**: Truck owners bid and assign drivers to loads.

**Manual Smoke Check**: Submit a bid and see it in applications list.

- [ ] T027 [P] Build truck owner dashboard layout in `frontend/src/app/truck-owner/layout.tsx`
- [ ] T028 [P] Implement available shipments list in `frontend/src/app/truck-owner/shipments/available`
- [ ] T029 [P] Implement bid submission flow in `frontend/src/app/truck-owner/applications/new`
- [ ] T030 [P] Implement applications list/detail in `frontend/src/app/truck-owner/applications/`
- [ ] T031 [P] Implement driver assignment UI in `frontend/src/app/truck-owner/shipments/[id]/assign`

---

## Phase 7: User Story 5 - Driver Execution & Proof (Priority: P3)

**Goal**: Drivers update status, location, and upload POD/issue reports.

**Manual Smoke Check**: Update status and see it reflected on shipment detail.

- [ ] T032 [P] Build driver dashboard layout in `frontend/src/app/driver/layout.tsx`
- [ ] T033 [P] Implement assigned shipments list/detail in `frontend/src/app/driver/shipments/`
- [ ] T034 [P] Implement status update form in `frontend/src/app/driver/shipments/[id]/status`
- [ ] T035 [P] Implement location update flow in `frontend/src/app/driver/location`
- [ ] T036 [P] Implement POD upload in `frontend/src/app/driver/shipments/[id]/pod`
- [ ] T037 [P] Implement issue reporting in `frontend/src/app/driver/shipments/[id]/issues`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T038 [P] Add shared tables, forms, empty states in `frontend/src/components/`
- [ ] T039 [P] Add error boundaries and toast notifications in `frontend/src/components/feedback/`
- [ ] T040 [P] Add responsive navigation patterns for mobile
- [ ] T041 [P] Update `docs/PORTALS.md` or new frontend docs if needed
