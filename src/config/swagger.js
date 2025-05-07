const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Delivery App API',
    version: '1.0.0',
    description: 'API documentation for the Delivery App',
    contact: {
      name: 'API Support',
      email: 'support@deliveryapp.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and authorization operations'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Trucks',
      description: 'Truck management operations'
    },
    {
      name: 'Shipments',
      description: 'Shipment management operations'
    },
    {
      name: 'Applications',
      description: 'Driver application operations'
    },
    {
      name: 'Documents',
      description: 'Document management operations'
    },
    {
      name: 'Admin',
      description: 'Admin operations'
    },
    {
      name: 'Driver',
      description: 'Driver operations for managing deliveries and location updates'
    },
    {
      name: 'TruckOwner',
      description: 'Truck owner operations for managing trucks and drivers'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/**/*.js',
    './src/docs/*.js', // Optional path for dedicated Swagger documentation files
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerServe: swaggerUi.serve,
  swaggerSetup: swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true
    }
  }),
  swaggerSpec
}; 