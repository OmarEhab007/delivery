const mongoose = require('mongoose');
const { Shipment } = require('../../models/Shipment');
const Truck = require('../../models/Truck');
const User = require('../../models/User');
const { Application } = require('../../models/Application');
const logger = require('../../utils/logger');

/**
 * @desc    Get shipment reports by status over time
 * @route   GET /api/admin/reports/shipments/status-trends
 * @access  Admin
 */
const getShipmentStatusTrends = async (req, res) => {
  try {
    const { timeframe = 'monthly', startDate, endDate, limit = 12 } = req.query;
    
    let timeGrouping;
    let dateFilter = {};
    
    // Parse dates if provided
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }
    
    // Set up time grouping based on timeframe parameter
    switch (timeframe) {
      case 'daily':
        timeGrouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        timeGrouping = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        timeGrouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }
    
    const pipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            ...timeGrouping,
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: parseInt(limit, 10) * 10 } // Multiplied to ensure we get enough data for each status
    ];
    
    const results = await Shipment.aggregate(pipeline);
    
    // Transform the results to a more usable format
    const formattedResults = transformTimeSeriesResults(results, timeframe);
    
    return res.status(200).json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    logger.error(`Error in getShipmentStatusTrends: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving shipment status trends'
    });
  }
};

/**
 * @desc    Get revenue analysis
 * @route   GET /api/admin/reports/revenue
 * @access  Admin
 */
const getRevenueAnalysis = async (req, res) => {
  try {
    const { timeframe = 'monthly', startDate, endDate, limit = 12 } = req.query;
    
    let timeGrouping;
    let dateFilter = {};
    
    // Parse dates if provided
    if (startDate) {
      dateFilter['paymentDetails.paymentDate'] = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      dateFilter['paymentDetails.paymentDate'] = { 
        ...dateFilter['paymentDetails.paymentDate'], 
        $lte: new Date(endDate) 
      };
    }
    
    // Set up time grouping based on timeframe parameter
    switch (timeframe) {
      case 'daily':
        timeGrouping = {
          year: { $year: '$paymentDetails.paymentDate' },
          month: { $month: '$paymentDetails.paymentDate' },
          day: { $dayOfMonth: '$paymentDetails.paymentDate' }
        };
        break;
      case 'weekly':
        timeGrouping = {
          year: { $year: '$paymentDetails.paymentDate' },
          week: { $week: '$paymentDetails.paymentDate' }
        };
        break;
      case 'monthly':
      default:
        timeGrouping = {
          year: { $year: '$paymentDetails.paymentDate' },
          month: { $month: '$paymentDetails.paymentDate' }
        };
        break;
    }
    
    // Only consider shipments with verified payments
    dateFilter['paymentDetails.paymentVerified'] = true;
    
    const pipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: timeGrouping,
          totalRevenue: { $sum: '$paymentDetails.amount' },
          count: { $sum: 1 },
          avgRevenue: { $avg: '$paymentDetails.amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: parseInt(limit, 10) }
    ];
    
    const results = await Shipment.aggregate(pipeline);
    
    // Format dates in the response
    const formattedResults = results.map(item => {
      let dateString;
      
      if (timeframe === 'daily') {
        dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (timeframe === 'weekly') {
        dateString = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else {
        dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        period: dateString,
        totalRevenue: item.totalRevenue,
        shipmentCount: item.count,
        averageRevenuePerShipment: item.avgRevenue
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedResults.reverse() // Reverse to get chronological order
    });
  } catch (error) {
    logger.error(`Error in getRevenueAnalysis: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving revenue analysis'
    });
  }
};

/**
 * @desc    Get performance metrics for drivers and trucks
 * @route   GET /api/admin/reports/performance
 * @access  Admin
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    const { entityType = 'driver', timeframe = 'allTime', limit = 10 } = req.query;
    
    let pipeline = [];
    
    // Filter for completed shipments only
    const matchStage = { $match: { status: 'COMPLETED' } };
    
    if (timeframe !== 'allTime') {
      let dateFilter = {};
      const now = new Date();
      
      switch (timeframe) {
        case 'lastWeek':
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          dateFilter = { $gte: lastWeek };
          break;
        case 'lastMonth':
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          dateFilter = { $gte: lastMonth };
          break;
        case 'lastQuarter':
          const lastQuarter = new Date(now);
          lastQuarter.setMonth(now.getMonth() - 3);
          dateFilter = { $gte: lastQuarter };
          break;
        default:
          break;
      }
      
      matchStage.$match.updatedAt = dateFilter;
    }
    
    pipeline.push(matchStage);
    
    if (entityType === 'driver') {
      // Driver performance metrics
      pipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'users',
            localField: 'assignedDriverId',
            foreignField: '_id',
            as: 'driver'
          }
        },
        { $unwind: { path: '$driver', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$assignedDriverId',
            driverName: { $first: '$driver.name' },
            driverEmail: { $first: '$driver.email' },
            totalShipments: { $sum: 1 },
            totalDistance: { $sum: '$distanceTraveled' },
            averageRating: { $avg: '$rating.overall' },
            onTimeDeliveryRate: {
              $avg: {
                $cond: [
                  { $eq: ['$isDelayed', false] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { totalShipments: -1 } },
        { $limit: parseInt(limit, 10) }
      ];
    } else if (entityType === 'truck') {
      // Truck performance metrics
      pipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'trucks',
            localField: 'assignedTruckId',
            foreignField: '_id',
            as: 'truck'
          }
        },
        { $unwind: { path: '$truck', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$assignedTruckId',
            truckRegistration: { $first: '$truck.registrationNumber' },
            truckModel: { $first: '$truck.model' },
            totalShipments: { $sum: 1 },
            totalDistance: { $sum: '$distanceTraveled' },
            breakdownRate: {
              $avg: {
                $cond: [
                  { $eq: ['$hadBreakdown', true] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { totalShipments: -1 } },
        { $limit: parseInt(limit, 10) }
      ];
    }
    
    const results = await Shipment.aggregate(pipeline);
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in getPerformanceMetrics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving performance metrics'
    });
  }
};

/**
 * @desc    Get customer insights
 * @route   GET /api/admin/reports/customers
 * @access  Admin
 */
const getCustomerInsights = async (req, res) => {
  try {
    const { sortBy = 'shipmentCount', limit = 10 } = req.query;
    
    let sortField = { totalShipments: -1 };
    if (sortBy === 'revenue') {
      sortField = { totalRevenue: -1 };
    } else if (sortBy === 'avgValue') {
      sortField = { avgOrderValue: -1 };
    }
    
    const pipeline = [
      { $match: { 'paymentDetails.paymentVerified': true } },
      {
        $lookup: {
          from: 'users',
          localField: 'merchantId',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: { path: '$merchant', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$merchantId',
          merchantName: { $first: '$merchant.name' },
          merchantEmail: { $first: '$merchant.email' },
          totalShipments: { $sum: 1 },
          totalRevenue: { $sum: '$paymentDetails.amount' },
          avgOrderValue: { $avg: '$paymentDetails.amount' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrderDate'] },
              1000 * 60 * 60 * 24
            ]
          },
          daysSinceLastOrder: {
            $divide: [
              { $subtract: [new Date(), '$lastOrderDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      { $sort: sortField },
      { $limit: parseInt(limit, 10) }
    ];
    
    const results = await Shipment.aggregate(pipeline);
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in getCustomerInsights: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving customer insights'
    });
  }
};

/**
 * @desc    Get operational efficiency metrics
 * @route   GET /api/admin/reports/efficiency
 * @access  Admin
 */
const getOperationalEfficiency = async (req, res) => {
  try {
    const { timeframe = 'monthly', startDate, endDate, limit = 12 } = req.query;
    
    let timeGrouping;
    let dateFilter = {};
    
    // Parse dates if provided
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }
    
    // Set up time grouping based on timeframe parameter
    switch (timeframe) {
      case 'daily':
        timeGrouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        timeGrouping = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        timeGrouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }
    
    const pipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: timeGrouping,
          totalShipments: { $sum: 1 },
          completedShipments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0]
            }
          },
          cancelledShipments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0]
            }
          },
          delayedShipments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'DELAYED'] }, 1, 0]
            }
          },
          avgDeliveryTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'COMPLETED'] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
                    1000 * 60 * 60 * 24 // Convert ms to days
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalShipments', 0] },
              { $divide: ['$completedShipments', '$totalShipments'] },
              0
            ]
          },
          cancellationRate: {
            $cond: [
              { $gt: ['$totalShipments', 0] },
              { $divide: ['$cancelledShipments', '$totalShipments'] },
              0
            ]
          },
          delayRate: {
            $cond: [
              { $gt: ['$totalShipments', 0] },
              { $divide: ['$delayedShipments', '$totalShipments'] },
              0
            ]
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: parseInt(limit, 10) }
    ];
    
    const results = await Shipment.aggregate(pipeline);
    
    // Format dates in the response
    const formattedResults = results.map(item => {
      let dateString;
      
      if (timeframe === 'daily') {
        dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (timeframe === 'weekly') {
        dateString = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else {
        dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        period: dateString,
        totalShipments: item.totalShipments,
        completedShipments: item.completedShipments,
        cancelledShipments: item.cancelledShipments,
        delayedShipments: item.delayedShipments,
        completionRate: item.completionRate,
        cancellationRate: item.cancellationRate,
        delayRate: item.delayRate,
        avgDeliveryTime: item.avgDeliveryTime
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedResults.reverse() // Reverse to get chronological order
    });
  } catch (error) {
    logger.error(`Error in getOperationalEfficiency: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving operational efficiency metrics'
    });
  }
};

/**
 * @desc    Get geospatial analytics
 * @route   GET /api/admin/reports/geo
 * @access  Admin
 */
const getGeospatialAnalytics = async (req, res) => {
  try {
    const { analysisType = 'originDestination' } = req.query;
    
    let pipeline = [];
    
    if (analysisType === 'originDestination') {
      // Get top origin-destination pairs
      pipeline = [
        {
          $match: {
            'origin.country': { $exists: true, $ne: null },
            'destination.country': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: {
              origin: '$origin.country',
              destination: '$destination.country'
            },
            count: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentDetails.paymentVerified', true] },
                  '$paymentDetails.amount',
                  0
                ]
              }
            },
            avgTravelTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'COMPLETED'] },
                  { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                  null
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ];
    } else if (analysisType === 'hotspots') {
      // Identify shipping hotspots based on origin/destination frequency
      pipeline = [
        {
          $facet: {
            originHotspots: [
              {
                $match: {
                  'origin.country': { $exists: true, $ne: null }
                }
              },
              {
                $group: {
                  _id: '$origin.country',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            destinationHotspots: [
              {
                $match: {
                  'destination.country': { $exists: true, $ne: null }
                }
              },
              {
                $group: {
                  _id: '$destination.country',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ];
    }
    
    const results = await Shipment.aggregate(pipeline);
    
    // Format the results depending on the analysis type
    let formattedResults = results;
    
    if (analysisType === 'originDestination') {
      formattedResults = results.map(item => ({
        origin: item._id.origin,
        destination: item._id.destination,
        shipmentCount: item.count,
        totalRevenue: item.totalRevenue,
        averageTravelTime: item.avgTravelTime
      }));
    }
    
    return res.status(200).json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    logger.error(`Error in getGeospatialAnalytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Error retrieving geospatial analytics'
    });
  }
};

// Helper function to transform time series data
const transformTimeSeriesResults = (results, timeframe) => {
  // Create a map to organize data by time period
  const timeMap = new Map();
  
  // Process each result
  results.forEach(item => {
    let dateString;
    
    // Format the date string based on timeframe
    if (timeframe === 'daily' && item._id.day) {
      dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
    } else if (timeframe === 'weekly' && item._id.week) {
      dateString = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
    } else {
      dateString = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    }
    
    // Initialize the period if it doesn't exist
    if (!timeMap.has(dateString)) {
      timeMap.set(dateString, {
        period: dateString,
        statuses: {}
      });
    }
    
    // Add the status count
    const period = timeMap.get(dateString);
    period.statuses[item._id.status] = item.count;
  });
  
  // Convert map to array and sort by date
  const timeSeries = Array.from(timeMap.values());
  
  // Sort by period (date)
  timeSeries.sort((a, b) => {
    return new Date(a.period) - new Date(b.period);
  });
  
  return timeSeries;
};

module.exports = {
  getShipmentStatusTrends,
  getRevenueAnalysis,
  getPerformanceMetrics,
  getCustomerInsights,
  getOperationalEfficiency,
  getGeospatialAnalytics
}; 