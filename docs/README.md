# Delivery App Documentation

Welcome to the comprehensive documentation for the Delivery App system. This documentation is designed to serve as a reference for backend developers, frontend developers, testers, and system administrators.

## Table of Contents

### System Documentation

1. [System Architecture](./SYSTEM_ARCHITECTURE.md) - High-level overview of the system components and design
2. [Database Schema](./DATABASE_SCHEMA.md) - Detailed documentation of database models and relationships
3. [API Documentation](./API_DOCUMENTATION.md) - Complete reference for all API endpoints

### Developer Guides

1. [Backend Development Guide](./BACKEND_GUIDE.md) - Guide for backend developers
2. [API Testing Guide](./API_TESTING_GUIDE.md) - Guide for testing the API endpoints

## System Overview

The Delivery App is a comprehensive platform for connecting merchants with truck owners for shipping cargo. The system allows merchants to create shipment requests, truck owners to bid on these requests, and facilitates the end-to-end management of the shipping process.

### Key Features

- User management with multiple roles (Admin, Merchant, Truck Owner, Driver)
- Shipment creation and lifecycle management
- Application/bidding system for truck owners
- Timeline tracking for shipments
- Location tracking for in-transit shipments
- Secure authentication and authorization

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React.js (for admin panel)
- **Authentication**: JSON Web Tokens (JWT)
- **Deployment**: Docker support

## Getting Started

To set up a development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.sample` to `.env` and configure environment variables
4. Start the development server: `npm run dev`

For more detailed instructions, refer to the specific development guides.

## API Reference

The API follows RESTful principles and is organized around the following resources:

- **Auth**: User registration, login, and password management
- **Shipments**: Creating and managing shipments
- **Applications**: Bidding on shipments
- **Trucks**: Managing truck information
- **Users**: User profile management

For a complete API reference, see the [API Documentation](./API_DOCUMENTATION.md).

## Contributing

When contributing to this project, please follow the coding standards and best practices outlined in the developer guides.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 