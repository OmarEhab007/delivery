# How to Import and Use the Delivery App Postman Collection

This guide provides instructions for importing and using the Delivery App Postman collection to test the API endpoints.

## Importing the Collection

1. **Open Postman**
   - Launch the Postman application on your system.

2. **Import the Collection**
   - Click on the "Import" button in the top left corner
   - Select the `delivery-app-postman-collection-new.json` file
   - Click "Import"

3. **Set Up Environment (Optional but Recommended)**
   - Click on the gear icon (⚙️) in the top right corner
   - Click "Add" to create a new environment
   - Name it "Delivery App Environment"
   - Add a variable called `baseUrl` with the value `http://localhost:3000/api` (or your server URL)
   - Click "Save"
   - Select your new environment from the dropdown in the top right corner

## Authentication Flow

Most API endpoints require authentication. Follow these steps to set up authentication:

1. **Register Users** (if not already registered)
   - Use the "Register Merchant" request to create a merchant user
   - Use the "Register Truck Owner" request to create a truck owner
   - The truck owner can then register drivers using "Register Driver"

2. **Login and Get Tokens**
   - Use the "Login - Admin", "Login - Merchant", "Login - Truck Owner", or "Login - Driver" requests to get authentication tokens
   - These requests have test scripts that automatically save the tokens as variables

3. **Access Protected Endpoints**
   - After login, you can access protected endpoints that require the respective token
   - The tokens are automatically included in the request headers

## Testing the Complete Workflow

Follow this sequence to test the complete delivery workflow:

1. **Login as Merchant** → Create a shipment
2. **Login as Truck Owner** → Register a truck → Register a driver
3. **Login as Truck Owner** → View available shipments → Submit an application
4. **Login as Merchant** → View applications → Accept an application
5. **Login as Driver** → View assigned shipments → Start delivery
6. **Login as Driver** → Update shipment status → Complete delivery
7. **Login as Merchant** → View completed shipment

## Variables Used

The collection uses these variables which are automatically set during testing:

- `baseUrl` - Base URL for the API
- `adminToken`, `merchantToken`, `truckOwnerToken`, `driverToken` - Authentication tokens
- `shipmentId`, `truckId`, `applicationId`, `documentId`, etc. - IDs for resources

## File Upload Testing

For endpoints that require file uploads:

1. Edit the request to update the file path
2. Replace `/path/to/document.pdf` with the actual path to your test file
3. For multiple file uploads, select multiple files

## Troubleshooting

- **401 Unauthorized**: Your token may have expired. Log in again to get a new token.
- **403 Forbidden**: You don't have permission for this action. Make sure you're using the correct user role.
- **404 Not Found**: Check that you're using valid resource IDs.
- **422 Validation Error**: Check the response for details on what validation failed.

## Extending the Collection

To add new requests:

1. Right-click on the appropriate folder and select "Add Request"
2. Configure the request with the appropriate method, URL, headers, and body
3. Add test scripts if needed to capture response data

Happy testing! 