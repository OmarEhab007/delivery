# Delivery App - Postman Collection & API Workflow Guide

This guide explains how to use the updated Postman collection to test all APIs in the Delivery App system, along with detailed user stories and workflows.

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Key User Workflows](#key-user-workflows)
3. [API Organization](#api-organization)
4. [Testing Sequence](#testing-sequence)
5. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

## Setup Instructions

### Prerequisites
- [Postman](https://www.postman.com/downloads/) installed
- Delivery App server running (local or remote)

### Import the Collection
1. Open Postman
2. Click "Import" button
3. Select the `delivery-app-postman-collection.json` file
4. The collection will be imported with all requests and variables

### Set Environment Variables
1. Create a new environment or use the default
2. Set the `baseUrl` variable to your server URL (default: `http://localhost:3000/api`)
3. Other variables will be automatically set during testing

## Key User Workflows

The collection is organized around key user workflows. Here's how different users interact with the system:

### Merchant Workflow
1. **Register/Login**: Create an account or log in
2. **Create Shipment**: Submit shipment details
3. **Review Applications**: View and manage applications from truck owners
4. **Track Shipment**: Monitor shipment status during delivery
5. **View History**: Access completed shipment records

### Truck Owner Workflow
1. **Register/Login**: Create an account or log in
2. **Manage Fleet**: Register and manage trucks
3. **Manage Drivers**: Register and manage drivers
4. **Browse Shipments**: View available shipments
5. **Submit Applications**: Apply to transport shipments
6. **Track Operations**: Monitor active shipments and driver activities

### Driver Workflow
1. **Login**: Access driver account (created by truck owner)
2. **Update Status**: Set availability and current status
3. **Manage Deliveries**: Start, update, and complete assigned deliveries
4. **Report Issues**: Document problems during delivery
5. **Upload Proofs**: Provide delivery confirmation

### Admin Workflow
1. **Login**: Access admin account
2. **Monitor System**: View dashboard statistics
3. **Manage Users**: Verify and manage all user accounts
4. **Oversee Operations**: Track all shipments and applications
5. **Verify Documents**: Review and approve submitted documents

## API Organization

The collection is organized into the following categories:

### 1. Authentication
- User registration (all roles)
- Login/logout
- Password management

### 2. Admin Operations
- Dashboard statistics
- User management
- System-wide shipment monitoring
- Verification workflows

### 3. Merchant Operations
- Shipment creation and management
- Application review and selection
- Shipment tracking

### 4. Truck Owner Operations
- Fleet management
- Driver management
- Application submission
- Shipment tracking

### 5. Driver Operations
- Shipment delivery management
- Status updates
- Location tracking
- Issue reporting

### 6. Document Management
- Document upload and management
- Verification workflows

## Testing Sequence

For proper testing, follow this sequence:

### Initial Setup
1. Create admin account (or use default)
2. Create merchant account
3. Create truck owner account
4. Create driver account (as truck owner)

### Basic Workflow Test
1. Merchant creates shipment
2. Truck owner views available shipments
3. Truck owner submits application
4. Merchant accepts application
5. Driver starts delivery
6. Driver updates shipment status
7. Driver completes delivery
8. All parties view completed shipment

### Document Verification Test
1. User uploads document
2. Admin verifies document
3. Document is linked to relevant entity

## Common Issues & Troubleshooting

### Authentication Problems
- **Issue**: 401 Unauthorized errors
- **Solution**: Ensure you're logged in and the token is valid

### Missing Resources
- **Issue**: 404 Not Found errors
- **Solution**: Check that you're using valid IDs for resources

### Validation Errors
- **Issue**: 422 Validation Error
- **Solution**: Ensure request data meets all requirements

### Permission Denied
- **Issue**: 403 Forbidden errors
- **Solution**: Verify you're using the correct user role for the action

## Detailed API Reference

For a complete API reference, refer to:
1. `delivery-app-postman-collection-guide.md` - Detailed API documentation
2. `delivery-app-user-stories-api-workflow.md` - User stories and workflow sequences

## Collection Structure

The Postman collection includes:

- **Environment Variables**
  - `baseUrl` - API base URL
  - User tokens: `adminToken`, `merchantToken`, `truckOwnerToken`, `driverToken`
  - Resource IDs: `shipmentId`, `truckId`, `applicationId`, etc.

- **Request Categories**
  - Authentication
  - Admin Operations
  - Merchant Operations
  - Truck Owner Operations 
  - Driver Operations
  - Document Management

- **Pre-request Scripts**
  - Token management
  - Variable setting

- **Tests**
  - Response validation
  - Variable extraction

## End-to-End Testing Example

Here's a complete flow for testing the shipment process:

1. Login as merchant
   - `POST {{baseUrl}}/auth/login` (merchant credentials)
   - Automatically sets `merchantToken`

2. Create shipment
   - `POST {{baseUrl}}/shipments`
   - Saves `shipmentId` from response

3. Login as truck owner
   - `POST {{baseUrl}}/auth/login` (truck owner credentials)
   - Automatically sets `truckOwnerToken`

4. View available shipments
   - `GET {{baseUrl}}/truck-owner/shipments/available`

5. Submit application
   - `POST {{baseUrl}}/applications`
   - Uses saved `shipmentId`
   - Saves `applicationId` from response

6. Login as merchant again
   - `POST {{baseUrl}}/auth/login` (merchant credentials)

7. View applications
   - `GET {{baseUrl}}/shipments/:shipmentId/applications`
   - Uses saved `shipmentId`

8. Accept application
   - `PATCH {{baseUrl}}/applications/:id/accept`
   - Uses saved `applicationId`

9. Login as driver
   - `POST {{baseUrl}}/auth/login` (driver credentials)
   - Automatically sets `driverToken`

10. View assigned shipments
    - `GET {{baseUrl}}/driver/shipments/assigned`

11. Start delivery
    - `POST {{baseUrl}}/driver/shipments/:shipmentId/start`
    - Uses saved `shipmentId`

12. Update status during transit
    - `PATCH {{baseUrl}}/driver/shipments/:shipmentId/status`
    - Uses saved `shipmentId`
    - Set status to `IN_TRANSIT`

13. Complete delivery
    - `POST {{baseUrl}}/driver/shipments/:shipmentId/complete`
    - Uses saved `shipmentId`

14. Login as merchant again
    - `POST {{baseUrl}}/auth/login` (merchant credentials)

15. Verify shipment completion
    - `GET {{baseUrl}}/shipments/:id`
    - Uses saved `shipmentId`
    - Verify status is `COMPLETED` 