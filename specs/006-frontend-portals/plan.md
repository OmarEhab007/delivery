# Implementation Plan: Next.js Frontend Portals

**Branch**: `006-frontend-portals` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-frontend-portals/spec.md`

## Summary

Build a Next.js 14 frontend under `/frontend` that delivers role-based portals for Admin, Merchant, Truck Owner, and Driver. The UI uses `shadcn/ui`, integrates with existing `/api` endpoints (including CSRF handling), and mirrors the provided Figma identity.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 14 (App Router)
**Primary Dependencies**: `shadcn/ui`, Tailwind CSS, Radix UI, `class-variance-authority`
**Storage**: Browser storage for tokens; file uploads via REST multipart
**Testing**: Manual smoke tests (no automated tests requested)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web frontend only (existing backend)
**Performance Goals**: <2s initial dashboard load on local dev, responsive UI on mobile
**Constraints**: Use existing REST API under `/api`, handle CSRF, align with Figma identity
**Scale/Scope**: 4 portals, ~20-30 screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template is not configured for this project. Proceeding with standard engineering best practices.

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | ✅ PASS | Single Next.js app under `/frontend` |
| Testability | ✅ PASS | Manual smoke checks defined in tasks |
| Observability | ✅ PASS | UI logging for errors only |
| Documentation | ✅ PASS | quickstart + contracts provided |

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-portals/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (UI data shapes)
├── quickstart.md        # Phase 1 output (dev setup)
├── contracts/
│   └── api.md           # API endpoints used by portals
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── admin/
│   │   ├── merchant/
│   │   ├── truck-owner/
│   │   └── driver/
│   ├── components/
│   │   ├── layout/
│   │   ├── tables/
│   │   ├── forms/
│   │   └── ui/          # shadcn/ui
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   └── validators/
│   ├── styles/
│   └── types/
└── public/
```

**Structure Decision**: Single Next.js app with role-based route groups to reduce overhead while keeping roles isolated by layout and guards.

## Complexity Tracking

No constitution violations.

## Phase 0: Research

See [research.md](./research.md) for backend API constraints, CSRF handling, and token lifecycle notes.

## Phase 1: Design

### 1.1 UI Data Model

See [data-model.md](./data-model.md).

### 1.2 API Contracts

See [contracts/api.md](./contracts/api.md).

### 1.3 Visual Identity

- Extract colors, typography, and spacing from Figma.
- Define Tailwind theme tokens and shadcn/ui overrides accordingly.

## Phase 2: Implementation Tasks

See [tasks.md](./tasks.md).
