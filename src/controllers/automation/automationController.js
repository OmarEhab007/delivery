const { AutomationRule } = require('../../models/AutomationRule');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

const resolveMerchantId = (req) => {
  if (req.user.role === 'Admin' && req.body?.merchantId) {
    return req.body.merchantId;
  }
  return req.user.id;
};

const createRule = asyncHandler(async (req, res, next) => {
  const { triggerType, threshold, thresholdUnit, action, name } = req.body;

  if (!triggerType || threshold === undefined) {
    return next(new ApiError('Trigger type and threshold are required', 400));
  }

  const merchantId = resolveMerchantId(req);

  const rule = await AutomationRule.create({
    merchantId,
    createdBy: req.user.id,
    triggerType,
    threshold,
    thresholdUnit,
    action,
    name,
  });

  return ApiSuccess(res, { rule }, 201);
});

const listRules = asyncHandler(async (req, res, next) => {
  const merchantId = req.user.role === 'Admin' && req.query.merchantId ? req.query.merchantId : req.user.id;
  const rules = await AutomationRule.find({ merchantId }).sort({ createdAt: -1 });
  return ApiSuccess(res, { rules });
});

const updateRule = asyncHandler(async (req, res, next) => {
  const merchantId = req.user.role === 'Admin' && req.body?.merchantId ? req.body.merchantId : req.user.id;

  const rule = await AutomationRule.findOne({ _id: req.params.id, merchantId });

  if (!rule) {
    return next(new ApiError('Automation rule not found', 404));
  }

  const updates = ['triggerType', 'threshold', 'thresholdUnit', 'action', 'active', 'name'];
  updates.forEach((field) => {
    if (req.body[field] !== undefined) {
      rule[field] = req.body[field];
    }
  });

  await rule.save();

  return ApiSuccess(res, { rule });
});

module.exports = {
  createRule,
  listRules,
  updateRule,
};
