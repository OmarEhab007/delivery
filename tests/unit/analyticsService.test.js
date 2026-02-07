jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

const mongoose = require('mongoose');
const { Shipment } = require('../../src/models/Shipment');
const { getKpiSummary, getLanePerformance } = require('../../src/services/reporting/analyticsService');

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds date range with startDate and returns KPI summary', async () => {
    Shipment.countDocuments
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);
    Shipment.aggregate.mockResolvedValue([
      { onTimeCount: 1, avgTransitHours: 10, avgDelayHours: 2 },
    ]);

    const result = await getKpiSummary({
      merchantId: '507f1f77bcf86cd799439011',
      startDate: '2025-01-01',
    });

    const match = Shipment.countDocuments.mock.calls[0][0];
    expect(match).toEqual(
      expect.objectContaining({
        merchantId: expect.any(mongoose.Types.ObjectId),
        createdAt: expect.objectContaining({ $gte: expect.any(Date) }),
      })
    );
    expect(result.onTimeRate).toBe(0.5);
    expect(result.averageTransitHours).toBe(10);
  });

  it('returns zeros when deliveredCount is zero and summary missing', async () => {
    Shipment.countDocuments
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    Shipment.aggregate.mockResolvedValue([]);

    const result = await getKpiSummary({
      merchantId: '507f1f77bcf86cd799439011',
      endDate: '2025-02-01',
    });

    const match = Shipment.countDocuments.mock.calls[0][0];
    expect(match).toEqual(
      expect.objectContaining({
        createdAt: expect.objectContaining({ $lte: expect.any(Date) }),
      })
    );
    expect(result.onTimeRate).toBe(0);
    expect(result.averageTransitHours).toBe(0);
    expect(result.averageDelayHours).toBe(0);
  });

  it('builds lane performance pipeline with date range and limit', async () => {
    Shipment.aggregate.mockResolvedValue([]);

    await getLanePerformance({
      merchantId: '507f1f77bcf86cd799439011',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      limit: '3',
    });

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    const matchStage = pipeline[0].$match;
    expect(matchStage).toEqual(
      expect.objectContaining({
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      })
    );
    expect(pipeline[pipeline.length - 1]).toEqual({ $limit: 3 });
  });
});
