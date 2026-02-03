const { ApiSuccess } = require('../../middleware/apiSuccess');
const { ApiError } = require('../../middleware/errorHandler');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { getKpiSummary, getLanePerformance } = require('../../services/reporting/analyticsService');

const resolveMerchantId = (req) => {
  if (req.user.role === 'Admin' && req.query.merchantId) {
    return req.query.merchantId;
  }
  return req.user.id;
};

/**
 * Validates date query parameters and returns parsed dates or null.
 * Returns an error message if validation fails.
 */
const validateDateParams = (startDate, endDate) => {
  let parsedStart = null;
  let parsedEnd = null;

  if (startDate) {
    const timestamp = Date.parse(startDate);
    if (isNaN(timestamp)) {
      return { error: 'Invalid startDate format. Use ISO 8601 format (e.g., 2024-01-01)' };
    }
    parsedStart = new Date(timestamp);
  }

  if (endDate) {
    const timestamp = Date.parse(endDate);
    if (isNaN(timestamp)) {
      return { error: 'Invalid endDate format. Use ISO 8601 format (e.g., 2024-01-01)' };
    }
    parsedEnd = new Date(timestamp);
  }

  if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
    return { error: 'startDate must be before or equal to endDate' };
  }

  return { startDate: parsedStart, endDate: parsedEnd };
};

const getKpis = asyncHandler(async (req, res, next) => {
  const merchantId = resolveMerchantId(req);
  const { startDate, endDate } = req.query;

  const dateValidation = validateDateParams(startDate, endDate);
  if (dateValidation.error) {
    return next(new ApiError(dateValidation.error, 400));
  }

  const summary = await getKpiSummary({
    merchantId,
    startDate: dateValidation.startDate,
    endDate: dateValidation.endDate,
  });

  return ApiSuccess(res, { summary });
});

const getLanePerformanceReport = asyncHandler(async (req, res, next) => {
  const merchantId = resolveMerchantId(req);
  const { startDate, endDate, limit = 10 } = req.query;

  const dateValidation = validateDateParams(startDate, endDate);
  if (dateValidation.error) {
    return next(new ApiError(dateValidation.error, 400));
  }

  const lanes = await getLanePerformance({
    merchantId,
    startDate: dateValidation.startDate,
    endDate: dateValidation.endDate,
    limit,
  });

  return ApiSuccess(res, { lanes });
});

module.exports = {
  getKpis,
  getLanePerformanceReport,
};
