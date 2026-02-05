# API Contracts: Frontend Portals

This document enumerates the primary API endpoints used by the frontend. It is not exhaustive; refer to `docs/API_DOCUMENTATION.md` and `docs/admin-api.md` for full coverage.

## Auth & Session

- `GET /api/auth/csrf-token`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/register/merchant`
- `POST /api/auth/register/truckOwner`
- `POST /api/auth/register/driver` (Truck Owner only)
- `POST /api/auth/register/admin` (Admin only)

## Admin Portal

### Users & Registration

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/registration-requests`
- `POST /api/admin/registration-requests/:id/approve`
- `POST /api/admin/registration-requests/:id/reject`

### Shipments & Applications

- `GET /api/admin/shipments`
- `GET /api/admin/shipments/:id`
- `POST /api/admin/shipments`
- `PUT /api/admin/shipments/:id`
- `PATCH /api/admin/shipments/:id/status`
- `GET /api/admin/applications`
- `PATCH /api/admin/applications/:id/approve`
- `PATCH /api/admin/applications/:id/reject`

### Trucks & Drivers

- `GET /api/admin/trucks`
- `GET /api/admin/trucks/:id`
- `POST /api/admin/trucks`
- `PUT /api/admin/trucks/:id`
- `GET /api/admin/drivers`
- `GET /api/admin/drivers/:id`

### Reports

- `GET /api/reports/summary`
- `GET /api/reports/shipments`
- `GET /api/reports/users`

## Merchant Portal

- `GET /api/shipments` (merchant-scoped)
- `POST /api/shipments` (create request)
- `GET /api/shipments/:id`
- `PATCH /api/shipments/:id/accept-quote`
- `POST /api/shipments/:id/payment-proof`
- `POST /api/documents` (shipment documents)
- `GET /api/documents?entityType=Shipment&entityId=...`

## Truck Owner Portal

- `GET /api/truck-owner/shipments/available`
- `GET /api/truck-owner/shipments`
- `PATCH /api/truck-owner/shipments/:shipmentId/assign`
- `POST /api/applications`
- `GET /api/applications`
- `GET /api/trucks`
- `POST /api/trucks`
- `PUT /api/trucks/:id`

## Driver Portal

- `GET /api/driver/shipments/assigned`
- `PATCH /api/driver/shipments/:shipmentId/status`
- `PATCH /api/driver/location`
- `POST /api/driver/shipments/:shipmentId/proof`
- `POST /api/driver/shipments/:shipmentId/issues`

## Documents

- `POST /api/documents` (multipart)
- `GET /api/documents/:id`
- `DELETE /api/documents/:id`
