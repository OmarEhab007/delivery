const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema(
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
    name: {
      type: String,
      trim: true,
    },
    triggerType: {
      type: String,
      enum: ['delay', 'missing-update'],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
    },
    thresholdUnit: {
      type: String,
      enum: ['hours'],
      default: 'hours',
    },
    action: {
      type: String,
      enum: ['notify', 'escalate'],
      default: 'notify',
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: Date,
    lastTriggeredShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
    },
  },
  {
    timestamps: true,
  }
);

automationRuleSchema.index({ merchantId: 1, active: 1 });
automationRuleSchema.index({ triggerType: 1, active: 1 });

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

module.exports = {
  AutomationRule,
};
