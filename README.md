# Delivery App

> Production-ready platform that connects merchants with truck owners and drivers to orchestrate international shipments, approvals, and real-time tracking.

## Overview
- Role-based workflows for Admins, Merchants, Truck Owners, and Drivers
- Request → Payment → Admin approval → Entry creation flow with configurable limits
- Real-time shipment location updates via Socket.io
- Document management with secure storage and audit trails
- Health monitoring, Prometheus metrics, and Grafana dashboards baked in

## Architecture
```
delivery-app/
├── src/
│   ├── config/          # App, database, swagger, monitoring config
│   ├── controllers/     # Express route handlers
│   ├── middleware/      # Auth, rate limits, security headers, logging
│   ├── models/          # Mongoose schemas (Users, Shipments, Trucks, etc.)
│   ├── routes/          # REST endpoints grouped by module
│   ├── services/        # Business logic (auth, notifications, documents)
│   ├── utils/           # Metrics, tracing, logging, validation helpers
│   └── server.js        # Express bootstrap + Socket.io server
├── client/              # React admin panel (optional)
├── docker/              # Prometheus, Grafana, Mongo init scripts
├── docs/                # Runbooks, API guide, monitoring, deployment
├── env/                 # Environment templates for production
├── tests/               # Jest unit/integration tests + utilities
└── Dockerfile & compose files
```

Key technologies: Node.js/Express, MongoDB (Mongoose), JWT auth, Socket.io, Prometheus/Grafana, Docker, Winston logging.

## Quick Start
### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for local infra)
- MongoDB (local or container)

### Local development
```bash
git clone https://github.com/<org>/delivery-app.git
cd delivery-app
cp env.sample .env  # fill in secrets locally
npm install
npm run dev
```

The first startup seeds an admin user using values from `ADMIN_*` env vars. More details in [`docs/ADMIN_INITIALIZATION.md`](docs/ADMIN_INITIALIZATION.md).

### Docker Compose
```bash
docker compose up -d
```
This boots the API, MongoDB (with init script), Prometheus, and Grafana using `docker-compose.yml`. For production, use `docker-compose.prod.yml` plus the runbook.

## Configuration & Secrets
All secrets are supplied via environment variables (see `env.sample`). Critical ones:
- `MONGODB_URI` – connection string (auth enabled by default in production compose)
- `JWT_SECRET`, `COOKIE_SECRET`
- Admin bootstrap: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Rate limits, CSRF, compression, cache, and external service keys (Twilio, Stripe, Google Maps)

`src/utils/validateEnv.js` enforces mandatory values on startup, especially in production.

## Deployment
- Build hardened image: `docker build --target runner -t registry.example.com/delivery-app:<tag> .`
- Follow the [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md) for secrets, health checks, and rollback steps
- Recommended: front the app with nginx/Caddy, terminate TLS, restrict Prometheus/Grafana to private networks
- MongoDB backups handled by `scripts/backup/mongodb-backup.sh` (cron friendly)

## Quality & Tooling
- Linting/formatting: `npm run lint`, `npm run format`
- Tests: `npm test` (uses mongodb-memory-server for isolation)
- Coverage reports land in `coverage/`
- Husky + lint-staged enforce formatting on commit
- Planned CI (GitHub Actions) runs lint, tests, coverage upload, Docker build, and security scans

## Monitoring & Observability
- `/health` and `/health/*` endpoints expose system/storage/DB checks
- `GET /api/metrics` (admin JWT required) exposes Prometheus metrics
- Grafana dashboards are provisioned under `docker/grafana/`
- Winston structured logging with daily rotation; logs stored under `logs/`

## Documentation
- API reference: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) plus live Swagger (`/api-docs`, admin-only)
- System diagrams and roadmap: [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md), [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md)
- Monitoring, logging, deployment, and health guides located under `docs/`

