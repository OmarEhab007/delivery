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
   
   **Note**: On first run, an admin user will be automatically created if one doesn't exist. See [Admin Initialization](docs/ADMIN_INITIALIZATION.md) for details.

### Using Docker

1. Build and start the containers:
   ```
   docker-compose up -d
   ```

## API Documentation

API documentation will be available at `/api-docs` when the server is running.

## Development Workflow

See [TASKS.md](./TASKS.md) for the development roadmap and progress tracking.
