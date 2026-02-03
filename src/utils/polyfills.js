/**
 * SlowBuffer Polyfill
 *
 * SlowBuffer was deprecated in Node.js 6+ but some older dependencies
 * (particularly crypto-related packages like jsonwebtoken) may still
 * reference it. This polyfill ensures backward compatibility.
 */
const buffer = require('buffer');
const logger = require('./logger');

if (!buffer.SlowBuffer) {
  logger.debug('Applying SlowBuffer polyfill for backward compatibility');
  buffer.SlowBuffer = buffer.Buffer;
}

if (!buffer.SlowBuffer.prototype.equal) {
  buffer.SlowBuffer.prototype.equal = function equal(other) {
    if (!buffer.Buffer.isBuffer(other)) {
      return false;
    }

    if (this.length !== other.length) {
      return false;
    }

    for (let i = 0; i < this.length; i += 1) {
      if (this[i] !== other[i]) {
        return false;
      }
    }

    return true;
  };
}
