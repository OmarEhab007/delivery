# ISSUE-002: CSRF Blocks Bearer-Token API Calls

Date: 2026-02-03
Status: Open
Severity: Medium
Area: Security middleware, API usability

## Summary
State-changing API calls that use `Authorization: Bearer <token>` fail with `Invalid or expired CSRF token` because CSRF protection is applied unconditionally to several API routes.

## Impact
API clients that are not browser-cookie based cannot call endpoints like `/api/shipments` without fetching CSRF tokens and cookies. This blocks legitimate service-to-service or mobile clients.

## Root Cause
`server.js` applies `csrfProtection` to several API routes via `app.all` without checking auth mode. The code comment states only cookie-authenticated endpoints should require CSRF, but implementation does not skip bearer token requests.

## Reproduction
1. Login to get bearer token
2. POST `/api/shipments` with `Authorization: Bearer <token>` and no CSRF token
3. Response is 403 with CSRF error

## Expected
Bearer-token requests should bypass CSRF protection, while cookie-authenticated requests remain protected.

## Proposed Fix
Wrap CSRF middleware to skip when `Authorization` header contains a bearer token.

## Acceptance Criteria
1. Bearer-token POST `/api/shipments` succeeds without CSRF token.
2. Cookie-authenticated POST `/api/shipments` still requires CSRF token.

## Test Plan
Run `scripts/smoke-docker.sh` after fix and confirm shipment creation succeeds using bearer token.
