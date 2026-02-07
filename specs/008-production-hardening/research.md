# Research: Production Readiness Hardening

## R1: CSP Hardening — Safe to remove `unsafe-inline`/`unsafe-eval`?

**Decision**: Remove `unsafe-inline` and `unsafe-eval` from `scriptSrc`. Keep `unsafe-inline` in `styleSrc` (required for styled-components/CSS-in-JS patterns).

**Rationale**: The backend serves JSON API responses, not HTML pages. CSP script-src primarily protects browser-rendered HTML. Since the backend is an API server, removing unsafe script directives has zero impact on functionality. The CSP still protects the Swagger UI page (which is admin-only).

**Alternatives considered**: Using nonces for script-src (more complex, unnecessary for API-only backend).

## R2: Broker Schema Test Failures — Root Cause

**Decision**: Update tests to match current schema behavior.

**Rationale**: The `brokerFormSchema` defines `countriesServed` as `z.array(z.string())` (required, no default) and `contacts` as a required object. The tests assume:
1. `contacts.email: 'not-an-email'` should fail on email — but the schema uses `.optional().or(z.literal(''))` so the first error may be `countriesServed` being missing
2. `contacts.email: ''` should pass — but `countriesServed` is required without a default
3. `{name, licenseNumber}` should set defaults — but `countriesServed` and `contacts` have no defaults

**Fix**: Either add `.default([])` to `countriesServed` and `.default({email: '', phone: ''})` to `contacts`, or update test data to include all required fields.

## R3: Password Validation — Backend Implementation Approach

**Decision**: Use `express-validator` custom validator with regex checks on the backend. Use Zod `.regex()` refinement on the frontend.

**Rationale**: Express-validator is already used for all auth route validation (see `authRoutes.js` line 14). Adding password complexity checks as custom validators keeps the pattern consistent. The frontend already uses Zod schemas for form validation.

**Alternatives considered**: Using `zxcvbn` library for strength scoring (heavier dependency, more opinionated); NIST SP 800-63B recommends minimum 8 chars without complexity (but 12 + complexity is a stronger stance for B2B logistics).

## R4: Graceful Shutdown — Implementation Pattern

**Decision**: Use Node.js `http.Server.close()` + SIGTERM/SIGINT handlers with a 30-second force-kill timeout.

**Rationale**: The existing `server.js` creates an HTTP server via `createServer(app)`. Adding `process.on('SIGTERM', ...)` and calling `httpServer.close()` stops accepting new connections while completing in-flight ones. After close completes, close the MongoDB connection via `mongoose.connection.close()`.

**Alternatives considered**: Using `stoppable` npm package (adds unnecessary dependency); using `http-terminator` (over-engineered for this use case).

## R5: Health Probe Separation

**Decision**: Add `/health/live` and `/health/ready` as new routes in `healthRoutes.js`. Keep existing `/health` unchanged.

**Rationale**: Kubernetes requires separate liveness (is the process alive?) and readiness (can it serve traffic?) probes. The existing `/health` returns 200 always — suitable for liveness. The new `/health/ready` checks MongoDB connection state. Both must be unauthenticated for orchestrator access.

## R6: npm audit fix — Risk Assessment

**Decision**: Run `npm audit fix` (non-breaking) first. Assess remaining vulnerabilities individually. Use `--force` only if needed and after testing.

**Rationale**: `npm audit fix` without `--force` only updates within semver ranges, minimizing breakage risk. The critical `fast-xml-parser` vulnerability is in `@aws-sdk/core` — if fix requires major version bump, test AWS SDK integration separately. Frontend `next` vulnerability fix requires version 15.6+ which may need manual testing.

## R7: Next.js Security Headers

**Decision**: Use `headers()` async function in `next.config.mjs` to set response headers on all routes.

**Rationale**: Next.js supports response header configuration natively via the config file. This is the recommended approach over custom middleware. Headers apply to all routes including static assets.
