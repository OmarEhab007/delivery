const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding user's tokens
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

/**
 * Static method to hash a refresh token
 * @param {string} token - Raw refresh token
 * @returns {string} Hashed token
 */
refreshTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Static method to generate a new refresh token
 * @returns {string} Random token
 */
refreshTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Static method to create and save a new refresh token
 * @param {string} userId - User ID
 * @param {Object} options - Additional options (userAgent, ipAddress)
 * @returns {Promise<Object>} Object containing raw token and saved document
 */
refreshTokenSchema.statics.createToken = async function (userId, options = {}) {
  const token = this.generateToken();
  const tokenHash = this.hashToken(token);

  // Default expiry: 7 days
  const expiresInMs =
    parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS, 10) * 24 * 60 * 60 * 1000 ||
    7 * 24 * 60 * 60 * 1000;

  const expiresAt = new Date(Date.now() + expiresInMs);

  const refreshToken = await this.create({
    userId,
    tokenHash,
    expiresAt,
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
  });

  return {
    token,
    refreshToken,
  };
};

/**
 * Static method to verify and find a refresh token
 * @param {string} token - Raw refresh token
 * @returns {Promise<Object|null>} Refresh token document or null
 */
refreshTokenSchema.statics.findByToken = async function (token) {
  const tokenHash = this.hashToken(token);

  return this.findOne({
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Static method to revoke a refresh token
 * @param {string} token - Raw refresh token
 * @returns {Promise<boolean>} True if revoked successfully
 */
refreshTokenSchema.statics.revokeToken = async function (token) {
  const tokenHash = this.hashToken(token);

  const result = await this.updateOne(
    { tokenHash, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
    }
  );

  return result.modifiedCount > 0;
};

/**
 * Static method to revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
refreshTokenSchema.statics.revokeAllUserTokens = async function (userId) {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
    }
  );

  return result.modifiedCount;
};

/**
 * Static method to clean up expired tokens
 * @returns {Promise<number>} Number of tokens deleted
 */
refreshTokenSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    ],
  });

  return result.deletedCount;
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
