# Swagger API Documentation Guide

## Accessing the Documentation

The interactive API documentation is available at:
```
http://localhost:5000/api-docs
```

This interface allows you to:
- Browse all available API endpoints
- See details of request parameters and response formats
- Test API endpoints directly from the browser
- Download the OpenAPI specification

## Swagger JSON Export

The raw OpenAPI specification is available at:
```
http://localhost:5000/api-docs-json/json
```

This can be imported into tools like Postman, Insomnia, or other API clients.

## Adding Documentation to Routes

To document a new endpoint, add JSDoc-style comments above your route definitions:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [CategoryName]
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/your-endpoint', controller.yourFunction);
```

## Documenting Models

Models should be documented in the `src/docs/models.js` file using the following format:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     ModelName:
 *       type: object
 *       required:
 *         - requiredField1
 *         - requiredField2
 *       properties:
 *         field1:
 *           type: string
 *           description: Description of field1
 *         field2:
 *           type: number
 *           description: Description of field2
 *       example:
 *         field1: "Example value"
 *         field2: 123
 */
```

## Common Response Types

Common response types are defined in `src/docs/models.js` and can be referenced using:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
```

## Security Definitions

To mark an endpoint as requiring authentication:

```javascript
/**
 * @swagger
 * /api/secured-endpoint:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     // rest of your documentation
 */
```

## Organizing with Tags

Use tags to group related endpoints:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags: [Category]
 *     // rest of your documentation
 */
```

## Best Practices

1. Document all parameters, request bodies, and responses
2. Group related endpoints with consistent tags
3. Include examples for complex objects
4. Use references to avoid duplication
5. Keep your documentation updated as the API evolves
6. Test your endpoints through the Swagger UI to verify documentation accuracy

## Newly Added Documentation

The following route sets have been documented with Swagger annotations:

### Driver Routes
Driver-specific endpoints for delivery management:
- GET `/api/driver/profile` - Get driver profile
- GET `/api/driver/truck` - Get current truck assignment
- GET `/api/driver/shipments/active` - Get active shipments
- POST `/api/driver/shipments/:shipmentId/start` - Start a delivery
- POST `/api/driver/shipments/:shipmentId/complete` - Complete a delivery
- POST `/api/driver/shipments/:shipmentId/proof` - Upload proof of delivery
- PATCH/POST `/api/driver/location` - Update driver's current location

### Truck Owner Routes
Endpoints for truck owners to manage their fleet:
- GET `/api/truck-owner/shipments` - Get all assigned shipments
- GET `/api/truck-owner/shipments/available` - Get available shipments for bidding
- PATCH `/api/truck-owner/shipments/:shipmentId/assign` - Assign shipment to driver
- GET `/api/truck-owner/drivers/available` - Get available drivers
- GET `/api/truck-owner/trucks/available` - Get available trucks
- GET `/api/truck-owner/drivers` - Get all drivers
- PATCH `/api/truck-owner/drivers/:id` - Update driver details

### Admin Routes
Admin-specific endpoints for system management:
- GET `/api/admin/dashboard` - Get admin dashboard statistics
- GET/POST `/api/admin/users` - Get all users or create a new user
- GET/PUT/DELETE `/api/admin/users/:id` - Manage user by ID
- GET `/api/admin/shipments` - Get all shipments
- GET/PUT/DELETE `/api/admin/shipments/:id` - Manage shipment by ID
- PATCH `/api/admin/shipments/:id/status` - Change shipment status
- PATCH `/api/admin/shipments/:id/assign` - Assign shipment to driver
- GET `/api/admin/applications` - Get all applications
- GET/DELETE `/api/admin/applications/:id` - Manage application by ID
- PATCH `/api/admin/applications/:id/status` - Update application status

## Schema Documentation

The API documentation includes comprehensive schemas for all models in the system:

### Core Models

- **User**: Authentication and user management with role-specific fields
  - Supports Admin, Merchant, TruckOwner, and Driver roles
  - Includes specialized fields per role (e.g., driverLicense for Driver)

- **Truck**: Vehicle management with detailed specifications
  - Complete tracking of maintenance, registration, and insurance
  - Integration with driver assignments and current status

- **Shipment**: End-to-end shipping workflow
  - Origin and destination with address and coordinates
  - Cargo details, timeline tracking, and delivery confirmation

- **Application**: Bidding and application system
  - Connects truck owners with available shipments
  - Manages the bidding process and assignment workflow

- **Document**: Document management
  - Handles file upload and verification
  - Supports various document types for different entities

### Using Schemas in the Documentation

You can reference the schemas in your endpoint documentation using:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shipment'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Shipment'
 */
```

### Schema Validation

The documented schemas match the Mongoose models used in the application, providing consistent validation between the API documentation and actual implementation 