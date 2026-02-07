# Feature Specification: Production Readiness Hardening

**Feature Branch**: `8-production-hardening`
**Created**: 2026-02-07
**Status**: Draft
**Input**: Prepare the delivery app for production deployment by fixing critical security vulnerabilities, hardening the backend and frontend, fixing failing tests, and improving test coverage.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Secure Dependency Management (Priority: P0)

A platform administrator ensures all third-party dependencies are free from known critical and high-severity vulnerabilities before deploying to production. The backend has 36 known vulnerabilities (1 critical, 26 high) and the frontend has 4 high-severity vulnerabilities that must be resolved.

**Why this priority**: Vulnerable dependencies are the most exploitable attack vector. OWASP A06:2021 (Vulnerable and Outdated Components) ranks as a top-10 security risk. A single critical vulnerability in fast-xml-parser could enable XML External Entity attacks against the backend.

**Independent Test**: Run `npm audit` in both root and frontend directories and verify zero critical/high-severity vulnerabilities remain.

**Acceptance Scenarios**:

1. **Given** the backend dependencies are updated, **When** `npm audit` is run in the project root, **Then** zero critical or high-severity vulnerabilities are reported.
2. **Given** the frontend dependencies are updated, **When** `npm audit` is run in the frontend directory, **Then** zero critical or high-severity vulnerabilities are reported.
3. **Given** dependencies have been updated, **When** the full test suite is run, **Then** all existing tests continue to pass (no regressions).
4. **Given** the backend server starts, **When** all API endpoints are exercised, **Then** no runtime errors occur from updated packages.

---

### User Story 2 - Hardened Content Security Policy (Priority: P0)

The platform enforces a strict Content Security Policy that prevents cross-site scripting (XSS) attacks by removing `unsafe-inline` and `unsafe-eval` directives from script sources. The backend CSP headers are tightened and the frontend adds its own security headers for defense in depth.

**Why this priority**: CSP with `unsafe-inline` and `unsafe-eval` effectively disables XSS protection. This is a critical security gap that must be closed before handling real user data in production.

**Independent Test**: Make an HTTP request to any API endpoint and inspect the `Content-Security-Policy` response header to confirm `unsafe-inline` and `unsafe-eval` are absent from `script-src`.

**Acceptance Scenarios**:

1. **Given** a request is made to the backend API, **When** the response headers are inspected, **Then** the CSP `script-src` directive does not contain `unsafe-inline` or `unsafe-eval`.
2. **Given** the frontend application loads in a browser, **When** response headers are inspected, **Then** security headers include Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
3. **Given** strict CSP is in place, **When** the application is used normally, **Then** no CSP violations are reported in the browser console for legitimate application functionality.

---

### User Story 3 - Secure Secret Management (Priority: P0)

The platform requires all cryptographic secrets to be provided via environment variables with no hardcoded fallback values. Specifically, the OTP hashing secret must not fall back to a static string in any environment other than test.

**Why this priority**: Hardcoded secrets (OWASP A02:2021 - Cryptographic Failures) mean an attacker who reads the source code can forge OTP codes. This is a direct authentication bypass vulnerability.

**Independent Test**: Start the server without `OTP_SECRET` set in a non-test environment and verify it refuses to start or logs a clear error.

**Acceptance Scenarios**:

1. **Given** the server starts in production mode without `OTP_SECRET` set, **When** the application initializes, **Then** it exits with a clear error message indicating OTP_SECRET is required.
2. **Given** the server starts in development mode without `OTP_SECRET` set, **When** the application initializes, **Then** it logs a warning but continues with a development-only secret.
3. **Given** the server starts in test mode, **When** tests run, **Then** the OTP service uses a test-specific secret without requiring environment configuration.

---

### User Story 4 - Strong Password Policy (Priority: P1)

Users registering or changing passwords must meet enhanced complexity requirements: minimum 12 characters with at least one uppercase letter, one lowercase letter, one number, and one special character. Clear Arabic error messages guide users to meet requirements.

**Why this priority**: The current 6-character minimum allows trivially brute-forceable passwords. Strong password policies are a baseline security requirement for production applications handling business data.

**Independent Test**: Attempt to register with passwords of varying complexity and verify rejection/acceptance messages.

**Acceptance Scenarios**:

1. **Given** a user tries to register with a password shorter than 12 characters, **When** the form is submitted, **Then** a clear Arabic error message indicates the minimum length requirement.
2. **Given** a user provides a 12+ character password without uppercase letters, **When** submitted, **Then** an Arabic error message specifies the missing requirement.
3. **Given** a user provides a fully compliant password, **When** submitted, **Then** registration proceeds successfully.
4. **Given** existing users with short passwords, **When** they log in, **Then** they can still access their accounts (no retroactive enforcement).
5. **Given** an existing user changes their password, **When** they submit a new password, **Then** the new password must meet the updated requirements.

---

### User Story 5 - Graceful Shutdown & Health Probes (Priority: P1)

The platform shuts down gracefully when receiving termination signals, completing in-flight requests before closing connections. Separate health check endpoints allow container orchestrators to distinguish between a running server (liveness) and a fully ready server (readiness).

**Why this priority**: Without graceful shutdown, deployments and scaling events drop active user requests. Without proper health probes, orchestrators cannot properly manage service lifecycle, leading to traffic being routed to unhealthy instances.

**Independent Test**: Send a SIGTERM signal while a request is in-flight and verify it completes. Call liveness and readiness endpoints and verify correct status codes.

**Acceptance Scenarios**:

1. **Given** the server receives SIGTERM, **When** there are active HTTP connections, **Then** in-flight requests complete before the server shuts down.
2. **Given** the server receives SIGTERM, **When** all connections are drained, **Then** MongoDB connections are closed and the process exits cleanly.
3. **Given** the server is running and healthy, **When** `/health/live` is called, **Then** it returns a 200 status indicating the process is alive.
4. **Given** the server is running and the database is connected, **When** `/health/ready` is called, **Then** it returns a 200 status indicating readiness to serve traffic.
5. **Given** the database connection is lost, **When** `/health/ready` is called, **Then** it returns a 503 status, while `/health/live` still returns 200.

---

### User Story 6 - Resilient Frontend Error Handling (Priority: P1)

The dashboard application catches unexpected React rendering errors and displays a user-friendly Arabic error page instead of a blank white screen. Users can recover by navigating back or refreshing, and the error boundary logs details for debugging.

**Why this priority**: Unhandled React errors crash the entire component tree, rendering the application unusable. A global error boundary is essential for production resilience so that one component failure does not take down the entire dashboard.

**Independent Test**: Simulate a component error within the dashboard layout and verify the error boundary catches it and displays a recovery UI.

**Acceptance Scenarios**:

1. **Given** a React component within the dashboard throws an error, **When** the error propagates, **Then** the error boundary catches it and displays an Arabic error message with a recovery action.
2. **Given** the error boundary is showing, **When** the user clicks the recovery button, **Then** the application attempts to re-render or navigates to a safe page.
3. **Given** a component error occurs, **When** the error boundary catches it, **Then** error details are logged to the console for debugging purposes.

---

### User Story 7 - Fixed Test Suite & Quality Gate (Priority: P1)

All existing tests pass without failures, and new tests are added to verify the security hardening changes. The test suite serves as a quality gate ensuring no regressions are introduced.

**Why this priority**: Failing tests indicate broken functionality. Tests are the safety net that ensures hardening changes do not break existing features. A passing test suite is a prerequisite for confident production deployment.

**Independent Test**: Run the full test suite (`npm test` for backend, `npm run test` for frontend) and verify zero failures.

**Acceptance Scenarios**:

1. **Given** the broker form validation schema is updated, **When** the frontend unit tests run, **Then** the previously failing 3 broker schema tests now pass.
2. **Given** the password policy is strengthened, **When** backend integration tests run, **Then** tests verify passwords below the new requirements are rejected.
3. **Given** health endpoints are added, **When** backend integration tests run, **Then** tests verify liveness and readiness endpoints return correct status codes.
4. **Given** all hardening changes are applied, **When** the complete test suite runs, **Then** all tests pass with zero failures.

---

## Functional Requirements _(mandatory)_

### FR-1: Backend Dependency Security Update
- Update all backend npm dependencies to resolve the 36 known vulnerabilities
- Zero critical or high-severity vulnerabilities remain after update
- All existing backend tests pass after the update

### FR-2: Frontend Dependency Security Update
- Update all frontend npm dependencies to resolve the 4 known vulnerabilities
- Zero critical or high-severity vulnerabilities remain after update
- Frontend build completes without errors after update
- All existing frontend tests pass after the update

### FR-3: Content Security Policy Hardening
- Remove `unsafe-inline` and `unsafe-eval` from the CSP `script-src` directive
- Backend serves tightened CSP headers on all API responses
- Frontend Next.js configuration includes security response headers: Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

### FR-4: OTP Secret Hardening
- Remove the hardcoded fallback secret `delivery-app-otp-secret` from the OTP service
- In production: require `OTP_SECRET` environment variable, exit with error if missing
- In development: log a warning and use a development-only secret
- In test: use a static test secret without environment configuration

### FR-5: Password Policy Enhancement
- Minimum password length increased from 6 to 12 characters
- Require at least one uppercase letter, one lowercase letter, one digit, and one special character
- Backend validation enforces the policy on registration and password change endpoints
- Frontend Zod schema enforces the policy with Arabic error messages
- Existing users are not locked out (policy applies only to new passwords)

### FR-6: Graceful Shutdown
- Handle SIGTERM and SIGINT signals to initiate graceful shutdown
- Stop accepting new connections while completing in-flight requests
- Set a maximum shutdown timeout (30 seconds) after which the process force-exits
- Close MongoDB connection after all requests complete
- Log shutdown events for operational visibility

### FR-7: Kubernetes Health Probes
- Add `GET /health/live` endpoint that returns 200 if the process is running
- Add `GET /health/ready` endpoint that returns 200 if the server and database are healthy, 503 otherwise
- Both endpoints are unauthenticated (accessible without JWT)
- Existing `/health` endpoint continues to work unchanged

### FR-8: Next.js Security Headers
- Configure `headers()` in `next.config.mjs` to set security headers on all frontend responses
- Headers: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (restrict camera, microphone, geolocation)

### FR-9: Dashboard Error Boundary
- Wrap the dashboard layout with a global React error boundary component
- Error boundary displays an Arabic-language error message with a "try again" action
- Error boundary logs error details to console
- Error boundary does not affect the login/register pages (only dashboard)

### FR-10: Fix Failing Broker Schema Tests
- Fix the 3 failing tests in `tests/unit/lib/validations.test.ts` related to `brokerFormSchema`
- Either update the schema or update the test expectations to match current behavior
- All validation tests pass after the fix

### FR-11: Backend Security Integration Tests
- Add integration tests for the strengthened password policy (reject weak passwords, accept strong passwords)
- Add integration tests for liveness and readiness health endpoints
- Add integration test verifying graceful shutdown behavior

### FR-12: Frontend Hardening Unit Tests
- Add unit test for the error boundary component (catches errors, renders fallback)
- Add unit test verifying the password validation schema enforces new requirements
- All new tests follow existing patterns (Jest, React Testing Library)

## Success Criteria _(mandatory)_

1. Zero critical or high-severity dependency vulnerabilities across the entire codebase
2. All security headers present on both backend API and frontend responses
3. No hardcoded cryptographic secrets in the codebase (OTP, JWT fallbacks)
4. All user passwords created after deployment meet the 12-character complexity requirements
5. Server completes in-flight requests before shutting down on SIGTERM (zero dropped requests during deployment)
6. Container orchestrators can accurately determine server health via dedicated liveness and readiness endpoints
7. A React component failure in the dashboard shows a user-friendly Arabic recovery screen instead of a blank page
8. 100% of tests pass (zero failures) including all new security-focused tests
9. No breaking changes to existing API contracts or user-facing functionality

## Scope _(mandatory)_

### In Scope
- Backend npm dependency updates for security fixes
- Frontend npm dependency updates for security fixes
- CSP header hardening (backend securityHeaders.js)
- Next.js security headers configuration
- OTP secret management hardening
- Password policy strengthening (backend + frontend validation)
- Graceful shutdown implementation
- Kubernetes-compatible health probe endpoints
- Dashboard error boundary component
- Fixing failing broker schema tests
- New integration and unit tests for hardened features

### Out of Scope
- Token storage migration from localStorage to httpOnly cookies (separate initiative)
- Redis caching implementation
- API versioning (v1/v2 prefix)
- Database backup automation
- Error tracking service integration (Sentry)
- Log aggregation setup (ELK/Splunk)
- Accessibility audit and ARIA improvements
- Mobile responsive design improvements
- Public pages (landing page, terms, privacy)
- Performance optimizations (lazy loading, code splitting)

## Assumptions _(mandatory)_

1. `npm audit fix` can resolve the majority of vulnerabilities without major breaking changes; where `--force` is needed, the updated packages remain compatible
2. Removing `unsafe-inline` from CSP will not break the backend API since it primarily serves JSON (no inline scripts)
3. The existing error boundary component in `frontend/src/components/shared/error-boundary.tsx` can be extended for the dashboard wrapper
4. The broker schema tests are failing due to schema changes that were not reflected in tests (tests need updating, not schema reverting)
5. The 30-second graceful shutdown timeout is sufficient for all in-flight requests to complete
6. Password policy changes are forward-only: existing users with weak passwords can still log in but must use strong passwords when changing them

## Dependencies _(optional)_

- Backend tests require MongoDB Memory Server (already configured)
- Frontend tests require jest-environment-jsdom (already configured)
- Health probe endpoints must be accessible without authentication for orchestrator compatibility
