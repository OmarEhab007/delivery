/**
 * Compression middleware and utilities
 * Enhances the standard compression library with additional functionality
 */

const compression = require('compression');
const logger = require('../utils/logger');

/**
 * Size formatter utility
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Custom compression middleware with logging and additional features
 * @param {Object} options - Compression options
 * @returns {Function} - Express middleware
 */
const compressionWithLogging = (options = {}) => {
  // Create standard compression middleware
  const compressionMiddleware = compression({
    // Filter function to determine which responses should be compressed
    filter: (req, res) => {
      // Don't compress responses with this header
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use the default filter
      return compression.filter(req, res);
    },
    // Compression level (0-9, where 9 is maximum compression)
    level: options.level || 6,
    // Don't compress responses smaller than this size
    threshold: options.threshold || 0
  });
  
  // Return middleware function
  return (req, res, next) => {
    // Save the original end method
    const originalEnd = res.end;
    
    // Track response size data for logging
    let originalSize = 0;
    let compressedSize = 0;
    
    // Override the end method
    res.end = function(chunk, encoding) {
      // Only log for specific content types and successful responses
      if (
        res.statusCode >= 200 && 
        res.statusCode < 300 &&
        res.getHeader('Content-Type') && 
        res.getHeader('Content-Type').includes('application/json')
      ) {
        // Calculate sizes
        originalSize = res.getHeader('Content-Length') || 
                     (chunk ? Buffer.byteLength(chunk, encoding) : 0);
        compressedSize = res.getHeader('Content-Length') || 0;
        
        // Log compression data
        if (originalSize > 0 && compressedSize > 0 && originalSize > compressedSize) {
          const compressionRatio = (1 - (compressedSize / originalSize)) * 100;
          logger.debug('Response compression', {
            path: req.originalUrl || req.url,
            originalSize: formatBytes(originalSize),
            compressedSize: formatBytes(compressedSize),
            reduction: compressionRatio.toFixed(2) + '%',
            contentType: res.getHeader('Content-Type'),
            requestId: req.requestId
          });
        }
      }
      
      // Call original end method
      return originalEnd.apply(this, arguments);
    };
    
    // Continue with compression middleware
    compressionMiddleware(req, res, next);
  };
};

module.exports = {
  compressionWithLogging
}; 