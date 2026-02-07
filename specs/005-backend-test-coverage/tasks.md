# Tasks: Backend Test Coverage to 85%

## Phase 1: Mixed Controller Coverage
- [x] Integration: happy-path coverage for `documentController` (upload, multi-upload, access control, download, verify, update, delete)
- [x] Unit: error-branch coverage for `documentController` (missing fields, invalid entity type/id, access control)
- [x] Integration: happy-path coverage for `applicationController` (create/update/cancel/accept/reject)
- [x] Unit: error-branch coverage for `applicationController` (invalid status, unauthorized, missing fields)
- [x] Integration: happy-path coverage for `authController` (login/registration/forgot/reset/refresh)
- [x] Unit: error-branch coverage for `authController` (invalid credentials, inactive, OTP/refresh errors)
- [x] Integration: happy-path coverage for `adminController` and admin subcontrollers (users, shipments, trucks, brokers, applications)
- [x] Unit: error-branch coverage for `adminController` and admin subcontrollers (invalid IDs, forbidden, validation failures)
- [x] Unit: deepen coverage for `documentController`, `shipmentController`, `adminController`, `driverController`

## Phase 2: Services & Config (Targeted)
- [x] Cover `config/database` edge cases
- [x] Cover `emailService` error handling
- [x] Cover `metricsRoutes` error branches
- [x] Cover reporting analytics controllers/services
- [x] Cover `errorTracker` additional branches
- [x] Cover `healthCheck` additional branches
- [x] Cover `dbMonitor` error branches

## Phase 3: Coverage Verification
- [x] Run `npm run test:coverage`
- [x] Re-target any remaining files below threshold
