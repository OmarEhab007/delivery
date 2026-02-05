# Tasks: Frontend Completion & Backend Wiring

**Input**: specs/006-frontend-completion/spec.md
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)

---

## Phase 1: API Wiring & Contracts

- [x] T001 [US1] Update API endpoints for driver/truck-owner routes in `frontend/src/lib/api/endpoints.ts`
- [x] T002 [P] [US1] Add driver API client in `frontend/src/lib/api/driver.ts`
- [x] T003 [P] [US1] Add truck-owner API client in `frontend/src/lib/api/truck-owner.ts`
- [x] T004 [P] [US1] Fix applications API method verbs (PATCH) in `frontend/src/lib/api/applications.ts`
- [x] T005 [P] [US1] Update driver-related request types in `frontend/src/types/api.ts`

## Phase 2: Driver Flow Wiring

- [x] T006 [US1] Wire driver dashboard data in `frontend/src/hooks/use-drivers.ts`
- [x] T007 [US1] Wire driver shipments/history data in `frontend/src/hooks/use-drivers.ts`
- [x] T008 [US1] Wire driver check-in/out actions in `frontend/src/app/(dashboard)/driver/checkin/page.tsx`
- [x] T009 [US1] Wire driver start/complete delivery actions in `frontend/src/app/(dashboard)/driver/shipments/[id]/page.tsx`
- [x] T010 [US1] Wire driver issue reporting in `frontend/src/app/(dashboard)/driver/shipments/[id]/page.tsx`
- [x] T011 [US1] Add proof upload fallback in `frontend/src/app/(dashboard)/driver/shipments/[id]/page.tsx`
- [x] T012 [US5] Add rating placeholders in driver dashboard/history pages

## Phase 3: Truck Owner Wiring

- [x] T013 [US1] Update truck-owner shipments list to use truck-owner endpoints in `frontend/src/app/(dashboard)/truck-owner/shipments/page.tsx`
- [x] T014 [US1] Update assigned shipments list to use truck-owner endpoints in `frontend/src/app/(dashboard)/truck-owner/assigned/page.tsx`
- [x] T015 [US1] Update driver list/detail data sources in `frontend/src/hooks/use-drivers.ts` and driver pages

## Phase 4: Admin Features

- [x] T016 [US2] Implement admin shipment detail page in `frontend/src/app/(dashboard)/admin/shipments/[id]/page.tsx`
- [x] T017 [US2] Add admin shipment actions (approve/reject/assign/status) via `frontend/src/hooks/use-admin.ts`
- [x] T018 [US3] Add admin create user UI and API wiring in `frontend/src/app/(dashboard)/admin/users/page.tsx` and `frontend/src/lib/api/admin.ts`

## Phase 5: Tracking & Notifications

- [x] T019 [US4] Fix socket auth/events in `frontend/src/hooks/use-tracking-socket.ts`
- [x] T020 [US4] Fix notification bell navigation in `frontend/src/components/shared/header.tsx`

## Phase 6: Data Normalization & Analytics

- [x] T021 [US1] Normalize populated shipment/application/truck refs for UI expectations
- [x] T022 [US2] Fix merchant analytics API wiring to `/analytics/kpis` and `/analytics/lanes`
- [x] T023 [US1] Wire driver dashboard quick actions to current shipment

---

## Parallel Opportunities

- T002, T003, T004, T005 can run in parallel.
- T006–T012 can run in parallel after API clients are in place.
- T016 and T018 can run in parallel.
