const mongoose = require('mongoose');

const integrationCredentialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Credential name is required'],
      trim: true,
    },
    apiKeyHash: {
      type: String,
      required: true,
      select: false,
    },
    apiKeyPrefix: {
      type: String,
      required: true,
      trim: true,
    },
    scopes: {
      type: [String],
      default: ['shipments:read', 'shipments:write', 'webhooks:read', 'webhooks:write'],
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: Date,
  },
  {
    timestamps: true,
  }
);

integrationCredentialSchema.index({ merchantId: 1, active: 1 });
integrationCredentialSchema.index({ apiKeyHash: 1 }, { unique: true });
integrationCredentialSchema.index({ apiKeyPrefix: 1 });

const IntegrationCredential = mongoose.model(
  'IntegrationCredential',
  integrationCredentialSchema
);

module.exports = {
  IntegrationCredential,
};
