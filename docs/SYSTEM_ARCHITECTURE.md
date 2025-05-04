# System Architecture Documentation

## Overview

This document outlines the system architecture of the Delivery App, including components, technology stack, and design patterns.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **API Documentation**: Postman Collection


### DevOps
- **Container**: Docker
- **Logging**: Winston
- **Testing**: Jest

## System Components

![System Architecture Diagram](./architecture-diagram.png)

### Core Components

#### 1. Authentication System
- Handles user registration, login, password reset
- Manages JWT token generation and verification
- Manages role-based access control

#### 2. User Management System
- Manages different user types (Admin, Merchant, Truck Owner, Driver)
- Handles role-specific operations and permissions
- User profile management

#### 3. Shipment Management System
- Shipment creation and lifecycle management
- Shipment status tracking and timeline updates
- Location tracking and updates

#### 4. Application Management System
- Handles bids from truck owners for shipments
- Application review and approval/rejection process
- Automatic state transitions

#### 5. Truck Management System
- Truck registration and details management
- Driver assignment and management
- Truck availability tracking

#### 6. Notification System
- Status updates notifications
- Email notifications for critical events
- Push notifications (if mobile app is implemented)

## Architecture Patterns

### MVC (Model-View-Controller)
The application follows the MVC pattern:
- **Models**: MongoDB schemas defined with Mongoose
- **Views**: API responses (JSON) or React components (if frontend is implemented)
- **Controllers**: Business logic for processing requests

### Repository Pattern
For database operations, a repository layer abstracts data access.

### Service Layer
Complex business logic is encapsulated in service classes.

### Middleware Pattern
Express middleware for cross-cutting concerns:
- Authentication middleware
- Error handling middleware
- Validation middleware
- Logging middleware

## Directory Structure

```
├── src/
│   ├── config/             # Application configuration
│   ├── controllers/        # Request handlers
│   │   ├── admin/          # Admin-specific controllers
│   │   ├── application/    # Application management controllers
│   │   ├── auth/           # Authentication controllers
│   │   ├── document/       # Document handling controllers
│   │   ├── driver/         # Driver-specific controllers
│   │   ├── notification/   # Notification controllers
│   │   ├── shipment/       # Shipment management controllers
│   │   ├── tracking/       # Location tracking controllers
│   │   ├── truck/          # Truck management controllers
│   │   └── user/           # User management controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── scripts/            # Utility scripts
│   ├── services/           # Business logic services
│   ├── utils/              # Helper utilities
│   └── server.js           # Main application entry point
├── tests/                  # Test files
├── docs/                   # Documentation
├── .env.sample             # Environment variables template
├── package.json            # Node.js dependencies
├── Dockerfile              # Docker build instructions
└── docker-compose.yml      # Docker compose configuration
```

## Data Flow

### Request Flow

1. HTTP request reaches the server
2. Request passes through global middleware (CORS, body parsing, etc.)
3. Route-specific middleware processes the request (authentication, validation)
4. Controller handles the request
5. Service layer implements business logic
6. Models interact with the database
7. Response is sent back to the client

### Authentication Flow

1. User submits login credentials
2. Auth controller validates credentials
3. If valid, JWT token is generated with user details and role
4. Token is sent back to the client
5. Client includes token in subsequent requests
6. Auth middleware validates token for protected routes

### Shipment Lifecycle Flow

1. Merchant creates a shipment
2. Truck owners view available shipments
3. Truck owners submit applications with bid details
4. Merchant reviews and accepts an application
5. System rejects all other applications
6. Shipment status is updated to CONFIRMED
7. Driver updates shipment status and location as it progresses
8. Timeline entries track the shipment journey
9. Shipment is marked as DELIVERED upon completion
10. After verification, shipment is marked as COMPLETED

## Security Measures

### Authentication
- JWT tokens with appropriate expiration
- Password hashing using bcrypt with salt rounds
- Role-based access control

### Input Validation
- Request validation using express-validator
- Mongoose schema validation for data integrity

### API Security
- Rate limiting to prevent abuse
- CORS configuration to limit origins
- Helmet middleware for HTTP headers security

### Error Handling
- Centralized error handling
- Sanitized error responses to prevent information leakage

## Scalability Considerations

### Horizontal Scaling
- Stateless API design for load balancing
- Session-less authentication (JWT)

### Database Optimization
- Proper indexing for common queries
- Pagination for large result sets
- Mongoose schema optimization

### Caching
- Response caching for frequently accessed data
- Database query caching if needed

## Deployment

### Development Environment
- Local Node.js server
- Local MongoDB or cloud MongoDB instance
- Environment variables for configuration

### Production Environment
- Docker containers
- MongoDB Atlas (or equivalent)
- Proper logging and monitoring
- Automated deployment pipeline

## Monitoring and Logging

### Logging
- Winston for structured logging
- Log levels (error, warn, info, debug)
- Log rotation and storage

### Monitoring
- API performance metrics
- Error rate monitoring
- Database performance monitoring

## Backup and Recovery

### Database Backup
- Regular automated backups
- Point-in-time recovery options

### Disaster Recovery
- Backup restoration procedures
- Data integrity verification 