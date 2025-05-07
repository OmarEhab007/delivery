# Logging System

## Overview

This document describes the logging system in the Delivery App, designed to help track application behavior, debug issues, and monitor performance.

## Log Types

The application uses various log types:

1. **API Request/Response Logs**: Details about HTTP requests and responses
2. **Error Logs**: Application errors with stack traces
3. **Database Logs**: MongoDB queries and operations
4. **System Logs**: Application startup, shutdown, and general operation logs
5. **Security Logs**: Authentication events, access denials, etc.
6. **Performance Logs**: Timing information for key operations

## Log Format

All logs contain the following standard fields:

- **timestamp**: When the log was generated
- **level**: Log severity (error, warn, info, debug)
- **message**: Human-readable log message
- **service**: Service name ("delivery-app")

Additional context fields are included based on log type.

## Log Files

Logs are stored in the `logs/` directory:

- **combined.log**: All logs (legacy format)
- **error.log**: Only error logs (legacy format)
- **application-YYYY-MM-DD.log**: Daily application logs
- **error-YYYY-MM-DD.log**: Daily error logs
- **exception-YYYY-MM-DD.log**: Daily uncaught exception logs
- **access.log**: HTTP access logs (Morgan format)

## Log Rotation

Log files are automatically rotated daily using the `winston-daily-rotate-file` package. The configuration maintains:

- One log file per day
- Maximum file size of 20MB
- Retention of logs for 14 days

## Log Levels

The application uses the following log levels, from highest to lowest priority:

1. **error**: Critical errors that require immediate attention
2. **warn**: Warning conditions that should be addressed
3. **info**: Informational messages about normal operation
4. **debug**: Detailed debugging information (development only)
5. **silly**: Extremely detailed debugging (rarely used)

The active log level is controlled by the `LOG_LEVEL` environment variable.

## Using the Logger

The logger is available by requiring the logger module:

```javascript
const logger = require('../utils/logger');

// Basic logging
logger.info('Simple info message');
logger.error('Error occurred', { error: new Error('Details') });

// Specialized logging methods
logger.apiRequest('API request received', { requestDetails });
logger.apiResponse('API response sent', { responseDetails });
logger.database('Database operation', { operation: 'find', collection: 'users' });
logger.security('Security event', { event: 'login', user: 'username' });
logger.performance('Operation timing', { operation: 'query', duration: 125 });
```

## Log Management Utility

A utility script is provided for managing logs:

```bash
# View available commands
npm run logs help

# List all log files
npm run logs list

# View the last 10 lines of a specific log file
npm run logs tail application-2023-01-01.log 10

# Delete log files older than 30 days
npm run logs clean 30
```

## Environment Variables

- **LOG_LEVEL**: Sets the minimum log level to record (default: 'info')
- **NODE_ENV**: Affects console logging format and verbosity

## Best Practices

1. Use appropriate log levels
2. Include context in log messages
3. Avoid logging sensitive information (passwords, tokens, etc.)
4. Log at the beginning and end of important operations
5. Include request IDs in logs for request tracing
6. Add structured data as second parameter rather than string interpolation

## Monitoring and Alerting

For production environments, consider:

1. Forwarding logs to a centralized log management system
2. Setting up alerting for error-level logs
3. Creating dashboards for monitoring application health
4. Implementing log-based metrics

## Troubleshooting

If logs are not being created:

1. Check if the `logs` directory exists and has write permissions
2. Verify the `LOG_LEVEL` setting is not too restrictive
3. Ensure disk space is available
4. Check for errors during application startup 