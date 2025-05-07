# Delivery App - Merchant-Truck Coordination Platform

This is a backend application that connects Merchants with Truck Owners (and their Drivers) to coordinate international shipments.

## Features

- User management with role-based access (Admin, Merchant, Truck Owner, Driver)
- Automatic admin user creation on first run
- Shipment creation and management
- Fleet management (trucks and drivers)
- Application/bid system for shipments
- Document upload and management
- Real-time location tracking for shipments
- WhatsApp notifications for important events
- Optimized database performance with strategic indexing
- Comprehensive system health monitoring

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time tracking
- Twilio for WhatsApp integration
- AWS S3 for document storage
- Docker and Docker Compose for containerization

## Project Structure

```
delivery-app/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers for all endpoints
│   ├── middleware/     # Custom middleware functions
│   ├── models/         # Mongoose models
│   ├── routes/         # Route definitions
│   ├── scripts/        # Utility scripts
│   │   └── database/   # Database maintenance scripts
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── tests/              # Automated tests
├── .env.example        # Example environment variables
├── docker-compose.yml  # Docker compose configuration
├── Dockerfile          # Docker configuration
└── package.json        # Project metadata and dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository
2. Copy `env.sample` to `.env` and update the values
3. Install dependencies:
   ```
   npm install
   ```
4. Start the application:
   ```
   npm run dev
   ```
   
   **Note**: On first run, an admin user will be automatically created if one doesn't exist. See [docs/ADMIN_INITIALIZATION.md](docs/ADMIN_INITIALIZATION.md) for details.

### Database Optimization

To optimize the MongoDB database with strategic indexes:

```
node src/scripts/database/createIndexes.js
```

This script creates optimized indexes for all collections to improve query performance. See [src/scripts/database/README.md](src/scripts/database/README.md) for details.

### Using Docker

1. Build and start the containers:
   ```
   docker-compose up -d
   ```

## API Documentation

The application provides comprehensive API documentation using Swagger:

- `/api-docs` - Interactive API documentation with Swagger UI
- `/api-docs-json/json` - Raw OpenAPI specification in JSON format

### Features of the API Documentation

- Interactive testing interface for all endpoints
- Detailed request and response schemas for all models:
  - User - Authentication and user management
  - Truck - Vehicle management and tracking
  - Shipment - End-to-end shipping process
  - Application - Bidding and application system
  - Document - File upload and document management
- Authentication support with JWT
- Example requests and responses
- Group-based organization of endpoints by role/function
- Support for file uploads with multi-part form data
- Ability to download the OpenAPI specification

For more details on using and extending the API documentation, see [docs/SWAGGER_GUIDE.md](docs/SWAGGER_GUIDE.md).

## System Health Monitoring

The application includes comprehensive health monitoring endpoints to track system status:

### Health Check Endpoints

- `/health` - Basic health check (no authentication required)
- `/health/system` - System resources health check (CPU, memory, etc.)
- `/health/storage` - Storage health check (disk space, upload directory status)
- `/health/database` - Database connection health check
- `/health/comprehensive` - Complete system status check with all components

All endpoints except `/health` require admin authentication.

### Health Status Categories

Health checks return one of the following status levels:

- `healthy` - All systems operating normally
- `degraded` - System operational but with some services impaired
- `critical` - System at risk and requires immediate attention
- `error` - System in error state and may not be functioning properly

### Configuring External API Monitoring

External API health checks can be configured in the `.env` file:

```
EXTERNAL_API_ENDPOINTS=[{"name":"Example API","url":"https://api.example.com/health","timeout":5000,"maxResponseTime":2000}]
```

This allows monitoring of third-party services that your application depends on.

## Development Workflow

See [TASKS.md](./TASKS.md) for the development roadmap and progress tracking.
