# Delivery App API Endpoints Summary

This document provides a structured summary of all API endpoints available in the Delivery App, organized by category and user role.

## Authentication Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/register/admin` | Register new admin | Admin |
| POST | `/api/auth/register/merchant` | Register new merchant | Public |
| POST | `/api/auth/register/truckOwner` | Register new truck owner | Public |
| POST | `/api/auth/register/driver` | Register new driver | Truck Owner |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Get current user profile | All |
| POST | `/api/auth/forgotPassword` | Request password reset | Public |
| PATCH | `/api/auth/resetPassword/:token` | Reset password with token | Public |
| PATCH | `/api/auth/updatePassword` | Update password (logged in) | All |

## Admin Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Get dashboard statistics | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/users/:id` | Get user by ID | Admin |
| PATCH | `/api/admin/users/:id/status` | Update user status | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/shipments` | Get all shipments | Admin |
| GET | `/api/admin/shipments/:id` | Get shipment by ID | Admin |
| PATCH | `/api/admin/shipments/:id/status` | Update shipment status | Admin |
| PATCH | `/api/admin/trucks/:id/verify` | Verify truck | Admin |
| PATCH | `/api/admin/drivers/:id/verify` | Verify driver | Admin |
| PATCH | `/api/admin/documents/:id/verify` | Verify document | Admin |

## Merchant Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/shipments` | Create new shipment | Merchant |
| GET | `/api/shipments` | Get merchant's shipments | Merchant |
| GET | `/api/shipments/search` | Search shipments | Merchant |
| GET | `/api/shipments/:id` | Get shipment by ID | Merchant, Truck Owner, Driver |
| PATCH | `/api/shipments/:id` | Update shipment | Merchant |
| PATCH | `/api/shipments/:id/cancel` | Cancel shipment | Merchant |
| GET | `/api/shipments/:shipmentId/applications` | Get applications for shipment | Merchant |
| PATCH | `/api/applications/:id/accept` | Accept application | Merchant |
| PATCH | `/api/applications/:id/reject` | Reject application | Merchant |

## Truck Owner Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/trucks` | Register new truck | Truck Owner |
| GET | `/api/trucks` | Get owner's trucks | Truck Owner |
| GET | `/api/trucks/:id` | Get truck by ID | Truck Owner |
| PATCH | `/api/trucks/:id` | Update truck | Truck Owner |
| DELETE | `/api/trucks/:id` | Delete truck | Truck Owner |
| GET | `/api/truck-owner/drivers` | Get owner's drivers | Truck Owner |
| PATCH | `/api/truck-owner/drivers/:id` | Update driver | Truck Owner |
| GET | `/api/truck-owner/shipments/available` | Get available shipments | Truck Owner |
| POST | `/api/applications` | Submit application | Truck Owner |
| GET | `/api/applications/my` | Get my applications | Truck Owner |
| PATCH | `/api/applications/:id/cancel` | Cancel application | Truck Owner |

## Driver Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/driver/profile` | Get driver profile | Driver |
| GET | `/api/driver/truck` | Get current truck | Driver |
| GET | `/api/driver/shipments/active` | Get active shipments | Driver |
| GET | `/api/driver/shipments/assigned` | Get assigned shipments | Driver |
| GET | `/api/driver/shipments/history` | Get shipment history | Driver |
| POST | `/api/driver/shipments/:shipmentId/start` | Start delivery | Driver |
| POST | `/api/driver/shipments/:shipmentId/complete` | Complete delivery | Driver |
| PATCH | `/api/driver/shipments/:shipmentId/status` | Update shipment status | Driver |
| POST | `/api/driver/shipments/:shipmentId/issues` | Report issue | Driver |
| POST | `/api/driver/shipments/:shipmentId/proof` | Upload proof of delivery | Driver |
| POST | `/api/driver/checkin` | Driver check-in | Driver |
| POST | `/api/driver/checkout` | Driver check-out | Driver |
| PATCH | `/api/driver/availability` | Update availability | Driver |
| PATCH | `/api/driver/status` | Update driver status | Driver |
| PATCH/POST | `/api/driver/location` | Update location | Driver |
| GET | `/api/driver/dashboard` | Get driver dashboard | Driver |
| GET | `/api/driver/route/:shipmentId` | Get delivery route | Driver |

## Document Management Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/documents/upload` | Upload document | All |
| POST | `/api/documents/upload-multiple` | Upload multiple documents | All |
| GET | `/api/documents/:id` | Get document by ID | All |
| GET | `/api/documents/:id/download` | Download document | All |
| GET | `/api/documents/entity/:entityType/:entityId` | Get documents by entity | All |
| PATCH | `/api/documents/:id` | Update document | All |
| DELETE | `/api/documents/:id` | Delete document | All |
| PATCH | `/api/documents/:id/verify` | Verify document | Admin |

## Application Management Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/applications` | Create application | Truck Owner |
| GET | `/api/applications/:id` | Get application by ID | Truck Owner, Merchant |
| PATCH | `/api/applications/:id/accept` | Accept application | Merchant |
| PATCH | `/api/applications/:id/reject` | Reject application | Merchant |
| PATCH | `/api/applications/:id/cancel` | Cancel application | Truck Owner |
| GET | `/api/applications/my` | Get my applications | Truck Owner |

## Shipment Timeline Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/shipments/:id/timeline` | Add timeline entry | Truck Owner, Driver |

## Special Notes

### Request Body Requirements

- **Authentication endpoints**:
  - Registration: `name`, `email`, `password`, `phone`, `role` (plus role-specific fields)
  - Login: `email`, `password`

- **Shipment creation**:
  - Required: `origin.address`, `destination.address`, `cargoDetails.description`, `cargoDetails.weight`
  - Optional: Special instructions, hazardous cargo flag, etc.

- **Application submission**:
  - Required: `shipmentId`, `truckId`, `driverId`, `bidDetails.price`
  - Optional: Notes, valid until date, etc.

- **Document upload**:
  - Form data with file field: `document` or `documents[]`
  - Metadata: `entityType`, `entityId`, `documentType`, etc.

### Authentication and Authorization

- Most endpoints require authentication via JWT token
- Token should be included in the Authorization header: `Bearer <token>`
- Role-based authorization restricts access to endpoints
- Ownership checks ensure users can only access their own resources

### Response Format

Standard response format includes:
```json
{
  "success": true|false,
  "data": { /* response data */ }, 
  "message": "Success/error message",
  "error": { /* error details if any */ }
}
```

### Error Handling

- 400: Bad Request (invalid input)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 422: Unprocessable Entity (validation errors)
- 500: Server Error 