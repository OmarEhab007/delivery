# Quickstart: Production Frontend Completion

**Feature Branch**: `007-production-frontend`
**Date**: 2026-02-05

## Prerequisites

1. Node.js 18+ installed
2. Backend server running at `http://localhost:3000` (see root README)
3. MongoDB running and seeded with test data

## Setup

```bash
# Switch to feature branch
git checkout 007-production-frontend

# Install frontend dependencies
cd frontend
npm install

# Install new dependencies needed for this feature
npm install recharts msw --save
npm install @types/recharts --save-dev

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3001`.

## Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Development Workflow

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with watch mode
npm run test:watch

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires dev server running)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### Key Development Tasks

1. **Real-time features**: Start backend with `npm run dev` in root, then work on Socket.io integration in `src/hooks/use-tracking-socket.ts`.
2. **New pages**: Create pages in `src/app/(dashboard)/<role>/<feature>/page.tsx`.
3. **New API hooks**: Add API functions in `src/lib/api/`, then create React Query hooks in `src/hooks/`.
4. **New components**: Follow existing patterns in `src/components/`.

### Testing Real-Time Features

1. Start backend: `npm run dev` (from project root)
2. Start frontend: `npm run dev` (from frontend/)
3. Log in as a driver, navigate to active shipment
4. Open another browser tab, log in as merchant
5. Driver's location updates should appear on merchant's map

### File Organization Conventions

- **Pages**: `src/app/(dashboard)/<role>/<feature>/page.tsx`
- **API layer**: `src/lib/api/<entity>.ts` (one file per entity)
- **React Query hooks**: `src/hooks/use-<entity>.ts` (one file per entity)
- **Components**: `src/components/<type>/<name>.tsx` (charts/, forms/, maps/, shared/, tables/)
- **Types**: `src/types/entities.ts` for data models, `src/types/api.ts` for API response types
- **Validation**: `src/lib/validations/index.ts` for all Zod schemas
- **Stores**: `src/stores/<name>-store.ts` for Zustand stores

### Backend API Reference

The backend provides 100+ endpoints. Key ones for this feature:

| Endpoint | Method | Role | Purpose |
| --- | --- | --- | --- |
| `/api/analytics/kpis` | GET | Merchant/Admin | KPI metrics |
| `/api/analytics/lanes` | GET | Merchant/Admin | Lane performance |
| `/api/reports/shipments/status-trends` | GET | Admin | Status trends chart |
| `/api/reports/revenue` | GET | Admin | Revenue analysis |
| `/api/reports/performance` | GET | Admin | Driver/truck rankings |
| `/api/reports/customers` | GET | Admin | Customer insights |
| `/api/reports/efficiency` | GET | Admin | Operational efficiency |
| `/api/reports/geo` | GET | Admin | Geographic distribution |
| `/api/admin/brokers` | GET/POST | Admin | Broker management |
| `/api/admin/brokers/:id` | GET/PATCH/DELETE | Admin | Broker detail |
| `/api/admin/registration-requests` | GET | Admin | Registration requests |
| `/api/admin/registration-requests/:id/approve` | PATCH | Admin | Approve registration |
| `/api/admin/registration-requests/:id/reject` | PATCH | Admin | Reject registration |
| `/api/automation/rules` | GET/POST | Merchant/Admin | Automation rules |
| `/api/automation/rules/:id` | PATCH | Merchant/Admin | Update rule |
| `/api/integration/credentials` | GET/POST | Merchant/Admin | API credentials |
| `/api/integration/webhooks` | GET/POST | Merchant/Admin | Webhook subscriptions |
