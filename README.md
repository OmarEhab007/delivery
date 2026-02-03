# Delivery App

> A production-ready platform connecting merchants with truck owners and drivers for international shipments, featuring real-time tracking, role-based workflows, and comprehensive security measures.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Database Management](#database-management)
- [Monitoring & Observability](#monitoring--observability)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Delivery App is a comprehensive logistics platform that orchestrates international shipping operations through role-based workflows. It connects merchants who need shipping services with truck owners and drivers, providing tools for shipment management, real-time tracking, document handling, and admin oversight.

### Key Workflows

- **Request → Payment → Admin Approval → Entry Creation**: Configurable approval flow for shipments
- **Real-time Location Tracking**: Live shipment tracking via Socket.IO
- **Document Management**: Secure storage with audit trails
- **Role-based Access Control**: Four-tier user hierarchy with granular permissions

## Features

### Authentication & Authorization

- **JWT Access Token System**: Short-lived access tokens (24h default) for API authentication
- **Refresh Token Rotation**: Secure refresh token system with 7-day expiry and revocation support
- **Role-based Access Control (RBAC)**: Four user roles with hierarchical permissions
  - **Admin**: Full system access, user management, reporting
  - **Merchant**: Create shipments, manage applications, view tracking
  - **Truck Owner**: Manage fleet, submit bids, assign drivers
  - **Driver**: Update location, manage assigned shipments
- **Registration Approval System**: Admin approval required for new user registrations
- **Password Reset Flow**: Secure token-based password reset via email

### Email Service

- **Transactional Emails**: Nodemailer-based email service with template support
- **Email Types**:
  - Password reset emails
  - Registration approval notifications
  - Registration rejection notices
  - Generic notification emails
- **Development Mode**: Email logging instead of sending during development
- **Privacy-compliant Logging**: GDPR/CCPA compliant email address masking in logs

### Real-time Tracking

- **Socket.IO Integration**: WebSocket-based real-time communication
- **Live Location Updates**: Drivers can update shipment location in real-time
- **Room-based Channels**: Join/leave shipment tracking rooms
- **JWT Authentication for Socket.IO**: Secured WebSocket connections
- **Location History**: Track shipment journey with timeline entries
- **ETA Calculation**: Estimated time of arrival for shipments
- **Geofencing Support**: Check if locations are within defined boundaries

### Shipment Management

- **Fixed Price Shipments**: Admin-defined fixed price shipments
- **Bidding System**: Truck owners can bid on available shipments
- **Shipment Status Workflow**: Track status through shipment lifecycle
- **Timeline Tracking**: Complete history of shipment events
- **Document Association**: Link documents to shipments and applications

### Document Management

- **Secure File Storage**: On-premises document storage with validation
- **Upload Middleware**: Multi-part form data handling with file validation
- **Entity Relationships**: Documents linked to shipments, applications, trucks
- **Audit Trail**: Track document uploads and modifications

### Input Validation & Security

- **NoSQL Injection Prevention**: MongoDB operator sanitization
- **Input Validation**: Express-validator middleware for all endpoints
- **XSS Protection**: Sanitization of user input throughout the application
- **SQL Injection Prevention**: Parameterized queries via Mongoose ODM

### Testing Infrastructure

- **Jest Test Framework**: Comprehensive unit and integration tests
- **MongoDB Memory Server**: Isolated test database
- **Test Utilities**: Helper functions and data factories
- **Coverage Reporting**: Built-in test coverage tracking
- **Security Tests**: Dedicated tests for authorization and injection prevention

## Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO 4.8+
- **Email**: Nodemailer 7.0+
- **Validation**: express-validator 6.15+

### Security

- **Helmet**: HTTP security headers
- **CSRF Protection**: csurf for cross-site request forgery prevention
- **Rate Limiting**: express-rate-limit for API protection
- **Sanitization**: express-mongo-sanitize for NoSQL injection prevention
- **CORS**: Cross-origin resource sharing configuration

### Monitoring & Logging

- **Logging**: Winston 3.8+ with daily rotation
- **Metrics**: Prometheus (prom-client)
- **Health Checks**: Custom health monitoring endpoints

### Development

- **Testing**: Jest 29.7+ with Supertest
- **Linting**: ESLint with Airbnb style guide
- **Formatting**: Prettier 3.5+
- **Git Hooks**: Husky + lint-staged for pre-commit checks

### DevOps

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Process Management**: Nodemon for development

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **MongoDB**: Version 6.0 or higher (local or Docker)
- **Docker & Docker Compose**: For containerized deployment (optional but recommended)
- **Git**: For version control

### Optional Dependencies

- **Twilio Account**: For WhatsApp notifications
- **SMTP Server**: For email services (e.g., Mailtrap, SendGrid)
- **AWS S3**: For cloud document storage (optional)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/delivery-app.git
cd delivery-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables)).

### 4. Initialize the Database

The application will automatically:

- Connect to MongoDB on startup
- Create necessary indexes
- Initialize the admin user if none exists

You can manually create indexes:

```bash
npm run db:create-indexes
```

### 5. Start the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/delivery-app
MONGODB_TEST_URI=mongodb://localhost:27017/delivery-app-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
```

### Optional Variables

```bash
# Admin User (auto-created on first startup)
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@deliveryapp.com
ADMIN_PASSWORD=secure-password-here

# Email Configuration
EMAIL_ENABLED=true
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=noreply@deliveryapp.com
EMAIL_USERNAME=your-smtp-username  # Alternative to EMAIL_USER
EMAIL_PASSWORD=your-smtp-password  # Alternative to EMAIL_PASS

# Frontend Configuration
FRONTEND_URL=http://localhost:3001
SUPPORT_EMAIL=support@deliveryapp.com

# Twilio Configuration (for WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number

# AWS S3 Configuration (for cloud storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name

# Logging Configuration
LOG_LEVEL=info
```

### Security Notes

- **Never commit `.env` files to version control**
- **Use strong, unique secrets in production**
- **Rotate JWT_SECRET periodically in production**
- **Use different `MONGODB_URI` for each environment**

## Running the Application

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start both backend and React frontend concurrently
npm run dev:all

# Start React frontend only
npm run client

# Build React frontend for production
npm run client:build
```

### Production Commands

```bash
# Start production server
npm start

# Run with Node.js in cluster mode (recommended for production)
NODE_ENV=production npm start
```

### Database Management

```bash
# Create optimized MongoDB indexes
npm run db:create-indexes

# Monitor index performance
npm run db:monitor-indexes

# Run both index creation and monitoring
npm run db:optimize
```

### Admin Management

```bash
# Create admin user interactively
npm run create-admin

# Make an existing user an admin
node src/scripts/makeUserAdmin.js

# List all users in the system
node src/scripts/listUsers.js
```

### Logging

```bash
# Run log management utilities
npm run logs

# List available log files
npm run logs:list

# Clean old log files
npm run logs:clean
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## API Documentation

### Swagger UI

Interactive API documentation is available via Swagger UI:

- **Development**: `http://localhost:3000/api-docs` (requires authentication)
- **JSON Spec**: `http://localhost:3000/api-docs-json/json`

### Key API Endpoints

#### Authentication

- `POST /api/auth/register` - User registration (requires admin approval)
- `POST /api/auth/login` - User login (returns access + refresh tokens)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password with token

#### Users

- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update current user profile
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)

#### Shipments

- `GET /api/shipments` - List all shipments
- `POST /api/shipments` - Create new shipment (merchant)
- `GET /api/shipments/:id` - Get shipment details
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment

#### Fixed Price Shipments

- `GET /api/fixed-price-shipments` - List fixed price shipments
- `POST /api/fixed-price-shipments` - Create fixed price shipment (admin)
- `GET /api/fixed-price-shipments/:id` - Get details
- `PATCH /api/fixed-price-shipments/:id` - Update shipment (admin)

#### Applications (Bids)

- `GET /api/applications` - List all applications
- `POST /api/applications` - Submit bid on shipment (truck owner)
- `GET /api/applications/:id` - Get application details
- `PATCH /api/applications/:id/status` - Update application status

#### Trucks

- `GET /api/trucks` - List all trucks
- `POST /api/trucks` - Register new truck (truck owner)
- `GET /api/trucks/:id` - Get truck details
- `PATCH /api/trucks/:id` - Update truck
- `DELETE /api/trucks/:id` - Delete truck

#### Documents

- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document

#### Admin

- `GET /api/admin/users/pending` - List pending registrations
- `PATCH /api/admin/users/:id/approve` - Approve registration
- `PATCH /api/admin/users/:id/reject` - Reject registration
- `GET /api/admin/reports` - Generate reports

#### Health & Metrics

- `GET /health` - Basic health check
- `GET /health/db` - Database health check
- `GET /health/storage` - Storage health check
- `GET /metrics` - Prometheus metrics (admin only)

For detailed API documentation with request/response examples, see the Swagger UI at `/api-docs`.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── integration/          # Integration tests
│   └── auth/            # Authentication flow tests
├── security/            # Security-focused tests
│   ├── authorization.test.js
│   └── injection.test.js
├── utils/               # Test utilities and helpers
│   ├── authHelpers.js   # Authentication test helpers
│   ├── dataFactories.js # Test data factories
│   └── testUtils.js     # General test utilities
├── setup.js             # Test setup configuration
└── auth.test.js         # Auth unit tests
```

### Test Coverage

The test suite covers:

- Authentication flows (login, registration, token refresh)
- Authorization and role-based access control
- Input validation and sanitization
- NoSQL injection prevention
- API endpoint functionality
- Error handling

### Running Individual Test Files

```bash
# Run specific test file
npxjest tests/integration/auth/login.test.js

# Run tests matching a pattern
npxjest tests/security/
```

## Project Structure

```
delivery-app/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── config.js          # App configuration
│   │   ├── database.js        # MongoDB connection
│   │   └── swagger.js         # Swagger API documentation
│   │
│   ├── controllers/            # Route handlers organized by domain
│   │   ├── admin/             # Admin-specific controllers
│   │   │   ├── adminController.js
│   │   │   ├── adminApplicationController.js
│   │   │   ├── adminShipmentController.js
│   │   │   ├── adminTruckController.js
│   │   │   └── reportingController.js
│   │   ├── application/       # Application/bidding controllers
│   │   │   └── applicationController.js
│   │   ├── auth/              # Authentication controllers
│   │   │   └── authController.js
│   │   ├── document/          # Document management
│   │   │   └── documentController.js
│   │   ├── driver/            # Driver-specific controllers
│   │   │   └── driverController.js
│   │   ├── shipment/          # Shipment management
│   │   │   ├── fixedPriceShipmentController.js
│   │   │   └── shipmentController.js
│   │   ├── truck/             # Truck fleet management
│   │   │   ├── truckController.js
│   │   │   └── truckOwnerController.js
│   │   └── user/              # User management
│   │       └── userController.js
│   │
│   ├── middleware/             # Express middleware
│   │   ├── authMiddleware.js  # JWT authentication & authorization
│   │   ├── csrfProtection.js  # CSRF protection
│   │   ├── errorHandler.js    # Centralized error handling
│   │   ├── rateLimiters.js    # Rate limiting configuration
│   │   ├── sanitization.js    # NoSQL injection prevention
│   │   ├── securityHeaders.js # Security headers (Helmet)
│   │   ├── uploadMiddleware.js # File upload handling
│   │   ├── validationMiddleware.js # Input validation
│   │   └── validators/        # Validation schemas
│   │       ├── commonValidators.js
│   │       └── shipmentValidators.js
│   │
│   ├── models/                 # Mongoose models
│   │   ├── Application.js     # Bidding/application model
│   │   ├── Document.js        # Document model
│   │   ├── RefreshToken.js    # Refresh token model
│   │   ├── Shipment.js        # Shipment model
│   │   ├── Truck.js           # Truck model
│   │   ├── User.js            # User model
│   │   └── UserRegistrationRequest.js # Registration requests
│   │
│   ├── routes/                 # Route definitions
│   │   ├── adminRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── driverRoutes.js
│   │   ├── fixedPriceShipmentRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── metricsRoutes.js
│   │   ├── reportingRoutes.js
│   │   ├── shipmentRoutes.js
│   │   ├── swaggerRoutes.js
│   │   ├── truckOwnerRoutes.js
│   │   ├── truckRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── services/               # Business logic layer
│   │   ├── auth/              # Authentication services
│   │   │   └── otpService.js
│   │   ├── document/          # Document services
│   │   │   └── documentService.js
│   │   ├── email/             # Email services
│   │   │   ├── emailService.js
│   │   │   └── emailTemplates.js
│   │   ├── notification/      # Notification services
│   │   │   └── notificationService.js
│   │   └── tracking/          # Tracking services
│   │       └── trackingService.js
│   │
│   ├── utils/                  # Utility functions
│   │   ├── apiError.js        # API error classes
│   │   ├── catchAsync.js      # Async error wrapper
│   │   ├── db.js              # Database utilities
│   │   ├── dbMonitor.js       # Database monitoring
│   │   ├── errorTracker.js    # Error tracking
│   │   ├── healthCheck.js     # Health check utilities
│   │   ├── initAdmin.js       # Admin initialization
│   │   ├── logger.js          # Winston logger
│   │   ├── metrics.js         # Prometheus metrics
│   │   ├── metricScheduler.js # Metric scheduling
│   │   ├── sendWhatsApp.js    # WhatsApp utilities
│   │   ├── tracer.js          # Distributed tracing
│   │   └── validateEnv.js     # Environment validation
│   │
│   ├── scripts/                # Maintenance scripts
│   │   ├── createAdminUser.js # Create admin user
│   │   ├── database/          # Database scripts
│   │   │   ├── createIndexes.js
│   │   │   ├── migrateShipmentsPricingType.js
│   │   │   └── monitorIndexes.js
│   │   ├── listUsers.js       # List all users
│   │   ├── log-utils.js       # Log management
│   │   └── makeUserAdmin.js   # Promote user to admin
│   │
│   ├── app.js                  # Express app configuration
│   └── server.js               # Server entry point
│
├── tests/                      # Test files
│   ├── integration/           # Integration tests
│   ├── security/              # Security tests
│   ├── utils/                 # Test utilities
│   ├── setup.js               # Test configuration
│   └── auth.test.js           # Auth tests
│
├── client/                     # React frontend (optional)
│   ├── public/
│   ├── src/
│   └── package.json
│
├── logs/                       # Application logs (gitignored)
├── uploads/                    # Document uploads (gitignored)
│
├── .env.example               # Environment variables template
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── docker-compose.yml         # Docker Compose config
├── docker-compose.prod.yml    # Production Docker Compose
├── Dockerfile                 # Docker image definition
├── jest.config.js             # Jest test configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Security Features

This application implements multiple layers of security to protect against common vulnerabilities:

### Authentication & Authorization

- **JWT-based Authentication**: Stateless token-based authentication
- **Refresh Token Rotation**: Secure token refresh with revocation support
- **Role-based Access Control**: Four-tier role hierarchy (Admin, Merchant, Truck Owner, Driver)
- **Token Expiration**: Configurable token expiry (24h access, 7 days refresh)
- **Password Hashing**: bcrypt with salt for secure password storage

### Input Validation & Sanitization

- **NoSQL Injection Prevention**: MongoDB operator sanitization (`express-mongo-sanitize`)
- **Input Validation**: Request validation using `express-validator`
- **XSS Protection**: Input sanitization throughout the application
- **Parameterized Queries**: Mongoose ODM prevents SQL injection

### HTTP Security

- **Security Headers**: Helmet for secure HTTP headers
  - Content Security Policy (CSP)
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME-sniffing protection)
  - Strict-Transport-Security (HSTS)
  - X-XSS-Protection
- **CSRF Protection**: Token-based CSRF protection for state-changing operations
- **CORS Configuration**: Controlled cross-origin resource sharing

### Rate Limiting

- **General API Limiter**: 100 requests per 15 minutes
- **Auth Limiter**: 5 requests per 15 minutes for sensitive endpoints
- **Sensitive Operations**: Stricter limits for password reset, registration

### Data Protection

- **Environment Variable Validation**: Mandatory variables checked on startup
- **Secure Password Reset**: Time-limited, single-use reset tokens
- **Email Masking**: GDPR/CCPA compliant logging
- **Document Storage**: Secure file upload with validation

### Security Best Practices

- **No Secrets in Code**: All secrets via environment variables
- **Error Handling**: Generic error messages to prevent information leakage
- **Logging**: Structured logging with sensitive data redaction
- **Dependency Management**: Regular security audits via npm audit

## Database Management

### MongoDB Indexes

The application uses optimized indexes for query performance:

```bash
# Create all indexes
npm run db:create-indexes

# Monitor index performance
npm run db:monitor-indexes
```

### Key Indexes

- **Users**: email (unique), role
- **RefreshTokens**: tokenHash (unique), userId, expiresAt (TTL)
- **Shipments**: merchantId, status, currentLocation (geospatial)
- **Applications**: shipmentId, truckOwnerId, status
- **Trucks**: truckOwnerId, licensePlate (unique)

### Database Monitoring

```bash
# View database statistics
npm run db:monitor-indexes
```

### Backup

For production, implement regular MongoDB backups using:

```bash
# Manual backup
mongodump --uri="MONGODB_URI" --out=/backup/path

# Restore backup
mongorestore --uri="MONGODB_URI" --dir=/backup/path
```

## Monitoring & Observability

### Health Check Endpoints

- `GET /health` - Overall system health
- `GET /health/db` - Database connectivity check
- `GET /health/storage` - Storage availability check
- `GET /health/external` - External service availability

### Metrics

Prometheus metrics available at `GET /metrics` (admin only):

- Request count, latency, error rate
- Database connection pool stats
- Custom business metrics
- System metrics (CPU, memory, disk)

### Logging

Logs are stored in `/logs` with daily rotation:

- `error.log` - Error logs
- `combined.log` - All logs
- `access.log` - HTTP access logs (via Morgan)

```bash
# List log files
npm run logs:list

# Clean old logs
npm run logs:clean
```

### Prometheus & Grafana (Optional)

When using Docker Compose:

- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (default credentials: admin/admin)

## Contributing

We welcome contributions to the Delivery App! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write code** following existing patterns and conventions

   - Use async/await for asynchronous operations
   - Implement proper error handling
   - Add input validation for new endpoints
   - Write tests for new functionality

3. **Run tests** and ensure they pass

   ```bash
   npm test
   npm run lint
   npm run format
   ```

4. **Commit changes** with clear messages

   ```bash
   git add .
   git commit -m "Add: Feature description"
   ```

5. **Push to fork** and create a pull request

### Code Style

- **Linting**: ESLint with Airbnb style guide
- **Formatting**: Prettier for consistent code style
- **Git Hooks**: Husky + lint-staged run on pre-commit

### Commit Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Testing Requirements

- **Unit Tests**: For business logic in services
- **Integration Tests**: For API endpoints
- **Security Tests**: For authorization and input validation
- **Coverage**: Maintain >80% test coverage

## License

This project is licensed under the MIT License.

## Support

For questions, issues, or contributions:

- **Documentation**: See `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for the logistics community**
