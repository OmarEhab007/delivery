jest.mock('../../src/services/reporting/analyticsService', () => ({
  getKpiSummary: jest.fn(),
  getLanePerformance: jest.fn(),
}));

const { getKpiSummary, getLanePerformance } = require('../../src/services/reporting/analyticsService');
const { ApiError } = require('../../src/middleware/errorHandler');
const analyticsController = require('../../src/controllers/reporting/analyticsController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('analyticsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses merchantId from admin query params', async () => {
    getKpiSummary.mockResolvedValue({ totalShipments: 1 });
    const req = {
      user: { id: 'admin-1', role: 'Admin' },
      query: { merchantId: 'merchant-1' },
    };
    const res = mockRes();

    await analyticsController.getKpis(req, res, jest.fn());

    expect(getKpiSummary).toHaveBeenCalledWith(
      expect.objectContaining({ merchantId: 'merchant-1' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 for invalid startDate', async () => {
    const req = {
      user: { id: 'u1', role: 'Merchant' },
      query: { startDate: 'not-a-date' },
    };
    const res = mockRes();
    const next = jest.fn();

    await analyticsController.getKpis(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 for invalid endDate', async () => {
    const req = {
      user: { id: 'u1', role: 'Merchant' },
      query: { endDate: 'not-a-date' },
    };
    const res = mockRes();
    const next = jest.fn();

    await analyticsController.getLanePerformanceReport(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when startDate is after endDate', async () => {
    const req = {
      user: { id: 'u1', role: 'Merchant' },
      query: { startDate: '2025-02-02', endDate: '2025-01-01' },
    };
    const res = mockRes();
    const next = jest.fn();

    await analyticsController.getKpis(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns KPI summary for merchants', async () => {
    getKpiSummary.mockResolvedValue({ deliveredCount: 2 });
    const req = { user: { id: 'merchant-1', role: 'Merchant' }, query: {} };
    const res = mockRes();

    await analyticsController.getKpis(req, res, jest.fn());

    expect(getKpiSummary).toHaveBeenCalledWith(expect.objectContaining({ merchantId: 'merchant-1' }));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ summary: { deliveredCount: 2 } }),
      })
    );
  });

  it('returns lane performance with custom limit', async () => {
    getLanePerformance.mockResolvedValue([{ originCountry: 'US' }]);
    const req = {
      user: { id: 'merchant-1', role: 'Merchant' },
      query: { limit: '5' },
    };
    const res = mockRes();

    await analyticsController.getLanePerformanceReport(req, res, jest.fn());

    expect(getLanePerformance).toHaveBeenCalledWith(
      expect.objectContaining({ limit: '5', merchantId: 'merchant-1' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
