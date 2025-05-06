# Delivery App - User Stories & API Workflow

This document outlines the user stories and API workflows for the Delivery App, detailing how various user types interact with the system.

## User Types

1. **Admin** - System administrators with full access to manage the platform
2. **Merchant** - Businesses that need to ship goods
3. **Truck Owner** - Companies/individuals who own trucks and provide transportation services
4. **Driver** - Individuals who drive the trucks and deliver shipments

## User Stories & API Workflows

### 1. Authentication Workflows

#### 1.1 User Registration

**User Story:** As a new user, I want to register on the platform so I can use the delivery services or provide my transportation services.

**API Workflow:**
1. Merchant registration: `POST /api/auth/register/merchant`
2. Truck Owner registration: `POST /api/auth/register/truckOwner`
3. Admin registration (by existing admin): `POST /api/auth/register/admin`
4. Driver registration (by Truck Owner): `POST /api/auth/register/driver`

#### 1.2 User Login

**User Story:** As a registered user, I want to log in to access my account and use the platform's features.

**API Workflow:**
1. Login: `POST /api/auth/login`
2. Get current user profile: `GET /api/auth/me`

#### 1.3 Password Management

**User Story:** As a user, I want to recover or change my password when needed.

**API Workflow:**
1. Forgot password: `POST /api/auth/forgotPassword`
2. Reset password: `PATCH /api/auth/resetPassword/:token`
3. Update password (logged in): `PATCH /api/auth/updatePassword`

### 2. Admin Workflows

#### 2.1 Dashboard & System Management

**User Story:** As an admin, I want to view system statistics and manage the platform effectively.

**API Workflow:**
1. Get dashboard statistics: `GET /api/admin/dashboard`
2. Get all users: `GET /api/admin/users`
3. Update user status: `PATCH /api/admin/users/:userId/status`
4. Delete user: `DELETE /api/admin/users/:userId`

#### 2.2 Shipment Management

**User Story:** As an admin, I want to monitor and manage all shipments in the system.

**API Workflow:**
1. Get all shipments: `GET /api/admin/shipments`
2. View shipment details: `GET /api/admin/shipments/:id`
3. Update shipment status: `PATCH /api/admin/shipments/:id/status`

#### 2.3 Verification Workflows

**User Story:** As an admin, I want to verify trucks, drivers, and documents to ensure compliance and safety.

**API Workflow:**
1. Verify truck: `PATCH /api/admin/trucks/:id/verify`
2. Verify driver: `PATCH /api/admin/drivers/:id/verify`
3. Verify document: `PATCH /api/admin/documents/:id/verify`

### 3. Merchant Workflows

#### 3.1 Creating Shipments

**User Story:** As a merchant, I want to create a new shipment request to transport my goods.

**API Workflow:**
1. Create shipment: `POST /api/shipments`
2. View my shipments: `GET /api/shipments`
3. Search shipments: `GET /api/shipments/search`

#### 3.2 Managing Shipment Applications

**User Story:** As a merchant, I want to review and manage applications from truck owners who want to transport my shipment.

**API Workflow:**
1. View applications for a shipment: `GET /api/shipments/:shipmentId/applications`
2. Accept an application: `PATCH /api/applications/:id/accept`
3. Reject an application: `PATCH /api/applications/:id/reject`

#### 3.3 Tracking Shipments

**User Story:** As a merchant, I want to track my shipments and see their current status.

**API Workflow:**
1. Get shipment details and timeline: `GET /api/shipments/:id`
2. Get shipment location (if implemented): `GET /api/shipments/:id/location`

### 4. Truck Owner Workflows

#### 4.1 Fleet Management

**User Story:** As a truck owner, I want to manage my fleet of trucks.

**API Workflow:**
1. Register a new truck: `POST /api/trucks`
2. View my trucks: `GET /api/trucks`
3. Update truck details: `PATCH /api/trucks/:id`
4. Delete a truck: `DELETE /api/trucks/:id`

#### 4.2 Driver Management

**User Story:** As a truck owner, I want to manage my drivers.

**API Workflow:**
1. Register a new driver: `POST /api/auth/register/driver`
2. View my drivers: `GET /api/truck-owner/drivers`
3. Update driver details: `PATCH /api/truck-owner/drivers/:id`

#### 4.3 Application Submission

**User Story:** As a truck owner, I want to apply for shipments that match my truck capabilities.

**API Workflow:**
1. View available shipments: `GET /api/truck-owner/shipments/available`
2. Submit application for a shipment: `POST /api/applications`
3. View my applications: `GET /api/applications/my`
4. Cancel an application: `PATCH /api/applications/:id/cancel`

#### 4.4 Document Management

**User Story:** As a truck owner, I want to upload and manage documents required for compliance.

**API Workflow:**
1. Upload document: `POST /api/documents/upload`
2. View my documents: `GET /api/documents`
3. Update document: `PATCH /api/documents/:id`
4. Delete document: `DELETE /api/documents/:id`

### 5. Driver Workflows

#### 5.1 Managing Shipment Delivery

**User Story:** As a driver, I want to manage the shipments assigned to me.

**API Workflow:**
1. View assigned shipments: `GET /api/driver/shipments/assigned`
2. Start delivery: `POST /api/driver/shipments/:shipmentId/start`
3. Update shipment status: `PATCH /api/driver/shipments/:shipmentId/status`
4. Complete delivery: `POST /api/driver/shipments/:shipmentId/complete`

#### 5.2 Status and Check-in

**User Story:** As a driver, I want to update my status and perform daily check-ins/outs.

**API Workflow:**
1. Update availability: `PATCH /api/driver/availability`
2. Update status: `PATCH /api/driver/status`
3. Driver check-in: `POST /api/driver/checkin`
4. Driver check-out: `POST /api/driver/checkout`

#### 5.3 Location Updates

**User Story:** As a driver, I want to update my location for real-time tracking.

**API Workflow:**
1. Update location: `PATCH /api/driver/location` or `POST /api/driver/location`

#### 5.4 Issue Reporting

**User Story:** As a driver, I want to report issues during delivery.

**API Workflow:**
1. Report issue: `POST /api/driver/shipments/:shipmentId/issues`
2. Upload proof of delivery: `POST /api/driver/shipments/:shipmentId/proof`

## Complete API Workflow for a Shipment

### From Creation to Delivery

1. **Merchant creates a shipment**
   - `POST /api/shipments`

2. **Truck Owners browse available shipments**
   - `GET /api/truck-owner/shipments/available`

3. **Truck Owner submits an application**
   - `POST /api/applications`

4. **Merchant views applications for the shipment**
   - `GET /api/shipments/:shipmentId/applications`

5. **Merchant accepts an application**
   - `PATCH /api/applications/:id/accept`

6. **Driver is assigned to the shipment**
   - Assignment is handled by the system

7. **Driver starts the delivery**
   - `POST /api/driver/shipments/:shipmentId/start`

8. **Driver updates shipment status during transit**
   - `PATCH /api/driver/shipments/:shipmentId/status`

9. **Driver completes the delivery**
   - `POST /api/driver/shipments/:shipmentId/complete`

10. **Merchant confirms delivery completion**
    - (This step may be automatic or through a separate endpoint)

11. **All parties can view the completed shipment**
    - `GET /api/shipments/:id`

## Document Verification Workflow

1. **User uploads a document**
   - `POST /api/documents/upload`

2. **Admin reviews and verifies the document**
   - `PATCH /api/admin/documents/:id/verify`

3. **Document is linked to an entity (Truck, User, Application)**
   - This is handled automatically by the system

## Real-time Tracking Workflow (if implemented)

1. **Driver updates location**
   - `PATCH /api/driver/location` or `POST /api/driver/location`

2. **Socket.io broadcasts location update to relevant clients**
   - Frontend listens for location updates through Socket.io connection

3. **Merchant views real-time shipment location**
   - Frontend displays the location on a map

## Error Handling and Validation

All APIs implement proper error handling and validation:

1. Input validation using express-validator
2. Authentication checks using JWT
3. Role-based access control
4. Appropriate HTTP status codes for different scenarios
5. Meaningful error messages for better debugging

## Next Steps for Implementation

1. **Notification System**
   - Implement Twilio integration for SMS and WhatsApp notifications
   - Create notification preferences for users

2. **Real-time Tracking**
   - Implement Socket.io for real-time updates
   - Create geofencing capabilities for route monitoring

3. **Payment Integration**
   - Add payment processing for shipments
   - Implement invoicing and receipt generation 