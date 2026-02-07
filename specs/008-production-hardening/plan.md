# Implementation Plan: Production Readiness Hardening

**Feature Branch**: `8-production-hardening`
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)

## Technical Context

- **Backend**: Express.js + MongoDB at project root (`src/`)
- **Frontend**: Next.js 14 App Router + TypeScript in `/frontend/`
- **Testing**: Backend uses Jest + MongoDB Memory Server; Frontend uses Jest + jsdom + Playwright E2E
- **Key Files**:
  - CSP: `src/middleware/securityHeaders.js`
  - OTP: `src/services/auth/otpService.js`
  - Server: `src/server.js`
  - Health Routes: `src/routes/healthRoutes.js`
  - Auth Routes: `src/routes/authRoutes.js`
  - Env Validation: `src/utils/validateEnv.js`
  - Frontend Config: `frontend/next.config.mjs`
  - Dashboard Layout: `frontend/src/app/(dashboard)/layout.tsx`
  - Error Boundary: `frontend/src/components/shared/error-boundary.tsx`
  - Validations: `frontend/src/lib/validations/index.ts`
  - Validation Tests: `frontend/tests/unit/lib/validations.test.ts`

## Implementation Phases

### Phase 1: Dependency Security Fixes (FR-1, FR-2)

**Backend** (`/`):
1. Run `npm audit fix` to resolve non-breaking vulnerabilities
2. If critical/high remain, run `npm audit fix --force` and test
3. Run `npm test` to verify no regressions
4. Run `npm audit` to verify zero critical/high

**Frontend** (`/frontend/`):
1. Run `npm audit fix` to resolve non-breaking vulnerabilities
2. If critical/high remain, run targeted updates (e.g., `npm install next@latest`)
3. Run `npm run build` to verify no build errors
4. Run `npm run test` to verify no regressions
5. Run `npm audit` to verify zero critical/high

### Phase 2: Backend Security Hardening (FR-3, FR-4, FR-5)

**2a. CSP Hardening** — `src/middleware/securityHeaders.js`:
- Remove `'unsafe-inline'` and `'unsafe-eval'` from `scriptSrc` (line 15)
- Keep `'unsafe-inline'` in `styleSrc` (needed for common CSS patterns)
- Result: `scriptSrc: ["'self'"]`

**2b. OTP Secret Hardening** — `src/services/auth/otpService.js`:
- Remove the hardcoded fallback `'delivery-app-otp-secret'` (line 48)
- Update `getSecret()` logic:
  - If `OTP_SECRET` env var set → use it (any environment)
  - If `NODE_ENV === 'production'` → throw Error (already implemented on line 39-41)
  - If `NODE_ENV === 'test'` → use `'test-otp-secret'`
  - Else (development) → fall back to `JWT_SECRET` or log warning with auto-generated secret
- Update `src/utils/validateEnv.js` to add `OTP_SECRET` to `PRODUCTION_ONLY_ENV_VARS`

**2c. Password Policy** — `src/routes/authRoutes.js`:
- Update `registerValidation` password validator from `isLength({ min: 6 })` to custom validator:
  - Minimum 12 characters
  - At least one uppercase letter (`/[A-Z]/`)
  - At least one lowercase letter (`/[a-z]/`)
  - At least one digit (`/[0-9]/`)
  - At least one special character (`/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/`)
- Apply same validation to password change routes in `src/routes/userRoutes.js`
- Frontend: Update `loginSchema` and `registerSchema` in `frontend/src/lib/validations/index.ts`

### Phase 3: Graceful Shutdown & Health Probes (FR-6, FR-7)

**3a. Graceful Shutdown** — `src/server.js`:
- Add `gracefulShutdown()` function after server starts listening
- Register `process.on('SIGTERM', gracefulShutdown)` and `process.on('SIGINT', gracefulShutdown)`
- Implementation:
  1. Log "Received shutdown signal"
  2. Call `httpServer.close()` to stop accepting new connections
  3. Set 30-second force-kill timeout via `setTimeout(() => process.exit(1), 30000)`
  4. After server closes, close MongoDB: `mongoose.connection.close()`
  5. Log "Shutdown complete" and `process.exit(0)`

**3b. Health Probes** — `src/routes/healthRoutes.js`:
- Add `GET /live` endpoint (unauthenticated):
  - Returns `{ status: 'ok', timestamp }` with 200
  - No database check — just confirms process is alive
- Add `GET /ready` endpoint (unauthenticated):
  - Checks `mongoose.connection.readyState === 1`
  - Returns 200 with `{ status: 'ready' }` if connected
  - Returns 503 with `{ status: 'not_ready' }` if disconnected

### Phase 4: Frontend Security & Resilience (FR-8, FR-9)

**4a. Security Headers** — `frontend/next.config.mjs`:
- Add `headers()` function returning security headers for all routes (`/:path*`):
  ```
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```

**4b. Dashboard Error Boundary** — `frontend/src/app/(dashboard)/layout.tsx`:
- Import `ErrorBoundary` from `@/components/shared/error-boundary`
- Wrap the dashboard content (`<main>` area) with `<ErrorBoundary>` inside `<SocketProvider>`
- The existing `ErrorBoundary` component already has Arabic error messages and recovery UI

### Phase 5: Fix Tests & Add New Tests (FR-10, FR-11, FR-12)

**5a. Fix Broker Schema Tests** — `frontend/tests/unit/lib/validations.test.ts`:
- Update `brokerFormSchema` to add defaults for optional fields:
  - `countriesServed: z.array(z.string()).default([])`
  - `contacts: z.object({...}).default({ email: '', phone: '' })`
- Or update tests to provide all required fields in test data

**5b. Update Password Validation Tests** — `frontend/tests/unit/lib/validations.test.ts`:
- Update existing password test expectations to match new 12-char minimum

**5c. Backend Integration Tests** — `tests/integration/security-hardening.test.js`:
- Test password policy: POST `/api/auth/register` with weak password → 400
- Test password policy: POST `/api/auth/register` with strong password → success
- Test liveness: GET `/health/live` → 200
- Test readiness: GET `/health/ready` → 200 (with DB connected)

**5d. Frontend Unit Tests** — `frontend/tests/unit/components/error-boundary.test.tsx`:
- Test error boundary catches thrown errors
- Test error boundary renders Arabic fallback UI
- Test error boundary reset button works

**5e. Frontend Password Schema Tests** — update in `frontend/tests/unit/lib/validations.test.ts`:
- Test new password schema rejects short passwords
- Test new password schema rejects missing complexity
- Test new password schema accepts compliant passwords

## File Change Summary

| File | Change Type | Description |
|------|------------|-------------|
| `package.json` + `package-lock.json` | Modified | npm audit fix |
| `frontend/package.json` + lock | Modified | npm audit fix |
| `src/middleware/securityHeaders.js` | Modified | Remove unsafe-inline/eval from scriptSrc |
| `src/services/auth/otpService.js` | Modified | Remove hardcoded fallback secret |
| `src/utils/validateEnv.js` | Modified | Add OTP_SECRET to production vars |
| `src/routes/authRoutes.js` | Modified | Strengthen password validation |
| `src/routes/userRoutes.js` | Modified | Strengthen password change validation |
| `src/server.js` | Modified | Add graceful shutdown |
| `src/routes/healthRoutes.js` | Modified | Add /live and /ready endpoints |
| `frontend/next.config.mjs` | Modified | Add security headers |
| `frontend/src/app/(dashboard)/layout.tsx` | Modified | Wrap with ErrorBoundary |
| `frontend/src/lib/validations/index.ts` | Modified | Strengthen password schema, fix broker schema |
| `frontend/tests/unit/lib/validations.test.ts` | Modified | Fix broker tests, add password tests |
| `tests/integration/security-hardening.test.js` | New | Backend security integration tests |
| `frontend/tests/unit/components/error-boundary.test.tsx` | New | Error boundary unit tests |

## Build Sequence

1. Backend npm audit fix → verify `npm test`
2. Frontend npm audit fix → verify `npm run build` + `npm run test`
3. Backend code changes (CSP, OTP, password, shutdown, health) → verify `npm test`
4. Frontend code changes (headers, error boundary, validation schemas) → verify `npm run build`
5. Fix broker schema tests → verify `npm run test`
6. Add new backend tests → verify `npm test`
7. Add new frontend tests → verify `npm run test`
8. Final validation: `npm audit` both, full test suite both
