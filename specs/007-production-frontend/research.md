# Research: Production Frontend Completion

**Feature Branch**: `007-production-frontend`
**Date**: 2026-02-05

## Research Summary

All technical unknowns have been resolved through codebase analysis. No external research was needed as the existing frontend and backend codebases provide all necessary context.

---

## R1: Socket.io Event Contract

**Decision**: Use the existing `use-tracking-socket.ts` hook as the foundation and extend it to integrate with React Query cache invalidation and the notification system.

**Rationale**: The hook already handles `shipment:location`, `shipment:status`, `join:shipment`, `leave:shipment`, and `driver:location` events with proper JWT authentication. It tracks connection status, location history (max 100 entries), and last update timestamps. The backend tracking service at `src/services/tracking/trackingService.js` emits `shipment:location` events to room `shipment:{shipmentId}`.

**What needs to change**:
1. Wire socket events to React Query `queryClient.invalidateQueries()` to auto-refresh shipment data when status changes.
2. Feed location updates directly to the existing `tracking-map.tsx` component via props/context.
3. Add notification events (new channel) for in-app alerts.
4. Integrate `ConnectionStatusIndicator` into the dashboard layout header.

**Alternatives considered**:
- Server-Sent Events (SSE): Simpler but Socket.io already implemented on backend with room support for per-shipment tracking.
- Polling: Higher latency, more server load; only used as fallback when Socket.io connection fails.

---

## R2: Notification Persistence Strategy

**Decision**: Client-side notification persistence using Zustand with localStorage, supplemented by Socket.io events. The existing `notification-store.ts` handles toast-style ephemeral notifications; a new persistent notification system will be built alongside it.

**Rationale**: The backend notification service only sends WhatsApp messages and does not persist in-app notifications in the database. Rather than requiring backend changes (which are out of scope), notifications will be:
1. Received via Socket.io events in real-time.
2. Stored in a Zustand store with `persist` middleware (localStorage).
3. Managed with read/unread state per notification.
4. Capped at 100 notifications with oldest-first eviction.

**Alternatives considered**:
- Backend notification table + REST API: More robust but requires backend changes outside scope.
- IndexedDB storage: More capacity but overkill for notification volume; localStorage sufficient.

---

## R3: Map Integration Approach

**Decision**: Use the existing `tracking-map.tsx`, `map-marker.tsx`, and `route-polyline.tsx` components. Create a new `shipment-map.tsx` wrapper that combines these with real-time Socket.io location updates.

**Rationale**: All three map components are fully implemented with:
- Dynamic Leaflet import (SSR-safe)
- Origin/destination/vehicle markers with Arabic labels
- Planned and actual route polylines with distance calculation
- Skeleton loading state
- Default center on Riyadh (24.7136, 46.6753)

**What needs to change**:
1. Create `shipment-map.tsx` as a smart wrapper that subscribes to Socket.io location events and passes them as props.
2. Embed the map on all shipment detail pages across all four role views.
3. Add a toggle for tracking history display.

**Alternatives considered**:
- Mapbox GL JS: More powerful but React Leaflet already installed, working, and lightweight.
- Google Maps: Requires API key billing; Leaflet/OpenStreetMap is free.

---

## R4: Admin Analytics Chart Library

**Decision**: Use lightweight chart rendering with the existing chart components pattern (found in `src/components/charts/kpi-charts.tsx`). Use Recharts for new chart types since it's a common React charting library with good SSR support.

**Rationale**: The backend provides 7 analytics endpoints with consistent `{ success: true, data: [...] }` response format:
- `/api/analytics/kpis` - KPI summary
- `/api/analytics/lanes` - Lane performance
- `/api/reports/shipments/status-trends` - Status over time (line/area chart)
- `/api/reports/revenue` - Revenue by period (bar chart)
- `/api/reports/performance` - Driver/truck rankings (table + bar)
- `/api/reports/customers` - Customer insights (table)
- `/api/reports/efficiency` - Operational metrics (multi-line chart)
- `/api/reports/geo` - Geographic distribution (map + table)

**Alternatives considered**:
- Chart.js: Heavier, less React-native integration.
- D3.js: Too low-level for standard business charts.
- Tremor: Good but adds another design system dependency.

---

## R5: Command Palette Implementation

**Decision**: Use `cmdk` library (already installed in package.json as version 1.1.1) for the global search command palette.

**Rationale**: cmdk is already a dependency, provides an accessible, composable command menu component that integrates well with Radix UI. It supports fuzzy search, keyboard navigation, groups, and custom rendering.

**What needs to change**:
1. Create a `CommandPalette` component using cmdk.
2. Register keyboard shortcut (Cmd/Ctrl+K) at the dashboard layout level.
3. Implement search across entities using existing API search endpoints.
4. Display results grouped by type (shipments, trucks, drivers, users).

**Alternatives considered**:
- Custom implementation: More work, less accessible out-of-the-box.
- kbar: Another option but cmdk already installed.

---

## R6: URL-Synced Filters

**Decision**: Use Next.js `useSearchParams` and `useRouter` to sync filter state with URL query parameters. Create a reusable `useUrlFilters` hook.

**Rationale**: Next.js App Router natively supports reading and writing search params. This approach:
- Makes filtered views bookmarkable and shareable.
- Persists filters across page refreshes.
- Follows Next.js idioms (no extra dependencies).

**What needs to change**:
1. Create `use-url-filters.ts` hook that reads from `useSearchParams` and writes via `router.push`.
2. Integrate with React Query by passing URL params as query keys.
3. Add filter UI components (`advanced-filters.tsx`) for each list page.

**Alternatives considered**:
- Zustand store: Doesn't persist in URL, not shareable.
- nuqs library: Good but unnecessary; native Next.js params sufficient.

---

## R7: RTL Support Strategy

**Decision**: Use Tailwind CSS `rtl:` variant with the `dir` attribute on the HTML element. Leverage CSS logical properties where possible.

**Rationale**: The frontend already uses Cairo font (Arabic typeface) and has Arabic labels throughout. The `dir="rtl"` attribute on the root layout combined with Tailwind's RTL variant (`rtl:mr-4` instead of `ml-4`) provides a clean approach. The sidebar, forms, and tables need RTL-aware spacing.

**What needs to change**:
1. Add `dir` attribute toggle to root layout based on locale.
2. Audit all margin/padding classes for RTL equivalents using logical properties (`ms-*`/`me-*` instead of `ml-*`/`mr-*`).
3. Mirror sidebar position and navigation flow.

**Alternatives considered**:
- Separate RTL stylesheet: Maintenance burden, harder to keep in sync.
- CSS transforms `scaleX(-1)`: Hacky, breaks text rendering.

---

## R8: Testing Strategy

**Decision**: Jest + React Testing Library for unit/component tests, Playwright for E2E. Use MSW (Mock Service Worker) for API mocking in tests.

**Rationale**: Jest is already configured with jsdom, path aliases, coverage thresholds (70%), and setup file with Next.js mocks. Playwright is configured with 5 browser/device targets and HTML reporting. MSW is the standard approach for mocking API calls in React tests.

**What needs to change**:
1. Install MSW as a dev dependency.
2. Create MSW handlers for core API endpoints.
3. Write unit tests for all custom hooks (15 hooks).
4. Write E2E tests for 4 primary user journeys.

**Alternatives considered**:
- Vitest: Good but Jest already configured with Next.js integration.
- Cypress: Good E2E tool but Playwright already configured with mobile device support.

---

## R9: Recharts vs Existing Charts

**Decision**: Install Recharts for the new admin analytics charts. The existing `kpi-charts.tsx` component uses basic card-based KPI display without actual chart visualization.

**Rationale**: The current analytics page only shows 4 stat cards. The new requirements need line charts (trends), bar charts (revenue), area charts (efficiency), and potentially maps (geo). Recharts is lightweight (~40KB gzipped), React-native, SSR-compatible, and well-maintained.

**Alternatives considered**: See R4 above.
