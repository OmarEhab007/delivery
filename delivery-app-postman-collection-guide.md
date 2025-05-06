# Delivery App - Postman Collection Guide

This guide provides instructions on how to use the Delivery App Postman collection to test and interact with the API.

## Setup and Configuration

### Environment Variables

The collection uses the following variables:

- `baseUrl`: The base URL of the API (default: `http://localhost:3000/api`)
- `adminToken`: JWT token for admin authentication
- `merchantToken`: JWT token for merchant authentication
- `truckOwnerToken`: JWT token for truck owner authentication
- `driverToken`: JWT token for driver authentication
- Various IDs: `shipmentId`, `truckId`, `applicationId`, etc.

### Authentication

Most API endpoints require authentication. The collection includes pre-request scripts that automatically set tokens after login. Use the login endpoints first to set the required tokens.

## API Categories

### 1. Authentication APIs

#### Register Users
- **Register Admin** (Admin only): `POST {{baseUrl}}/auth/register/admin`
- **Register Merchant**: `POST {{baseUrl}}/auth/register/merchant`
- **Register Truck Owner**: `POST {{baseUrl}}/auth/register/truckOwner`
- **Register Driver** (Truck Owner only): `POST {{baseUrl}}/auth/register/driver`

#### Login & Authentication
- **Login**: `POST {{baseUrl}}/auth/login`
- **Get Current User**: `GET {{baseUrl}}/auth/me`
- **Forgot Password**: `POST {{baseUrl}}/auth/forgotPassword`
- **Reset Password**: `PATCH {{baseUrl}}/auth/resetPassword/:token`
- **Update Password**: `PATCH {{baseUrl}}/auth/updatePassword`

### 2. Admin APIs

#### Dashboard & Users
- **Get Dashboard Stats**: `GET {{baseUrl}}/admin/dashboard`
- **Get All Users**: `GET {{baseUrl}}/admin/users`
- **Get User by ID**: `GET {{baseUrl}}/admin/users/:id`
- **Update User Status**: `PATCH {{baseUrl}}/admin/users/:id/status`
- **Delete User**: `DELETE {{baseUrl}}/admin/users/:id`

#### Shipment Management
- **Get All Shipments**: `GET {{baseUrl}}/admin/shipments`
- **Get Shipment Details**: `GET {{baseUrl}}/admin/shipments/:id`
- **Update Shipment Status**: `PATCH {{baseUrl}}/admin/shipments/:id/status`

#### Verification
- **Verify Truck**: `PATCH {{baseUrl}}/admin/trucks/:id/verify`
- **Verify Driver**: `PATCH {{baseUrl}}/admin/drivers/:id/verify`
- **Verify Document**: `PATCH {{baseUrl}}/admin/documents/:id/verify`

### 3. Shipment APIs

#### Shipment CRUD
- **Create Shipment** (Merchant only): `POST {{baseUrl}}/shipments`
- **Get My Shipments** (Merchant only): `GET {{baseUrl}}/shipments`
- **Search Shipments**: `GET {{baseUrl}}/shipments/search`
- **Get Shipment by ID**: `GET {{baseUrl}}/shipments/:id`
- **Update Shipment**: `PATCH {{baseUrl}}/shipments/:id`
- **Cancel Shipment**: `PATCH {{baseUrl}}/shipments/:id/cancel`

#### Shipment Timeline
- **Add Timeline Entry**: `POST {{baseUrl}}/shipments/:id/timeline`

### 4. Application/Bid APIs

#### Applications
- **Submit Application** (Truck Owner only): `POST {{baseUrl}}/applications`
- **Get My Applications**: `GET {{baseUrl}}/applications/my`
- **Get Application by ID**: `GET {{baseUrl}}/applications/:id`
- **Accept Application** (Merchant only): `PATCH {{baseUrl}}/applications/:id/accept`
- **Reject Application** (Merchant only): `PATCH {{baseUrl}}/applications/:id/reject`
- **Cancel Application** (Truck Owner only): `PATCH {{baseUrl}}/applications/:id/cancel`
- **Get Shipment Applications**: `GET {{baseUrl}}/shipments/:shipmentId/applications`

### 5. Truck Owner APIs

#### Truck Management
- **Register Truck**: `POST {{baseUrl}}/trucks`
- **Get My Trucks**: `GET {{baseUrl}}/trucks`
- **Get Truck by ID**: `GET {{baseUrl}}/trucks/:id`
- **Update Truck**: `PATCH {{baseUrl}}/trucks/:id`
- **Delete Truck**: `DELETE {{baseUrl}}/trucks/:id`

#### Driver Management
- **Get My Drivers**: `GET {{baseUrl}}/truck-owner/drivers`
- **Update Driver**: `PATCH {{baseUrl}}/truck-owner/drivers/:id`

#### Available Shipments
- **Get Available Shipments**: `GET {{baseUrl}}/truck-owner/shipments/available`

### 6. Driver APIs

#### Shipment Delivery
- **Get Active Shipments**: `GET {{baseUrl}}/driver/shipments/active`
- **Get Assigned Shipments**: `GET {{baseUrl}}/driver/shipments/assigned`
- **Get Shipment History**: `GET {{baseUrl}}/driver/shipments/history`
- **Start Delivery**: `POST {{baseUrl}}/driver/shipments/:shipmentId/start`
- **Complete Delivery**: `POST {{baseUrl}}/driver/shipments/:shipmentId/complete`
- **Update Shipment Status**: `PATCH {{baseUrl}}/driver/shipments/:shipmentId/status`

#### Driver Status & Location
- **Driver Check-in**: `POST {{baseUrl}}/driver/checkin`
- **Driver Check-out**: `POST {{baseUrl}}/driver/checkout`
- **Update Availability**: `PATCH {{baseUrl}}/driver/availability`
- **Update Driver Status**: `PATCH {{baseUrl}}/driver/status`
- **Update Location**: `PATCH {{baseUrl}}/driver/location` or `POST {{baseUrl}}/driver/location`

#### Issue Reporting
- **Report Issue**: `POST {{baseUrl}}/driver/shipments/:shipmentId/issues`
- **Upload Proof of Delivery**: `POST {{baseUrl}}/driver/shipments/:shipmentId/proof`

### 7. Document APIs

#### Document Management
- **Upload Document**: `POST {{baseUrl}}/documents/upload`
- **Get My Documents**: `GET {{baseUrl}}/documents`
- **Get Document by ID**: `GET {{baseUrl}}/documents/:id`
- **Download Document**: `GET {{baseUrl}}/documents/:id/download`
- **Update Document**: `PATCH {{baseUrl}}/documents/:id`
- **Delete Document**: `DELETE {{baseUrl}}/documents/:id`

## Testing Workflows

### Complete Shipment Workflow

1. **Merchant**: Create a shipment
   - `POST {{baseUrl}}/shipments`
   - Save the returned `shipmentId`

2. **Truck Owner**: View available shipments
   - `GET {{baseUrl}}/truck-owner/shipments/available`

3. **Truck Owner**: Submit an application for the shipment
   - `POST {{baseUrl}}/applications`
   - Use the saved `shipmentId`
   - Save the returned `applicationId`

4. **Merchant**: View applications for the shipment
   - `GET {{baseUrl}}/shipments/:shipmentId/applications`
   - Use the saved `shipmentId`

5. **Merchant**: Accept an application
   - `PATCH {{baseUrl}}/applications/:id/accept`
   - Use the saved `applicationId`

6. **Driver**: View assigned shipments
   - `GET {{baseUrl}}/driver/shipments/assigned`

7. **Driver**: Start delivery
   - `POST {{baseUrl}}/driver/shipments/:shipmentId/start`
   - Use the saved `shipmentId`

8. **Driver**: Update shipment status (multiple times during transit)
   - `PATCH {{baseUrl}}/driver/shipments/:shipmentId/status`
   - Use the saved `shipmentId`
   - Use different statuses: `LOADING`, `IN_TRANSIT`, `UNLOADING`

9. **Driver**: Complete delivery
   - `POST {{baseUrl}}/driver/shipments/:shipmentId/complete`
   - Use the saved `shipmentId`

10. **All parties**: View the completed shipment
    - `GET {{baseUrl}}/shipments/:id`
    - Use the saved `shipmentId`

### Document Verification Workflow

1. **User**: Upload document
   - `POST {{baseUrl}}/documents/upload`
   - Save the returned `documentId`

2. **Admin**: Verify document
   - `PATCH {{baseUrl}}/admin/documents/:id/verify`
   - Use the saved `documentId`

## Tips for Testing

1. **Authentication**: Always start with login requests to set the tokens
2. **Variables**: Use the "Tests" tab in Postman to automatically set variables from responses
3. **File Uploads**: For document uploads, use form-data with file fields
4. **Error Handling**: Check responses for error messages and status codes
5. **Sequence**: Follow the logical sequence of operations as outlined in the workflows

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token is missing or invalid. Re-run the login request.
2. **403 Forbidden**: User doesn't have permission for this action. Check the user role.
3. **404 Not Found**: Resource ID is incorrect or the resource doesn't exist.
4. **422 Validation Error**: Request data is invalid. Check the error messages in the response.

### Server Connection

If you can't connect to the server:
1. Ensure the server is running
2. Check that the `baseUrl` variable is set correctly
3. Verify network connectivity
4. Check for any CORS issues if testing from a browser

## Extending the Collection

To add new requests:
1. Create a new request in the appropriate folder
2. Set the correct method, URL, and headers
3. Add authentication headers if needed
4. Add body parameters if required
5. Add tests to capture response variables if needed 