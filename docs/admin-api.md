# Admin API Documentation

This document provides information about all admin APIs in the Delivery App.

## Authentication

All admin endpoints require authentication using a JWT token and are restricted to users with Admin role.

**Authorization Header:**
```
Authorization: Bearer <token>
```

## User Management

### Get All Users
```
GET /api/admin/users
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of results per page (default: 10)
- `role` (optional): Filter by user role (Admin, Merchant, TruckOwner, Driver)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "60f7a6d4e4b0b42ae04f9e46",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Merchant",
        "phone": "123-456-7890",
        "active": true,
        "createdAt": "2023-07-20T15:21:08.332Z",
        "updatedAt": "2023-07-20T15:21:08.332Z"
      },
      ...
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pages": 5,
      "limit": 10
    }
  }
}
```

### Get User by ID
```
GET /api/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60f7a6d4e4b0b42ae04f9e46",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Merchant",
      "phone": "123-456-7890",
      "active": true,
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-20T15:21:08.332Z"
    }
  }
}
```

### Create User
```
POST /api/admin/users
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "password": "password123",
  "phone": "987-654-3210",
  "role": "Merchant"
}
```

For TruckOwner role, additional fields are required:
```json
{
  "name": "Truck Co.",
  "email": "trucking@example.com",
  "password": "password123",
  "phone": "555-123-4567",
  "role": "TruckOwner",
  "companyName": "Truck Co. LLC",
  "companyAddress": "123 Truck St, City, State, 12345"
}
```

For Driver role, additional fields are required:
```json
{
  "name": "Driver Name",
  "email": "driver@example.com",
  "password": "password123",
  "phone": "555-987-6543",
  "role": "Driver",
  "licenseNumber": "DL12345678",
  "ownerId": "60f7a6d4e4b0b42ae04f9e47"
}
```

For Admin role, optional fields:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123",
  "phone": "555-123-7890",
  "role": "Admin",
  "adminPermissions": ["USER_MANAGEMENT", "SHIPMENT_MANAGEMENT"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User created successfully",
    "user": {
      "_id": "60f7a6d4e4b0b42ae04f9e46",
      "name": "John Smith",
      "email": "john.smith@example.com",
      "role": "Merchant",
      "phone": "987-654-3210",
      "active": true,
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-20T15:21:08.332Z"
    }
  }
}
```

### Update User
```
PUT /api/admin/users/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated.email@example.com",
  "phone": "111-222-3333",
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User updated successfully",
    "user": {
      "_id": "60f7a6d4e4b0b42ae04f9e46",
      "name": "Updated Name",
      "email": "updated.email@example.com",
      "role": "Merchant",
      "phone": "111-222-3333",
      "active": true,
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-20T15:25:10.452Z"
    }
  }
}
```

### Delete User
```
DELETE /api/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

## Shipment Management

### Get All Shipments
```
GET /api/admin/shipments
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of results per page (default: 10)
- `status` (optional): Filter by shipment status
- `merchantId` (optional): Filter by merchant ID
- `truckId` (optional): Filter by truck ID
- `driverId` (optional): Filter by driver ID
- `startDate` (optional): Filter by created date range start
- `endDate` (optional): Filter by created date range end

**Response:**
```json
{
  "success": true,
  "data": {
    "shipments": [
      {
        "_id": "60f7a6d4e4b0b42ae04f9e48",
        "status": "Pending",
        "pickupLocation": "123 Pickup St, City, State, 12345",
        "deliveryLocation": "456 Delivery Ave, City, State, 67890",
        "cargo": {
          "description": "Electronics",
          "weight": 500,
          "dimensions": "100x50x30"
        },
        "price": 1500,
        "merchantId": {
          "_id": "60f7a6d4e4b0b42ae04f9e46",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "truckId": {
          "_id": "60f7a6d4e4b0b42ae04f9e49",
          "licensePlate": "TRK1234",
          "truckType": "Flatbed"
        },
        "createdAt": "2023-07-20T15:21:08.332Z",
        "updatedAt": "2023-07-20T15:21:08.332Z"
      },
      ...
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pages": 5,
      "limit": 10
    }
  }
}
```

### Get Shipment by ID
```
GET /api/admin/shipments/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipment": {
      "_id": "60f7a6d4e4b0b42ae04f9e48",
      "status": "Pending",
      "pickupLocation": "123 Pickup St, City, State, 12345",
      "deliveryLocation": "456 Delivery Ave, City, State, 67890",
      "cargo": {
        "description": "Electronics",
        "weight": 500,
        "dimensions": "100x50x30"
      },
      "price": 1500,
      "merchantId": {
        "_id": "60f7a6d4e4b0b42ae04f9e46",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "123-456-7890"
      },
      "truckId": {
        "_id": "60f7a6d4e4b0b42ae04f9e49",
        "licensePlate": "TRK1234",
        "truckType": "Flatbed"
      },
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-20T15:21:08.332Z"
    }
  }
}
```

### Update Shipment
```
PUT /api/admin/shipments/:id
```

**Request Body:**
```json
{
  "status": "InTransit",
  "pickupLocation": "Updated Pickup Location",
  "deliveryLocation": "Updated Delivery Location",
  "cargo": {
    "description": "Updated Cargo Description",
    "weight": 600,
    "dimensions": "110x60x40"
  },
  "price": 1800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Shipment updated successfully",
    "shipment": {
      "_id": "60f7a6d4e4b0b42ae04f9e48",
      "status": "InTransit",
      "pickupLocation": "Updated Pickup Location",
      "deliveryLocation": "Updated Delivery Location",
      "cargo": {
        "description": "Updated Cargo Description",
        "weight": 600,
        "dimensions": "110x60x40"
      },
      "price": 1800,
      "merchantId": "60f7a6d4e4b0b42ae04f9e46",
      "truckId": "60f7a6d4e4b0b42ae04f9e49",
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-20T15:30:42.123Z"
    }
  }
}
```

### Change Shipment Status
```
PATCH /api/admin/shipments/:id/status
```

**Request Body:**
```json
{
  "status": "Delivered"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Shipment status updated successfully",
    "shipment": {
      "_id": "60f7a6d4e4b0b42ae04f9e48",
      "status": "Delivered",
      "statusHistory": [
        {
          "status": "Pending",
          "timestamp": "2023-07-20T15:21:08.332Z",
          "updatedBy": "60f7a6d4e4b0b42ae04f9e45"
        },
        {
          "status": "InTransit",
          "timestamp": "2023-07-21T09:45:30.123Z",
          "updatedBy": "60f7a6d4e4b0b42ae04f9e45"
        },
        {
          "status": "Delivered",
          "timestamp": "2023-07-22T14:20:15.987Z",
          "updatedBy": "60f7a6d4e4b0b42ae04f9e40"
        }
      ],
      "pickupLocation": "Updated Pickup Location",
      "deliveryLocation": "Updated Delivery Location",
      "cargo": {
        "description": "Updated Cargo Description",
        "weight": 600,
        "dimensions": "110x60x40"
      },
      "price": 1800,
      "merchantId": "60f7a6d4e4b0b42ae04f9e46",
      "truckId": "60f7a6d4e4b0b42ae04f9e49",
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-22T14:20:15.987Z"
    }
  }
}
```

### Delete Shipment
```
DELETE /api/admin/shipments/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Shipment deleted successfully"
  }
}
```

## Application Management

### Get All Applications
```
GET /api/admin/applications
```

**Query Parameters:**
- Similar to shipments, supports pagination and filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "60f7a6d4e4b0b42ae04f9e50",
        "status": "Pending",
        "truckOwnerId": {
          "_id": "60f7a6d4e4b0b42ae04f9e47",
          "name": "Truck Co.",
          "email": "trucking@example.com",
          "phone": "555-123-4567",
          "companyName": "Truck Co. LLC"
        },
        "truckId": {
          "_id": "60f7a6d4e4b0b42ae04f9e49",
          "licensePlate": "TRK1234",
          "truckType": "Flatbed"
        },
        "createdAt": "2023-07-20T15:21:08.332Z",
        "updatedAt": "2023-07-20T15:21:08.332Z"
      },
      ...
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "pages": 3,
      "limit": 10
    }
  }
}
```

### Update Application Status
```
PATCH /api/admin/applications/:id/status
```

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Application approved after verification"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Application status updated successfully",
    "application": {
      "_id": "60f7a6d4e4b0b42ae04f9e50",
      "status": "Approved",
      "adminNotes": "Application approved after verification",
      "statusHistory": [
        {
          "status": "Pending",
          "timestamp": "2023-07-20T15:21:08.332Z"
        },
        {
          "status": "Approved",
          "timestamp": "2023-07-22T10:15:30.123Z",
          "updatedBy": "60f7a6d4e4b0b42ae04f9e40",
          "notes": "Application approved after verification"
        }
      ],
      "truckOwnerId": "60f7a6d4e4b0b42ae04f9e47",
      "truckId": "60f7a6d4e4b0b42ae04f9e49",
      "createdAt": "2023-07-20T15:21:08.332Z",
      "updatedAt": "2023-07-22T10:15:30.123Z"
    }
  }
}
```

## Truck Management

### Get All Trucks
```
GET /api/admin/trucks
```

**Query Parameters:**
- Similar to other endpoints, supports pagination and filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "_id": "60f7a6d4e4b0b42ae04f9e49",
        "licensePlate": "TRK1234",
        "truckType": "Flatbed",
        "capacity": 20000,
        "status": "Available",
        "ownerId": {
          "_id": "60f7a6d4e4b0b42ae04f9e47",
          "name": "Truck Co.",
          "email": "trucking@example.com",
          "phone": "555-123-4567",
          "companyName": "Truck Co. LLC"
        },
        "createdAt": "2023-07-20T15:21:08.332Z",
        "updatedAt": "2023-07-20T15:21:08.332Z"
      },
      ...
    ],
    "pagination": {
      "total": 40,
      "page": 1,
      "pages": 4,
      "limit": 10
    }
  }
}
```

### Create Truck
```
POST /api/admin/trucks
```

**Request Body:**
```json
{
  "licensePlate": "TRK5678",
  "truckType": "Refrigerated",
  "capacity": 15000,
  "ownerId": "60f7a6d4e4b0b42ae04f9e47",
  "specifications": {
    "length": 48,
    "width": 8.5,
    "height": 9.5,
    "features": ["Temperature Control", "GPS Tracking"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Truck created successfully",
    "truck": {
      "_id": "60f7a6d4e4b0b42ae04f9e55",
      "licensePlate": "TRK5678",
      "truckType": "Refrigerated",
      "capacity": 15000,
      "status": "Available",
      "ownerId": "60f7a6d4e4b0b42ae04f9e47",
      "specifications": {
        "length": 48,
        "width": 8.5,
        "height": 9.5,
        "features": ["Temperature Control", "GPS Tracking"]
      },
      "createdAt": "2023-07-25T11:30:45.123Z",
      "updatedAt": "2023-07-25T11:30:45.123Z"
    }
  }
}
```

## Dashboard

### Get Dashboard Stats
```
GET /api/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 120,
      "merchants": 50,
      "truckOwners": 30,
      "drivers": 40
    },
    "trucks": {
      "total": 45,
      "available": 30
    },
    "shipments": {
      "total": 200,
      "pending": 40,
      "inTransit": 35,
      "delivered": 125,
      "recent": [
        {
          "_id": "60f7a6d4e4b0b42ae04f9e48",
          "status": "Delivered",
          "merchantId": {
            "_id": "60f7a6d4e4b0b42ae04f9e46",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "truckId": {
            "_id": "60f7a6d4e4b0b42ae04f9e49",
            "licensePlate": "TRK1234",
            "truckType": "Flatbed"
          },
          "createdAt": "2023-07-20T15:21:08.332Z"
        },
        ...
      ]
    },
    "applications": {
      "total": 50,
      "pending": 15
    }
  }
}
```

## Setting Up Admin User

To create an initial admin user, run:

```
npm run create-admin
```

This will create an admin user with default credentials (if not set in environment variables):
- Email: admin@deliveryapp.com
- Password: admin123456

To customize the admin credentials, set these environment variables before running the script:
- `ADMIN_EMAIL`: Custom admin email
- `ADMIN_PASSWORD`: Custom admin password 