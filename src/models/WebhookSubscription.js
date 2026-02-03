const mongoose = require('mongoose');

const webhookSubscriptionSchema = new mongoose.Schema(
  {
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
    endpointUrl: {
      type: String,
      required: [true, 'Webhook endpoint URL is required'],
      trim: true,
    },
    eventTypes: {
      type: [String],
      required: true,
      default: ['shipment.status.updated'],
    },
    secret: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'DISABLED'],
      default: 'ACTIVE',
    },
    lastDeliveredAt: Date,
    failureCount: {
      type: Number,
      default: 0,
    },
    lastFailureAt: Date,
  },
  {
    timestamps: true,
  }
);

webhookSubscriptionSchema.index({ merchantId: 1, status: 1 });
webhookSubscriptionSchema.index({ endpointUrl: 1 });

const WebhookSubscription = mongoose.model(
  'WebhookSubscription',
  webhookSubscriptionSchema
);

module.exports = {
  WebhookSubscription,
};
