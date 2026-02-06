<p align="center">
  <h1 align="center">Delivery</h1>
  <p align="center">
    A production-ready logistics platform connecting merchants with truck owners for international shipments.
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node.js">
  <img src="https://img.shields.io/badge/mongodb-%3E%3D6.0-green" alt="MongoDB">
  <img src="https://img.shields.io/badge/next.js-14-black" alt="Next.js">
  <img src="https://img.shields.io/badge/typescript-5-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/docker-ready-2496ED" alt="Docker">
</p>

---

## Overview

Delivery orchestrates international shipping operations through role-based workflows. It connects **merchants** who need shipping services with **truck owners** and **drivers**, providing shipment management, real-time tracking, bidding, document handling, and admin oversight.

### Core Workflows

- **Shipment Lifecycle** &mdash; Request &rarr; Bidding &rarr; Admin Approval &rarr; Tracking &rarr; Delivery
- **Real-time Tracking** &mdash; Live location updates via Socket.IO with geofencing and ETA
- **Document Management** &mdash; Secure upload, entity linking, and audit trails
- **Role-based Access** &mdash; Admin, Merchant, Truck Owner, Driver &mdash; each with granular permissions

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js 18+, Express.js, MongoDB + Mongoose, Socket.IO, JWT |
| **Frontend** | Next.js 14 (App Router), TypeScript 5, React 18, TanStack Query, Zustand, Tailwind CSS, Radix UI |
| **Security** | Helmet, CSRF protection, rate limiting, NoSQL injection prevention, CORS |
| **Observability** | Winston logging, Prometheus metrics, Grafana dashboards, health checks |
| **Notifications** | Nodemailer (email), Twilio (WhatsApp) |
| **DevOps** | Docker, Docker Compose, Husky + lint-staged, Jest |

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- MongoDB 6.0+ (local or Docker)
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/OmarEhab007/delivery.git
cd delivery

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Running

```bash
# Backend (development with hot reload)
npm run dev

# Frontend (Next.js dev server on port 3001)
cd frontend && npm run dev

# Or run both concurrently
npm run dev:all
```

### Docker

```bash
docker compose up -d
```

## Architecture

```
delivery/
├── src/                        # Backend (Express.js)
│   ├── controllers/            # Route handlers by domain
│   │   ├── admin/              # Admin management & reporting
│   │   ├── auth/               # Authentication (JWT + refresh tokens)
│   │   ├── shipment/           # Shipment & fixed-price shipment logic
│   │   ├── application/        # Bidding system
│   │   ├── truck/              # Fleet management
│   │   ├── driver/             # Driver operations
│   │   ├── document/           # File management
│   │   └── user/               # User profiles
│   ├── middleware/              # Auth, CSRF, rate limiting, validation
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic (email, tracking, notifications)
│   ├── utils/                  # Logger, metrics, health checks, error handling
│   ├── scripts/                # Admin & DB maintenance scripts
│   ├── app.js                  # Express configuration
│   └── server.js               # Entry point
│
├── frontend/                   # Frontend (Next.js 14 + TypeScript)
│   └── src/app/                # App Router pages & components
│
├── tests/                      # Jest test suite
│   ├── integration/            # API endpoint tests
│   ├── security/               # Auth & injection tests
│   └── utils/                  # Test helpers & data factories
│
├── docker-compose.yml          # Local development stack
├── docker-compose.prod.yml     # Production deployment
└── Dockerfile                  # Multi-stage build
```

## API

Interactive API documentation is available at `/api-docs` (Swagger UI) when the server is running.

### Key Endpoints

| Area | Endpoints | Description |
|------|-----------|-------------|
| **Auth** | `POST /api/auth/register`, `login`, `refresh-token`, `logout` | Registration (with admin approval), JWT auth, token refresh |
| **Shipments** | `GET/POST/PATCH/DELETE /api/shipments` | Full CRUD with status workflow |
| **Fixed Price** | `/api/fixed-price-shipments` | Admin-defined fixed-price shipments |
| **Applications** | `/api/applications` | Truck owner bidding on shipments |
| **Trucks** | `/api/trucks` | Fleet registration and management |
| **Documents** | `/api/documents` | Secure file upload with entity linking |
| **Admin** | `/api/admin/users/pending`, `approve`, `reject`, `reports` | User approval, reporting |
| **Health** | `/health`, `/health/db`, `/health/storage`, `/metrics` | System health and Prometheus metrics |

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access, user approval/rejection, reporting, fixed-price shipments |
| **Merchant** | Create shipments, review bids, track deliveries |
| **Truck Owner** | Manage fleet, submit bids, assign drivers |
| **Driver** | Update location, manage assigned shipments |

## Security

- JWT access tokens (24h) + refresh token rotation (7d) with revocation
- Role-based access control on every endpoint
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- CSRF protection for state-changing operations
- Rate limiting (100 req/15min general, 5 req/15min auth)
- NoSQL injection prevention via `express-mongo-sanitize`
- Input validation with `express-validator`
- Password hashing with bcrypt

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Testing

```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode
```

Test coverage includes authentication flows, authorization, input validation, NoSQL injection prevention, and API endpoint functionality.

## Monitoring

- **Health checks**: `/health`, `/health/db`, `/health/storage`
- **Prometheus metrics**: `/metrics` (admin only)
- **Grafana dashboards**: Pre-configured when using Docker Compose
- **Logging**: Winston with daily rotation (`/logs/`)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branching, commits, code style, and pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
