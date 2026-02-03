const { AutomationRule } = require('../../models/AutomationRule');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

const VALID_TRIGGER_TYPES = ['delay', 'missing-update'];
const VALID_ACTIONS = ['notify', 'escalate'];
const VALID_THRESHOLD_UNITS = ['hours'];

const resolveMerchantId = (req) => {
  if (req.user.role === 'Admin' && req.body?.merchantId) {
    return req.body.merchantId;
  }
  return req.user.id;
};

const createRule = asyncHandler(async (req, res, next) => {
  const { triggerType, threshold, thresholdUnit, action, name } = req.body;

  // Validate triggerType
  if (!triggerType) {
    return next(new ApiError('Trigger type is required', 400));
  }
  if (!VALID_TRIGGER_TYPES.includes(triggerType)) {
    return next(
      new ApiError(`Invalid trigger type. Must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`, 400)
    );
  }

  // Validate threshold
  if (threshold === undefined || threshold === null) {
    return next(new ApiError('Threshold is required', 400));
  }
  const parsedThreshold = Number(threshold);
  if (isNaN(parsedThreshold) || parsedThreshold < 0) {
    return next(new ApiError('Threshold must be a non-negative number', 400));
  }

  // Validate optional thresholdUnit if provided
  if (thresholdUnit !== undefined && !VALID_THRESHOLD_UNITS.includes(thresholdUnit)) {
    return next(
      new ApiError(
        `Invalid threshold unit. Must be one of: ${VALID_THRESHOLD_UNITS.join(', ')}`,
        400
      )
    );
  }

  // Validate optional action if provided
  if (action !== undefined && !VALID_ACTIONS.includes(action)) {
    return next(new ApiError(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`, 400));
  }

  const merchantId = resolveMerchantId(req);

  const rule = await AutomationRule.create({
    merchantId,
    createdBy: req.user.id,
    triggerType,
    threshold: parsedThreshold,
    thresholdUnit,
    action,
    name,
  });

  return ApiSuccess(res, { rule }, 201);
});

const listRules = asyncHandler(async (req, res, next) => {
  const merchantId =
    req.user.role === 'Admin' && req.query.merchantId ? req.query.merchantId : req.user.id;
  const rules = await AutomationRule.find({ merchantId }).sort({ createdAt: -1 });
  return ApiSuccess(res, { rules });
});

const updateRule = asyncHandler(async (req, res, next) => {
  const merchantId =
    req.user.role === 'Admin' && req.body?.merchantId ? req.body.merchantId : req.user.id;

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
