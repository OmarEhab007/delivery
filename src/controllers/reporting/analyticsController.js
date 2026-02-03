const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { getKpiSummary, getLanePerformance } = require('../../services/reporting/analyticsService');

const resolveMerchantId = (req) => {
  if (req.user.role === 'Admin' && req.query.merchantId) {
    return req.query.merchantId;
  }
  return req.user.id;
};

const getKpis = asyncHandler(async (req, res, next) => {
  const merchantId = resolveMerchantId(req);
  const { startDate, endDate } = req.query;

  const summary = await getKpiSummary({ merchantId, startDate, endDate });

  return ApiSuccess(res, { summary });
});

const getLanePerformanceReport = asyncHandler(async (req, res, next) => {
  const merchantId = resolveMerchantId(req);
  const { startDate, endDate, limit = 10 } = req.query;

  const lanes = await getLanePerformance({ merchantId, startDate, endDate, limit });

  return ApiSuccess(res, { lanes });
});

module.exports = {
  getKpis,
  getLanePerformanceReport,
};
