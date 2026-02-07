jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    aggregate: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
}));

const { Shipment } = require('../../src/models/Shipment');
const reportingController = require('../../src/controllers/admin/reportingController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('reportingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns shipment status trends for daily timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, month: 1, day: 2, status: 'COMPLETED' }, count: 2 },
    ]);

    const req = { query: { timeframe: 'daily', limit: '2', startDate: '2025-01-01' } };
    const res = mockRes();

    await reportingController.getShipmentStatusTrends(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Array),
    });
  });

  it('returns shipment status trends for default monthly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, month: 1, status: 'PENDING' }, count: 1 },
      { _id: { year: 2025, month: 2, status: 'COMPLETED' }, count: 2 },
    ]);

    const req = { query: { endDate: '2025-02-28', limit: '2' } };
    const res = mockRes();

    await reportingController.getShipmentStatusTrends(req, res);

    expect(Shipment.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            createdAt: expect.objectContaining({ $lte: expect.any(Date) }),
          }),
        }),
      ])
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns shipment status trends for weekly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, week: 6, status: 'COMPLETED' }, count: 4 },
    ]);

    const req = { query: { timeframe: 'weekly', startDate: '2025-01-01', limit: '1' } };
    const res = mockRes();

    await reportingController.getShipmentStatusTrends(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns revenue analysis for weekly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, week: 5 }, totalRevenue: 1000, count: 2, avgRevenue: 500 },
    ]);

    const req = { query: { timeframe: 'weekly', limit: '1', endDate: '2025-02-01' } };
    const res = mockRes();

    await reportingController.getRevenueAnalysis(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Array),
    });
  });

  it('returns revenue analysis for default monthly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, month: 3 }, totalRevenue: 300, count: 3, avgRevenue: 100 },
    ]);

    const req = { query: { limit: '1' } };
    const res = mockRes();

    await reportingController.getRevenueAnalysis(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data[0].period).toBe('2025-03');
  });

  it('returns revenue analysis for daily timeframe and formats periods', async () => {
    Shipment.aggregate.mockResolvedValue([
      { _id: { year: 2025, month: 2, day: 1 }, totalRevenue: 200, count: 1, avgRevenue: 200 },
      { _id: { year: 2025, month: 2, day: 2 }, totalRevenue: 100, count: 1, avgRevenue: 100 },
    ]);

    const req = { query: { timeframe: 'daily', limit: '2', startDate: '2025-02-01' } };
    const res = mockRes();

    await reportingController.getRevenueAnalysis(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data[0].period).toBe('2025-02-02');
    expect(payload.data[1].period).toBe('2025-02-01');
  });

  it('returns performance metrics for drivers', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'driver1', totalShipments: 3 }]);

    const req = { query: { entityType: 'driver', timeframe: 'lastWeek', limit: '5' } };
    const res = mockRes();

    await reportingController.getPerformanceMetrics(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns performance metrics for drivers in lastMonth timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'driver2', totalShipments: 1 }]);

    const req = { query: { entityType: 'driver', timeframe: 'lastMonth', limit: '2' } };
    const res = mockRes();

    await reportingController.getPerformanceMetrics(req, res);

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual(
      expect.objectContaining({
        $match: expect.objectContaining({
          updatedAt: expect.objectContaining({ $gte: expect.any(Date) }),
        }),
      })
    );
  });

  it('returns performance metrics for drivers in lastQuarter timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'driver3', totalShipments: 2 }]);

    const req = { query: { entityType: 'driver', timeframe: 'lastQuarter', limit: '2' } };
    const res = mockRes();

    await reportingController.getPerformanceMetrics(req, res);

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.updatedAt).toBeDefined();
  });

  it('returns performance metrics for trucks', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'truck1', totalShipments: 2 }]);

    const req = { query: { entityType: 'truck', timeframe: 'allTime', limit: '3' } };
    const res = mockRes();

    await reportingController.getPerformanceMetrics(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns performance metrics for unknown entity types', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'other', totalShipments: 1 }]);

    const req = { query: { entityType: 'other', timeframe: 'allTime', limit: '1' } };
    const res = mockRes();

    await reportingController.getPerformanceMetrics(req, res);

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    expect(pipeline).toEqual([
      expect.objectContaining({
        $match: { status: 'COMPLETED' },
      }),
    ]);
  });

  it('returns customer insights sorted by revenue', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'm1', totalRevenue: 1000 }]);

    const req = { query: { sortBy: 'revenue', limit: '2' } };
    const res = mockRes();

    await reportingController.getCustomerInsights(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns customer insights with default sort', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'm3', totalShipments: 5 }]);

    const req = { query: {} };
    const res = mockRes();

    await reportingController.getCustomerInsights(req, res);

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find((stage) => stage.$sort);
    expect(sortStage).toEqual({ $sort: { totalShipments: -1 } });
  });

  it('returns customer insights sorted by avgValue', async () => {
    Shipment.aggregate.mockResolvedValue([{ _id: 'm2', avgOrderValue: 300 }]);

    const req = { query: { sortBy: 'avgValue', limit: '1' } };
    const res = mockRes();

    await reportingController.getCustomerInsights(req, res);

    const pipeline = Shipment.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find((stage) => stage.$sort);
    expect(sortStage).toEqual({ $sort: { avgOrderValue: -1 } });
  });

  it('returns operational efficiency data for daily timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      {
        _id: { year: 2025, month: 1, day: 1 },
        totalShipments: 2,
        completedShipments: 1,
        cancelledShipments: 0,
        delayedShipments: 0,
        completionRate: 0.5,
        cancellationRate: 0,
        delayRate: 0,
        avgDeliveryTime: 1,
      },
    ]);

    const req = { query: { timeframe: 'daily', limit: '1' } };
    const res = mockRes();

    await reportingController.getOperationalEfficiency(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns operational efficiency data for weekly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      {
        _id: { year: 2025, week: 6 },
        totalShipments: 3,
        completedShipments: 2,
        cancelledShipments: 1,
        delayedShipments: 0,
        completionRate: 0.66,
        cancellationRate: 0.33,
        delayRate: 0,
        avgDeliveryTime: 1,
      },
    ]);

    const req = { query: { timeframe: 'weekly', limit: '1', endDate: '2025-02-15' } };
    const res = mockRes();

    await reportingController.getOperationalEfficiency(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data[0].period).toContain('W');
  });

  it('returns operational efficiency data for monthly timeframe', async () => {
    Shipment.aggregate.mockResolvedValue([
      {
        _id: { year: 2025, month: 4 },
        totalShipments: 5,
        completedShipments: 4,
        cancelledShipments: 1,
        delayedShipments: 0,
        completionRate: 0.8,
        cancellationRate: 0.2,
        delayRate: 0,
        avgDeliveryTime: 1,
      },
    ]);

    const req = { query: { timeframe: 'monthly', limit: '1' } };
    const res = mockRes();

    await reportingController.getOperationalEfficiency(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data[0].period).toBe('2025-04');
  });

  it('returns geospatial analytics for originDestination', async () => {
    Shipment.aggregate.mockResolvedValue([
      {
        _id: { origin: 'US', destination: 'CA' },
        count: 3,
        totalRevenue: 500,
        avgTravelTime: 2,
      },
    ]);

    const req = { query: { analysisType: 'originDestination' } };
    const res = mockRes();

    await reportingController.getGeospatialAnalytics(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns geospatial analytics for hotspots', async () => {
    Shipment.aggregate.mockResolvedValue([
      {
        originHotspots: [{ _id: 'US', count: 2 }],
        destinationHotspots: [{ _id: 'CA', count: 1 }],
      },
    ]);

    const req = { query: { analysisType: 'hotspots' } };
    const res = mockRes();

    await reportingController.getGeospatialAnalytics(req, res);

    expect(Shipment.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns geospatial analytics when analysisType is unknown', async () => {
    Shipment.aggregate.mockResolvedValue([{ ok: true }]);

    const req = { query: { analysisType: 'unknown' } };
    const res = mockRes();

    await reportingController.getGeospatialAnalytics(req, res);

    expect(Shipment.aggregate).toHaveBeenCalledWith([]);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when revenue analysis fails', async () => {
    Shipment.aggregate.mockRejectedValue(new Error('fail'));

    const req = { query: { timeframe: 'monthly' } };
    const res = mockRes();

    await reportingController.getRevenueAnalysis(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 500 when aggregation fails', async () => {
    Shipment.aggregate.mockRejectedValue(new Error('fail'));

    const req = { query: {} };
    const res = mockRes();

    await reportingController.getShipmentStatusTrends(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
