# Delivery App Project Audit

This document captures a point-in-time technical audit of the Delivery App backend. It highlights the current architecture, core modules, supporting infrastructure, and the status of roadmap items so work can resume with clear context.

## 1. Architecture Snapshot

- **Runtime**: Express HTTP server (`src/server.js`) backed by MongoDB via Mongoose (`src/config/database.js`). Socket.io is mounted for real-time use, though tracking hooks are still placeholders.
- **Configuration**: Centralized in `src/config/config.js` with environment-driven settings (Mongo URI, Twilio, storage, rate limits). Swagger setup lives in `src/config/swagger.js`.
- **Entry Flow**: `src/app.js` wires middleware stacks (CORS, compression, rate limiting, CSRF), request logging, Prometheus metrics, and route registration.
- **Domain Routing**: REST modules exposed under `/api`, plus `/health`, `/api-docs`, `/api/metrics`, and admin/monitoring routes. Swagger UI is bundled for API exploration.

## 2. API & Service Modules

| Area                      | Key Files                                                                                                                                                  | Notes                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Authentication & Sessions | `src/controllers/auth/authController.js`, `src/routes/authRoutes.js`, `src/middleware/authMiddleware.js`                                                   | Covers multi-role registration, login, JWT protection, password reset, CSRF helpers, and rate-limit guards.              |
| User Management           | `src/controllers/user/userController.js`, `src/routes/userRoutes.js`                                                                                       | Allows profile CRUD, admin user oversight, driver rosters for truck owners.                                              |
| Fleet (Trucks & Drivers)  | `src/controllers/truck/truckController.js`, `src/controllers/truck/truckOwnerController.js`, `src/routes/truckRoutes.js`, `src/routes/truckOwnerRoutes.js` | Full CRUD with validation, capacity metadata, driver assignment, availability toggles.                                   |
| Shipments                 | `src/controllers/shipment/shipmentController.js`, `src/routes/shipmentRoutes.js`, timeline logic in `src/models/Shipment.js`                               | Supports creation, merchant lifecycle actions, status advancement, timeline/history, issue reporting, payment recording. |
| Fixed-Price Workflow      | `src/controllers/shipment/fixedPriceShipmentController.js`, `src/routes/fixedPriceShipmentRoutes.js`                                                       | Implements fixed-price postings, acceptance flow, and limited WhatsApp notifications to truck owners.                    |
| Applications/Bids         | `src/controllers/application/applicationController.js`, `src/routes/applicationRoutes.js`, `src/models/Application.js`                                     | Truck owner bidding, merchant review, acceptance/rejection with history tracking.                                        |
| Document Management       | `src/controllers/documentController.js`, `src/services/documentService.js`, `src/models/Document.js`, `src/middleware/uploadMiddleware.js`                 | Multi-entity file upload/download, metadata, validation, on-disk storage bootstrapped at startup.                        |
| Driver Portal             | `src/controllers/driver/driverController.js`, `src/routes/driverRoutes.js`                                                                                 | Driver profile, shipment queue, status updates, issue reports, proof-of-delivery uploads, manual location updates.       |
| Admin Suite               | `src/controllers/admin/*`, `src/routes/adminRoutes.js`                                                                                                     | Dashboard metrics, cross-entity CRUD, reporting endpoints.                                                               |
| Health & Monitoring       | `src/routes/healthRoutes.js`, `src/utils/healthCheck.js`, Prometheus wiring in `src/utils/metrics.js`                                                      | System/database/storage health probes, metrics export, error tracking hooks.                                             |
| Notifications             | `src/services/notification/notificationService.js`, `src/utils/sendWhatsApp.js`                                                                            | Twilio WhatsApp integration with templated message builder; currently invoked by fixed-price shipment flows only.        |

## 3. Data Layer Highlights

- **User (`src/models/User.js`)**: Role-specific constraints, driver availability & logs, geospatial indexing on `currentLocation`, document links, password hashing hooks.
- **Truck (`src/models/Truck.js`)**: Capacity, regulatory docs, maintenance records, assignment state, geospatial location, with helper methods for document linkage.
- **Shipment (`src/models/Shipment.js`)**: Rich timeline, pricing modes, assignment pointers, payment & proof tracking, issue handling, geospatial indices, helper methods for timeline/documents.
- **Application (`src/models/Application.js`)**: Bid payload, status history, uniqueness constraints, helpers to accept/reject/cancel and propagate document requirements.
- **Document (`src/models/Document.js`)**: Metadata for stored files, verification flags, entity linkage, soft-delete support.

## 4. Cross-Cutting Infrastructure

- **Security Middleware**: Global rate limiters, CSRF tokens (`src/middleware/csrfProtection.js`), compression controls, cache directives, optional CSP scaffolding, role-based guards.
- **Logging**: Winston-based logger (`src/utils/logger.js`), request logging middleware, rotating file transport; log directory bootstrap via `src/utils/ensureLogDir.js`.
- **Metrics & Tracing**: Prometheus instrumentation (`src/utils/metrics.js`), OpenTelemetry-style tracer stub (`src/utils/tracer.js`), scheduled metric refreshers (`src/utils/metricScheduler.js`).
- **Error Handling**: Centralized API error classes, async wrappers, and capture pipeline through `src/middleware/errorHandler.js` plus `src/utils/errorTracker.js` for aggregation.
- **Background Scripts**: Database migration/index scripts (`src/scripts/database/*`), admin seeding (`src/scripts/createAdminUser.js`, `src/utils/initAdmin.js`), log utilities.

## 5. External Integrations

- **Twilio WhatsApp**: Configured via environment variables, sending messages and template-based content.
- **Socket.io**: Server instantiated in `src/server.js`; detailed tracking behaviors defined in `src/services/tracking/trackingService.js` but not yet wired into the live Socket.io instance.
- **Monitoring Stack**: Dockerized Prometheus & Grafana with prepared dashboards (`docker/`), demo metrics endpoint for quick visualization.

## 6. Testing Landscape

- Jest/Supertest harness under `tests/` with module test suites, in-memory Mongo orchestration (`tests/setup.js`), and end-to-end journey specs. Shell scripts simplify running targeted or full suites; coverage reports land in `tests/coverage/`.

## 7. Roadmap Status Check

### Completed (verified in code)

- **Project Setup**: Directory structure, Express server, Mongo connection, Docker baseline, logging, error handling.
- **User Authentication**: Multi-role registration/login, JWT guards, password reset, role middleware.
- **Fleet Management**: Truck & driver CRUD, assignment, filtering, validation.
- **Shipment Management**: CRUD, status machine, timeline, assignment logic, validation, payment tracking, issue reporting.
- **Application/Bid System**: Submission, review workflow, auto-rejection helpers, notifications limited to fixed-price events.
- **Document Management**: On-prem storage, metadata persistence, entity linking, verification hooks.
- **API Testing & Docs**: Swagger (`/api-docs`), extensive docs under `docs/`, Jest suites covering core modules.

### Partially Implemented

- **Notification System**:
  - Twilio WhatsApp client & notification service exist.
  - Fixed-price shipment creation/acceptance trigger alerts.
  - Missing centralized notification persistence, preference handling, failure retries, and coverage for broader business events.
- **Real-time Tracking**:
  - Socket.io server initialized; trackingService defines auth middleware, broadcast patterns, ETA/geofence helpers.
  - REST endpoints allow drivers to update location and shipment status.
  - Integration between trackingService and live Socket.io instance is pending; location updates do not yet broadcast in real time nor store history beyond manual timeline entries.
- **Deployment & DevOps**:
  - Docker Compose spins up app + Mongo + Prometheus + Grafana.
  - Dockerfile is single-stage development oriented; no production tuning, health checks, or asset build steps.
  - Monitoring docs exist, but formal deployment runbooks, CI/CD scripts, and backup automation remain to be defined.

### Not Yet Implemented / Gaps

- **Notification Enhancements**: No notification preference schema, no WhatsApp template catalog/approval tracking, no audit logging beyond Winston.
- **Tracking Security & UX**: Socket authentication placeholder only checks token presence; no JWT validation or role scoping. Geofencing helper unused. No location history persistence separate from shipment timeline.
- **Production Hardening**: Environment hardening, secrets management, scaling strategy, rolling updates, automated backups still outstanding.
- **Client Integration**: While server supports Socket.io and notifications, corresponding client workflows (e.g., event consumers) are not part of this repo.

## 8. Suggested Next Steps

1. Finish wiring `trackingService.initializeTracking` into `src/server.js`, validate JWTs on sockets, and connect driver location updates to WebSocket broadcasts + history storage.
2. Extend notification service with persistent delivery logs, user preference toggles, and broader event coverage (shipment status transitions, document verification, etc.).
3. Harden deployment artifacts: multi-stage Docker build, production `docker-compose` or Helm chart, documented rollout/rollback, and backup cron strategy.
4. Add observability for Twilio interactions and tracking events (metrics + structured logs) to improve supportability.
