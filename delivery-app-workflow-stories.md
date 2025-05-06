# Delivery App - User Workflow Stories

This document provides detailed user stories and workflows for all user roles in the Delivery App, demonstrating the complete lifecycle of shipments and related operations.

## 1. System Overview

The Delivery App connects merchants who need to ship goods with truck owners who provide transportation services. The platform manages the entire lifecycle of shipments, from request to delivery completion, including driver management, document verification, and real-time tracking.

### User Roles

1. **Admin**: System administrators who oversee the platform
2. **Merchant**: Businesses that need to ship goods
3. **Truck Owner**: Companies/individuals who own trucks
4. **Driver**: Individuals who drive trucks and deliver shipments

## 2. New User Registration & Onboarding

### 2.1 Merchant Registration

**Story**: As a new merchant, I want to register on the platform so I can create shipment requests and find transportation providers.

**Workflow**:
1. Merchant visits the registration page
2. Merchant submits registration form with basic details:
   - Name, Email, Password, Phone
   - Role: "Merchant"
3. System creates merchant account
4. Merchant receives confirmation email
5. Merchant logs in to access the dashboard

**API Flow**:
```
POST /api/auth/register/merchant
POST /api/auth/login
GET /api/auth/me
```

### 2.2 Truck Owner Registration

**Story**: As a transportation provider, I want to register my company on the platform so I can find shipping contracts for my fleet.

**Workflow**:
1. Truck owner visits the registration page
2. Truck owner submits registration form with:
   - Name, Email, Password, Phone
   - Role: "TruckOwner"
   - Company Name, Company Address
3. System creates truck owner account
4. Truck owner receives confirmation email
5. Truck owner logs in to access the dashboard

**API Flow**:
```
POST /api/auth/register/truckOwner
POST /api/auth/login
GET /api/auth/me
```

### 2.3 Truck Owner Onboarding

**Story**: As a new truck owner, I want to register my trucks and drivers so I can start accepting shipping contracts.

**Workflow**:
1. Truck owner logs in to dashboard
2. Truck owner registers trucks:
   - Plate Number, Model, Year, Capacity
   - Uploads insurance and registration documents
3. Truck owner registers drivers:
   - Driver details (Name, Email, Phone, License Number)
   - System creates driver accounts
   - Drivers receive login credentials
4. Admin verifies truck and driver documents
5. Truck owner receives verification confirmation

**API Flow**:
```
POST /api/trucks (for each truck)
POST /api/documents/upload (for truck documents)
POST /api/auth/register/driver (for each driver)
```

## 3. Shipment Lifecycle

### 3.1 Shipment Creation

**Story**: As a merchant, I want to create a shipment request with all necessary details so truck owners can bid on it.

**Workflow**:
1. Merchant logs in to dashboard
2. Merchant creates new shipment request with:
   - Origin and destination addresses
   - Cargo details (description, weight, volume)
   - Special instructions
   - Hazardous cargo flag (if applicable)
3. System creates shipment with status "REQUESTED"
4. System notifies eligible truck owners about new shipment
5. Merchant can view the created shipment in their dashboard

**API Flow**:
```
POST /api/shipments
GET /api/shipments
```

### 3.2 Application Submission

**Story**: As a truck owner, I want to browse available shipments and submit applications for suitable jobs.

**Workflow**:
1. Truck owner logs in to dashboard
2. Truck owner views available shipments
3. Truck owner selects a shipment and submits application:
   - Selects truck and driver for the job
   - Provides bid price and additional notes
   - Attaches any required documents
4. System creates application with status "PENDING"
5. Merchant receives notification about new application
6. Truck owner can view application status in dashboard

**API Flow**:
```
GET /api/truck-owner/shipments/available
POST /api/applications
GET /api/applications/my
```

### 3.3 Application Review & Selection

**Story**: As a merchant, I want to review applications for my shipment and select the best option.

**Workflow**:
1. Merchant logs in to dashboard
2. Merchant views applications for a specific shipment
3. Merchant reviews each application:
   - Bid price
   - Truck details
   - Driver information
   - Truck owner ratings
4. Merchant selects preferred application and accepts it
5. System updates application status to "ACCEPTED"
6. System automatically rejects other applications
7. Truck owner and driver receive notification about application acceptance

**API Flow**:
```
GET /api/shipments/:shipmentId/applications
PATCH /api/applications/:id/accept
```

### 3.4 Shipment Preparation

**Story**: As a truck owner, I want to prepare for an accepted shipment by assigning a driver and truck.

**Workflow**:
1. Truck owner receives notification about accepted application
2. Truck owner confirms truck and driver assignment
3. Truck owner provides any additional required documents
4. System updates shipment status to "CONFIRMED"
5. Driver receives notification about new assignment
6. Merchant can view confirmed shipment details

**API Flow**:
```
GET /api/applications/my
POST /api/documents/upload (if additional documents needed)
```

### 3.5 Shipment Pickup & Delivery

**Story**: As a driver, I want to manage the shipment delivery process efficiently and provide updates to all parties.

**Workflow**:
1. Driver logs in to mobile app
2. Driver views assigned shipment details
3. Driver starts the delivery process:
   - Records odometer reading
   - Updates status to "LOADING"
4. Driver loads cargo and updates status to "IN_TRANSIT"
5. Driver periodically updates location during transit
6. Driver arrives at destination and updates status to "UNLOADING"
7. Driver completes delivery:
   - Records final odometer reading
   - Obtains recipient signature or proof of delivery
   - Updates status to "DELIVERED"
8. System updates shipment status to "COMPLETED"
9. Merchant and truck owner receive delivery confirmation

**API Flow**:
```
GET /api/driver/shipments/assigned
POST /api/driver/shipments/:shipmentId/start
PATCH /api/driver/shipments/:shipmentId/status (multiple updates)
PATCH /api/driver/location (periodic updates)
POST /api/driver/shipments/:shipmentId/proof (upload delivery proof)
POST /api/driver/shipments/:shipmentId/complete
```

### 3.6 Issue Handling

**Story**: As a driver, I want to report issues during delivery so they can be addressed promptly.

**Workflow**:
1. Driver encounters issue during delivery
2. Driver reports issue through mobile app:
   - Issue type and description
   - Current location
   - Photos if applicable
3. System notifies truck owner and merchant about issue
4. Truck owner or merchant provides instructions
5. Driver resolves issue and continues delivery
6. Issue is logged in shipment timeline

**API Flow**:
```
POST /api/driver/shipments/:shipmentId/issues
POST /api/shipments/:id/timeline (for issue resolution updates)
```

## 4. Driver Management

### 4.1 Driver Daily Operations

**Story**: As a driver, I want to manage my daily check-ins and status updates to maintain accurate records.

**Workflow**:
1. Driver starts work day and performs check-in:
   - Records current location
   - Reports truck condition
   - Records fuel level
2. Driver updates status throughout day:
   - Available/Unavailable
   - Active/Off Duty/On Break
3. Driver completes deliveries as assigned
4. Driver performs check-out at end of day:
   - Records final location
   - Reports total miles driven
   - Updates fuel level

**API Flow**:
```
POST /api/driver/checkin
PATCH /api/driver/status (multiple updates)
PATCH /api/driver/availability (as needed)
POST /api/driver/checkout
```

### 4.2 Truck Owner Fleet Monitoring

**Story**: As a truck owner, I want to monitor my fleet and drivers to ensure efficient operations.

**Workflow**:
1. Truck owner logs in to dashboard
2. Truck owner views fleet status:
   - Active trucks and current assignments
   - Driver availability and current locations
   - Maintenance schedules
3. Truck owner views active shipments:
   - In-progress deliveries
   - Timeline updates
   - Any reported issues
4. Truck owner manages truck maintenance:
   - Schedules maintenance based on odometer readings
   - Updates truck status during maintenance

**API Flow**:
```
GET /api/trucks
GET /api/truck-owner/drivers
GET /api/applications/my (with status filter)
PATCH /api/trucks/:id (for maintenance updates)
```

## 5. Administrative Operations

### 5.1 User Verification

**Story**: As an admin, I want to verify users and their documents to ensure platform integrity.

**Workflow**:
1. Admin logs in to dashboard
2. Admin reviews pending verifications:
   - New truck owner registrations
   - Driver license documents
   - Truck registration and insurance documents
3. Admin verifies documents and approves or rejects:
   - Checks document authenticity
   - Verifies information accuracy
4. Users receive notification about verification status
5. Verified users/trucks become fully operational

**API Flow**:
```
GET /api/admin/users (with filters)
GET /api/documents/:id
PATCH /api/admin/documents/:id/verify
PATCH /api/admin/trucks/:id/verify
PATCH /api/admin/drivers/:id/verify
```

### 5.2 System Monitoring

**Story**: As an admin, I want to monitor system operations and resolve issues as they arise.

**Workflow**:
1. Admin reviews dashboard statistics:
   - Total users by role
   - Active shipments by status
   - Recent registrations and verifications
2. Admin handles reported issues:
   - Customer support requests
   - Disputed deliveries
   - System anomalies
3. Admin generates reports for business intelligence

**API Flow**:
```
GET /api/admin/dashboard
GET /api/admin/shipments (with filters)
```

## 6. Document Management

### 6.1 Document Lifecycle

**Story**: As a user, I want to manage required documents for my account, trucks, and shipments.

**Workflow**:
1. User identifies required documents:
   - Driver: License, identification
   - Truck: Registration, insurance, inspection
   - Shipment: Bills of lading, customs forms
2. User uploads documents:
   - Selects document type
   - Uploads file
   - Provides metadata (expiry date, etc.)
3. Admin verifies uploaded documents
4. User receives verification confirmation
5. User updates documents when needed (renewal)

**API Flow**:
```
POST /api/documents/upload
GET /api/documents/entity/:entityType/:entityId
PATCH /api/documents/:id (for updates)
DELETE /api/documents/:id (if needed)
```

## 7. Complete End-to-End Shipment Process

Below is a comprehensive walkthrough of the complete shipment lifecycle, from creation to completion, showing all user interactions and API calls:

### Phase 1: Shipment Creation & Application

1. **Merchant creates shipment**
   - `POST /api/auth/login` (merchant credentials)
   - `POST /api/shipments` (shipment details)

2. **Truck Owner browses and applies**
   - `POST /api/auth/login` (truck owner credentials)
   - `GET /api/truck-owner/shipments/available`
   - `POST /api/applications` (includes truck, driver, bid price)

3. **Merchant reviews and accepts**
   - `POST /api/auth/login` (merchant credentials)
   - `GET /api/shipments/:shipmentId/applications`
   - `PATCH /api/applications/:id/accept`

### Phase 2: Preparation & Execution

4. **Driver preparation**
   - `POST /api/auth/login` (driver credentials)
   - `GET /api/driver/shipments/assigned`
   - `POST /api/driver/checkin` (start of day)

5. **Shipment execution**
   - `POST /api/driver/shipments/:shipmentId/start`
   - `PATCH /api/driver/shipments/:shipmentId/status` (to "LOADING")
   - `PATCH /api/driver/location` (periodic updates)
   - `PATCH /api/driver/shipments/:shipmentId/status` (to "IN_TRANSIT")

### Phase 3: Delivery & Completion

6. **Delivery completion**
   - `PATCH /api/driver/shipments/:shipmentId/status` (to "UNLOADING")
   - `POST /api/driver/shipments/:shipmentId/proof` (delivery confirmation)
   - `POST /api/driver/shipments/:shipmentId/complete`
   - `POST /api/driver/checkout` (end of day)

7. **Review & verification**
   - `POST /api/auth/login` (merchant credentials)
   - `GET /api/shipments/:id` (verify completion)
   - `POST /api/auth/login` (truck owner credentials)
   - `GET /api/applications/my` (with status filter for completed)

This comprehensive process demonstrates how all user roles interact with the system and with each other through the API to facilitate the entire shipment lifecycle. 