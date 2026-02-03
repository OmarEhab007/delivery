# Delivery App API Documentation

## Overview

This document provides a comprehensive reference of all API endpoints available in the Delivery App system. The API follows RESTful principles and uses JSON for data interchange.

## Base URL

```
https://api.delivery-app.com/api/v1
```

## Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT). The application implements a secure refresh token rotation system for enhanced security.

### Token Types

The application uses two types of tokens:

1. **Access Token** (Short-lived: 15 minutes)

   - Used for API authentication
   - Included in the `Authorization` header: `Authorization: Bearer <access_token>`

2. **Refresh Token** (Long-lived: 7 days)
   - Used to obtain new access tokens
   - Stored securely on the client
   - Automatically rotated on each refresh for security

### Authentication Flow

1. **Login**: Receive both access and refresh tokens
2. **API Access**: Use access token in Authorization header
3. **Token Refresh**: When access token expires, use refresh token to get new tokens
4. **Refresh Rotation**: Old refresh token is revoked, new one issued (security best practice)
5. **Logout**: Revoke the refresh token

### Getting Tokens

To obtain authentication tokens, use the login endpoint as described in the Auth API section. The response includes both tokens:

```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresIn": "15m",
  "refreshExpiresIn": "7d",
  "data": {
    "user": {
      /* user object */
    }
  }
}
```

## Common Response Formats

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error message",
  "errors": [] // Optional: array of validation errors
}
```

## API Endpoints

### Auth API

#### User Registration

Register different types of users in the system.

##### Admin Registration (Admin only)

- **URL**: `/auth/register/admin`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Request Body**:
  ```json
  {
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "Admin",
    "adminPermissions": ["FULL_ACCESS", "USER_MANAGEMENT"] // Optional
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "Admin Name",
        "email": "admin@example.com",
        "phone": "1234567890",
        "role": "Admin",
        "adminPermissions": ["FULL_ACCESS", "USER_MANAGEMENT"],
        "createdAt": "2023-01-01T00:00:00.000Z"
      },
      "token": "jwt_token"
    }
  }
  ```

##### Merchant Registration

- **URL**: `/auth/register/merchant`
- **Method**: `POST`
- **Auth required**: No
- **Description**: Submit a merchant registration request. The account requires admin approval before login.
- **Request Body**:
  ```json
  {
    "name": "Merchant Name",
    "email": "merchant@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "Merchant"
  }
  ```
- **Success Response**: `202 Accepted`
  ```json
  {
    "status": "success",
    "message": "Registration submitted for admin approval",
    "data": {
      "requestId": "request_id",
      "state": "PENDING"
    }
  }
  ```

##### Truck Owner Registration

- **URL**: `/auth/register/truckOwner`
- **Method**: `POST`
- **Auth required**: No
- **Description**: Submit a truck owner registration request. The account requires admin approval before login.
- **Request Body**:
  ```json
  {
    "name": "Owner Name",
    "email": "owner@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "TruckOwner",
    "companyName": "Trucking Company",
    "companyAddress": "123 Transportation Ave"
  }
  ```
- **Success Response**: `202 Accepted`
  ```json
  {
    "status": "success",
    "message": "Registration submitted for admin approval",
    "data": {
      "requestId": "request_id",
      "state": "PENDING"
    }
  }
  ```

##### Driver Registration (Truck Owner only)

- **URL**: `/auth/register/driver`
- **Method**: `POST`
- **Auth required**: Yes (Truck Owner only)
- **Description**: Submit a driver registration request. The account requires admin approval before login.
- **Request Body**:
  ```json
  {
    "name": "Driver Name",
    "email": "driver@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "Driver",
    "licenseNumber": "DL123456"
  }
  ```
- **Success Response**: `202 Accepted`
  ```json
  {
    "status": "success",
    "message": "Driver registration submitted for admin approval",
    "data": {
      "requestId": "request_id",
      "state": "PENDING"
    }
  }
  ```

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0...",
    "expiresIn": "15m",
    "refreshExpiresIn": "7d",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "role": "Merchant"
      }
    }
  }
  ```

#### Refresh Access Token

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth required**: No (uses refresh token)
- **Description**: Get a new access token using a valid refresh token. The old refresh token is revoked and a new one is issued (token rotation).
- **Request Body**:
  ```json
  {
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0..."
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new_refresh_token...",
    "expiresIn": "15m",
    "refreshExpiresIn": "7d"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Refresh token not provided
  - `401 Unauthorized`: Invalid or expired refresh token
  - `403 Forbidden`: User account is inactive

#### Logout

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth required**: No (but refresh token recommended)
- **Description**: Revoke the refresh token to prevent further use
- **Request Body**:
  ```json
  {
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0..."
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Logged out successfully"
  }
  ```

#### Request OTP Login Code

- **URL**: `/auth/otp/request`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "phone": "+15551234567"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "OTP sent successfully"
  }
  ```

#### Verify OTP and Login

- **URL**: `/auth/otp/verify`
- **Method**: `POST`
- **Auth required**: No
- **Description**: Verify OTP code and authenticate user. Returns both access and refresh tokens.
- **Request Body**:
  ```json
  {
    "phone": "+15551234567",
    "otp": "123456"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0...",
    "expiresIn": "15m",
    "refreshExpiresIn": "7d",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "phone": "+15551234567",
        "role": "Merchant"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid or expired OTP
  - `423 Locked (429)`: Maximum OTP attempts exceeded

#### Get Current User

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth required**: Yes
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "role": "Merchant"
        // Other user fields based on role
      }
    }
  }
  ```

#### Forgot Password

- **URL**: `/auth/forgotPassword`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Password reset token sent to email"
  }
  ```

#### Reset Password

- **URL**: `/auth/resetPassword/:token`
- **Method**: `PATCH`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "password": "newpassword123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
        // Other user fields
      },
      "token": "jwt_token"
    }
  }
  ```

#### Update Password

- **URL**: `/auth/updatePassword`
- **Method**: `PATCH`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "currentPassword": "password123",
    "newPassword": "newpassword123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
        // Other user fields
      },
      "token": "jwt_token"
    }
  }
  ```

### Shipment API

#### Create Shipment

- **URL**: `/shipments`
- **Method**: `POST`
- **Auth required**: Yes (Merchant only)
- **Request Body**:
  ```json
  {
    "origin": {
      "address": "Pickup Address",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.006
      },
      "country": "USA"
    },
    "destination": {
      "address": "Delivery Address",
      "coordinates": {
        "lat": 34.0522,
        "lng": -118.2437
      },
      "country": "USA"
    },
    "cargoDetails": {
      "description": "Electronics",
      "weight": 1000,
      "volume": 10,
      "category": "Electronics",
      "hazardous": false,
      "specialInstructions": "Handle with care"
    },
    "estimatedPickupDate": "2023-01-15T00:00:00.000Z",
    "estimatedDeliveryDate": "2023-01-20T00:00:00.000Z"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "shipment": {
        "_id": "shipment_id",
        "merchantId": "merchant_id",
        "origin": {
          "address": "Pickup Address",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.006
          },
          "country": "USA"
        },
        "destination": {
          "address": "Delivery Address",
          "coordinates": {
            "lat": 34.0522,
            "lng": -118.2437
          },
          "country": "USA"
        },
        "cargoDetails": {
          "description": "Electronics",
          "weight": 1000,
          "volume": 10,
          "category": "Electronics",
          "hazardous": false,
          "specialInstructions": "Handle with care"
        },
        "status": "REQUESTED",
        "estimatedPickupDate": "2023-01-15T00:00:00.000Z",
        "estimatedDeliveryDate": "2023-01-20T00:00:00.000Z",
        "timeline": [
          {
            "status": "REQUESTED",
            "createdAt": "2023-01-01T00:00:00.000Z"
          }
        ],
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    }
  }
  ```

#### Get My Shipments

- **URL**: `/shipments`
- **Method**: `GET`
- **Auth required**: Yes (Merchant only)
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 10,
    "data": {
      "shipments": [
        // Array of shipments
      ]
    }
  }
  ```

#### Search Shipments

- **URL**: `/shipments/search`
- **Method**: `GET`
- **Auth required**: Yes (Merchant only)
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `originCountry` (optional): Filter by origin country
  - `destinationCountry` (optional): Filter by destination country
  - `fromDate` (optional): Filter by created date range start
  - `toDate` (optional): Filter by created date range end
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 10,
    "data": {
      "shipments": [
        // Array of shipments
      ]
    }
  }
  ```

#### Get Shipment Applications

- **URL**: `/shipments/:shipmentId/applications`
- **Method**: `GET`
- **Auth required**: Yes (Merchant only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 5,
    "data": {
      "applications": [
        // Array of applications
      ]
    }
  }
  ```

#### Get Shipment

- **URL**: `/shipments/:id`
- **Method**: `GET`
- **Auth required**: Yes (Merchant, Truck Owner, or assigned Driver)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "shipment": {
        // Shipment details
      }
    }
  }
  ```

#### Update Shipment

- **URL**: `/shipments/:id`
- **Method**: `PATCH`
- **Auth required**: Yes (Merchant only, and only if status is REQUESTED)
- **Request Body**: Any fields to update
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "shipment": {
        // Updated shipment details
      }
    }
  }
  ```

#### Cancel Shipment

- **URL**: `/shipments/:id/cancel`
- **Method**: `PATCH`
- **Auth required**: Yes (Merchant only)
- **Request Body**:
  ```json
  {
    "reason": "Shipment no longer needed" // Optional
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "shipment": {
        // Updated shipment with CANCELLED status
      }
    }
  }
  ```

#### Add Timeline Entry

- **URL**: `/shipments/:id/timeline`
- **Method**: `POST`
- **Auth required**: Yes (Truck Owner or assigned Driver)
- **Request Body**:
  ```json
  {
    "status": "IN_TRANSIT",
    "note": "Shipment has left the warehouse",
    "location": {
      "lat": 40.7128,
      "lng": -74.006,
      "address": "Current Address"
    },
    "documents": [
      {
        "name": "Loading Report",
        "url": "https://example.com/documents/loading-report.pdf",
        "type": "PDF"
      }
    ]
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "shipment": {
        // Updated shipment with new timeline entry
      }
    }
  }
  ```

### Application API

#### Apply for Shipment

- **URL**: `/applications`
- **Method**: `POST`
- **Auth required**: Yes (Truck Owner only)
- **Request Body**:
  ```json
  {
    "shipmentId": "shipment_id",
    "truckId": "truck_id",
    "driverId": "driver_id",
    "bidDetails": {
      "price": 5000,
      "currency": "USD",
      "notes": "Can pick up immediately",
      "validUntil": "2023-01-10T00:00:00.000Z"
    }
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "application": {
        "_id": "application_id",
        "shipmentId": "shipment_id",
        "ownerId": "owner_id",
        "truckId": "truck_id",
        "driverId": "driver_id",
        "status": "PENDING",
        "bidDetails": {
          "price": 5000,
          "currency": "USD",
          "notes": "Can pick up immediately",
          "validUntil": "2023-01-10T00:00:00.000Z"
        },
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    }
  }
  ```

#### Get My Applications

- **URL**: `/applications`
- **Method**: `GET`
- **Auth required**: Yes (Truck Owner only)
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 10,
    "data": {
      "applications": [
        // Array of applications
      ]
    }
  }
  ```

#### Get Application

- **URL**: `/applications/:id`
- **Method**: `GET`
- **Auth required**: Yes (Merchant, Truck Owner)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "application": {
        // Application details
      }
    }
  }
  ```

#### Accept Application

- **URL**: `/applications/:id/accept`
- **Method**: `PATCH`
- **Auth required**: Yes (Merchant only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "application": {
        // Updated application with ACCEPTED status
      },
      "shipment": {
        // Updated shipment with CONFIRMED status
      }
    }
  }
  ```

#### Reject Application

- **URL**: `/applications/:id/reject`
- **Method**: `PATCH`
- **Auth required**: Yes (Merchant only)
- **Request Body**:
  ```json
  {
    "reason": "Price too high" // Optional
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "application": {
        // Updated application with REJECTED status
      }
    }
  }
  ```

#### Cancel Application

- **URL**: `/applications/:id/cancel`
- **Method**: `PATCH`
- **Auth required**: Yes (Truck Owner only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "application": {
        // Updated application with CANCELLED status
      }
    }
  }
  ```

### Truck API

#### Create Truck

- **URL**: `/trucks`
- **Method**: `POST`
- **Auth required**: Yes (Truck Owner only)
- **Request Body**:
  ```json
  {
    "plateNumber": "ABC123",
    "model": "Volvo FH16",
    "capacity": 25,
    "year": 2020,
    "insuranceInfo": {
      "provider": "Insurance Co",
      "policyNumber": "POL123456",
      "expiryDate": "2023-12-31T00:00:00.000Z"
    },
    "dimensions": {
      "length": 13.6,
      "width": 2.5,
      "height": 4.0
    },
    "features": ["Refrigeration", "GPS Tracking"],
    "photos": ["https://example.com/truck1.jpg"]
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "truck": {
        "_id": "truck_id",
        "ownerId": "owner_id",
        "plateNumber": "ABC123",
        "model": "Volvo FH16",
        "capacity": 25,
        "year": 2020,
        "available": true,
        "insuranceInfo": {
          "provider": "Insurance Co",
          "policyNumber": "POL123456",
          "expiryDate": "2023-12-31T00:00:00.000Z"
        },
        "dimensions": {
          "length": 13.6,
          "width": 2.5,
          "height": 4.0
        },
        "features": ["Refrigeration", "GPS Tracking"],
        "photos": ["https://example.com/truck1.jpg"],
        "active": true,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    }
  }
  ```

#### Get My Trucks

- **URL**: `/trucks`
- **Method**: `GET`
- **Auth required**: Yes (Truck Owner only)
- **Query Parameters**:
  - `available` (optional): Filter by availability
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 5,
    "data": {
      "trucks": [
        // Array of trucks
      ]
    }
  }
  ```

#### Get Truck

- **URL**: `/trucks/:id`
- **Method**: `GET`
- **Auth required**: Yes (Truck Owner, assigned Driver)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "truck": {
        // Truck details
      }
    }
  }
  ```

#### Update Truck

- **URL**: `/trucks/:id`
- **Method**: `PATCH`
- **Auth required**: Yes (Truck Owner only)
- **Request Body**: Any fields to update
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "truck": {
        // Updated truck details
      }
    }
  }
  ```

#### Assign Driver

- **URL**: `/trucks/:id/assignDriver`
- **Method**: `PATCH`
- **Auth required**: Yes (Truck Owner only)
- **Request Body**:
  ```json
  {
    "driverId": "driver_id"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "truck": {
        // Updated truck with assigned driver
      }
    }
  }
  ```

#### Remove Driver

- **URL**: `/trucks/:id/removeDriver`
- **Method**: `PATCH`
- **Auth required**: Yes (Truck Owner only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "truck": {
        // Updated truck with driver removed
      }
    }
  }
  ```

### User API

#### Update User Profile

- **URL**: `/users/profile`
- **Method**: `PATCH`
- **Auth required**: Yes
- **Request Body**: Fields to update (varies by role)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        // Updated user details
      }
    }
  }
  ```

#### Get Drivers (Truck Owner only)

- **URL**: `/users/drivers`
- **Method**: `GET`
- **Auth required**: Yes (Truck Owner only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 5,
    "data": {
      "drivers": [
        // Array of drivers
      ]
    }
  }
  ```

### Admin API

#### Get All Users

- **URL**: `/admin/users`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)
- **Query Parameters**:
  - `role` (optional): Filter by role
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 20,
    "data": {
      "users": [
        // Array of users
      ]
    }
  }
  ```

#### Get User

- **URL**: `/admin/users/:id`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        // User details
      }
    }
  }
  ```

#### Update User

- **URL**: `/admin/users/:id`
- **Method**: `PATCH`
- **Auth required**: Yes (Admin only)
- **Request Body**: Fields to update
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        // Updated user details
      }
    }
  }
  ```

#### Deactivate User

- **URL**: `/admin/users/:id/deactivate`
- **Method**: `PATCH`
- **Auth required**: Yes (Admin only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        // Updated user with active: false
      }
    }
  }
  ```

#### Activate User

- **URL**: `/admin/users/:id/activate`
- **Method**: `PATCH`
- **Auth required**: Yes (Admin only)
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        // Updated user with active: true
      }
    }
  }
  ```

#### Get All Shipments

- **URL**: `/admin/shipments`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)
- **Query Parameters**:
  - `status` (optional): Filter by status
  - `merchantId` (optional): Filter by merchant
  - `page` (optional): Page number
  - `limit` (optional): Results per page
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 20,
    "data": {
      "shipments": [
        // Array of shipments
      ]
    }
  }
  ```

## Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Not authorized to access the resource
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation errors
- `500`: Internal Server Error - Server encountered an error
