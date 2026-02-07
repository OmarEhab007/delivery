<div align="center">

# Logisti Platform

### International Freight Logistics for the Modern Supply Chain

A full-stack platform that connects merchants, truck owners, and drivers to streamline cross-border freight operations with real-time tracking, competitive bidding, and end-to-end document management.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D6.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Next.js](https://img.shields.io/badge/next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## About

Logisti Platform orchestrates international shipping through role-based workflows designed for the freight logistics industry. It provides a unified system where **merchants** post shipments, **truck owners** bid competitively, **drivers** execute deliveries with live tracking, and **admins** maintain oversight across the entire operation.

### Key Capabilities

- **Shipment Lifecycle Management** -- From request through bidding, approval, border crossing, to final delivery confirmation
- **Real-time GPS Tracking** -- Live vehicle location via Socket.IO with geofencing alerts and ETA calculation
- **Competitive Bidding System** -- Truck owners submit bids on shipments; merchants review and select
- **Fixed-Price Shipments** -- Admin-defined pricing for established routes
- **Document Vault** -- Secure upload and linking of trade documents (bill of lading, customs declarations, invoices, certificates)
- **Automation Engine** -- Configurable rules for delay alerts, escalations, and webhook notifications
- **Analytics Dashboard** -- Revenue trends, shipment volume, fleet utilization, and operational KPIs

### User Roles

| Role | Scope |
|------|-------|
| **Admin** | Full platform access -- user approval, reporting, fixed-price management, system configuration |
| **Merchant** | Create shipments, review bids, track deliveries, manage trade documents |
| **Truck Owner** | Fleet management, bid on shipments, assign drivers, monitor operations |
| **Driver** | Check-in, location updates, delivery execution, issue reporting |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend API** | Node.js 18+, Express.js, MongoDB + Mongoose, Socket.IO |
| **Frontend** | Next.js 14 (App Router), TypeScript 5, React 18, TanStack Query, Zustand, Tailwind CSS, Radix UI |
| **Auth & Security** | JWT + refresh token rotation, Helmet CSP/HSTS, CSRF protection, rate limiting, bcrypt, express-mongo-sanitize |
| **Observability** | Winston logging (daily rotation), Prometheus metrics, Grafana dashboards, liveness/readiness probes |
| **Notifications** | Nodemailer (email), Twilio (WhatsApp) |
| **Infrastructure** | Docker, Docker Compose, Husky + lint-staged, Jest + Playwright |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 8+
- **MongoDB** 6.0+ (local install or via Docker)
- **Docker** & Docker Compose (optional, for containerized setup)

### Quick Start

```bash
# Clone
git clone https://github.com/OmarEhab007/logisti-platform.git
cd logisti-platform

# Backend
npm install
cp env.sample .env          # Configure your environment variables

# Frontend
cd frontend && npm install && cd ..

# Run
npm run dev                  # Backend on :3000
cd frontend && npm run dev   # Frontend on :3001
```

### Docker

```bash
docker compose up -d                          # Development
docker compose -f docker-compose.prod.yml up  # Production
```

---

## Project Structure

```
logisti-platform/
├── src/                          # Backend API (Express.js)
│   ├── controllers/              # Request handlers organized by domain
│   │   ├── admin/                #   Admin management, reporting, approvals
│   │   ├── auth/                 #   JWT authentication, OTP, password reset
│   │   ├── shipment/             #   Shipment CRUD, status transitions
│   │   ├── application/          #   Bid management
│   │   ├── truck/                #   Fleet operations
│   │   ├── driver/               #   Driver check-in, delivery workflow
│   │   ├── document/             #   File upload & entity linking
│   │   └── user/                 #   Profile management
│   ├── middleware/                # Auth, CSRF, rate limiting, security headers
│   ├── models/                   # Mongoose schemas & business logic
│   ├── routes/                   # Route definitions & validation
│   ├── services/                 # Core services (tracking, email, webhooks, automation)
│   ├── utils/                    # Logger, metrics, health checks, error handling
│   └── server.js                 # Entry point with graceful shutdown
│
├── frontend/                     # Frontend (Next.js 14 + TypeScript)
│   └── src/
│       ├── app/                  # App Router
│       │   ├── (auth)/           #   Login, registration pages
│       │   └── (dashboard)/      #   Role-based dashboards
│       │       ├── admin/        #     Admin panel
│       │       ├── merchant/     #     Merchant workspace
│       │       ├── truck-owner/  #     Fleet & bid management
│       │       └── driver/       #     Driver operations
│       ├── components/           # UI components (shared, forms, tables, charts, maps)
│       ├── hooks/                # React Query hooks per domain
│       ├── stores/               # Zustand state management
│       ├── lib/                  # API client, validations, providers
│       └── types/                # TypeScript interfaces & API contracts
│
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests (controllers, services, models, middleware)
│   ├── integration/              # API integration tests
│   └── security/                 # Auth & injection prevention tests
│
├── specs/                        # Feature specifications & design docs
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # Development stack
└── docker-compose.prod.yml       # Production deployment
```

---

## API Reference

Interactive documentation is available at `/api-docs` (Swagger UI, admin-only) when the server is running.

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/api/auth/register/*`, `login`, `refresh`, `logout` | Role-based registration, JWT auth, token rotation, OTP |
| **Shipments** | `/api/shipments` | Full CRUD with 11-state lifecycle workflow |
| **Fixed Price** | `/api/shipments/fixed-price/*` | Admin-managed fixed-price shipments |
| **Applications** | `/api/applications` | Bid submission, review, acceptance |
| **Trucks** | `/api/trucks` | Fleet CRUD, maintenance records, insurance tracking |
| **Drivers** | `/api/driver` | Check-in, location updates, delivery start/complete |
| **Documents** | `/api/documents` | Upload, link to entities, download, audit trail |
| **Admin** | `/api/admin/*` | User approval, system reports, analytics |
| **Automation** | `/api/automation/rules` | Delay alerts, escalation rules, webhook config |
| **Health** | `/health/live`, `/health/ready` | Kubernetes-compatible liveness & readiness probes |

---

## Security

| Measure | Implementation |
|---------|---------------|
| Authentication | JWT access tokens + refresh token rotation with revocation |
| Password Policy | 12-character minimum with uppercase, lowercase, digit, and special character |
| Authorization | Role-based access control on every endpoint |
| Headers | Helmet with CSP (no unsafe-inline/eval), HSTS, X-Frame-Options, Referrer-Policy |
| CSRF | Token-based protection on all state-changing operations |
| Rate Limiting | 100 req/15min general, 5 req/15min for auth endpoints |
| Injection Prevention | express-mongo-sanitize for NoSQL, express-validator for input |
| Secrets | No hardcoded secrets; env-var validation with disallowed default detection |
| Shutdown | Graceful SIGTERM/SIGINT handling with connection draining |

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

---

## Testing

```bash
# Backend
npm test                              # All backend tests
npx jest tests/integration/auth.test.js  # Single file

# Frontend
cd frontend
npm run test                          # Unit tests
npm run test:e2e                      # Playwright E2E tests
npm run build                         # Type checking + production build
```

The test suite covers authentication flows, authorization enforcement, input validation, injection prevention, health endpoints, password policy, error boundaries, and schema validation.

---

## Monitoring & Operations

| Capability | Endpoint / Tool |
|-----------|----------------|
| **Liveness Probe** | `GET /health/live` -- process is alive |
| **Readiness Probe** | `GET /health/ready` -- process alive + DB connected |
| **System Health** | `GET /health/comprehensive` -- full system status (admin) |
| **Prometheus Metrics** | `GET /api/metrics` -- request durations, error rates (admin) |
| **Logging** | Winston with daily file rotation in `/logs/` |
| **Grafana** | Pre-configured dashboards via Docker Compose |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branching strategy, commit conventions, code style, and pull request workflow.

---

## License

This project is licensed under the [MIT License](LICENSE).
