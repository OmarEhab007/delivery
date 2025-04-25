# Quick Start Guide

This guide provides steps to quickly set up and start working on the Delivery App.

## Setting Up the Development Environment

### Option 1: Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file and set appropriate values for your environment.

3. **Start MongoDB**
   Ensure MongoDB is running locally, or update `.env` to point to your MongoDB instance.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The server will start on port 3000 (or the port specified in your `.env` file).

### Option 2: Using Docker

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file as needed.

2. **Build and start containers**
   ```bash
   docker-compose up -d
   ```
   This will start the Node.js application and MongoDB in containers.

3. **View logs**
   ```bash
   docker-compose logs -f app
   ```

## Testing the API

After starting the server, you can test the API using tools like Postman or curl.

### Example API Requests

**Register a Merchant**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register/merchant \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","phone":"1234567890","role":"Merchant"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Development Workflow

1. Check the `TASKS.md` file for the next task to implement
2. Create the necessary files and implement the feature
3. Test your implementation
4. Update the task status in `TASKS.md`
5. Commit your changes with descriptive commit messages

## Project Structure Overview

- `src/models/` - Database schemas and models
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/routes/` - API route definitions
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions
- `src/config/` - Configuration files
- `tests/` - Automated tests

## API Structure

The API follows RESTful principles with the following structure:

- **Base URL**: `/api/v1`
- **Authentication**: 
  - `/api/v1/auth/register/merchant` - Register as Merchant
  - `/api/v1/auth/register/truckOwner` - Register as Truck Owner
  - `/api/v1/auth/login` - Login (all user types)
  - `/api/v1/auth/me` - Get current user profile

- **Users**: 
  - `/api/v1/users` - User management (to be implemented)

- **Trucks**: 
  - `/api/v1/trucks` - Truck management (to be implemented)

- **Drivers**: 
  - `/api/v1/drivers` - Driver management (to be implemented)

- **Shipments**: 
  - `/api/v1/shipments` - Shipment management (to be implemented)

- **Applications**: 
  - `/api/v1/applications` - Application management (to be implemented)

- **Documents**: 
  - `/api/v1/documents` - Document management (to be implemented)

## Main User Flows

### Merchant Flow:
1. Register as Merchant
2. Create shipment request
3. Review applications from Truck Owners
4. Approve a Truck Owner's application
5. Upload payment receipt
6. Track shipment progress
7. Confirm delivery

### Truck Owner Flow:
1. Register as Truck Owner
2. Register trucks and drivers
3. Browse available shipment requests
4. Apply to shipments
5. Receive approval/rejection notifications
6. Coordinate with driver

### Driver Flow:
1. Login with credentials provided by Truck Owner
2. View assigned shipments
3. Update shipment status at various stages
4. Upload required documents
5. Provide real-time location updates

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env` file
   - Ensure network connectivity

2. **Authentication Errors**
   - Check if JWT_SECRET is properly set in `.env`
   - Verify token expiration time
   - Ensure you're using the correct token format in requests

3. **Docker Issues**
   - Ensure Docker and Docker Compose are installed
   - Check if ports are available (not in use by other services)
   - Verify Docker service is running

For additional assistance, refer to the documentation or reach out to the project maintainers.
