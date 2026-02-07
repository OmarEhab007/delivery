# Tasks: Production Readiness Hardening

**Feature Branch**: `8-production-hardening`
**Total Tasks**: 22
**User Stories**: 7 (mapped from spec.md)

---

## Phase 1: Setup — Dependency Security Fixes

**Goal**: Eliminate all critical and high-severity npm vulnerabilities in both codebases.

- [x] T001 [P] Run `npm audit fix` in project root to resolve backend vulnerabilities, then verify with `npm audit` — target zero critical/high in `package.json`
- [x] T002 [P] Run `npm audit fix` in `frontend/` to resolve frontend vulnerabilities, then verify with `npm audit` — target zero critical/high in `frontend/package.json`
- [x] T003 Run `npm test` in project root to verify backend tests pass after dependency updates
- [x] T004 Run `npm run build && npm run test` in `frontend/` to verify frontend build and tests pass after dependency updates

---

## Phase 2: Foundational — Backend Security Hardening

**Goal**: Harden CSP headers, remove hardcoded secrets, and strengthen password policy. These are blocking prerequisites for all user story testing.

### CSP Hardening (FR-3)

- [x] T005 [US2] Remove `'unsafe-inline'` and `'unsafe-eval'` from `scriptSrc` array in `src/middleware/securityHeaders.js` line 15, resulting in `scriptSrc: ["'self'"]`

### OTP Secret Hardening (FR-4)

- [x] T006 [US3] Remove the hardcoded fallback secret `'delivery-app-otp-secret'` in `src/services/auth/otpService.js` — update `getSecret()` to use `'test-otp-secret'` in test env, require `OTP_SECRET` or fall back to `JWT_SECRET` with warning in dev
- [x] T007 [US3] Add `'OTP_SECRET'` to the `PRODUCTION_ONLY_ENV_VARS` array in `src/utils/validateEnv.js`

### Password Policy Enhancement (FR-5)

- [x] T008 [US4] Update `registerValidation` in `src/routes/authRoutes.js` to enforce 12-char minimum with uppercase, lowercase, digit, and special character requirements using express-validator custom validator
- [x] T009 [P] [US4] Apply the same strengthened password validation to password change routes in `src/routes/authRoutes.js` (resetPassword, updatePassword)
- [x] T010 [US4] Update `registerSchema` and `loginSchema` password validation in `frontend/src/lib/validations/index.ts` to enforce 12-char minimum with complexity requirements and Arabic error messages

---

## Phase 3: User Story 5 — Graceful Shutdown & Health Probes

**Goal**: Server shuts down gracefully and exposes Kubernetes-compatible health endpoints.

**Independent Test**: Send SIGTERM during active request; call `/health/live` and `/health/ready`.

### Graceful Shutdown (FR-6)

- [x] T011 [US5] Add `gracefulShutdown()` function to `src/server.js` — register SIGTERM/SIGINT handlers that call `httpServer.close()`, set 30s force-kill timeout, close mongoose connection, log events, and exit cleanly

### Health Probes (FR-7)

- [x] T012 [US5] Add unauthenticated `GET /live` endpoint in `src/routes/healthRoutes.js` returning `{ status: 'ok', timestamp }` with HTTP 200
- [x] T013 [US5] Add unauthenticated `GET /ready` endpoint in `src/routes/healthRoutes.js` checking `mongoose.connection.readyState` — return 200 if connected, 503 if not

---

## Phase 4: User Story 2 & 6 — Frontend Security & Resilience

**Goal**: Frontend serves security headers and catches rendering errors gracefully.

**Independent Test**: Inspect response headers for security directives; simulate component error to verify boundary.

### Next.js Security Headers (FR-8)

- [x] T014 [P] [US2] Add `headers()` async function to `frontend/next.config.mjs` returning Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy for all routes

### Dashboard Error Boundary (FR-9)

- [x] T015 [US6] Import `ErrorBoundary` from `@/components/shared/error-boundary` and wrap the `<main>` content area inside `<SocketProvider>` in `frontend/src/app/(dashboard)/layout.tsx`

---

## Phase 5: User Story 7 — Fix Tests & Add New Tests

**Goal**: All tests pass, including new security-focused tests.

**Independent Test**: Run full test suites for both backend and frontend with zero failures.

### Fix Existing Failures (FR-10)

- [x] T016 [US7] Fix brokerFormSchema in `frontend/src/lib/validations/index.ts` by adding `.default([])` to `countriesServed` and `.default({ email: '', phone: '' })` to `contacts` object so the 3 failing tests in `frontend/tests/unit/lib/validations.test.ts` pass
- [x] T017 [US7] Update existing password-related test expectations in `frontend/tests/unit/lib/validations.test.ts` to match new 12-char minimum requirement

### Backend Integration Tests (FR-11)

- [x] T018 [P] [US7] Create `tests/integration/security-hardening.test.js` with tests for: password policy (weak rejected, strong accepted), liveness endpoint (GET `/health/live` → 200), readiness endpoint (GET `/health/ready` → 200)

### Frontend Unit Tests (FR-12)

- [x] T019 [P] [US7] Create `frontend/tests/unit/components/error-boundary.test.tsx` with tests for: error boundary catches thrown errors, renders Arabic fallback UI, reset button re-renders children
- [x] T020 [P] [US7] Add password schema validation tests to `frontend/tests/unit/lib/validations.test.ts` testing: reject short passwords, reject missing complexity, accept compliant passwords

---

## Phase 6: Polish — Final Validation

**Goal**: Complete end-to-end validation that all hardening is in place.

- [x] T021 Run `npm audit` in both root and `frontend/` to confirm zero critical/high vulnerabilities remain
- [x] T022 Run full test suites in both root (`npm test`) and frontend (`cd frontend && npm run build && npm run test`) to confirm all tests pass

---

## Dependency Graph

```
T001, T002 (parallel) → T003, T004 (verify)
    ↓
T005, T006, T007, T008, T009, T010 (backend + frontend hardening, mostly parallel)
    ↓
T011, T012, T013 (shutdown + health probes)
    ↓
T014, T015 (frontend security + error boundary, parallel)
    ↓
T016, T017 (fix existing tests)
    ↓
T018, T019, T020 (new tests, all parallel)
    ↓
T021, T022 (final validation)
```

## Parallel Execution Opportunities

| Parallel Group | Tasks | Reason |
|---------------|-------|--------|
| Dependency fixes | T001 + T002 | Different package.json files |
| Backend hardening | T005 + T006 + T008 | Different source files |
| Password (backend + frontend) | T009 + T010 | Different codebases |
| Frontend security | T014 + T015 | Different files (config vs layout) |
| New tests | T018 + T019 + T020 | Different test files, no dependencies |

## Implementation Strategy

**MVP (Phase 1-2)**: Dependency fixes + backend security hardening — addresses all P0 vulnerabilities
**Increment 2 (Phase 3)**: Graceful shutdown + health probes — enables safe deployment
**Increment 3 (Phase 4)**: Frontend security + error boundary — production resilience
**Increment 4 (Phase 5-6)**: Tests + validation — quality gate for deployment
