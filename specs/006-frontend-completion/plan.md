# Implementation Plan: Frontend Completion & Backend Wiring

**Branch**: `006-frontend-completion` | **Date**: 2026-02-04 | **Spec**: specs/006-frontend-completion/spec.md
**Input**: Feature specification from `/specs/006-frontend-completion/spec.md`

## Summary

Wire the Next.js frontend to real backend endpoints for driver workflows, admin shipment detail actions, and admin user creation. Fix Socket.IO tracking auth/event alignment, correct API method mismatches, and ensure navigation/placeholder UI behaves predictably.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 14 App Router
**Primary Dependencies**: Tanstack Query, Zustand, shadcn/ui, Socket.IO client
**Storage**: Browser storage for tokens and settings; backend MongoDB via API
**Testing**: Jest/RTL + Playwright (existing setup)
**Target Platform**: Web (desktop + mobile, RTL)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Keep UI responsive (<300ms UI feedback)
**Constraints**: Must keep backend unchanged; align with existing API routes
**Scale/Scope**: Multiple roles, 30+ pages

## Constitution Check

- Compliance-first logistics: No bypass of compliance gating in admin/driver actions.
- Secure, role-based access: Use role-appropriate endpoints; do not expose admin endpoints to non-admins.
- Traceable state transitions: Shipment status changes must use backend endpoints that create timeline entries.
- MVP scope discipline: No new backend features (ratings remain placeholders).

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-completion/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
```

**Structure Decision**: Implement changes in the Next.js frontend under `frontend/src/` and keep backend unchanged.

## Complexity Tracking

No constitution violations expected.
