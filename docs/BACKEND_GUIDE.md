# Backend Development Guide

## Overview

This guide provides instructions and best practices for developing the backend components of the Delivery App. The backend is built using Node.js with Express.js and MongoDB.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Logging**: Winston

## Project Structure

```
src/
├── config/             # Application configuration
├── controllers/        # Request handlers grouped by feature
├── middleware/         # Express middleware
├── models/             # Mongoose schemas
├── routes/             # API route definitions
├── services/           # Business logic services
├── utils/              # Helper utilities
└── server.js           # Main application entry point
```

## Setting Up Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.sample`
4. Start MongoDB locally or use MongoDB Atlas
5. Start the development server: `npm run dev`

## API Design Principles

### RESTful Endpoints

The API follows RESTful principles with the following standard patterns:

- GET `/resource` - List resources
- GET `/resource/:id` - Get a specific resource
- POST `/resource` - Create a new resource
- PATCH `/resource/:id` - Update a resource
- DELETE `/resource/:id` - Delete a resource

### Response Format

Standardized response format:

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

Error response format:

```json
{
  "status": "error",
  "message": "Error message",
  "errors": [] // Optional: validation errors
}
```

## Authentication

### JWT Implementation

JWT tokens are used for authentication:

```javascript
// utils/jwtUtils.js
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken
};
```

### Auth Middleware

```javascript
// middleware/authMiddleware.js
const { promisify } = require('util');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');
const AppError = require('../utils/appError');

exports.protect = async (req, res, next) => {
  // 1) Get token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = await promisify(verifyToken)(token);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Grant access to protected route
  req.user = user;
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
```

## Error Handling

### Custom Error Class

```javascript
// utils/appError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Global Error Handler

```javascript
// middleware/errorMiddleware.js
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
```

## Input Validation

Use express-validator middleware for request validation:

```javascript
// routes/shipmentRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipment/shipmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post(
  '/',
  protect,
  restrictTo('Merchant'),
  [
    body('origin.address').notEmpty().withMessage('Origin address is required'),
    body('destination.address').notEmpty().withMessage('Destination address is required'),
    body('cargoDetails.description').notEmpty().withMessage('Cargo description is required'),
    body('cargoDetails.weight').isNumeric().withMessage('Cargo weight must be a number')
  ],
  shipmentController.createShipment
);

// More routes...

module.exports = router;
```

Validate the request in the controller:

```javascript
// controllers/shipment/shipmentController.js
const { validationResult } = require('express-validator');
const { Shipment } = require('../../models/Shipment');
const AppError = require('../../utils/appError');

exports.createShipment = async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  try {
    // Create shipment with the current user as merchant
    const shipment = await Shipment.create({
      ...req.body,
      merchantId: req.user.id
    });

    // Add initial timeline entry
    await shipment.addTimelineEntry({
      status: 'REQUESTED',
      note: 'Shipment created'
    });

    res.status(201).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## Database Operations

### Repository Pattern (Optional)

For complex applications, consider using a repository pattern:

```javascript
// repositories/shipmentRepository.js
const { Shipment, ShipmentStatus } = require('../models/Shipment');

class ShipmentRepository {
  async findById(id) {
    return Shipment.findById(id);
  }

  async findByIdAndPopulate(id, options = {}) {
    const query = Shipment.findById(id);
    
    if (options.applications) {
      query.populate('applications');
    }
    
    return query;
  }

  async findByMerchant(merchantId, filters = {}) {
    const query = {
      merchantId,
      active: true
    };
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }
    
    return Shipment.find(query).sort({ createdAt: -1 });
  }

  async create(data) {
    return Shipment.create(data);
  }

  async update(id, data) {
    return Shipment.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async updateStatus(id, status) {
    return Shipment.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          timeline: {
            status,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );
  }
}

module.exports = new ShipmentRepository();
```

## Middleware Usage

### Request Logging

```javascript
// middleware/loggingMiddleware.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'delivery-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip
    });
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger
};
```

## Testing

### Unit Tests with Jest

```javascript
// tests/unit/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should hash the password before saving', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'Merchant'
    };

    const user = await User.create(userData);
    
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
  });

  it('should correctly validate a password', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'Merchant'
    };

    const user = await User.create(userData);
    
    // Should match the correct password
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    
    // Should not match incorrect password
    const isNotMatch = await user.comparePassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });
});
```

### API Tests

```javascript
// tests/integration/shipment.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { Shipment } = require('../../src/models/Shipment');
const { signToken } = require('../../src/utils/jwtUtils');

describe('Shipment API', () => {
  let merchant;
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Shipment.deleteMany({});

    // Create a test merchant
    merchant = await User.create({
      name: 'Test Merchant',
      email: 'merchant@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'Merchant'
    });

    token = signToken(merchant._id);
  });

  describe('POST /api/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        origin: {
          address: 'Origin Address',
          country: 'USA'
        },
        destination: {
          address: 'Destination Address',
          country: 'Canada'
        },
        cargoDetails: {
          description: 'Test Cargo',
          weight: 1000,
          volume: 10
        }
      };

      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.shipment).toHaveProperty('_id');
      expect(response.body.data.shipment.merchantId).toBe(merchant._id.toString());
      expect(response.body.data.shipment.status).toBe('REQUESTED');
    });

    it('should return validation errors for invalid input', async () => {
      const shipmentData = {
        // Missing required fields
        origin: {},
        destination: {
          address: 'Destination Address'
        },
        cargoDetails: {
          description: 'Test Cargo'
          // Missing weight
        }
      };

      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send(shipmentData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body).toHaveProperty('errors');
    });
  });
});
```

## Security Best Practices

1. **Use HTTPS in Production**: Always use HTTPS in production environments.

2. **Set Security Headers**: Use the Helmet middleware to set security headers.

   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

3. **Rate Limiting**: Implement rate limiting to prevent abuse.

   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP, please try again after 15 minutes'
   });
   
   app.use('/api', apiLimiter);
   ```

4. **Data Validation**: Always validate user input on the server side.

5. **Secure Cookies**: Use secure cookies when deploying to production.

   ```javascript
   app.use(session({
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       sameSite: 'strict'
     }
   }));
   ```

6. **CORS Configuration**: Configure CORS properly.

   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: process.env.CLIENT_URL,
     credentials: true
   }));
   ```

## Deployment

### Docker

The application can be deployed using Docker:

```bash
# Build the image
docker build -t delivery-app .

# Run the container
docker run -p 3000:3000 --env-file .env delivery-app
```

### Docker Compose

For development with Docker Compose:

```bash
docker-compose up
```

## Performance Optimization

1. **Database Indexing**: Ensure proper indexes are set on collections.
2. **Pagination**: Implement pagination for list endpoints.
3. **Caching**: Add caching for frequently accessed data.
4. **Compression**: Use compression middleware for response payloads.

## Logging and Monitoring

1. **Structured Logging**: Use Winston for structured logging.
2. **Request Logging**: Log all API requests.
3. **Error Logging**: Log all errors with stack traces.
4. **Performance Metrics**: Monitor API performance.

## Code Quality

1. **ESLint**: Use ESLint for code quality.
2. **Prettier**: Use Prettier for code formatting.
3. **Husky**: Use Husky for pre-commit hooks.
4. **Jest**: Write unit and integration tests. 