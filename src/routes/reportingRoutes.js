const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reportingController = require('../controllers/admin/reportingController');
const router = express.Router();

// All routes in this file are protected and restricted to Admin role
router.use(protect);
router.use(restrictTo('Admin'));

/**
 * @swagger
 * /api/reports/shipments/status-trends:
 *   get:
 *     summary: Get shipment status trends over time
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Timeframe for the analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 12
 *         description: Number of time periods to include
 *     responses:
 *       200:
 *         description: Shipment status trends retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/shipments/status-trends', reportingController.getShipmentStatusTrends);

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue analysis
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Timeframe for the analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 12
 *         description: Number of time periods to include
 *     responses:
 *       200:
 *         description: Revenue analysis retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/revenue', reportingController.getRevenueAnalysis);

/**
 * @swagger
 * /api/reports/performance:
 *   get:
 *     summary: Get performance metrics for drivers and trucks
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [driver, truck]
 *           default: driver
 *         description: Type of entity to analyze
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [lastWeek, lastMonth, lastQuarter, allTime]
 *           default: allTime
 *         description: Timeframe for the analysis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of entities to include
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/performance', reportingController.getPerformanceMetrics);

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get customer insights and analytics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [shipmentCount, revenue, avgValue]
 *           default: shipmentCount
 *         description: Sort criterion for the analysis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of customers to include
 *     responses:
 *       200:
 *         description: Customer insights retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/customers', reportingController.getCustomerInsights);

/**
 * @swagger
 * /api/reports/efficiency:
 *   get:
 *     summary: Get operational efficiency metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Timeframe for the analysis
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 12
 *         description: Number of time periods to include
 *     responses:
 *       200:
 *         description: Operational efficiency metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/efficiency', reportingController.getOperationalEfficiency);

/**
 * @swagger
 * /api/reports/geo:
 *   get:
 *     summary: Get geospatial analytics for shipments
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: analysisType
 *         schema:
 *           type: string
 *           enum: [originDestination, hotspots]
 *           default: originDestination
 *         description: Type of geospatial analysis
 *     responses:
 *       200:
 *         description: Geospatial analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/geo', reportingController.getGeospatialAnalytics);

module.exports = router; 