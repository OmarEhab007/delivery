const buffer = require('buffer');

if (!buffer.SlowBuffer) {
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
