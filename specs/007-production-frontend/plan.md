# Implementation Plan: Production Frontend Completion

**Branch**: `007-production-frontend` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-production-frontend/spec.md`

## Summary

Complete the delivery app frontend from MVP to production-ready by implementing real-time Socket.io tracking, in-app notifications, interactive Leaflet maps, comprehensive admin analytics, missing admin management pages (brokers, registration requests), merchant automation/integration settings, global search command palette, advanced filtering, payment display, performance optimizations (skeleton screens, lazy loading, prefetching), accessibility/RTL support, and automated testing (Jest unit + Playwright E2E).

## Technical Context

**Language/Version**: TypeScript 5 on Next.js 14.2.35 (App Router) with React 18
**Primary Dependencies**: @tanstack/react-query 5.90, zustand 5.0, socket.io-client 4.8, react-leaflet 4.2, react-hook-form 7.71, zod 4.3, Radix UI, Tailwind CSS 3.4, cmdk 1.1, lucide-react 0.563, sonner 2.0, date-fns 4.1
**Storage**: N/A (frontend consumes backend REST API + Socket.io)
**Testing**: Jest 30 + @testing-library/react 16 for unit/component tests; Playwright 1.58 for E2E
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge latest 2 versions), responsive mobile
**Project Type**: Web application (frontend only - backend already complete)
**Performance Goals**: <3s initial page load, <1s subsequent navigation, <5s real-time update latency
**Constraints**: Must work with existing backend API (no backend changes), RTL support for Arabic locale, WCAG AA accessibility
**Scale/Scope**: 44+ pages across 4 roles, 206 existing source files, ~15 new pages/features to add

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
| --- | --- | --- |
| Compliance-First Logistics | PASS | Frontend displays compliance data from existing backend; no new compliance workflows introduced |
| Secure, Role-Based Access | PASS | All new pages use existing RBAC middleware; API client enforces JWT auth; no new unauthenticated routes |
| Traceable State Transitions | PASS | Real-time updates consume existing backend events; shipment/document/payment states rendered from backend source of truth |
| Reliability and Observability | PASS | Connection status indicators, error boundaries, retry logic; Sonner toasts for user feedback |
| MVP Scope Discipline | PASS | This feature extends beyond original MVP scope but is explicitly approved as the production completion phase |
| Development Workflow | PASS | Spec, plan, and tasks artifacts created under specs/ |

**Post-Phase 1 Re-Check**: All gates still pass. No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-production-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-hooks.ts     # New hooks and API integration contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── analytics/page.tsx        # ENHANCE: Full analytics dashboard
│   │   │   │   ├── brokers/page.tsx           # NEW: Broker management
│   │   │   │   ├── brokers/[id]/page.tsx      # NEW: Broker detail/edit
│   │   │   │   └── registrations/page.tsx     # NEW: Registration requests
│   │   │   ├── merchant/
│   │   │   │   ├── automation/page.tsx        # NEW: Automation rules
│   │   │   │   ├── integrations/page.tsx      # NEW: API keys & webhooks
│   │   │   │   └── payments/page.tsx          # NEW: Payment history
│   │   │   └── notifications/page.tsx         # ENHANCE: Full notification page
│   │   └── globals.css                        # ENHANCE: RTL utilities
│   ├── components/
│   │   ├── charts/
│   │   │   ├── status-trends-chart.tsx        # NEW: Status trends over time
│   │   │   ├── revenue-chart.tsx              # NEW: Revenue analysis
│   │   │   ├── performance-chart.tsx          # NEW: Fleet/driver performance
│   │   │   ├── efficiency-chart.tsx           # NEW: Operational efficiency
│   │   │   ├── geo-chart.tsx                  # NEW: Geographic distribution
│   │   │   └── customer-insights-chart.tsx    # NEW: Customer analytics
│   │   ├── forms/
│   │   │   ├── broker-form.tsx                # NEW: Broker create/edit
│   │   │   ├── automation-rule-form.tsx       # NEW: Automation rule form
│   │   │   └── webhook-form.tsx               # NEW: Webhook subscription form
│   │   ├── maps/
│   │   │   ├── tracking-map.tsx               # ENHANCE: Wire real-time updates
│   │   │   ├── shipment-map.tsx               # NEW: Shipment detail map wrapper
│   │   │   └── geo-heatmap.tsx                # NEW: Admin geo analytics map
│   │   ├── shared/
│   │   │   ├── command-palette.tsx             # NEW: Global search (Cmd+K)
│   │   │   ├── notification-bell.tsx          # NEW: Header notification bell
│   │   │   ├── notification-dropdown.tsx      # NEW: Notification dropdown
│   │   │   ├── advanced-filters.tsx           # NEW: Multi-filter component
│   │   │   ├── payment-details-card.tsx       # NEW: Payment display
│   │   │   ├── empty-state.tsx                # NEW: Empty state component
│   │   │   └── error-retry.tsx                # NEW: Error with retry
│   │   └── tables/
│   │       ├── brokers-table.tsx              # NEW: Broker list table
│   │       ├── registrations-table.tsx        # NEW: Registration requests table
│   │       ├── automation-rules-table.tsx     # NEW: Automation rules table
│   │       └── webhooks-table.tsx             # NEW: Webhooks list table
│   ├── hooks/
│   │   ├── use-tracking-socket.ts             # ENHANCE: Wire to maps + query invalidation
│   │   ├── use-notifications.ts               # NEW: Notification management
│   │   ├── use-analytics.ts                   # NEW: Admin analytics hooks
│   │   ├── use-brokers.ts                     # NEW: Broker CRUD hooks
│   │   ├── use-automation.ts                  # NEW: Automation rule hooks
│   │   ├── use-integrations.ts                # NEW: API key & webhook hooks
│   │   ├── use-url-filters.ts                 # NEW: URL-synced filter state
│   │   └── use-command-palette.ts             # NEW: Search across entities
│   ├── lib/
│   │   ├── api/
│   │   │   ├── analytics.ts                   # NEW: Analytics API calls
│   │   │   ├── brokers.ts                     # NEW: Broker API calls
│   │   │   ├── automation.ts                  # NEW: Automation API calls
│   │   │   ├── integrations.ts                # NEW: Integration API calls
│   │   │   └── endpoints.ts                   # ENHANCE: Add missing endpoints
│   │   └── validations/
│   │       └── index.ts                       # ENHANCE: Add broker, automation, webhook schemas
│   ├── stores/
│   │   └── notification-store.ts              # ENHANCE: Add persistent notifications with read state
│   └── types/
│       ├── entities.ts                        # ENHANCE: Add Broker, AutomationRule, etc.
│       └── api.ts                             # ENHANCE: Add analytics response types
├── tests/
│   ├── unit/
│   │   ├── hooks/                             # NEW: Hook unit tests
│   │   └── utils/                             # NEW: Utility unit tests
│   ├── integration/
│   │   └── components/                        # NEW: Component integration tests
│   └── e2e/
│       ├── auth.spec.ts                       # NEW: Login/register E2E
│       ├── shipment.spec.ts                   # NEW: Create shipment E2E
│       ├── bidding.spec.ts                    # NEW: Submit bid E2E
│       └── tracking.spec.ts                   # NEW: Track shipment E2E
└── next.config.mjs                            # ENHANCE: Bundle analyzer, image config
```

**Structure Decision**: Extend the existing Next.js 14 App Router frontend at `/frontend/`. All new code follows established patterns (hooks in `/hooks`, API calls in `/lib/api`, components organized by type). No new top-level directories needed.

## Complexity Tracking

No constitution violations to justify.
