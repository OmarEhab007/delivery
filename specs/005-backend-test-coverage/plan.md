# Plan: Backend Test Coverage to 85%

**Input**: specs/005-backend-test-coverage/spec.md

## Summary
Increase backend coverage by targeting low-coverage controllers and services with unit tests and targeted integration cases. Emphasize branch coverage via error-path tests.

## Current Status (Snapshot)
- Coverage ~70% statements, ~47% branches after recent additions.
- Biggest gaps in controllers (document, application, auth, admin, fixed-price, truck-owner, driver, shipment).

## Strategy
1. **Unit tests for controller logic** using mocked models to hit error and success branches.
2. **Targeted integration tests** for complex flows (document access control, application errors, admin actions).
3. **Service-level tests** for error handling and edge cases (email, database config, metrics routes).
4. **Iterate**: run coverage, re-target top missing files until >= 85%.

## Target Modules (Highest Gaps)
- `src/controllers/documentController.js`
- `src/controllers/application/applicationController.js`
- `src/controllers/auth/authController.js`
- `src/controllers/admin/adminController.js`
- `src/controllers/shipment/fixedPriceShipmentController.js`
- `src/controllers/truck/truckOwnerController.js`
- `src/controllers/admin/adminTruckController.js`
- `src/controllers/shipment/shipmentController.js`
- `src/controllers/driver/driverController.js`

## Test Infrastructure
- Use existing helpers in `tests/utils` for users/shipments.
- Use temp upload directories for document tests.
- Mock external services (email, twilio, webhooks).

## Exit Criteria
- `npm run test:coverage` passes with thresholds >= 85%.
