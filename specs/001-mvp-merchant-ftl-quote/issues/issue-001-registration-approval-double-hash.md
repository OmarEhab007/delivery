# ISSUE-001: Registration Approval Produces Invalid Passwords

Date: 2026-02-03
Status: Open
Severity: High
Area: Auth, Admin approvals

## Summary
Users created through admin approval of registration requests cannot log in. The password is hashed twice.

## Impact
Merchants and truck owners who register through `/api/auth/register/*` are unable to authenticate after approval. This blocks core business flows.

## Root Cause
`UserRegistrationRequest` hashes the password in `payload.password` on save. During admin approval, the payload password is copied to the `User` model, whose pre-save hook hashes again. The stored password becomes double-hashed and cannot be verified.

## Reproduction
1. POST `/api/auth/register/merchant`
2. Admin approves `/api/admin/registration-requests/:id/approve`
3. POST `/api/auth/login` with the original password returns `Invalid credentials`

## Expected
Approved users can log in with the password provided during registration.

## Proposed Fix
Skip password hashing in `User` pre-save hook if the password already appears to be a bcrypt hash (prefix `$2`).

## Acceptance Criteria
1. A merchant registered via `/api/auth/register/merchant` can log in after admin approval.
2. A truck owner registered via `/api/auth/register/truckOwner` can log in after admin approval.
3. Users created directly by admin with a plaintext password still hash correctly and can log in.

## Test Plan
Run `scripts/smoke-docker.sh` after fix and confirm login works for approved registrations.
