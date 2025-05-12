const path = require('path');

const winston = require('winston');
require('winston-daily-rotate-file');

const { format } = winston;

// Define log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

// Create custom format
const customFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.json({
    space: 0,
    replacer: (key, value) => {
      // Handle circular references and complex objects
      if (key === 'error' && value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          code: value.code,
          statusCode: value.statusCode,
        };
      }
      return value;
    },
  })
);

// Configure console output format
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

// Create file transport with rotation
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat,
});

// Create error file transport with rotation
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat,
});

// Configure the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'delivery-app' },
  transports: [
    // Keep the old transports for backward compatibility
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: customFormat,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: customFormat,
    }),
    // Add the new rotating file transports
    fileRotateTransport,
    errorFileRotateTransport,
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format: customFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'exception-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: customFormat,
    }),
  ],
});

// If we're not in production, also log to the console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
    })
  );
}

// Add convenience methods for structured logging
logger.apiRequest = (message, details) => {
  logger.info(message, { type: 'API_REQUEST', ...details });
};

logger.apiResponse = (message, details) => {
  const level = details.statusCode >= 500 ? 'error' : details.statusCode >= 400 ? 'warn' : 'info';

  logger[level](message, { type: 'API_RESPONSE', ...details });
};

logger.database = (message, details) => {
  logger.debug(message, { type: 'DATABASE', ...details });
};

logger.security = (message, details) => {
  logger.warn(message, { type: 'SECURITY', ...details });
};

logger.performance = (message, details) => {
  logger.info(message, { type: 'PERFORMANCE', ...details });
};

// Export the logger
module.exports = logger;
