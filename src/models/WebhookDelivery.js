const mongoose = require('mongoose');

const webhookDeliverySchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebhookSubscription',
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'FAILED',
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    responseCode: Number,
    error: String,
    durationMs: Number,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

webhookDeliverySchema.index({ subscriptionId: 1, createdAt: -1 });
webhookDeliverySchema.index({ status: 1, createdAt: -1 });

const WebhookDelivery = mongoose.model('WebhookDelivery', webhookDeliverySchema);

module.exports = {
  WebhookDelivery,
};
