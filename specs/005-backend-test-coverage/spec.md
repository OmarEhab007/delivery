# Spec: Backend Test Coverage to 85%

**Date**: 2026-02-05
**Owner**: Backend QA / Engineering

## Goal
Raise backend test coverage to **>= 85%** across statements, branches, lines, and functions with a mix of unit, integration, and API-level E2E tests.

## Scope
- Backend (Node.js/Express/Mongoose) only.
- Test types: unit, integration, API-level E2E.
- Validate existing API behavior; add error-path coverage for critical flows.

## Non-Goals
- Frontend/UI tests in this phase.
- Performance/load testing.

## Acceptance Criteria
- `npm run test:coverage` passes with global thresholds >= 85%.
- Tests are deterministic and run against test MongoDB.
- No regressions in existing test suites.

## Risks
- High branch coverage requires broad error-path testing.
- Some modules depend on filesystem/network; use mocks and temp dirs.

## Notes
- Test DB uses `TEST_MONGODB_URI` (local Docker Mongo).
- Keep tests isolated and clean up after each run.
