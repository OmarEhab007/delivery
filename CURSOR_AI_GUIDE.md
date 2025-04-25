# Cursor AI Development Guide for Delivery App

This guide is specifically for Cursor AI to assist in the development of the Delivery App. It outlines the development approach, coding standards, and provides context for each module.

## Development Approach

### Incremental Development
1. Start with implementing one module at a time
2. Complete the core functionality before moving to edge cases
3. Follow the task order in TASKS.md
4. Always ensure existing functionality is not broken when adding new features

### Code Quality
1. Write clean, maintainable code
2. Include comprehensive error handling
3. Add validation for all user inputs
4. Write explicit, descriptive variable and function names
5. Include JSDoc comments for all functions and methods

## Module-Specific Guidance

### User Authentication and Management
- Complete the password reset functionality using email (nodemailer)
- Implement proper role-based middleware that checks both JWT validity and user role
- Add user profile management endpoints for updating basic information
- Consider implementing email verification for new accounts

### Fleet Management 
- Truck CRUD operations should always verify that the user is a Truck Owner
- Include validation for truck details (registration number format, etc.)
- When a truck is assigned to a shipment, mark it as unavailable until delivery is completed
- Implement search functionality with multiple filters (capacity, availability, location)

### Shipment Management
- Implement state transitions with validation (e.g., can't go from REQUESTED to DELIVERED)
- Create endpoints for Merchants to view their shipments with different status filters
- Allow Truck Owners to see only shipments they can apply for or have been assigned
- Implement pagination for shipment listings to handle large volumes

### Application/Bid System
- Ensure a Truck Owner can't apply multiple times to the same shipment
- Implement comparison functionality to help Merchants choose between applications
- When an application is accepted, automatically reject all others for that shipment
- Include notification triggers for all status changes

### Document Management
- Integrate with AWS S3 for secure file storage
- Implement proper document type validation (file extensions, size limits)
- Create endpoints for retrieving documents with proper access control
- Associate documents with specific shipment stages

### Real-time Tracking
- Implement Socket.io for real-time updates
- Create a secure connection mechanism using JWT for authentication
- Store location history for shipments in a space-efficient manner
- Implement efficient broadcasting to only relevant clients

## Best Practices

### Security
- Never trust user input, always validate
- Use parameterized queries for MongoDB to prevent injection
- Implement rate limiting for sensitive endpoints
- Secure all file uploads with validation and scanning
- Ensure JWT tokens are securely handled

### Performance
- Use indexes for frequently queried fields in MongoDB
- Implement pagination for list endpoints
- Use efficient database query patterns
- Cache frequently accessed, rarely changing data
- Consider using aggregation for complex queries

### Testing
- Write unit tests for critical business logic
- Create integration tests for API endpoints
- Use Jest for testing
- Implement test fixtures for consistent test data

## Implementation Order

For each module, follow this implementation order:

1. Create/update models and validations
2. Implement service layer with business logic
3. Create controller methods
4. Set up routes with proper middleware
5. Add tests
6. Document the API endpoints

## Troubleshooting Common Issues

### MongoDB Connection Issues
- Check connection string
- Ensure MongoDB is running
- Verify network connectivity
- Check authentication credentials

### JWT Authentication Problems
- Validate token signing secret
- Check token expiration
- Ensure proper token storage and transmission
- Verify payload structure

### API Endpoint Errors
- Check route definition
- Verify controller method implementation
- Ensure proper middleware is applied
- Validate request body against expected schema

## Next Steps

1. Complete the remaining User Authentication tasks
2. Move on to implementing the Fleet Management module
3. Continue with Shipment Management implementation
4. Focus on the Application/Bid System
5. Implement Document Management
6. Add Real-time Tracking functionality
7. Create comprehensive testing
8. Prepare for deployment

Refer to the TASKS.md file for specific tasks and their current status. Mark tasks as completed as you implement them.
